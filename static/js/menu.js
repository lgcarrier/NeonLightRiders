class GameMenu {
    constructor() {
        this.mainMenu = document.getElementById('main-menu');
        this.gameContainer = document.getElementById('game-container');
        this.startButton = document.getElementById('start-game');
        this.settingsButton = document.getElementById('settings');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.settingsButton.addEventListener('click', () => this.openSettings());
    }

    startGame() {
        this.mainMenu.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
        // Initialize the game if not already initialized
        if (window.game && !window.game.initialized) {
            window.game.init();
        }
    }

    openSettings() {
        // TODO: Implement settings menu
        alert('Settings coming soon!');
    }

    show() {
        this.mainMenu.classList.remove('hidden');
        this.gameContainer.classList.add('hidden');
    }
}

// Initialize menu when the page loads
window.addEventListener('DOMContentLoaded', () => {
    window.gameMenu = new GameMenu();
});
