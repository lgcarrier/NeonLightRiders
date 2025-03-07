class Controls {
    constructor(game) {
        this.game = game;
        this.setupTouchControls();
        this.setupKeyboardControls();
    }

    setupTouchControls() {
        const leftButton = document.getElementById('left-button');
        const rightButton = document.getElementById('right-button');

        leftButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.turnLeft();
        });

        rightButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.turnRight();
        });
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.game.turnLeft();
                    break;
                case 'ArrowRight':
                    this.game.turnRight();
                    break;
            }
        });
    }
}