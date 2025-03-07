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
        this.updatePlayerCount();
        console.log('Starting animation loop');
        this.animate();
        console.log('Game initialization completed');
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
            console.log(`Bike ${bikeIndex} wall collision:`, {
                position: `x:${gridPos.x.toFixed(2)}, z:${gridPos.z.toFixed(2)}`,
                gridSize: this.gridSize,
                buffer: buffer,
                distanceToWall: {
                    x: this.gridSize/2 - Math.abs(gridPos.x),
                    z: this.gridSize/2 - Math.abs(gridPos.z)
                }
            });
            return true;
        }

        // Improved trail collision detection
        const trailBuffer = 1.5; // Slightly larger buffer for trail collisions
        for (const trail of this.trails) {
            // Skip only very recent trails from the same bike
            if (trail.bikeId === bikeIndex && (now - trail.creationTime) < 500) {
                continue;
            }

            // Skip extremely new trails from any bike to prevent false positives
            if ((now - trail.creationTime) < 100) {
                continue;
            }

            // Check both grid position and actual position for more accurate detection
            const gridDistance = gridPos.distanceTo(trail.position);
            const actualDistance = bike.position.distanceTo(trail.position);

            if (gridDistance < this.gridCellSize * trailBuffer || actualDistance < this.gridCellSize * trailBuffer) {
                console.log(`Bike ${bikeIndex} trail collision:`, {
                    bikePosition: `x:${gridPos.x.toFixed(2)}, z:${gridPos.z.toFixed(2)}`,
                    trailPosition: `x:${trail.position.x.toFixed(2)}, z:${trail.position.z.toFixed(2)}`,
                    gridDistance: gridDistance.toFixed(2),
                    actualDistance: actualDistance.toFixed(2),
                    trailAge: now - trail.creationTime,
                    trailOwner: trail.bikeId
                });
                return true;
            }
        }

        for (let i = 0; i < this.bikes.length; i++) {
            if (i !== bikeIndex && this.bikes[i].active) {
                const otherBike = this.bikes[i];
                if (gridPos.distanceTo(otherBike.position) < this.gridCellSize * 2) {
                    console.log(`Bike ${bikeIndex} collision with bike ${i}:`, {
                        bikePosition: `x:${gridPos.x.toFixed(2)}, z:${gridPos.z.toFixed(2)}`,
                        otherBikePosition: `x:${otherBike.position.x.toFixed(2)}, z:${otherBike.position.z.toFixed(2)}`
                    });
                    this.explodeBike(i);
                    this.explodeBike(bikeIndex); // Explode both bikes
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

    restartGame() {
        this.trails.forEach(trail => this.scene.remove(trail));
        this.bikes.forEach(bike => this.scene.remove(bike));
        this.trails = [];
        this.bikes = [];
        this.ais = [];
        this.explosions = []; // Clear explosions on restart

        this.setupGame();
        this.updatePlayerCount();

        document.getElementById('game-over').classList.add('hidden');
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

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();

    document.getElementById('restart-button').addEventListener('click', () => {
        game.restartGame();
    });

    document.getElementById('restart-game').addEventListener('click', () => {
        game.restartGame();
    });
});