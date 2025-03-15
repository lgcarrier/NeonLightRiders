class Controls {
    constructor(game) {
        this.game = game;
        this.setupTouchControls();
        this.setupKeyboardControls();
    }

    setupTouchControls() {
        const leftButton = document.getElementById('left-button');
        const rightButton = document.getElementById('right-button');

        if (leftButton) {
            leftButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.game.turnLeft(0); 
            });
        }

        if (rightButton) {
            rightButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.game.turnRight(0); 
            });
        }
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.game.turnLeft(0);
                    break;
                case 'ArrowRight':
                    this.game.turnRight(0);
                    break;
            }
        });
    }
}

export default Controls;