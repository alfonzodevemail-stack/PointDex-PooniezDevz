import { useCallback, useEffect, useRef, useState } from 'react';

const FLUSH_INTERVAL_MS = 5000;

function xsrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Records one telemetry session while the camera runs: starts it, averages the
 * frame rate and latency of every processed frame, and saves the averages every few
 * seconds and when the page is left, so Dashboard and Analytics have real numbers.
 */
export default function useTelemetrySession({ presentationId = null, mode = 'presentation' } = {}) {
    const [sessionCode, setSessionCode] = useState(null);
    const codeRef = useRef(null);
    const stats = useRef({ frames: 0, latencySum: 0, fpsSum: 0, fpsSamples: 0, startedAt: Date.now(), changed: false });

    useEffect(() => {
        window.axios.post('/telemetry/start', { presentation_id: presentationId, mode })
            .then(({ data }) => {
                if (data.success && data.session) {
                    codeRef.current = data.session.session_code;
                    stats.current.startedAt = Date.now();
                    setSessionCode(data.session.session_code);
                }
            })
            .catch(() => {});
    }, []);

    const onTelemetryData = useCallback(({ fps, latencyMs }) => {
        const s = stats.current;
        s.frames += 1;
        s.latencySum += latencyMs || 0;
        // The frame rate is only known after the first full second.
        if (fps > 0) {
            s.fpsSum += fps;
            s.fpsSamples += 1;
        }
        s.changed = true;
    }, []);

    useEffect(() => {
        const flush = () => {
            const s = stats.current;
            if (!codeRef.current || !s.changed || s.frames === 0) return;
            s.changed = false;

            // keepalive lets the last update finish even while the tab is closing.
            fetch('/telemetry/end', {
                method: 'POST',
                keepalive: true,
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken(),
                },
                body: JSON.stringify({
                    session_code: codeRef.current,
                    total_frames_processed: s.frames,
                    avg_fps: s.fpsSamples ? Math.round((s.fpsSum / s.fpsSamples) * 10) / 10 : 0,
                    avg_latency_ms: Math.round((s.latencySum / s.frames) * 10) / 10,
                    duration_seconds: Math.round((Date.now() - s.startedAt) / 1000),
                }),
            }).catch(() => {});
        };

        const timer = setInterval(flush, FLUSH_INTERVAL_MS);
        window.addEventListener('pagehide', flush);

        return () => {
            clearInterval(timer);
            window.removeEventListener('pagehide', flush);
            flush();
        };
    }, []);

    return { sessionCode, onTelemetryData };
}
