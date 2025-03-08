class Controls {
    constructor(game) {
        this.game = game;
        this.setupTouchControls();
        this.setupKeyboardControls();
        this.setupEmoteControls();
    }

    setupTouchControls() {
        const leftButton = document.getElementById('left-button');
        const rightButton = document.getElementById('right-button');

        leftButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.turnLeft(0);
        });

        rightButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.turnRight(0);
        });
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.game.bikes[0].active) return;

            switch(e.key) {
                case 'ArrowLeft':
                    this.game.turnLeft(0);
                    break;
                case 'ArrowRight':
                    this.game.turnRight(0);
                    break;
                case '1':
                    this.triggerEmote('happy');
                    break;
                case '2':
                    this.triggerEmote('taunt');
                    break;
            }
        });
    }

    setupEmoteControls() {
        const emoteControls = document.getElementById('emote-controls');
        emoteControls.classList.remove('hidden');

        document.getElementById('emote-happy').addEventListener('click', () => {
            this.triggerEmote('happy');
        });

        document.getElementById('emote-taunt').addEventListener('click', () => {
            this.triggerEmote('taunt');
        });
    }

    triggerEmote(type) {
        const playerBike = this.game.bikes[0];
        if (playerBike && playerBike.active && playerBike.animations) {
            playerBike.animations.emote(type);
        }
    }
}