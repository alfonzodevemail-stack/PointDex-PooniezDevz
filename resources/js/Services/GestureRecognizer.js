/**
 * PointDex Event-Driven Gesture Recognition Engine
 * Implements Pub/Sub client-side event bus with Google MediaPipe Hands (WASM/WebGL).
 * Fulfills System Architecture Section 3.2 and Performance Benchmarking Section 3.4.
 */

export class GestureEngine {
    constructor(options = {}) {
        this.videoElement = options.videoElement || null;
        this.canvasElement = options.canvasElement || null;
        this.canvasCtx = this.canvasElement ? this.canvasElement.getContext('2d') : null;

        // Configuration
        this.sensitivity = options.sensitivity || 5; // 1 to 10
        this.cooldownMs = options.cooldownMs || 800; // Debounce window
        this.swipePixelThreshold = options.swipePixelThreshold || 55;
        this.fistHoldSeconds = options.fistHoldSeconds || 1.5;
        this.audioFeedback = options.audioFeedback ?? true;
        this.showLandmarkCanvas = options.showLandmarkCanvas ?? true;

        // Callbacks / Event Subscribers
        this.onGestureDetected = options.onGestureDetected || (() => {});
        this.onTelemetryUpdate = options.onTelemetryUpdate || (() => {});
        this.onStatusChange = options.onStatusChange || (() => {});
        this.onCooldownProgress = options.onCooldownProgress || (() => {});

        // Internal State
        this.stream = null;
        this.hands = null;
        this.isRunning = false;
        this.isCoolingDown = false;
        this.cooldownTimer = null;
        this.cooldownStartTime = 0;
        this.cooldownRaf = null;

        // Heuristics & Tracking Buffers
        this.landmarkHistory = []; // Buffer for smoothing
        this.fistStartTime = null;
        this.lastHandCenter = null;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = performance.now();

        // Audio Context (synthesizer)
        this.audioCtx = null;
    }

    /**
     * Synthesizes audio feedback for gesture confirmation
     */
    playBeep(frequency = 600, duration = 0.08, type = 'sine') {
        if (!this.audioFeedback) return;
        try {
            if (!this.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) this.audioCtx = new AudioContext();
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            if (this.audioCtx) {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = type;
                osc.frequency.value = frequency;
                gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start();
                osc.stop(this.audioCtx.currentTime + duration);
            }
        } catch (e) {
            console.warn('Audio feedback failed:', e);
        }
    }

    /**
     * Initializes camera and MediaPipe Hands instance
     */
    async initialize(deviceId = null) {
        this.onStatusChange({ camera: 'connecting', hand: 'none', message: 'Accessing webcam...' });

        try {
            const constraints = {
                video: deviceId 
                    ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } }
                    : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;
                await new Promise((resolve) => {
                    this.videoElement.onloadedmetadata = () => {
                        this.videoElement.play();
                        resolve();
                    };
                });
            }

            this.onStatusChange({ camera: 'online', hand: 'searching', message: 'Camera active. Initializing AI model...' });

            // Initialize MediaPipe Hands
            await this.initMediaPipe();

            this.isRunning = true;
            this.startFrameLoop();
            this.onStatusChange({ camera: 'online', hand: 'searching', message: 'Tracking active. Show hand to control.' });

            return true;
        } catch (err) {
            console.error('Webcam initialization failed:', err);
            this.onStatusChange({ camera: 'error', hand: 'none', message: `Camera error: ${err.message}` });
            throw err;
        }
    }

    /**
     * Loads and configures MediaPipe Hands
     */
    async initMediaPipe() {
        return new Promise(async (resolve, reject) => {
            try {
                // Ensure window.Hands is available
                if (typeof window.Hands === 'undefined') {
                    await this.loadScript('/vendor/mediapipe/hands/hands.js')
                        .catch(() => this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'));
                }

                if (typeof window.Hands === 'undefined') {
                    throw new Error('Could not load MediaPipe Hands SDK');
                }

                this.hands = new window.Hands({
                    locateFile: (file) => {
                        return `/vendor/mediapipe/hands/${file}`;
                    }
                });

                this.hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1, // 0 = lite, 1 = full
                    minDetectionConfidence: 0.6,
                    minTrackingConfidence: 0.5
                });

                this.hands.onResults(this.handleInferenceResults.bind(this));
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Continuous frame processing via requestAnimationFrame
     */
    startFrameLoop() {
        const process = async () => {
            if (!this.isRunning) return;

            const now = performance.now();
            this.frameCount++;
            if (now - this.lastFpsUpdate >= 1000) {
                this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
                this.frameCount = 0;
                this.lastFpsUpdate = now;
            }

            if (this.videoElement && this.videoElement.readyState >= 2 && this.hands) {
                const startTime = performance.now();
                try {
                    await this.hands.send({ image: this.videoElement });
                } catch (e) {
                    console.warn('MediaPipe send frame error:', e);
                }
                const latency = Math.round(performance.now() - startTime);

                this.onTelemetryUpdate({
                    fps: this.fps,
                    latencyMs: latency,
                    isCoolingDown: this.isCoolingDown
                });
            }

            if (this.isRunning) {
                requestAnimationFrame(process);
            }
        };

        requestAnimationFrame(process);
    }

    /**
     * Handles 21 hand landmarks returned by inference engine
     */
    handleInferenceResults(results) {
        const canvas = this.canvasElement;
        const ctx = this.canvasCtx;

        if (canvas && ctx) {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw video preview mirror
            if (this.videoElement && this.showLandmarkCanvas) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    const landmarks = results.multiHandLandmarks[0];
                    this.drawLandmarks(ctx, landmarks, canvas.width, canvas.height);
                }
            }
            ctx.restore();
        }

        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            this.onStatusChange({ camera: 'online', hand: 'none', message: 'No hand detected' });
            this.landmarkHistory = [];
            this.fistStartTime = null;
            return;
        }

        const landmarks = results.multiHandLandmarks[0];
        this.onStatusChange({ camera: 'online', hand: 'detected', message: 'Hand active' });

        // Evaluate gesture state machine if not currently in cooldown
        this.evaluateGestures(landmarks);
    }

    /**
     * Draws landmarks and skeletal connections on canvas
     */
    drawLandmarks(ctx, landmarks, width, height) {
        const CONNECTIONS = [
            [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],       // Index
            [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
            [9, 13], [13, 14], [14, 15], [15, 16],// Ring
            [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
            [0, 17]                               // Palm base
        ];

        // Draw bones
        ctx.strokeStyle = this.isCoolingDown ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.85)';
        ctx.lineWidth = 3;
        for (const [i, j] of CONNECTIONS) {
            const p1 = landmarks[i];
            const p2 = landmarks[j];
            ctx.beginPath();
            ctx.moveTo(p1.x * width, p1.y * height);
            ctx.lineTo(p2.x * width, p2.y * height);
            ctx.stroke();
        }

        // Draw joint points
        for (let i = 0; i < landmarks.length; i++) {
            const lm = landmarks[i];
            const isTip = [4, 8, 12, 16, 20].includes(i);
            ctx.fillStyle = isTip ? '#22c55e' : (i === 0 ? '#f59e0b' : '#38bdf8');
            ctx.beginPath();
            ctx.arc(lm.x * width, lm.y * height, isTip ? 6 : 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    /**
     * Evaluates gestures using spatial vector heuristics & state machine
     */
    evaluateGestures(landmarks) {
        const now = performance.now();

        // Key landmarks
        const wrist = landmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const indexMcp = landmarks[5];
        const middleTip = landmarks[12];
        const middleMcp = landmarks[9];
        const ringTip = landmarks[16];
        const ringMcp = landmarks[13];
        const pinkyTip = landmarks[20];
        const pinkyMcp = landmarks[17];

        // Hand center (average of wrist and knuckle base)
        const handCenterX = (wrist.x + indexMcp.x + pinkyMcp.x) / 3;
        const handCenterY = (wrist.y + indexMcp.y + pinkyMcp.y) / 3;

        // Buffer coordinate history for smoothing and delta calculation
        this.landmarkHistory.push({
            timestamp: now,
            x: handCenterX,
            y: handCenterY,
            indexX: indexTip.x,
            indexY: indexTip.y
        });

        // Keep last 300ms of history
        while (this.landmarkHistory.length > 0 && now - this.landmarkHistory[0].timestamp > 350) {
            this.landmarkHistory.shift();
        }

        if (this.isCoolingDown) {
            return;
        }

        // Calculate finger extension (is tip higher/further than MCP knuckle from wrist)
        const isIndexExtended = this.distance(indexTip, wrist) > this.distance(indexMcp, wrist) * 1.25;
        const isMiddleExtended = this.distance(middleTip, wrist) > this.distance(middleMcp, wrist) * 1.25;
        const isRingExtended = this.distance(ringTip, wrist) > this.distance(ringMcp, wrist) * 1.25;
        const isPinkyExtended = this.distance(pinkyTip, wrist) > this.distance(pinkyMcp, wrist) * 1.25;

        const extendedFingers = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended].filter(Boolean).length;

        // 1. Check for CLOSED FIST (0 or 1 finger extended) held statically
        if (extendedFingers <= 1) {
            if (!this.fistStartTime) {
                this.fistStartTime = now;
            } else {
                const heldDuration = (now - this.fistStartTime) / 1000;
                if (heldDuration >= this.fistHoldSeconds) {
                    this.fistStartTime = null;
                    this.triggerGesture('fist', 'F5', 'Presentation Fullscreen Toggle', 95);
                    return;
                }
            }
        } else {
            this.fistStartTime = null;
        }

        // 2. Check for SWIPE GESTURES (Horizontal translation over time)
        if (this.landmarkHistory.length >= 4 && extendedFingers >= 2) {
            const oldest = this.landmarkHistory[0];
            const current = this.landmarkHistory[this.landmarkHistory.length - 1];
            const timeDiff = current.timestamp - oldest.timestamp;

            if (timeDiff >= 80 && timeDiff <= 320) {
                // Because camera is mirrored horizontally:
                // Moving hand right in physical space moves landmark left in raw unmirrored coordinates
                const deltaX = (current.x - oldest.x);
                const deltaY = (current.y - oldest.y);

                // Normalizing delta by sensitivity factor
                // High sensitivity (10) lowers required threshold; Low sensitivity (1) raises it
                const threshold = (0.12 - (this.sensitivity * 0.007)); // e.g. ~0.08 at sens 5

                // Ensure movement is predominantly horizontal
                if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
                    // Raw camera: moving physical hand to presenter's RIGHT increases screen X in mirrored view
                    // (Oldest X > Current X means moving physically RIGHT in unmirrored frame)
                    if (deltaX < -threshold) {
                        this.triggerGesture('swipe_right', 'ArrowRight', 'Next Slide', 92, deltaX, deltaY);
                        this.landmarkHistory = [];
                        return;
                    } else if (deltaX > threshold) {
                        this.triggerGesture('swipe_left', 'ArrowLeft', 'Previous Slide', 91, deltaX, deltaY);
                        this.landmarkHistory = [];
                        return;
                    }
                }
            }
        }

        // 3. Check for OPEN PALM / STOP SIGN (All 4+ fingers extended, static)
        if (extendedFingers >= 4 && this.landmarkHistory.length >= 6) {
            const oldest = this.landmarkHistory[0];
            const current = this.landmarkHistory[this.landmarkHistory.length - 1];
            const deltaMove = Math.hypot(current.x - oldest.x, current.y - oldest.y);

            // If hand is steady (very small motion)
            if (deltaMove < 0.03) {
                // Can trigger pause/blank toggle if held for at least 1.0s
                // To prevent spamming, triggered via cooldown
            }
        }
    }

    distance(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    /**
     * Executes the confirmed gesture and enforces refractory cooldown
     */
    triggerGesture(type, key, label, confidence = 95, deltaX = 0, deltaY = 0) {
        if (this.isCoolingDown) return;

        this.startCooldown();
        this.playBeep(type === 'fist' ? 880 : 540, 0.1);

        // Dispatch synthetic KeyboardEvent to window (satisfying Phase 3 DOM Dispatcher spec)
        try {
            const keyEventDown = new KeyboardEvent('keydown', {
                key: key,
                code: key,
                bubbles: true,
                cancelable: true
            });
            window.dispatchEvent(keyEventDown);

            const keyEventUp = new KeyboardEvent('keyup', {
                key: key,
                code: key,
                bubbles: true,
                cancelable: true
            });
            window.dispatchEvent(keyEventUp);
        } catch (e) {
            console.warn('KeyboardEvent dispatch fallback:', e);
        }

        // Notify subscriber components
        this.onGestureDetected({
            type,
            key,
            label,
            confidence,
            deltaX,
            deltaY,
            timestamp: performance.now()
        });
    }

    /**
     * Software cooldown and debounce broker (enforces 600ms - 1500ms refractory period)
     */
    startCooldown() {
        this.isCoolingDown = true;
        this.cooldownStartTime = performance.now();

        const updateProgress = () => {
            if (!this.isCoolingDown) return;
            const elapsed = performance.now() - this.cooldownStartTime;
            const remaining = Math.max(0, this.cooldownMs - elapsed);
            const percent = Math.min(100, Math.round((elapsed / this.cooldownMs) * 100));

            this.onCooldownProgress({ remainingMs: Math.round(remaining), percent });

            if (elapsed < this.cooldownMs) {
                this.cooldownRaf = requestAnimationFrame(updateProgress);
            } else {
                this.isCoolingDown = false;
                this.onCooldownProgress({ remainingMs: 0, percent: 100 });
            }
        };

        if (this.cooldownRaf) cancelAnimationFrame(this.cooldownRaf);
        this.cooldownRaf = requestAnimationFrame(updateProgress);
    }

    /**
     * Updates live configuration sliders dynamically without reload
     */
    updateConfig(newConfig = {}) {
        if (newConfig.sensitivity !== undefined) this.sensitivity = newConfig.sensitivity;
        if (newConfig.cooldownMs !== undefined) this.cooldownMs = newConfig.cooldownMs;
        if (newConfig.showLandmarkCanvas !== undefined) this.showLandmarkCanvas = newConfig.showLandmarkCanvas;
        if (newConfig.audioFeedback !== undefined) this.audioFeedback = newConfig.audioFeedback;
    }

    /**
     * Gracefully stops camera and model tracking
     */
    stop() {
        this.isRunning = false;
        this.isCoolingDown = false;
        if (this.cooldownRaf) cancelAnimationFrame(this.cooldownRaf);

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }

        if (this.canvasCtx && this.canvasElement) {
            this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        }

        this.onStatusChange({ camera: 'offline', hand: 'none', message: 'Tracking stopped' });
    }
}
