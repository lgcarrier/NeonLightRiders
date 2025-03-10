class Game {
    constructor() {
        this.roundManager = new RoundManager();
        this.gameEndScreen = new GameEndScreen();
        this.initialized = false;
        this.roundActive = false;  // Add this to track if a round is in progress
        this.roundStarted = false; // Add new flag
        // Bind event listeners that should exist before initialization
        this.bindEventListeners();
    }

    bindEventListeners() {
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('restart-game').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('switch-camera').addEventListener('click', () => {
            this.cycleGhostCamera();
        });
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        console.log('Game initialization started');
        this.setupScene();
        this.setupLights();
        this.setupGame();
        this.controls = new Controls(this);
        this.audio = new AudioManager();
        this.radar = new RadarMap();
        this.trailsRemainAfterExplosion = true;
        this.explosions = [];
        this.ghostMode = false;
        this.ghostCameraIndex = 0;
        this.updatePlayerCount();
        console.log('Starting animation loop');
        this.animate();
        console.log('Game initialization completed');

        // Add ghost camera controls
        document.addEventListener('keydown', (e) => {
            if (this.ghostMode && e.key === 'Tab') {
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
            
            // Your existing game loop logic here
            // When a player wins or all others are eliminated:
            this.roundManager.recordRoundWinner(winnerId);
            resolve();
        });
    }

    endGame() {
        const finalScores = this.roundManager.getScores();
        this.gameEndScreen.show(finalScores);
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x120458);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }

    setupGame() {
        this.gridSize = 800; 
        this.gridCellSize = 1; 
        this.bikes = [];
        this.trails = [];
        this.ais = [];
        this.speed = this.gridCellSize; 
        this.lastTrailPositions = new Map();

        const grid = new THREE.GridHelper(this.gridSize, this.gridSize / this.gridCellSize, 0xff00ff, 0x00ff9f);
        this.scene.add(grid);

        const wallHeight = 20;
        const wallMaterial = new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.5
        });

        const walls = [
            { pos: [0, wallHeight/2, -this.gridSize/2], size: [this.gridSize, wallHeight, 3] },
            { pos: [0, wallHeight/2, this.gridSize/2], size: [this.gridSize, wallHeight, 3] },
            { pos: [this.gridSize/2, wallHeight/2, 0], size: [3, wallHeight, this.gridSize] },
            { pos: [-this.gridSize/2, wallHeight/2, 0], size: [3, wallHeight, this.gridSize] }
        ];

        walls.forEach(wall => {
            const geometry = new THREE.BoxGeometry(...wall.size);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            mesh.position.set(...wall.pos);
            this.scene.add(mesh);
        });

        const bikeGeometry = new THREE.BoxGeometry(2, 1, 4);
        const bikeMaterials = [
            new THREE.MeshPhongMaterial({color: 0x00ff9f}),  
            new THREE.MeshPhongMaterial({color: 0xff00ff}),  
            new THREE.MeshPhongMaterial({color: 0x00ffff}),  
            new THREE.MeshPhongMaterial({color: 0xff0000})   
        ];

        const cornerOffset = Math.floor(this.gridSize/2 / this.gridCellSize) * this.gridCellSize - 280; 
        const startPositions = [
            { x: -cornerOffset, z: cornerOffset, direction: new THREE.Vector3(1, 0, 0) },    
            { x: cornerOffset, z: cornerOffset, direction: new THREE.Vector3(0, 0, -1) },    
            { x: -cornerOffset, z: -cornerOffset, direction: new THREE.Vector3(0, 0, 1) },    
            { x: cornerOffset, z: -cornerOffset, direction: new THREE.Vector3(-1, 0, 0) }     
        ];

        for (let i = 0; i < 4; i++) {
            const bike = new THREE.Mesh(bikeGeometry, bikeMaterials[i]);
            bike.position.set(
                Math.round(startPositions[i].x / this.gridCellSize) * this.gridCellSize,
                0.5,
                Math.round(startPositions[i].z / this.gridCellSize) * this.gridCellSize
            );
            bike.direction = startPositions[i].direction.clone().normalize();
            const angle = Math.atan2(bike.direction.x, bike.direction.z);
            bike.rotation.y = angle;
            bike.active = true;
            bike.trailStartTime = Date.now() + 1000;
            bike.lastGridPosition = bike.position.clone();
            this.bikes.push(bike);
            this.scene.add(bike);

            console.log(`Bike ${i} initialized:`, {
                position: `x:${bike.position.x.toFixed(2)}, z:${bike.position.z.toFixed(2)}`,
                direction: `x:${bike.direction.x.toFixed(2)}, z:${bike.direction.z.toFixed(2)}`,
                angle: angle.toFixed(2)
            });

            if (i > 0) {
                this.ais.push(new AI(this, i));
            }
        }

        this.updateCamera();
        this.roundActive = true;
        this.roundStarted = true;
        this.roundManager = new RoundManager(); // Reset round manager
    }

    turnLeft(bikeIndex = 0) {
        const bike = this.bikes[bikeIndex];
        if (!bike.active) return;

        const onGrid = (
            Math.abs(bike.position.x % this.gridCellSize) < 0.1 &&
            Math.abs(bike.position.z % this.gridCellSize) < 0.1
        );

        console.log('Turn Left Attempt:', {
            position: `x:${bike.position.x.toFixed(2)}, z:${bike.position.z.toFixed(2)}`,
            onGrid: onGrid,
            modX: (bike.position.x % this.gridCellSize).toFixed(2),
            modZ: (bike.position.z % this.gridCellSize).toFixed(2)
        });

        if (onGrid) {
            const oldDir = bike.direction.clone();
            bike.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
            bike.rotateY(Math.PI/2);
            console.log('Turn Left Executed:', {
                oldDirection: `x:${oldDir.x.toFixed(2)}, z:${oldDir.z.toFixed(2)}`,
                newDirection: `x:${bike.direction.x.toFixed(2)}, z:${bike.direction.z.toFixed(2)}`
            });
            this.audio.playSound('turn');
        }
    }

    turnRight(bikeIndex = 0) {
        const bike = this.bikes[bikeIndex];
        if (!bike.active) return;

        const onGrid = (
            Math.abs(bike.position.x % this.gridCellSize) < 0.1 &&
            Math.abs(bike.position.z % this.gridCellSize) < 0.1
        );

        console.log('Turn Right Attempt:', {
            position: `x:${bike.position.x.toFixed(2)}, z:${bike.position.z.toFixed(2)}`,
            onGrid: onGrid,
            modX: (bike.position.x % this.gridCellSize).toFixed(2),
            modZ: (bike.position.z % this.gridCellSize).toFixed(2)
        });

        if (onGrid) {
            const oldDir = bike.direction.clone();
            bike.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2);
            bike.rotateY(-Math.PI/2);
            console.log('Turn Right Executed:', {
                oldDirection: `x:${oldDir.x.toFixed(2)}, z:${oldDir.z.toFixed(2)}`,
                newDirection: `x:${bike.direction.x.toFixed(2)}, z:${bike.direction.z.toFixed(2)}`
            });
            this.audio.playSound('turn');
        }
    }

    createTrail(bike) {
        const currentGridPos = new THREE.Vector3(
            Math.round(bike.position.x / this.gridCellSize) * this.gridCellSize,
            0.5,
            Math.round(bike.position.z / this.gridCellSize) * this.gridCellSize
        );

        if (currentGridPos.distanceTo(bike.lastGridPosition) < this.gridCellSize / 2) {
            return;
        }

        const trailGeometry = new THREE.BoxGeometry(
            Math.abs(currentGridPos.x - bike.lastGridPosition.x) || 1,
            8, 
            Math.abs(currentGridPos.z - bike.lastGridPosition.z) || 1
        );

        const trailMaterial = new THREE.MeshPhongMaterial({
            color: bike.material.color,
            transparent: true,
            opacity: 0.8
        });

        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.set(
            (currentGridPos.x + bike.lastGridPosition.x) / 2,
            4, 
            (currentGridPos.z + bike.lastGridPosition.z) / 2
        );

        trail.creationTime = Date.now();
        trail.bikeId = this.bikes.indexOf(bike);
        this.trails.push(trail);
        this.scene.add(trail);

        bike.lastGridPosition = currentGridPos.clone();
    }

    checkCollisions(bike) {
        const bikeIndex = this.bikes.indexOf(bike);
        console.log('Checking collisions for bike:', bikeIndex);
        const now = Date.now();

        // Wall collision check
        const buffer = 3;
        if (
            Math.abs(bike.position.x) > (this.gridSize/2 - buffer) ||
            Math.abs(bike.position.z) > (this.gridSize/2 - buffer)
        ) {
            console.log('Wall collision detected for bike:', bikeIndex);
            this.explodeBike(bikeIndex);
            this.checkGameOver(); // Add explicit call here
            return true;
        }

        // Trail collision check
        for (const trail of this.trails) {
            // Skip only very recent trails from the same bike
            if (trail.bikeId === bikeIndex && (now - trail.creationTime) < 100) {
                continue;
            }

            // Get trail dimensions and orientation
            const isVertical = trail.scale.z > trail.scale.x;
            const halfLength = isVertical ? trail.scale.z / 2 : trail.scale.x / 2;

            // Calculate trail endpoints
            const trailStart = new THREE.Vector3();
            const trailEnd = new THREE.Vector3();

            if (isVertical) {
                trailStart.set(trail.position.x, 0, trail.position.z - halfLength);
                trailEnd.set(trail.position.x, 0, trail.position.z + halfLength);
            } else {
                trailStart.set(trail.position.x - halfLength, 0, trail.position.z);
                trailEnd.set(trail.position.x + halfLength, 0, trail.position.z);
            }

            // Project bike position onto trail segment
            const trailVector = trailEnd.clone().sub(trailStart);
            const bikeToStart = bike.position.clone().sub(trailStart);

            const dot = bikeToStart.dot(trailVector);
            const trailLengthSq = trailVector.lengthSq();
            const t = Math.max(0, Math.min(1, dot / trailLengthSq));

            const closestPoint = trailStart.clone().add(trailVector.multiplyScalar(t));
            const distance = bike.position.distanceTo(closestPoint);

            // Use a smaller buffer for more precise collisions
            if (distance < 2) {
                console.log('Trail collision detected for bike:', bikeIndex);
                this.explodeBike(bikeIndex);
                this.checkGameOver(); // Add explicit call here
                return false; // Return false since we handle the explosion here
            }
        }

        // Bike-to-bike collision check
        for (let i = 0; i < this.bikes.length; i++) {
            if (i !== bikeIndex && this.bikes[i].active) {
                const otherBike = this.bikes[i];
                const distance = bike.position.distanceTo(otherBike.position);
                if (distance < this.gridCellSize * 2) {
                    console.log('Bike collision detected between bikes:', bikeIndex, i);
                    // Explode both bikes
                    this.explodeBike(i);
                    this.explodeBike(bikeIndex);
                    this.checkGameOver(); // Add explicit call here
                    return true;
                }
            }
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

        if (!this.trailsRemainAfterExplosion) {
            console.log(`Removing trails for bike ${bikeIndex}`);
            const remainingTrails = this.trails.filter(trail => trail.bikeId !== bikeIndex);
            this.trails.forEach(trail => {
                if (trail.bikeId === bikeIndex) {
                    this.scene.remove(trail);
                }
            });
            this.trails = remainingTrails;
        }

        // Show destruction message and delayed ghost mode for player
        if (bikeIndex === 0) {
            const destructionMsg = document.getElementById('destruction-message');
            destructionMsg.classList.remove('hidden');
            destructionMsg.classList.add('visible');

            // Delay ghost mode activation
            setTimeout(() => {
                this.ghostMode = true;
                this.ghostCameraIndex = 0;
                // Find first active bike to follow
                const firstActiveBike = this.bikes.findIndex((b, i) => i > 0 && b.active);
                if (firstActiveBike !== -1) {
                    this.ghostCameraIndex = this.bikes.filter(b => b.active).indexOf(this.bikes[firstActiveBike]);
                }
                // Show switch camera button
                document.getElementById('switch-camera').classList.add('visible');
                // Hide destruction message
                destructionMsg.classList.remove('visible');
                destructionMsg.classList.add('hidden');
            }, 5000); 
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
            this.trails.forEach(trail => this.scene.remove(trail));
            this.trails = [];
            this.explosions = [];
            this.ghostMode = false;
            this.ghostCameraIndex = 0;

            // Reset bikes to starting positions
            this.bikes.forEach((bike, index) => {
                bike.visible = true;
                bike.active = true;
                
                const cornerOffset = Math.floor(this.gridSize/2 / this.gridCellSize) * this.gridCellSize - 280;
                const startPositions = [
                    { x: -cornerOffset, z: cornerOffset, direction: new THREE.Vector3(1, 0, 0) },
                    { x: cornerOffset, z: cornerOffset, direction: new THREE.Vector3(0, 0, -1) },
                    { x: -cornerOffset, z: -cornerOffset, direction: new THREE.Vector3(0, 0, 1) },
                    { x: cornerOffset, z: -cornerOffset, direction: new THREE.Vector3(-1, 0, 0) }
                ];

                bike.position.set(
                    Math.round(startPositions[index].x / this.gridCellSize) * this.gridCellSize,
                    0.5,
                    Math.round(startPositions[index].z / this.gridCellSize) * this.gridCellSize
                );
                bike.direction.copy(startPositions[index].direction).normalize();
                bike.rotation.y = Math.atan2(bike.direction.x, bike.direction.z);
                bike.trailStartTime = Date.now() + 1000;
                bike.lastGridPosition = bike.position.clone();
            });

            this.updatePlayerCount();
            this.roundStarted = true;
            console.log('New Round Started:', {
                round: this.roundManager.getCurrentRound(),
                totalRounds: 7
            });
        });
    }

    updateCamera() {
        const followedBike = this.getActivePlayerBike();

        const cameraDistance = 80;
        const cameraHeight = 40;

        const targetPosition = new THREE.Vector3(
            followedBike.position.x - followedBike.direction.x * cameraDistance,
            cameraHeight,
            followedBike.position.z - followedBike.direction.z * cameraDistance
        );

        this.camera.position.lerp(targetPosition, 0.1);

        const lookAtPosition = new THREE.Vector3(
            followedBike.position.x,
            0,
            followedBike.position.z
        );
        this.camera.lookAt(lookAtPosition);
    }

    updatePlayerCount() {
        const activePlayers = this.bikes.filter(bike => bike.active).length;
        document.getElementById('players-value').textContent = activePlayers;
    }

    restartGame() {
        // First hide the end screen
        this.gameEndScreen.hide();

        this.trails.forEach(trail => this.scene.remove(trail));
        this.bikes.forEach(bike => this.scene.remove(bike));
        this.trails = [];
        this.bikes = [];
        this.ais = [];
        this.explosions = []; 
        this.ghostMode = false; 
        this.ghostCameraIndex = 0; 

        // Hide UI elements
        document.getElementById('switch-camera').classList.remove('visible');
        document.getElementById('destruction-message').classList.remove('visible');
        document.getElementById('destruction-message').classList.add('hidden');

        this.setupGame();
        this.updatePlayerCount();
        this.roundManager = new RoundManager(); // This resets to round 1
        document.getElementById('round-value').textContent = '1/7'; // Update display
        this.roundStarted = true;

        document.getElementById('game-over').classList.add('hidden');
    }

    cycleGhostCamera() {
        const activeBikes = this.bikes.filter(bike => bike.active);
        if (activeBikes.length > 1) {
            this.ghostCameraIndex = (this.ghostCameraIndex + 1) % activeBikes.length;
            const followedBike = activeBikes[this.ghostCameraIndex];
            console.log(`Ghost camera following bike ${this.bikes.indexOf(followedBike)}`);
        }
    }

    getActivePlayerBike() {
        if (!this.ghostMode) {
            return this.bikes[0];
        }

        const activeBikes = this.bikes.filter(bike => bike.active);
        if (activeBikes.length === 0) return this.bikes[0];

        return activeBikes[this.ghostCameraIndex % activeBikes.length];
    }

    animate() {
        const timestamp = Date.now();
        console.log(`Animation frame at ${timestamp}`);

        requestAnimationFrame(() => this.animate());

        this.explosions = this.explosions.filter(explosion => explosion.update());

        // Update radar before processing bike movements
        this.radar.update(this.bikes, this.gridSize);

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

            const oldPos = bike.position.clone();
            const movement = bike.direction.clone().multiplyScalar(this.speed);
            bike.position.add(movement);

            console.log(`Bike ${i} Movement:`, {
                oldPosition: `x:${oldPos.x.toFixed(2)}, z:${oldPos.z.toFixed(2)}`,
                newPosition: `x:${bike.position.x.toFixed(2)}, z:${bike.position.z.toFixed(2)}`,
                movement: `x:${movement.x.toFixed(2)}, z:${movement.z.toFixed(2)}`,
                direction: `x:${bike.direction.x.toFixed(2)}, z:${bike.direction.z.toFixed(2)}`,
                speed: this.speed,
                active: bike.active
            });

            if (Date.now() > bike.trailStartTime) {
                this.createTrail(bike);
            }

            if (this.checkCollisions(bike)) {
                console.log('Collision resulted in bike explosion:', i);
                // Remove this since we now call checkGameOver in checkCollisions
                // if (this.checkGameOver()) return;
            }
        }

        // Add an explicit check here too
        let activeBikes = this.bikes.filter(bike => bike.active);
        if (activeBikes.length <= 1) {
            console.log('Active bikes check in animate:', activeBikes.length);
            this.checkGameOver();
        }

        // Move the active bikes check outside the bike loop
        if (this.roundActive) {
            let activeBikes = this.bikes.filter(bike => bike.active);
            if (activeBikes.length <= 1) {
                console.log('Round End Check - Active bikes:', activeBikes.length);
                this.checkGameOver();
            }
        }

        for (const ai of this.ais) {
            ai.update();
        }

        this.updateCamera();
        this.renderer.render(this.scene, this.camera);

        // Move round check to end of animate
        if (this.roundStarted) {
            let activeBikes = this.bikes.filter(bike => bike.active);
            if (activeBikes.length <= 1) {
                this.checkGameOver();
            }
        }
    }
}

// Create a single global game instance
window.game = new Game();

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();

    document.getElementById('restart-button').addEventListener('click', () => {
        game.restartGame();
    });

    document.getElementById('restart-game').addEventListener('click', () => {
        game.restartGame();
    });

    // Add switch camera button handler
    document.getElementById('switch-camera').addEventListener('click', () => {
        game.cycleGhostCamera();
    });
});