class AudioManager {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.muted = false;
    }

    setMuted(muted) {
        this.muted = muted;
    }

    async createSound(frequency, type) {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        return { oscillator, gainNode };
    }

    async createExplosionSound() {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, this.context.currentTime);

        gainNode.gain.setValueAtTime(1, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        return { oscillator, gainNode };
    }

    async createTurnSound() {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, this.context.currentTime);

        gainNode.gain.setValueAtTime(0.5, this.context.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        return { oscillator, gainNode };
    }

    async playSound(soundName, duration = 0.1) {
        if (this.muted) return;

        let sound;
        switch(soundName) {
            case 'explosion':
                sound = await this.createExplosionSound();
                duration = 0.5;
                break;
            case 'turn':
                sound = await this.createTurnSound();
                break;
            default:
                sound = await this.createSound(440, 'square');
        }

        sound.oscillator.start();
        setTimeout(() => {
            sound.oscillator.stop();
            sound.oscillator.disconnect();
            sound.gainNode.disconnect();
        }, duration * 1000);
    }
}