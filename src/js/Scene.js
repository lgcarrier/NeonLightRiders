// Remove the import since THREE is already loaded via script tag
// import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

class Scene {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.gridSize = 800;
        this.gridCellSize = 1;
    }

    setupScene() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Get the canvas element or create one if it doesn't exist
        let canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'gameCanvas';
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // If we're in a test environment, append to the game-container
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.appendChild(canvas);
            } else {
                document.body.appendChild(canvas);
            }
        }
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x120458);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        return { scene: this.scene, camera: this.camera, renderer: this.renderer };
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }

    setupGrid() {
        const grid = new THREE.GridHelper(this.gridSize, this.gridSize / this.gridCellSize, 0xff00ff, 0x00ff9f);
        this.scene.add(grid);
    }

    setupWalls() {
        const wallHeight = 20;
        const wallMaterial = new THREE.MeshBasicMaterial({
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
    }

    setup() {
        this.setupScene();
        this.setupLights();
        this.setupGrid();
        this.setupWalls();
        return {
            scene: this.scene,
            camera: this.camera,
            renderer: this.renderer,
            gridSize: this.gridSize,
            gridCellSize: this.gridCellSize
        };
    }

    render(camera) {
        this.renderer.render(this.scene, camera || this.camera);
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getRenderer() {
        return this.renderer;
    }

    getGridSize() {
        return this.gridSize;
    }

    getGridCellSize() {
        return this.gridCellSize;
    }
}

export default Scene; 