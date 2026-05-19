/**
 * PedometerEngine.js
 * 
 * Web-based Step Counter using the Generic Sensor API (Accelerometer).
 * Mirrors the hardware pedometer pattern from the Flutter reference:
 *   Pedometer.stepCountStream.listen((event) => { _steps = event.steps; })
 * 
 * Instead of a native pedometer SDK, this uses raw accelerometer data
 * and applies a peak-detection algorithm to count steps in real time.
 * 
 * ALGORITHM:
 * 1. Read accelerometer X, Y, Z at ~60Hz
 * 2. Compute acceleration magnitude: sqrt(x² + y² + z²)
 * 3. Apply a low-pass filter to smooth noise
 * 4. Detect "peaks" (a step occurs when magnitude crosses a threshold)
 * 5. Enforce a minimum time gap between steps (debounce) to avoid double-counting
 * 
 * SUPPORTED: Chrome on Android (requires HTTPS). Falls back gracefully on iOS/desktop.
 */

export class PedometerEngine {
    constructor() {
        this.sensor = null;
        this.steps = 0;
        this.isActive = false;
        this.onStepUpdate = null;

        // Algorithm tuning parameters
        this._lastMagnitude = 0;
        this._lastStepTime = 0;
        this._filtered = 9.8; // gravity baseline
        this._alpha = 0.15;   // low-pass filter coefficient (higher = more responsive)

        // Step detection thresholds
        this.STEP_THRESHOLD = 10.8;    // magnitude must exceed this to register a step
        this.STEP_COOLDOWN_MS = 300;   // minimum ms between steps (prevents double-count)
        this.GRAVITY = 9.81;

        // Calorie calculation
        this.caloriesPerStep = 0.04;   // base calories per step (adjusted by weight)
        this.userWeight = 70;          // default weight in kg
    }

    /**
     * Check if the device supports the Accelerometer API.
     */
    static isSupported() {
        return 'Accelerometer' in window;
    }

    /**
     * Start counting steps from the device accelerometer.
     * @param {Function} callback - Called with { steps, calories } on each step
     * @param {number} weight - User weight in kg for calorie calculation
     */
    async start(callback, weight = 70) {
        this.onStepUpdate = callback;
        this.userWeight = weight;
        this.caloriesPerStep = 0.04 * (weight / 70); // scale calories by weight ratio

        if (!PedometerEngine.isSupported()) {
            console.warn('[PedometerEngine] Accelerometer API not supported on this device/browser.');
            return false;
        }

        try {
            // Request permission (required on some browsers)
            if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission !== 'granted') {
                    console.warn('[PedometerEngine] Motion permission denied.');
                    return false;
                }
            }

            this.sensor = new Accelerometer({ frequency: 30 }); // 30 Hz sampling

            this.sensor.addEventListener('reading', () => {
                this._processReading(this.sensor.x, this.sensor.y, this.sensor.z);
            });

            this.sensor.addEventListener('error', (event) => {
                console.error('[PedometerEngine] Sensor error:', event.error.name, event.error.message);
                this.isActive = false;
            });

            this.sensor.start();
            this.isActive = true;
            console.log('[PedometerEngine] Hardware accelerometer started. Listening for steps...');
            return true;

        } catch (err) {
            console.error('[PedometerEngine] Failed to initialize:', err);
            return false;
        }
    }

    /**
     * Process a single accelerometer reading and detect steps.
     */
    _processReading(x, y, z) {
        // 1. Compute raw acceleration magnitude
        const magnitude = Math.sqrt(x * x + y * y + z * z);

        // 2. Apply exponential low-pass filter to smooth signal
        this._filtered = this._alpha * magnitude + (1 - this._alpha) * this._filtered;

        // 3. Peak detection: check if we crossed the threshold upward
        const now = Date.now();
        const timeSinceLastStep = now - this._lastStepTime;

        if (
            this._filtered > this.STEP_THRESHOLD &&
            this._lastMagnitude <= this.STEP_THRESHOLD &&
            timeSinceLastStep > this.STEP_COOLDOWN_MS
        ) {
            this.steps++;
            this._lastStepTime = now;

            // Calculate calories burned
            const calories = parseFloat((this.steps * this.caloriesPerStep).toFixed(1));

            // Fire callback with updated data
            if (this.onStepUpdate) {
                this.onStepUpdate({
                    steps: this.steps,
                    calories: calories,
                    timestamp: now
                });
            }
        }

        this._lastMagnitude = this._filtered;
    }

    /**
     * Stop the pedometer and clean up resources.
     */
    stop() {
        if (this.sensor) {
            this.sensor.stop();
            this.sensor = null;
        }
        this.isActive = false;
        console.log('[PedometerEngine] Stopped. Total steps recorded:', this.steps);
    }

    /**
     * Reset step count to zero.
     */
    reset() {
        this.steps = 0;
        this._lastStepTime = 0;
        this._filtered = this.GRAVITY;
        this._lastMagnitude = 0;
    }

    /**
     * Get current step data snapshot.
     */
    getSnapshot() {
        return {
            steps: this.steps,
            calories: parseFloat((this.steps * this.caloriesPerStep).toFixed(1)),
            isActive: this.isActive,
            supported: PedometerEngine.isSupported()
        };
    }
}

// Singleton instance
export const pedometerEngine = new PedometerEngine();
