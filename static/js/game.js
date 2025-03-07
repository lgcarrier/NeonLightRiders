class Game {
    constructor() {
        this.setupScene();
        this.setupLights();
        this.setupGame();
        this.controls = new Controls(this);
        this.audio = new AudioManager();
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
        this.gridSize = 100;
        this.bikes = [];
        this.trails = [];
        this.ais = [];
        this.speed = 0.3; // Reduced speed

        // Create grid
        const grid = new THREE.GridHelper(this.gridSize, 20, 0xff00ff, 0x00ff9f);
        this.scene.add(grid);

        const bikeGeometry = new THREE.BoxGeometry(2, 1, 4);
        const bikeMaterials = [
            new THREE.MeshPhongMaterial({color: 0x00ff9f}),  // Player
            new THREE.MeshPhongMaterial({color: 0xff00ff}),  // CPU 1
            new THREE.MeshPhongMaterial({color: 0x00ffff}),  // CPU 2
            new THREE.MeshPhongMaterial({color: 0xff0000})   // CPU 3
        ];

        // Position bikes at corners with proper spacing from boundaries
        const cornerOffset = this.gridSize/2 - 15; // Increased safe distance from walls
        const startPositions = [
            { x: -cornerOffset, z: cornerOffset, direction: new THREE.Vector3(1, 0, -1) },    // Player (top left)
            { x: cornerOffset, z: cornerOffset, direction: new THREE.Vector3(-1, 0, -1) },    // CPU 1 (top right)
            { x: -cornerOffset, z: -cornerOffset, direction: new THREE.Vector3(1, 0, 1) },    // CPU 2 (bottom left)
            { x: cornerOffset, z: -cornerOffset, direction: new THREE.Vector3(-1, 0, 1) }     // CPU 3 (bottom right)
        ];

        for (let i = 0; i < 4; i++) {
            const bike = new THREE.Mesh(bikeGeometry, bikeMaterials[i]);
            bike.position.set(
                startPositions[i].x,
                0.5,
                startPositions[i].z
            );
            bike.direction = startPositions[i].direction.normalize();

            // Rotate bike to face its initial direction
            const angle = Math.atan2(bike.direction.x, bike.direction.z);
            bike.rotation.y = angle;

            bike.active = true;
            this.bikes.push(bike);
            this.scene.add(bike);

            if (i > 0) {
                this.ais.push(new AI(this, i));
            }
        }

        // Set camera position
        this.updateCamera();
    }

    updateCamera() {
        const playerBike = this.bikes[0];
        const cameraOffset = new THREE.Vector3(0, 40, 50); // Adjusted camera height and distance
        this.camera.position.copy(playerBike.position).add(cameraOffset);
        this.camera.lookAt(playerBike.position);
    }

    createTrail(bike) {
        const trailGeometry = new THREE.BoxGeometry(1, 20, 1);
        const trailMaterial = new THREE.MeshPhongMaterial({
            color: bike.material.color,
            transparent: true,
            opacity: 0.5
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.copy(bike.position);
        this.trails.push(trail);
        this.scene.add(trail);
    }

    turnLeft(bikeIndex = 0) {
        const bike = this.bikes[bikeIndex];
        if (!bike.active) return;

        bike.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
        bike.rotateY(Math.PI/2);
        this.audio.playSound('turn');
    }

    turnRight(bikeIndex = 0) {
        const bike = this.bikes[bikeIndex];
        if (!bike.active) return;

        bike.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2);
        bike.rotateY(-Math.PI/2);
        this.audio.playSound('turn');
    }

    checkCollisions(bike) {
        // Check wall collisions with larger buffer
        const buffer = 7; // Increased buffer zone
        if (
            Math.abs(bike.position.x) > (this.gridSize/2 - buffer) ||
            Math.abs(bike.position.z) > (this.gridSize/2 - buffer)
        ) {
            return true;
        }

        // Check trail collisions with slightly larger buffer
        for (const trail of this.trails) {
            if (bike.position.distanceTo(trail.position) < 3) { // Increased collision distance
                return true;
            }
        }

        return false;
    }

    explodeBike(bikeIndex) {
        const bike = this.bikes[bikeIndex];
        bike.active = false;
        this.audio.playSound('explosion', 0.5);

        // Simple explosion effect
        bike.material.opacity = 0.5;
        bike.material.transparent = true;
    }

    checkGameOver() {
        let activeBikes = this.bikes.filter(bike => bike.active);
        if (activeBikes.length <= 1) {
            document.getElementById('game-over').classList.remove('hidden');
            return true;
        }
        return false;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update bikes
        for (let i = 0; i < this.bikes.length; i++) {
            const bike = this.bikes[i];
            if (!bike.active) continue;

            // Move bike
            bike.position.add(bike.direction.clone().multiplyScalar(this.speed));
            this.createTrail(bike);

            // Check collisions
            if (this.checkCollisions(bike)) {
                this.explodeBike(i);
                if (this.checkGameOver()) return;
            }
        }

        // Update AI
        for (const ai of this.ais) {
            ai.update();
        }

        // Update camera
        this.updateCamera();

        // Render
        this.renderer.render(this.scene, this.camera);
    }
}

// Start game
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();

    document.getElementById('restart-button').addEventListener('click', () => {
        location.reload();
    });
});