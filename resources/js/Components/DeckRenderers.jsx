import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Tracks the pixel size of an element so slides can be scaled to fit it.
function useElementSize(ref) {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!ref.current) return;
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setSize({ width: Math.floor(width), height: Math.floor(height) });
        });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return size;
}

function DeckStatus({ loading, error }) {
    if (error) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-clay-cream space-y-2">
                <AlertTriangle className="w-8 h-8 text-clay-gold" />
                <span className="text-sm font-bold">{error}</span>
            </div>
        );
    }
    if (loading) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-clay-cream space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-clay-gold" />
                <span className="text-xs font-semibold">Loading presentation...</span>
            </div>
        );
    }
    return null;
}

export function PdfDeck({ url, slideIndex, onLoad = () => {} }) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const { width, height } = useElementSize(containerRef);
    const [pdf, setPdf] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        let loadingTask = null;

        (async () => {
            try {
                const pdfjs = await import('pdfjs-dist');
                pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
                loadingTask = pdfjs.getDocument({ url, withCredentials: true });
                const doc = await loadingTask.promise;
                if (cancelled) return;
                setPdf(doc);
                onLoad(doc.numPages);
            } catch (e) {
                console.error(e);
                if (!cancelled) setError('Could not open this PDF.');
            }
        })();

        return () => {
            cancelled = true;
            loadingTask?.destroy();
        };
    }, [url]);

    useEffect(() => {
        if (!pdf || !width || !height) return;
        let renderTask = null;
        let cancelled = false;

        (async () => {
            const page = await pdf.getPage(Math.min(slideIndex + 1, pdf.numPages));
            if (cancelled) return;

            const base = page.getViewport({ scale: 1 });
            const fit = Math.min(width / base.width, height / base.height);
            const ratio = window.devicePixelRatio || 1;
            const viewport = page.getViewport({ scale: fit * ratio });

            const canvas = canvasRef.current;
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = `${Math.floor(base.width * fit)}px`;
            canvas.style.height = `${Math.floor(base.height * fit)}px`;

            renderTask = page.render({ canvas, viewport });
            await renderTask.promise.catch(() => {});
        })();

        return () => {
            cancelled = true;
            renderTask?.cancel();
        };
    }, [pdf, slideIndex, width, height]);

    return (
        <div ref={containerRef} className="absolute inset-0 flex items-center justify-center bg-black">
            <canvas ref={canvasRef} className="block shadow-lg" />
            <DeckStatus loading={!pdf} error={error} />
        </div>
    );
}

// pptx-preview lays slides out at a fixed pixel size; the stage is then scaled to fit.
const PPTX_WIDTH = 960;
const PPTX_HEIGHT = 540;

export function PptxDeck({ url, slideIndex, onLoad = () => {} }) {
    const containerRef = useRef(null);
    const hostRef = useRef(null);
    const previewerRef = useRef(null);
    const { width, height } = useElementSize(containerRef);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const host = hostRef.current;

        (async () => {
            try {
                const [{ init }, response] = await Promise.all([
                    import('pptx-preview'),
                    fetch(url, { credentials: 'same-origin' }),
                ]);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const buffer = await response.arrayBuffer();
                if (cancelled) return;

                const previewer = init(host, { width: PPTX_WIDTH, height: PPTX_HEIGHT, mode: 'slide' });
                await previewer.load(buffer);
                if (cancelled) return;

                previewerRef.current = previewer;
                previewer.renderSingleSlide(0);
                setReady(true);
                onLoad(previewer.slideCount);
            } catch (e) {
                console.error(e);
                if (!cancelled) {
                    setError('Could not render this PowerPoint file. Try saving it as PDF in PowerPoint and uploading that.');
                }
            }
        })();

        return () => {
            cancelled = true;
            try {
                previewerRef.current?.destroy();
            } catch (e) {
                // ignore: the previewer may not have finished loading
            }
            previewerRef.current = null;
            host.innerHTML = '';
        };
    }, [url]);

    useEffect(() => {
        const previewer = previewerRef.current;
        if (!ready || !previewer) return;
        const index = Math.min(slideIndex, previewer.slideCount - 1);
        if (index !== previewer.currentIndex) {
            previewer.renderSingleSlide(index);
        }
    }, [ready, slideIndex]);

    const scale = width && height ? Math.min(width / PPTX_WIDTH, height / PPTX_HEIGHT) : 1;

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-black">
            <div
                ref={hostRef}
                className="absolute left-1/2 top-1/2 pointer-events-none [&_.pptx-preview-wrapper]:!overflow-hidden"
                style={{
                    width: PPTX_WIDTH,
                    height: PPTX_HEIGHT,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                }}
            />
            <DeckStatus loading={!ready} error={error} />
        </div>
    );
}
