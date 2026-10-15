import React, { useEffect, useRef, useState } from 'react';
import { 
    Camera, 
    Video, 
    VideoOff, 
    Hand, 
    Sliders, 
    Activity, 
    Volume2, 
    VolumeX, 
    Eye, 
    EyeOff,
    CheckCircle2,
    AlertCircle,
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
    const [statusMessage, setStatusMessage] = useState('Ready to connect camera');
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
    const [gestureHistory, setGestureHistory] = useState([]);

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
                setGestureHistory(prev => [gesture, ...prev.slice(0, 9)]);
                onGesture(gesture);

                // Send to backend telemetry API if session exists
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

                // Clear badge after 1.8s
                setTimeout(() => {
                    setDetectedGesture(null);
                }, 1800);
            },
            onStatusChange: (status) => {
                if (status.camera) setCameraStatus(status.camera);
                if (status.hand) setHandStatus(status.hand);
                if (status.message) setStatusMessage(status.message);
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col space-y-4">
            {/* Header & Gesture Engine Switch */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                        <Camera className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-white">Optical Controller</h3>
                        <p className="text-[10px] text-slate-400">MediaPipe WASM Engine</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-medium">Gesture:</span>
                    <button
                        onClick={() => setIsEngineOn(!isEngineOn)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            isEngineOn ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isEngineOn ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                    <span className={`text-xs font-bold ${isEngineOn ? 'text-indigo-400' : 'text-slate-500'}`}>
                        {isEngineOn ? 'ON' : 'OFF'}
                    </span>
                </div>
            </div>

            {/* Video & Landmark Canvas Viewport */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[4/3] flex items-center justify-center">
                {/* Hidden source video element */}
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="hidden"
                />

                {/* Visible Canvas Drawing Overlay */}
                <canvas
                    ref={canvasRef}
                    width={320}
                    height={240}
                    className={`w-full h-full object-cover transition-opacity ${isEngineOn ? 'opacity-100' : 'opacity-20'}`}
                />

                {/* Overlays / Cooldown Shutter */}
                {remainingCooldownMs > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shadow animate-pulse">
                        <Zap className="w-3 h-3" />
                        <span>Lock: {remainingCooldownMs}ms</span>
                    </div>
                )}

                {/* Detected Gesture Overlay Toast */}
                {detectedGesture && (
                    <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-xs flex flex-col items-center justify-center p-3 animate-scale-up">
                        <div className="bg-indigo-600 text-white text-base font-extrabold px-4 py-2 rounded-xl shadow-lg flex items-center space-x-2">
                            <span>{detectedGesture.type === 'swipe_right' ? '👉' : detectedGesture.type === 'swipe_left' ? '👈' : '✊'}</span>
                            <span>{detectedGesture.label}</span>
                        </div>
                        <span className="text-[11px] text-indigo-200 mt-1 font-mono font-medium">
                            Dispatched: {detectedGesture.key} ({latencyMs}ms)
                        </span>
                    </div>
                )}

                {!isEngineOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-1">
                        <VideoOff className="w-8 h-8" />
                        <span className="text-xs">Camera paused</span>
                    </div>
                )}
            </div>

            {/* Cooldown Refractory Progress Bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Cooldown State</span>
                    <span className={remainingCooldownMs > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                        {remainingCooldownMs > 0 ? `Refractory (${remainingCooldownMs}ms)` : 'Ready'}
                    </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-75 ${
                            remainingCooldownMs > 0 ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${cooldownPercent}%` }}
                    />
                </div>
            </div>

            {/* Status Badges Row (Matches Figure 4.1) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Camera Status */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                    <span className="text-slate-400 text-[11px]">Camera:</span>
                    <span className={`font-semibold text-[11px] flex items-center space-x-1 ${
                        cameraStatus === 'online' ? 'text-emerald-400' : cameraStatus === 'connecting' ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cameraStatus === 'online' ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                        <span>{cameraStatus === 'online' ? 'Online' : cameraStatus}</span>
                    </span>
                </div>

                {/* Hand Status */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                    <span className="text-slate-400 text-[11px]">Hand:</span>
                    <span className={`font-semibold text-[11px] flex items-center space-x-1 ${
                        handStatus === 'detected' ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                        <Hand className="w-3 h-3" />
                        <span>{handStatus === 'detected' ? 'Detected' : 'Searching'}</span>
                    </span>
                </div>
            </div>

            {/* Live Camera Device Selector */}
            {devices.length > 1 && (
                <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">Input Device</label>
                    <select
                        value={selectedDeviceId}
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                        className="w-full bg-slate-800 text-xs text-white rounded-lg border border-slate-700 px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none"
                    >
                        {devices.map((d, idx) => (
                            <option key={d.deviceId || idx} value={d.deviceId}>
                                {d.label || `Camera ${idx + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Live Settings Sliders (Matches Page 19 spec) */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
                {/* Sensitivity Slider */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium">Gesture Sensitivity</span>
                        <span className="text-indigo-400 font-mono font-bold">{sensitivity}/10</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={sensitivity}
                        onChange={(e) => setSensitivity(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                {/* Command Cooldown Slider */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium">Command Cooldown</span>
                        <span className="text-indigo-400 font-mono font-bold">{cooldownMs}ms</span>
                    </div>
                    <input
                        type="range"
                        min="400"
                        max="2000"
                        step="100"
                        value={cooldownMs}
                        onChange={(e) => setCooldownMs(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                {/* Visual / Sound toggles */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <button
                        onClick={() => setAudioFeedback(!audioFeedback)}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border ${
                            audioFeedback ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                    >
                        {audioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        <span>Audio Beep</span>
                    </button>

                    <button
                        onClick={() => setShowLandmarks(!showLandmarks)}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border ${
                            showLandmarks ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                    >
                        {showLandmarks ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>Skeleton</span>
                    </button>
                </div>
            </div>

            {/* Real-Time Telemetry Bar (Section 3.4 spec) */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <div className="flex items-center space-x-1">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>FPS:</span>
                    <span className={`font-bold ${fps >= 25 ? 'text-emerald-400' : 'text-amber-400'}`}>{fps || '--'}</span>
                </div>
                <div>
                    <span>Latency:</span>
                    <span className={`font-bold ml-1 ${latencyMs < 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {latencyMs ? `${latencyMs}ms` : '--'}
                    </span>
                </div>
            </div>
        </div>
    );
}
