
export class BluetoothManager {
    constructor() {
        this.device = null;
        this.server = null;
        this.char = null;
        this.onHeartRateChange = null;
    }

    async connect(callback) {
        this.onHeartRateChange = callback;

        try {
            console.log('Requesting Bluetooth Device...');
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }]
            });

            console.log('Connecting to GATT Server...');
            this.server = await this.device.gatt.connect();

            console.log('Getting Service...');
            const service = await this.server.getPrimaryService('heart_rate');

            console.log('Getting Characteristic...');
            this.char = await service.getCharacteristic('heart_rate_measurement');

            console.log('Starting Notifications...');
            await this.char.startNotifications();

            this.char.addEventListener('characteristicvaluechanged', (event) => {
                this.handleHeartRateMeasurement(event);
            });

            return true;
        } catch (error) {
            console.error('Bluetooth Error:', error);
            throw error;
        }
    }

    handleHeartRateMeasurement(event) {
        const value = event.target.value;
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        let heartRate;

        if (rate16Bits) {
            heartRate = value.getUint16(1, true);
        } else {
            heartRate = value.getUint8(1);
        }

        if (this.onHeartRateChange) {
            this.onHeartRateChange(heartRate);
        }
    }

    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
    }
}

export const bluetoothManager = new BluetoothManager();
