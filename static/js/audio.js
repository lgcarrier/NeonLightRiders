class AudioManager {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.init();
    }

    async init() {
        this.sounds.engine = await this.createSound(440, 'square');
        this.sounds.explosion = await this.createExplosionSound();
        this.sounds.turn = await this.createTurnSound();
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

    playSound(soundName, duration = 0.1) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.oscillator.start();
            setTimeout(() => {
                sound.oscillator.stop();
                this.sounds[soundName] = null;
                this.init();
            }, duration * 1000);
        }
    }
}
