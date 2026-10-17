// Gesture recognition handler using MediaPipe Hands
export class GestureEngine {
    constructor(options = {}) {
        this.videoElement = options.videoElement || null;
        this.canvasElement = options.canvasElement || null;
        this.canvasCtx = this.canvasElement ? this.canvasElement.getContext('2d') : null;

        this.sensitivity = options.sensitivity || 5;
        this.cooldownMs = options.cooldownMs || 800;
        this.swipePixelThreshold = options.swipePixelThreshold || 55;
        this.fistHoldSeconds = options.fistHoldSeconds || 1.5;
        this.audioFeedback = options.audioFeedback ?? true;
        this.showLandmarkCanvas = options.showLandmarkCanvas ?? true;

        this.onGestureDetected = options.onGestureDetected || (() => {});
        this.onTelemetryUpdate = options.onTelemetryUpdate || (() => {});
        this.onStatusChange = options.onStatusChange || (() => {});
        this.onCooldownProgress = options.onCooldownProgress || (() => {});

        this.stream = null;
        this.hands = null;
        this.isRunning = false;
        this.isCoolingDown = false;
        this.cooldownStartTime = 0;
        this.cooldownRaf = null;

        this.landmarkHistory = [];
        this.fistStartTime = null;
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = performance.now();
        this.audioCtx = null;
    }

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
            console.warn('Audio error:', e);
        }
    }

    async initialize(deviceId = null) {
        this.onStatusChange({ camera: 'connecting', hand: 'none' });

        try {
            const constraints = {
                video: deviceId
                    ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
                    : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
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

            await this.initMediaPipe();

            this.isRunning = true;
            this.startFrameLoop();
            this.onStatusChange({ camera: 'online', hand: 'searching' });

            return true;
        } catch (err) {
            console.error('Webcam error:', err);
            this.onStatusChange({ camera: 'error', hand: 'none' });
            throw err;
        }
    }

    async initMediaPipe() {
        if (typeof window.Hands === 'undefined') {
            await this.loadScript('/vendor/mediapipe/hands/hands.js')
                .catch(() => this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'));
        }

        this.hands = new window.Hands({
            locateFile: (file) => `/vendor/mediapipe/hands/${file}`
        });

        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults(this.handleInferenceResults.bind(this));
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
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
                    console.warn(e);
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

    handleInferenceResults(results) {
        const canvas = this.canvasElement;
        const ctx = this.canvasCtx;

        if (canvas && ctx) {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (this.videoElement && this.showLandmarkCanvas) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    this.drawLandmarks(ctx, results.multiHandLandmarks[0], canvas.width, canvas.height);
                }
            }
            ctx.restore();
        }

        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            this.onStatusChange({ camera: 'online', hand: 'none' });
            this.landmarkHistory = [];
            this.fistStartTime = null;
            return;
        }

        this.onStatusChange({ camera: 'online', hand: 'detected' });
        this.evaluateGestures(results.multiHandLandmarks[0]);
    }

    drawLandmarks(ctx, landmarks, width, height) {
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [5, 9], [9, 10], [10, 11], [11, 12],
            [9, 13], [13, 14], [14, 15], [15, 16],
            [13, 17], [17, 18], [18, 19], [19, 20],
            [0, 17]
        ];

        ctx.strokeStyle = this.isCoolingDown ? '#E6B31E' : '#FCFAF1';
        ctx.lineWidth = 2.5;
        for (const [i, j] of connections) {
            ctx.beginPath();
            ctx.moveTo(landmarks[i].x * width, landmarks[i].y * height);
            ctx.lineTo(landmarks[j].x * width, landmarks[j].y * height);
            ctx.stroke();
        }

        for (let i = 0; i < landmarks.length; i++) {
            const lm = landmarks[i];
            ctx.fillStyle = '#E6B31E';
            ctx.beginPath();
            ctx.arc(lm.x * width, lm.y * height, 4, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    evaluateGestures(landmarks) {
        const now = performance.now();
        const wrist = landmarks[0];
        const indexTip = landmarks[8];
        const indexMcp = landmarks[5];
        const middleTip = landmarks[12];
        const middleMcp = landmarks[9];
        const ringTip = landmarks[16];
        const ringMcp = landmarks[13];
        const pinkyTip = landmarks[20];
        const pinkyMcp = landmarks[17];

        const handCenterX = (wrist.x + indexMcp.x + pinkyMcp.x) / 3;
        const handCenterY = (wrist.y + indexMcp.y + pinkyMcp.y) / 3;

        this.landmarkHistory.push({
            timestamp: now,
            x: handCenterX,
            y: handCenterY
        });

        while (this.landmarkHistory.length > 0 && now - this.landmarkHistory[0].timestamp > 350) {
            this.landmarkHistory.shift();
        }

        if (this.isCoolingDown) return;

        const isIndexExtended = this.distance(indexTip, wrist) > this.distance(indexMcp, wrist) * 1.25;
        const isMiddleExtended = this.distance(middleTip, wrist) > this.distance(middleMcp, wrist) * 1.25;
        const isRingExtended = this.distance(ringTip, wrist) > this.distance(ringMcp, wrist) * 1.25;
        const isPinkyExtended = this.distance(pinkyTip, wrist) > this.distance(pinkyMcp, wrist) * 1.25;

        const extendedFingers = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended].filter(Boolean).length;

        // Closed fist check
        if (extendedFingers <= 1) {
            if (!this.fistStartTime) {
                this.fistStartTime = now;
            } else if ((now - this.fistStartTime) / 1000 >= this.fistHoldSeconds) {
                this.fistStartTime = null;
                this.triggerGesture('fist', 'F5', 'Fullscreen', 95);
                return;
            }
        } else {
            this.fistStartTime = null;
        }

        // Swipe left / right check
        if (this.landmarkHistory.length >= 4 && extendedFingers >= 2) {
            const oldest = this.landmarkHistory[0];
            const current = this.landmarkHistory[this.landmarkHistory.length - 1];
            const timeDiff = current.timestamp - oldest.timestamp;

            if (timeDiff >= 80 && timeDiff <= 320) {
                const deltaX = current.x - oldest.x;
                const deltaY = current.y - oldest.y;
                const threshold = 0.12 - (this.sensitivity * 0.007);

                if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
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

        // TODO: Open palm pause trigger for next phase
    }

    distance(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    triggerGesture(type, key, label, confidence = 95, deltaX = 0, deltaY = 0) {
        if (this.isCoolingDown) return;

        this.startCooldown();
        this.playBeep(type === 'fist' ? 880 : 540, 0.1);

        window.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, bubbles: true }));

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

    updateConfig(newConfig = {}) {
        if (newConfig.sensitivity !== undefined) this.sensitivity = newConfig.sensitivity;
        if (newConfig.cooldownMs !== undefined) this.cooldownMs = newConfig.cooldownMs;
        if (newConfig.showLandmarkCanvas !== undefined) this.showLandmarkCanvas = newConfig.showLandmarkCanvas;
        if (newConfig.audioFeedback !== undefined) this.audioFeedback = newConfig.audioFeedback;
    }

    stop() {
        this.isRunning = false;
        this.isCoolingDown = false;
        if (this.cooldownRaf) cancelAnimationFrame(this.cooldownRaf);

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) this.videoElement.srcObject = null;
        if (this.canvasCtx && this.canvasElement) {
            this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        }

        this.onStatusChange({ camera: 'offline', hand: 'none' });
    }
}
