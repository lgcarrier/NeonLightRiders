import RoundManager from './RoundManager.js';
import GameEndScreen from './GameEndScreen.js';
import AudioManager from './audio.js';
import Controls from './controls.js';
import AI from './ai.js';
import Explosion from './explosion.js';
import RadarMap from './radar.js';
import Bike from './Bike.js';
import Trail from './Trail.js';
import CollisionManager from './CollisionManager.js';
import CameraManager from './CameraManager.js';
import Scene from './Scene.js';
import ScoreManager from './ScoreManager.js';

class Game {
    constructor(options = {}) {
        this.initialized = false;
        this.gameActive = false;
        this.roundActive = false;
        this.bikes = [];
        this.explosions = [];
        this.playerCount = 2;
        this.aiCount = 2;
        this.totalPlayers = this.playerCount + this.aiCount;
        this.speed = 0.5;
        this.roundNumber = 0;
        this.maxRounds = 5;
        this.scoreManager = new ScoreManager();
        this.roundManager = new RoundManager();
        this.gameEndScreen = new GameEndScreen();
        this.ais = [];
        
        // Game settings
        window.gameSettings = {
            allowSelfCollision: false, // Set to true to allow bikes to collide with their own trails
            trailDelay: 1000, // Delay in ms before trail creation starts
            debug: false, // Enable debug mode
            trailSegmentSize: 1, // Size of trail segments
            trailsRemainAfterExplosion: false, // Set to true to keep trails after a bike explodes
            ...options.gameSettings
        };
        
        // Only bind event listeners if not in test mode
        if (options.skipEventListeners !== true) {
            this.bindEventListeners();
        }
    }

    bindEventListeners() {
        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                this.restartGame();
            });
        }

        const restartGame = document.getElementById('restart-game');
        if (restartGame) {
            restartGame.addEventListener('click', () => {
                this.restartGame();
            });
        }

        const switchCamera = document.getElementById('switch-camera');
        if (switchCamera) {
            switchCamera.addEventListener('click', () => {
                // Only allow camera switching if player's bike is not active
                if (!this.bikes[0].active) {
                    this.cycleGhostCamera();
                }
            });
        }
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        console.log('Game initialization started');
        
        // Setup scene, camera, and renderer
        this.sceneManager = new Scene();
        const sceneSetup = this.sceneManager.setup();
        this.scene = sceneSetup.scene;
        this.camera = sceneSetup.camera;
        this.renderer = sceneSetup.renderer;
        this.gridSize = sceneSetup.gridSize;
        this.gridCellSize = sceneSetup.gridCellSize;
        
        // Initialize managers
        this.trailManager = new Trail(this.scene);
        this.collisionManager = new CollisionManager(this.scene, this.gridSize, this.gridCellSize);
        this.cameraManager = new CameraManager(this.camera);
        this.controls = new Controls(this);
        this.audio = new AudioManager();
        this.radar = new RadarMap();
        
        // Setup game components
        this.setupGame();
        
        console.log('Starting animation loop');
        this.animate();
        console.log('Game initialization completed');

        // Add ghost camera controls
        document.addEventListener('keydown', (e) => {
            if (this.cameraManager.isGhostMode() && e.key === 'Tab' && !this.bikes[0].active) {
                e.preventDefault();
                this.cycleGhostCamera();
            }
        });
    }

    async startGame() {
        while (!this.roundManager.isGameOver()) {
            await this.roundManager.startNewRound();
            await this.playRound();
        }
        this.endGame();
    }

    async playRound() {
        return new Promise(resolve => {
            // Reset player positions and trails
            this.resetPlayers();
            
            // When a player wins or all others are eliminated:
            const winnerId = this.determineWinner();
            this.roundManager.recordRoundWinner(winnerId);
            resolve();
        });
    }
    
    determineWinner() {
        const activeBikes = this.bikes.filter(bike => bike.active);
        return activeBikes.length > 0 ? activeBikes[0].bikeIndex.toString() : "-1";
    }

    endGame() {
        const finalScores = this.roundManager.getScores();
        this.gameEndScreen.show(finalScores);
    }

    setupGame() {
        this.bikes = [];
        this.ais = [];
        this.explosions = [];
        this.speed = this.gridCellSize;
        
        // Create bike materials
        const bikeMaterials = [
            new THREE.MeshBasicMaterial({ color: 0xff0000 }),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
            new THREE.MeshBasicMaterial({ color: 0x0000ff }),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        ];

        const cornerOffset = Math.floor(this.gridSize/2 / this.gridCellSize) * this.gridCellSize - 280; 
        const startPositions = [
            { x: -cornerOffset, z: cornerOffset, direction: new THREE.Vector3(1, 0, 0) },    
            { x: cornerOffset, z: cornerOffset, direction: new THREE.Vector3(0, 0, -1) },    
            { x: -cornerOffset, z: -cornerOffset, direction: new THREE.Vector3(0, 0, 1) },    
            { x: cornerOffset, z: -cornerOffset, direction: new THREE.Vector3(-1, 0, 0) }     
        ];

        // Create bikes
        for (let i = 0; i < 4; i++) {
            const position = new THREE.Vector3(
                startPositions[i].x,
                0.5,
                startPositions[i].z
            );
            
            const bike = new Bike(
                this.scene,
                position,
                startPositions[i].direction,
                bikeMaterials[i],
                this.gridCellSize,
                i
            );
            
            this.bikes.push(bike);

            // Create AI for non-player bikes
            if (i > 0) {
                this.ais.push(new AI(this, i));
            }
        }

        this.updateCamera();
        // Don't automatically start the round
        this.roundActive = false;
        this.roundStarted = false;
        this.roundManager = new RoundManager(); // Reset round manager
        this.updatePlayerCount();
    }

    turnLeft(bikeIndex = 0) {
        const bike = this.bikes[bikeIndex];
        if (bike.turnLeft()) {
            this.audio.playSound('turn');
        }
    }

    turnRight(bikeIndex = 0) {
        const bike = this.bikes[bikeIndex];
        if (bike.turnRight()) {
            this.audio.playSound('turn');
        }
    }

    checkCollisions(bike) {
        const bikeIndex = this.bikes.indexOf(bike);
        
        if (this.collisionManager.checkCollisions(bike, this.bikes, this.trailManager.getTrails())) {
            this.explodeBike(bikeIndex);
            this.checkGameOver();
            return true;
        }
        
        return false;
    }

    explodeBike(bikeIndex) {
        const bike = this.bikes[bikeIndex];
        bike.active = false;
        this.audio.playSound('explosion', 0.5);

        const explosion = new Explosion(
            this.scene,
            bike.position.clone(),
            bike.material.color
        );
        this.explosions.push(explosion);

        bike.visible = false;

        if (!window.gameSettings.trailsRemainAfterExplosion) {
            console.log(`Removing trails for bike ${bikeIndex}`);
            this.trailManager.removeTrailsForBike(bikeIndex);
        }

        // Show destruction message and delayed ghost mode for player
        if (bikeIndex === 0) {
            const destructionMsg = document.getElementById('destruction-message');
            if (destructionMsg) {
                destructionMsg.classList.remove('hidden');
                destructionMsg.classList.add('visible');

                // Delay ghost mode activation
                setTimeout(() => {
                    this.cameraManager.enableGhostMode();
                    // Find first active bike to follow
                    const firstActiveBike = this.bikes.findIndex((b, i) => i > 0 && b.active);
                    if (firstActiveBike !== -1) {
                        this.cameraManager.ghostCameraIndex = this.bikes.filter(b => b.active).indexOf(this.bikes[firstActiveBike]);
                    }
                    // Show switch camera button
                    const switchCameraButton = document.getElementById('switch-camera');
                    if (switchCameraButton) {
                        switchCameraButton.classList.add('visible');
                    }
                    // Hide destruction message
                    destructionMsg.classList.remove('visible');
                    destructionMsg.classList.add('hidden');
                }, 5000); 
            }
        }

        this.updatePlayerCount();
    }

    checkGameOver() {
        if (!this.roundStarted) return false;

        let activeBikes = this.bikes.filter(bike => bike.active);
        console.log('Check Game Over:', {
            activeBikes: activeBikes.length,
            currentRound: this.roundManager.getCurrentRound(),
            isGameOver: this.roundManager.isGameOver()
        });

        if (activeBikes.length <= 1) {
            this.roundStarted = false;

            if (activeBikes.length === 1) {
                const winnerIndex = this.bikes.indexOf(activeBikes[0]);
                console.log('Round Winner:', winnerIndex);
                this.roundManager.recordRoundWinner(winnerIndex.toString());
            }

            // First increment the round
            this.roundManager.incrementRound();

            // Then check if game is over
            if (this.roundManager.isGameOver()) {
                console.log('Game Over - Final Scores:', this.roundManager.getScores());
                this.gameEndScreen.show(this.roundManager.getScores());
            } else {
                console.log('Starting Next Round');
                setTimeout(() => {
                    this.startNewRound();
                }, 2000);
            }
            return true;
        }
        return false;
    }

    startNewRound() {
        if (this.roundManager.isGameOver()) return;

        this.roundManager.startNewRound().then(() => {
            // Reset the game state for new round
            this.trailManager.clearAllTrails();
            
            // Properly clean up all explosions before clearing the array
            this.explosions.forEach(explosion => explosion.cleanup());
            this.explosions = [];
            
            this.cameraManager.disableGhostMode();

            // Reset bikes to starting positions
            const cornerOffset = Math.floor(this.gridSize/2 / this.gridCellSize) * this.gridCellSize - 280;
            const startPositions = [
                { x: -cornerOffset, z: cornerOffset, direction: new THREE.Vector3(1, 0, 0) },
                { x: cornerOffset, z: cornerOffset, direction: new THREE.Vector3(0, 0, -1) },
                { x: -cornerOffset, z: -cornerOffset, direction: new THREE.Vector3(0, 0, 1) },
                { x: cornerOffset, z: -cornerOffset, direction: new THREE.Vector3(-1, 0, 0) }
            ];
            
            this.bikes.forEach((bike, index) => {
                bike.reset(
                    new THREE.Vector3(startPositions[index].x, 0.5, startPositions[index].z),
                    startPositions[index].direction
                );
            });

            this.updatePlayerCount();
            this.roundStarted = true;
            this.roundActive = true;  // Set roundActive to true when starting a new round
            console.log('New Round Started:', {
                round: this.roundManager.getCurrentRound(),
                totalRounds: 7
            });
        });
    }

    updateCamera() {
        const followedBike = this.getActivePlayerBike();
        this.cameraManager.updateCamera(followedBike);
    }

    updatePlayerCount() {
        const activePlayers = this.bikes.filter(bike => bike.active).length;
        const playersValueElement = document.getElementById('players-value');
        if (playersValueElement) {
            playersValueElement.textContent = activePlayers;
        }
    }

    restartGame() {
        // First hide the end screen
        this.gameEndScreen.hide();

        // Clear existing game elements
        this.trailManager.clearAllTrails();
        this.bikes.forEach(bike => bike.remove());
        this.bikes = [];
        this.ais = [];
        
        // Properly clean up all explosions before clearing the array
        this.explosions.forEach(explosion => explosion.cleanup());
        this.explosions = []; 
        
        this.cameraManager.disableGhostMode();

        // Hide UI elements
        const switchCameraButton = document.getElementById('switch-camera');
        if (switchCameraButton) {
            switchCameraButton.classList.remove('visible');
        }
        
        const destructionMsg = document.getElementById('destruction-message');
        if (destructionMsg) {
            destructionMsg.classList.remove('visible');
            destructionMsg.classList.add('hidden');
        }

        this.setupGame();
        this.updatePlayerCount();
        this.roundManager = new RoundManager(); // This resets to round 1
        
        const roundValueElement = document.getElementById('round-value');
        if (roundValueElement) {
            roundValueElement.textContent = '1/7'; // Update display
        }
        
        this.roundStarted = true;

        const gameOverElement = document.getElementById('game-over');
        if (gameOverElement) {
            gameOverElement.classList.add('hidden');
        }
    }

    cycleGhostCamera() {
        // Only allow camera cycling if player's bike (index 0) is not active
        if (!this.bikes[0].active) {
            const activeBikes = this.bikes.filter(bike => bike.active);
            this.cameraManager.cycleGhostCamera(activeBikes);
        }
    }

    getActivePlayerBike() {
        return this.cameraManager.getActivePlayerBike(this.bikes);
    }

    animate() {
        const timestamp = Date.now();
        console.log(`Animation frame at ${timestamp}`);

        requestAnimationFrame(() => this.animate());

        this.explosions = this.explosions.filter(explosion => explosion.update());

        // Update radar before processing bike movements
        this.radar.update(this.bikes.map(bike => bike.mesh), this.gridSize);

        // Only process bike movements if a round is active
        if (this.roundActive) {
            for (let i = 0; i < this.bikes.length; i++) {
                const bike = this.bikes[i];
                if (!bike.active) continue;

                console.log(`Bike ${i} Pre-Movement:`, {
                    position: `x:${bike.position.x.toFixed(2)}, z:${bike.position.z.toFixed(2)}`,
                    direction: `x:${bike.direction.x.toFixed(2)}, z:${bike.direction.z.toFixed(2)}`,
                    speed: this.speed,
                    active: bike.active,
                    timestamp: timestamp
                });

                const moveInfo = bike.move(this.speed);

                console.log(`Bike ${i} Movement:`, {
                    oldPosition: `x:${moveInfo.oldPosition.x.toFixed(2)}, z:${moveInfo.oldPosition.z.toFixed(2)}`,
                    newPosition: `x:${moveInfo.newPosition.x.toFixed(2)}, z:${moveInfo.newPosition.z.toFixed(2)}`,
                    movement: `x:${moveInfo.movement.x.toFixed(2)}, z:${moveInfo.movement.z.toFixed(2)}`,
                    direction: `x:${bike.direction.x.toFixed(2)}, z:${bike.direction.z.toFixed(2)}`,
                    speed: this.speed,
                    active: bike.active,
                    timestamp: timestamp
                });

                // First check for collisions, then create trail
                // This ensures we detect collisions before creating new trail segments
                if (this.checkCollisions(bike)) {
                    console.log('Collision resulted in bike explosion:', i);
                    continue; // Skip trail creation if bike exploded
                }

                // Create trail after collision check and only if enough time has passed
                if (Date.now() > bike.trailStartTime) {
                    this.trailManager.createTrail(bike, this.gridCellSize);
                }
            }

            // Add an explicit check here too
            let activeBikes = this.bikes.filter(bike => bike.active);
            if (activeBikes.length <= 1) {
                console.log('Active bikes check in animate:', activeBikes.length);
                this.checkGameOver();
            }
        }

        // Move the active bikes check outside the bike loop
        if (this.roundActive) {
            let activeBikes = this.bikes.filter(bike => bike.active);
            if (activeBikes.length <= 1) {
                console.log('Round End Check - Active bikes:', activeBikes.length);
                this.checkGameOver();
            }
            
            // Only update AI when a round is active
            for (const ai of this.ais) {
                ai.update();
            }
        }

        this.updateCamera();
        this.sceneManager.render(this.camera);
        
        // Move round check to end of animate
        if (this.roundStarted) {
            let activeBikes = this.bikes.filter(bike => bike.active);
            if (activeBikes.length <= 1) {
                this.checkGameOver();
            }
        }
    }
}

export { Game };
export default Game;