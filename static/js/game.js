class Game {
    constructor() {
        this.setupScene();
        this.setupLights();
        this.setupGame();
        this.controls = new Controls(this);
        this.audio = new AudioManager();
        this.trailsRemainAfterExplosion = true;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
        this.deltaTimeBuffer = [];
        this.animate();
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
        this.gridCellSize = 2;
        this.bikes = [];
        this.trails = [];
        this.ais = [];
        this.speed = this.gridCellSize; // Removed 1.2 multiplier to revert to original speed
        this.lastTrailPositions = new Map();

        const grid = new THREE.GridHelper(this.gridSize, this.gridSize / this.gridCellSize, 0xff00ff, 0x00ff9f);
        this.scene.add(grid);

        // Keep background color but remove fog
        const backgroundColor = 0x120458;
        this.renderer.setClearColor(backgroundColor);

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
            bike.turnCooldown = 0;
            this.bikes.push(bike);
            this.scene.add(bike);

            if (i > 0) {
                this.ais.push(new AI(this, i));
            }
        }

        this.updateCamera();
    }

    turnLeft(bikeIndex = 0) {
        const bike = this.bikes[bikeIndex];
        if (!bike.active) return;

        // Scale tolerance with speed
        const tolerance = this.speed * 0.4;
        const cooldownTime = 1000 / (this.speed * 2); // Dynamic cooldown based on speed

        // Only allow turns if cooldown has passed
        if (Date.now() < bike.turnCooldown) return;

        const onGrid = (
            Math.abs(bike.position.x % this.gridCellSize) < tolerance &&
            Math.abs(bike.position.z % this.gridCellSize) < tolerance
        );

        if (onGrid) {
            bike.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
            bike.rotateY(Math.PI/2);
            bike.position.x = Math.round(bike.position.x / this.gridCellSize) * this.gridCellSize;
            bike.position.z = Math.round(bike.position.z / this.gridCellSize) * this.gridCellSize;
            bike.turnCooldown = Date.now() + cooldownTime;
            this.audio.playSound('turn');
        }
    }

    turnRight(bikeIndex = 0) {
        const bike = this.bikes[bikeIndex];
        if (!bike.active) return;

        // Scale tolerance with speed
        const tolerance = this.speed * 0.4;
        const cooldownTime = 1000 / (this.speed * 2); // Dynamic cooldown based on speed

        // Only allow turns if cooldown has passed
        if (Date.now() < bike.turnCooldown) return;

        const onGrid = (
            Math.abs(bike.position.x % this.gridCellSize) < tolerance &&
            Math.abs(bike.position.z % this.gridCellSize) < tolerance
        );

        if (onGrid) {
            bike.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2);
            bike.rotateY(-Math.PI/2);
            bike.position.x = Math.round(bike.position.x / this.gridCellSize) * this.gridCellSize;
            bike.position.z = Math.round(bike.position.z / this.gridCellSize) * this.gridCellSize;
            bike.turnCooldown = Date.now() + cooldownTime;
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
            20,
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
            0.5,
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

        const gridPos = new THREE.Vector3(
            Math.round(bike.position.x / this.gridCellSize) * this.gridCellSize,
            0.5,
            Math.round(bike.position.z / this.gridCellSize) * this.gridCellSize
        );

        const buffer = 3;
        if (
            Math.abs(gridPos.x) > (this.gridSize/2 - buffer) ||
            Math.abs(gridPos.z) > (this.gridSize/2 - buffer)
        ) {
            return true;
        }

        for (const trail of this.trails) {
            if (trail.bikeId === bikeIndex && (now - trail.creationTime) < 1000) {
                continue;
            }

            if ((now - trail.creationTime) < 500) {
                continue;
            }

            if (gridPos.distanceTo(trail.position) < this.gridCellSize) {
                return true;
            }
        }

        return false;
    }

    explodeBike(bikeIndex) {
        const bike = this.bikes[bikeIndex];
        bike.active = false;
        this.audio.playSound('explosion', 0.5);

        bike.material.opacity = 0.5;
        bike.material.transparent = true;

        if (!this.trailsRemainAfterExplosion) {
            const remainingTrails = this.trails.filter(trail => trail.bikeId !== bikeIndex);
            this.trails.forEach(trail => {
                if (trail.bikeId === bikeIndex) {
                    this.scene.remove(trail);
                }
            });
            this.trails = remainingTrails;
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
        const playerBike = this.bikes[0];
        const cameraDistance = 80;
        const cameraHeight = 40;

        const targetPosition = new THREE.Vector3(
            playerBike.position.x - playerBike.direction.x * cameraDistance,
            cameraHeight,
            playerBike.position.z - playerBike.direction.z * cameraDistance
        );

        this.camera.position.lerp(targetPosition, 0.1);

        const lookAtPosition = new THREE.Vector3(
            playerBike.position.x,
            0,
            playerBike.position.z
        );
        this.camera.lookAt(lookAtPosition);
    }

    updatePlayerCount() {
        const activePlayers = this.bikes.filter(bike => bike.active).length;
        document.getElementById('players-value').textContent = activePlayers;
    }

    updateFPS() {
        this.frameCount++;
        const now = performance.now();
        const delta = now - this.lastFpsUpdate;

        if (delta >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / delta);
            document.getElementById('fps-value').textContent = fps;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    restartGame() {
        this.trails.forEach(trail => this.scene.remove(trail));
        this.bikes.forEach(bike => this.scene.remove(bike));
        this.trails = [];
        this.bikes = [];
        this.ais = [];

        this.setupGame();
        this.updatePlayerCount();

        document.getElementById('game-over').classList.add('hidden');
    }

    animate() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Smooth out delta time to prevent jerky movement
        this.deltaTimeBuffer.push(deltaTime);
        if (this.deltaTimeBuffer.length > 5) {
            this.deltaTimeBuffer.shift();
        }
        const smoothDeltaTime = this.deltaTimeBuffer.reduce((a, b) => a + b, 0) / this.deltaTimeBuffer.length;

        requestAnimationFrame(() => this.animate());

        // Update FPS counter
        this.updateFPS();

        // Update bikes with smoothed time-based movement
        for (let i = 0; i < this.bikes.length; i++) {
            const bike = this.bikes[i];
            if (!bike.active) continue;

            // Move bike forward with smooth delta time
            const movement = bike.direction.clone().multiplyScalar(this.speed * smoothDeltaTime * 60);
            bike.position.add(movement);

            // Create trails less frequently
            if (Date.now() > bike.trailStartTime && 
                this.frameCount % 2 === 0) {
                this.createTrail(bike);
            }

            // Check collisions
            if (this.checkCollisions(bike)) {
                this.explodeBike(i);
                if (this.checkGameOver()) return;
            }
        }

        // Update AI less frequently
        if (this.frameCount % 3 === 0) {
            for (const ai of this.ais) {
                ai.update();
            }
        }

        // Update camera with smoother interpolation
        this.updateCamera();

        // Render
        this.renderer.render(this.scene, this.camera);
    }
}

// Start game
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();

    document.getElementById('restart-button').addEventListener('click', () => {
        game.restartGame();
    });

    document.getElementById('restart-game').addEventListener('click', () => {
        game.restartGame();
    });
});