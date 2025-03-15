import Game from './game.js';

// Initialize game
window.game = new Game();

document.addEventListener('DOMContentLoaded', () => {
    window.game.init();
}); 