class GameMenu {
    constructor() {
        this.mainMenu = document.getElementById('main-menu');
        this.gameContainer = document.getElementById('game-container');
        this.startButton = document.getElementById('start-game');
        this.settingsButton = document.getElementById('settings');
        
        // Settings menu elements
        this.settingsMenu = document.getElementById('settings-menu') || this.createSettingsMenu();
        this.selfCollisionToggle = document.getElementById('self-collision-toggle');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.settingsButton.addEventListener('click', () => this.openSettings());
        
        // Settings menu event listeners
        if (this.selfCollisionToggle) {
            this.selfCollisionToggle.addEventListener('change', (e) => {
                window.gameSettings.allowSelfCollision = e.target.checked;
                console.log('Self-collision set to:', window.gameSettings.allowSelfCollision);
            });
        }
        
        // Persistent trails toggle
        const persistentTrailsToggle = document.getElementById('persistent-trails-toggle');
        if (persistentTrailsToggle) {
            persistentTrailsToggle.addEventListener('change', (e) => {
                window.gameSettings.trailsRemainAfterExplosion = e.target.checked;
                console.log('Persistent trails set to:', window.gameSettings.trailsRemainAfterExplosion);
            });
        }
        
        // Debug mode toggle
        const debugToggle = document.getElementById('debug-toggle');
        if (debugToggle) {
            debugToggle.addEventListener('change', (e) => {
                window.gameSettings.debug = e.target.checked;
                console.log('Debug mode set to:', window.gameSettings.debug);
            });
        }
        
        // Close settings button
        const closeSettingsButton = document.getElementById('close-settings');
        if (closeSettingsButton) {
            closeSettingsButton.addEventListener('click', () => this.closeSettings());
        }
    }

    startGame() {
        this.mainMenu.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
        
        // Initialize the game if not already initialized
        if (window.game) {
            if (!window.game.initialized) {
                window.game.init();
            }
            
            // Explicitly start a new round when the user clicks "Start Game"
            window.game.startNewRound();
        }
    }

    openSettings() {
        this.mainMenu.classList.add('hidden');
        this.settingsMenu.classList.remove('hidden');
        
        // Update toggle states based on current settings
        if (this.selfCollisionToggle) {
            this.selfCollisionToggle.checked = window.gameSettings?.allowSelfCollision || false;
        }
        
        const persistentTrailsToggle = document.getElementById('persistent-trails-toggle');
        if (persistentTrailsToggle) {
            persistentTrailsToggle.checked = window.gameSettings?.trailsRemainAfterExplosion || false;
        }
        
        const debugToggle = document.getElementById('debug-toggle');
        if (debugToggle) {
            debugToggle.checked = window.gameSettings?.debug || false;
        }
    }
    
    closeSettings() {
        this.settingsMenu.classList.add('hidden');
        this.mainMenu.classList.remove('hidden');
    }
    
    createSettingsMenu() {
        // Create settings menu if it doesn't exist
        const settingsMenu = document.createElement('div');
        settingsMenu.id = 'settings-menu';
        settingsMenu.className = 'menu hidden';
        
        // Create settings content
        settingsMenu.innerHTML = `
            <div class="menu-content">
                <h2>Game Settings</h2>
                <div class="setting-item">
                    <label for="self-collision-toggle">Allow Self-Collision:</label>
                    <input type="checkbox" id="self-collision-toggle">
                </div>
                <div class="setting-item">
                    <label for="persistent-trails-toggle">Persistent Trails:</label>
                    <input type="checkbox" id="persistent-trails-toggle">
                </div>
                <div class="setting-item">
                    <label for="debug-toggle">Debug Mode:</label>
                    <input type="checkbox" id="debug-toggle">
                </div>
                <button id="close-settings" class="menu-button">Back to Menu</button>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(settingsMenu);
        
        // Initialize toggle
        this.selfCollisionToggle = document.getElementById('self-collision-toggle');
        
        // Add event listener for close button
        const closeSettingsButton = document.getElementById('close-settings');
        if (closeSettingsButton) {
            closeSettingsButton.addEventListener('click', () => this.closeSettings());
        }
        
        return settingsMenu;
    }

    show() {
        this.mainMenu.classList.remove('hidden');
        this.gameContainer.classList.add('hidden');
        this.settingsMenu.classList.add('hidden');
    }
}

// Initialize menu when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.gameMenu = new GameMenu();
});

export default GameMenu;
