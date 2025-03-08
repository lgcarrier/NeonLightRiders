class Game {
    constructor() {
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

        // Add sound muting capability
        this.audio.setMuted(!document.getElementById('sound-toggle').checked);
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
            { pos: [0, wallHeight / 2, -this.gridSize / 2], size: [this.gridSize, wallHeight, 3] },
            { pos: [0, wallHeight / 2, this.gridSize / 2], size: [this.gridSize, wallHeight, 3] },
            { pos: [this.gridSize / 2, wallHeight / 2, 0], size: [3, wallHeight, this.gridSize] },
            { pos: [-this.gridSize / 2, wallHeight / 2, 0], size: [3, wallHeight, this.gridSize] }
        ];

        walls.forEach(wall => {
            const geometry = new THREE.BoxGeometry(...wall.size);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            mesh.position.set(...wall.pos);
            this.scene.add(mesh);
        });

        const bikeGeometry = new THREE.BoxGeometry(2, 1, 4);
        const bikeMaterials = [
            new THREE.MeshPhongMaterial({ color: 0x00ff9f }),
            new THREE.MeshPhongMaterial({ color: 0xff00ff }),
            new THREE.MeshPhongMaterial({ color: 0x00ffff }),
            new THREE.MeshPhongMaterial({ color: 0xff0000 })
        ];

        const cornerOffset = Math.floor(this.gridSize / 2 / this.gridCellSize) * this.gridCellSize - 280;
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
            bike.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
            bike.rotateY(Math.PI / 2);
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
            bike.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
            bike.rotateY(-Math.PI / 2);
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
        const now = Date.now();

        // Wall collision check
        const buffer = 3;
        if (
            Math.abs(bike.position.x) > (this.gridSize / 2 - buffer) ||
            Math.abs(bike.position.z) > (this.gridSize / 2 - buffer)
        ) {
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
                // Only explode the bike that hit the trail, not the trail's creator
                this.explodeBike(bikeIndex);
                return false; // Return false since we handle the explosion here
            }
        }

        // Bike-to-bike collision check
        for (let i = 0; i < this.bikes.length; i++) {
            if (i !== bikeIndex && this.bikes[i].active) {
                const otherBike = this.bikes[i];
                const distance = bike.position.distanceTo(otherBike.position);
                if (distance < this.gridCellSize * 2) {
                    // Explode both bikes
                    this.explodeBike(i);
                    this.explodeBike(bikeIndex);
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
        let activeBikes = this.bikes.filter(bike => bike.active);
        if (activeBikes.length <= 1) {
            document.getElementById('game-over').classList.remove('hidden');
            return true;
        }
        return false;
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
                this.explodeBike(i);
                if (this.checkGameOver()) return;
            }
        }

        for (const ai of this.ais) {
            ai.update();
        }

        this.updateCamera();
        this.renderer.render(this.scene, this.camera);
    }
}

class AudioManager {
    constructor() {
        this.muted = false;
    }

    setMuted(muted) {
        this.muted = muted;
    }

    async playSound(soundName, duration = 0.1) {
        if (this.muted) return;

        //Existing playSound Code
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let game = null;
    const gameContainer = document.getElementById('game-container');
    const mainMenu = document.getElementById('main-menu');
    const settingsMenu = document.getElementById('settings-menu');
    const soundToggle = document.getElementById('sound-toggle');

    // Start Game button
    document.getElementById('start-game-btn').addEventListener('click', () => {
        console.log('Start Game clicked');
        mainMenu.classList.add('hidden');
        gameContainer.classList.remove('hidden');

        if (!game) {
            game = new Game();
        } else {
            game.restartGame();
        }
    });

    // Settings button
    document.getElementById('settings-btn').addEventListener('click', () => {
        console.log('Settings clicked');
        mainMenu.classList.add('hidden');
        settingsMenu.classList.remove('hidden');
    });

    // Back to menu button
    document.getElementById('back-to-menu').addEventListener('click', () => {
        console.log('Back to Menu clicked');
        settingsMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
    });

    // Sound toggle handler
    soundToggle.addEventListener('change', (e) => {
        if (game) {
            game.audio.setMuted(!e.target.checked);
        }
    });

    // Game over menu button
    document.getElementById('menu-button').addEventListener('click', () => {
        console.log('Menu button clicked');
        if (game) {
            game.scene.clear();
            game = null;
        }
        gameContainer.classList.add('hidden');
        mainMenu.classList.remove('hidden');
    });

    // Restart button in game over screen
    document.getElementById('restart-button').addEventListener('click', () => {
        console.log('Restart button clicked');
        if (game) {
            game.restartGame();
        }
    });

    // Restart button during gameplay
    document.getElementById('restart-game').addEventListener('click', () => {
        console.log('In-game restart clicked');
        if (game) {
            game.restartGame();
        }
    });

    // Switch camera button
    document.getElementById('switch-camera').addEventListener('click', () => {
        console.log('Switch camera clicked');
        if (game) {
            game.cycleGhostCamera();
        }
    });
});