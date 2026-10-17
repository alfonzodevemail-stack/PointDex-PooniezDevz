import React, { useEffect, useRef, useState } from 'react';
import {
    VideoOff,
    Activity,
    Volume2,
    VolumeX,
    Eye,
    EyeOff,
    Zap
} from 'lucide-react';
import { GestureEngine } from '@/Services/GestureRecognizer';

export default function WebcamControllerPanel({
    settings = {},
    onGesture = () => {},
    sessionCode = null,
    onTelemetryData = () => {}
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const engineRef = useRef(null);

    // States
    const [isEngineOn, setIsEngineOn] = useState(true);
    const [cameraStatus, setCameraStatus] = useState('offline'); // offline, connecting, online, error
    const [handStatus, setHandStatus] = useState('none'); // none, searching, detected
    const [detectedGesture, setDetectedGesture] = useState(null);
    const [cooldownPercent, setCooldownPercent] = useState(100);
    const [remainingCooldownMs, setRemainingCooldownMs] = useState(0);

    // Sliders & Toggles
    const [sensitivity, setSensitivity] = useState(settings.sensitivity || 5);
    const [cooldownMs, setCooldownMs] = useState(settings.cooldown_ms || 800);
    const [audioFeedback, setAudioFeedback] = useState(settings.audio_feedback ?? true);
    const [showLandmarks, setShowLandmarks] = useState(settings.show_landmark_canvas ?? true);

    // Devices
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');

    // Telemetry
    const [fps, setFps] = useState(0);
    const [latencyMs, setLatencyMs] = useState(0);

    // Populate camera devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                const devs = await navigator.mediaDevices.enumerateDevices();
                const videoDevs = devs.filter(d => d.kind === 'videoinput');
                setDevices(videoDevs);
                if (videoDevs.length > 0 && !selectedDeviceId) {
                    setSelectedDeviceId(videoDevs[0].deviceId);
                }
            } catch (e) {
                console.warn('Could not enumerate camera devices:', e);
            }
        };

        getDevices();
        navigator.mediaDevices.addEventListener?.('devicechange', getDevices);
        return () => navigator.mediaDevices.removeEventListener?.('devicechange', getDevices);
    }, []);

    // Initialize or restart engine
    useEffect(() => {
        if (!isEngineOn) {
            if (engineRef.current) {
                engineRef.current.stop();
                engineRef.current = null;
            }
            setCameraStatus('offline');
            setHandStatus('none');
            return;
        }

        const engine = new GestureEngine({
            videoElement: videoRef.current,
            canvasElement: canvasRef.current,
            sensitivity: sensitivity,
            cooldownMs: cooldownMs,
            audioFeedback: audioFeedback,
            showLandmarkCanvas: showLandmarks,
            onGestureDetected: (gesture) => {
                setDetectedGesture(gesture);
                onGesture(gesture);

                if (sessionCode) {
                    fetch('/api/telemetry/log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({
                            session_code: sessionCode,
                            gesture_type: gesture.type,
                            confidence: gesture.confidence / 100,
                            latency_ms: latencyMs,
                            dispatched_key: gesture.key,
                            delta_x: gesture.deltaX,
                            delta_y: gesture.deltaY,
                            is_successful: true
                        })
                    }).catch(err => console.warn('Telemetry log failed:', err));
                }

                setTimeout(() => {
                    setDetectedGesture(null);
                }, 1800);
            },
            onStatusChange: (status) => {
                if (status.camera) setCameraStatus(status.camera);
                if (status.hand) setHandStatus(status.hand);
            },
            onTelemetryUpdate: (telemetry) => {
                setFps(telemetry.fps);
                setLatencyMs(telemetry.latencyMs);
                onTelemetryData(telemetry);
            },
            onCooldownProgress: ({ remainingMs, percent }) => {
                setCooldownPercent(percent);
                setRemainingCooldownMs(remainingMs);
            }
        });

        engineRef.current = engine;
        engine.initialize(selectedDeviceId).catch((e) => {
            console.error('Engine start failed:', e);
        });

        return () => {
            if (engineRef.current) {
                engineRef.current.stop();
                engineRef.current = null;
            }
        };
    }, [isEngineOn, selectedDeviceId]);

    // Live update settings without restarting camera
    useEffect(() => {
        if (engineRef.current) {
            engineRef.current.updateConfig({
                sensitivity,
                cooldownMs,
                audioFeedback,
                showLandmarkCanvas: showLandmarks
            });
        }
    }, [sensitivity, cooldownMs, audioFeedback, showLandmarks]);

    return (
        <div className="clay-card p-5 flex flex-col space-y-4">
            {/* Webcam Viewport + "Preview" Caption (Matches Figure 4.1 Top Right) */}
            <div>
                <div className="relative rounded-2xl overflow-hidden bg-clay-charcoal border-4 border-white shadow-md aspect-[4/3] flex items-center justify-center">
                    <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="hidden"
                    />

                    <canvas
                        ref={canvasRef}
                        width={320}
                        height={240}
                        className={`w-full h-full object-cover transition-opacity ${
                            isEngineOn ? 'opacity-100' : 'opacity-20'
                        }`}
                    />

                    {/* Cooldown Lock Pill */}
                    {remainingCooldownMs > 0 && (
                        <div className="absolute top-2.5 right-2.5 clay-btn-gold px-2.5 py-0.5 text-[10px] font-black flex items-center space-x-1">
                            <Zap className="w-3 h-3" />
                            <span>{remainingCooldownMs}ms</span>
                        </div>
                    )}

                    {/* Active Gesture Overlay Toast */}
                    {detectedGesture && (
                        <div className="absolute inset-0 bg-clay-charcoal/75 backdrop-blur-xs flex flex-col items-center justify-center p-3">
                            <div className="clay-btn-gold px-4 py-2 text-sm font-black flex items-center space-x-2">
                                <span>
                                    {detectedGesture.type === 'swipe_right'
                                        ? '👉'
                                        : detectedGesture.type === 'swipe_left'
                                        ? '👈'
                                        : '✊'}
                                </span>
                                <span>{detectedGesture.label}</span>
                            </div>
                            <span className="text-[11px] text-clay-cream mt-1.5 font-mono font-semibold">
                                {detectedGesture.key} ({latencyMs}ms)
                            </span>
                        </div>
                    )}

                    {!isEngineOn && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-clay-gray space-y-1">
                            <VideoOff className="w-8 h-8" />
                            <span className="text-xs font-semibold">Camera Off</span>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs font-bold text-clay-charcoal mt-2">
                    Preview
                </p>
            </div>

            {/* Status Badges (Matches Figure 4.1: Camera | Hand | Gesture) */}
            <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                    {/* Camera Badge */}
                    <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-clay-charcoal text-[11px]">Camera:</span>
                        <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs ${
                                cameraStatus === 'online'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-clay-gray text-clay-charcoal'
                            }`}
                        >
                            {cameraStatus === 'online' ? 'Online' : 'Offline'}
                        </span>
                    </div>

                    {/* Hand Badge */}
                    <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-clay-charcoal text-[11px]">Hand:</span>
                        <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                handStatus === 'detected'
                                    ? 'bg-clay-gold text-clay-charcoal'
                                    : 'bg-clay-charcoal text-clay-cream'
                            }`}
                        >
                            {handStatus === 'detected' ? 'Detected' : isEngineOn ? 'Searching' : 'Gesture Off'}
                        </span>
                    </div>
                </div>

                {/* Gesture Status Row */}
                <div className="flex items-center space-x-2 pt-0.5">
                    <span className="font-bold text-clay-charcoal text-[11px]">Gesture:</span>
                    <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold ${
                            detectedGesture
                                ? 'bg-clay-gold text-clay-charcoal'
                                : 'bg-clay-charcoal text-clay-cream'
                        }`}
                    >
                        {detectedGesture
                            ? detectedGesture.label
                            : isEngineOn
                            ? 'Ready'
                            : 'Gesture Off'}
                    </span>
                </div>
            </div>

            {/* Gesture Off / On Switch (Matches Figure 4.1) */}
            <div className="pt-2 border-t border-clay-gray/50 flex items-center justify-between">
                <div>
                    <div className="text-xs font-extrabold text-clay-charcoal">Gesture</div>
                    <div className="text-[10px] text-clay-charcoal/65">Enable Gesture Control</div>
                </div>

                <div className="flex items-center space-x-2">
                    <span className={`text-[11px] font-bold ${!isEngineOn ? 'text-clay-charcoal' : 'text-clay-charcoal/50'}`}>
                        Off
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsEngineOn(!isEngineOn)}
                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors clay-inset p-0.5 ${
                            isEngineOn ? 'bg-clay-gold/30' : 'bg-clay-gray/60'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full transition-transform shadow-md ${
                                isEngineOn
                                    ? 'translate-x-6 bg-clay-charcoal'
                                    : 'translate-x-0.5 bg-clay-charcoal/60'
                            }`}
                        />
                    </button>
                    <span className={`text-[11px] font-bold ${isEngineOn ? 'text-clay-charcoal' : 'text-clay-charcoal/50'}`}>
                        On
                    </span>
                </div>
            </div>

            {/* Input Device Dropdown (Matches Figure 4.1) */}
            <div className="space-y-1.5 pt-2 border-t border-clay-gray/50">
                <label className="block text-xs font-extrabold text-clay-charcoal">
                    Input Device
                </label>
                <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="w-full clay-inset text-xs font-semibold text-clay-charcoal px-3 py-2 focus:outline-none focus:ring-2 focus:ring-clay-gold"
                >
                    {devices.length === 0 ? (
                        <option value="">Default Webcam</option>
                    ) : (
                        devices.map((d, idx) => (
                            <option key={d.deviceId || idx} value={d.deviceId}>
                                {d.label || `Webcam ${idx + 1}`}
                            </option>
                        ))
                    )}
                </select>
            </div>

            {/* Live Calibration Sliders (Sensitivity & Cooldown) */}
            <div className="space-y-3 pt-2 border-t border-clay-gray/50">
                {/* Sensitivity */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-clay-charcoal">
                        <span>Sensitivity</span>
                        <span className="font-mono bg-clay-gold/30 px-1.5 rounded text-clay-charcoal">
                            {sensitivity}/10
                        </span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={sensitivity}
                        onChange={(e) => setSensitivity(Number(e.target.value))}
                        className="w-full h-2 clay-inset rounded-lg appearance-none cursor-pointer accent-clay-charcoal"
                    />
                </div>

                {/* Cooldown */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-clay-charcoal">
                        <span>Cooldown Timer</span>
                        <span className="font-mono bg-clay-gold/30 px-1.5 rounded text-clay-charcoal">
                            {cooldownMs}ms
                        </span>
                    </div>
                    <input
                        type="range"
                        min="400"
                        max="2000"
                        step="100"
                        value={cooldownMs}
                        onChange={(e) => setCooldownMs(Number(e.target.value))}
                        className="w-full h-2 clay-inset rounded-lg appearance-none cursor-pointer accent-clay-charcoal"
                    />
                </div>

                {/* Cooldown Progress Bar */}
                <div className="w-full clay-inset h-2 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-75 ${
                            remainingCooldownMs > 0 ? 'bg-clay-gold' : 'bg-clay-charcoal'
                        }`}
                        style={{ width: `${cooldownPercent}%` }}
                    />
                </div>

                {/* Audio & Skeleton Quick Toggles */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                        type="button"
                        onClick={() => setAudioFeedback(!audioFeedback)}
                        className={`py-1.5 px-2.5 text-[11px] flex items-center justify-center space-x-1.5 ${
                            audioFeedback ? 'clay-btn-gold' : 'clay-btn-light opacity-75'
                        }`}
                    >
                        {audioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        <span>Beep</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowLandmarks(!showLandmarks)}
                        className={`py-1.5 px-2.5 text-[11px] flex items-center justify-center space-x-1.5 ${
                            showLandmarks ? 'clay-btn-gold' : 'clay-btn-light opacity-75'
                        }`}
                    >
                        {showLandmarks ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>Skeleton</span>
                    </button>
                </div>
            </div>

            {/* Bottom Telemetry Bar (FPS & Latency) */}
            <div className="clay-inset px-3 py-2 flex items-center justify-between text-[11px] font-mono font-bold text-clay-charcoal">
                <div className="flex items-center space-x-1">
                    <Activity className="w-3.5 h-3.5 text-clay-charcoal" />
                    <span>FPS: {fps || '--'}</span>
                </div>
                <div>
                    <span>Latency: {latencyMs ? `${latencyMs}ms` : '--'}</span>
                </div>
            </div>
        </div>
    );
}