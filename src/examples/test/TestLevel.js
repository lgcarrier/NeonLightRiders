// Define TestLevel class
class TestLevel {
    constructor(config = {}) {
        // Store the configuration
        this.testConfig = {
            // Default test configuration
            autoRun: false,
            logResults: true,
            bikeConfigurations: [],
            obstacles: [],
            autoComplete: false,
            timeLimit: 30000, // 30 seconds
            ...config
        };
        
        // Initialize properties
        this.initialized = false;
        this.gameActive = false;
        this.roundActive = false;
        this.bikes = [];
        this.ais = [];
        this.explosions = [];
        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        console.log('Test level initialized with config:', this.testConfig);
        
        // Set up scene
        this.setupScene();
        
        // Set up game components
        this.setupGame();
        
        // Start animation loop
        this.animate();
        
        // Override default game behavior for testing
        if (this.testConfig.autoRun) {
            this.startTestLevel();
        }
    }
    
    setupScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 50, 0);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Create grid
        this.gridSize = 500;
        this.gridCellSize = 1;
        const grid = new THREE.GridHelper(this.gridSize, this.gridSize / this.gridCellSize);
        this.scene.add(grid);
        
        // Create lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }

    setupGame() {
        // Initialize arrays
        this.bikes = [];
        this.ais = [];
        this.explosions = [];
        
        // Use custom bike configurations or fall back to defaults
        if (this.testConfig.bikeConfigurations.length > 0) {
            this.setupCustomBikes();
        } else {
            this.setupDefaultBikes();
        }
        
        // Add any test obstacles
        this.addTestObstacles();
        
        // Setup test monitoring
        if (this.testConfig.logResults) {
            this.setupTestMonitoring();
        }
    }
    
    setupCustomBikes() {
        // Create bikes with custom configurations
        const bikeMaterials = [
            new THREE.MeshBasicMaterial({ color: 0xff0000 }),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
            new THREE.MeshBasicMaterial({ color: 0x0000ff }),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        ];
        
        this.testConfig.bikeConfigurations.forEach((config, index) => {
            const position = new THREE.Vector3(
                config.position.x,
                0.5,
                config.position.z
            );
            
            // Create bike geometry
            const bikeGeometry = new THREE.BoxGeometry(1, 1, 1);
            const bikeMaterial = bikeMaterials[index % bikeMaterials.length];
            const bikeMesh = new THREE.Mesh(bikeGeometry, bikeMaterial);
            
            // Set position
            bikeMesh.position.set(
                Math.round(position.x / this.gridCellSize) * this.gridCellSize,
                0.5,
                Math.round(position.z / this.gridCellSize) * this.gridCellSize
            );
            
            // Set direction
            bikeMesh.direction = new THREE.Vector3(
                config.direction.x,
                config.direction.y,
                config.direction.z
            ).normalize();
            
            const angle = Math.atan2(config.direction.x, config.direction.z);
            bikeMesh.rotation.y = angle;
            
            // Add to scene
            this.scene.add(bikeMesh);
            
            // Create bike object
            const bike = {
                mesh: bikeMesh,
                bikeIndex: index,
                active: true,
                position: bikeMesh.position,
                direction: bikeMesh.direction,
                material: bikeMaterial
            };
            
            this.bikes.push(bike);
            
            // Add AI if specified
            if (config.isAI) {
                this.ais.push({
                    bikeIndex: index,
                    update: () => {
                        // Simple AI logic
                        if (Math.random() < 0.05) {
                            if (Math.random() < 0.5) {
                                this.turnLeft(index);
                            } else {
                                this.turnRight(index);
                            }
                        }
                    }
                });
            }
        });
        
        this.updateCamera();
    }
    
    setupDefaultBikes() {
        // Create default bikes
        const bikeMaterials = [
            new THREE.MeshBasicMaterial({ color: 0xff0000 }),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
            new THREE.MeshBasicMaterial({ color: 0x0000ff }),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        ];
        
        const startPositions = [
            { x: -200, z: 200, direction: new THREE.Vector3(1, 0, 0) },
            { x: 200, z: 200, direction: new THREE.Vector3(0, 0, -1) },
            { x: -200, z: -200, direction: new THREE.Vector3(0, 0, 1) },
            { x: 200, z: -200, direction: new THREE.Vector3(-1, 0, 0) }
        ];
        
        for (let i = 0; i < 4; i++) {
            const position = new THREE.Vector3(
                startPositions[i].x,
                0.5,
                startPositions[i].z
            );
            
            // Create bike geometry
            const bikeGeometry = new THREE.BoxGeometry(1, 1, 1);
            const bikeMaterial = bikeMaterials[i];
            const bikeMesh = new THREE.Mesh(bikeGeometry, bikeMaterial);
            
            // Set position
            bikeMesh.position.set(
                Math.round(position.x / this.gridCellSize) * this.gridCellSize,
                0.5,
                Math.round(position.z / this.gridCellSize) * this.gridCellSize
            );
            
            // Set direction
            bikeMesh.direction = startPositions[i].direction.clone().normalize();
            const angle = Math.atan2(startPositions[i].direction.x, startPositions[i].direction.z);
            bikeMesh.rotation.y = angle;
            
            // Add to scene
            this.scene.add(bikeMesh);
            
            // Create bike object
            const bike = {
                mesh: bikeMesh,
                bikeIndex: i,
                active: true,
                position: bikeMesh.position,
                direction: bikeMesh.direction,
                material: bikeMaterial
            };
            
            this.bikes.push(bike);
            
            // Add AI for non-player bikes
            if (i > 0) {
                this.ais.push({
                    bikeIndex: i,
                    update: () => {
                        // Simple AI logic
                        if (Math.random() < 0.05) {
                            if (Math.random() < 0.5) {
                                this.turnLeft(i);
                            } else {
                                this.turnRight(i);
                            }
                        }
                    }
                });
            }
        }
        
        this.updateCamera();
    }
    
    addTestObstacles() {
        // Add predefined obstacles (walls) for testing
        this.testConfig.obstacles.forEach(obstacle => {
            // Create wall geometry
            const start = new THREE.Vector3(obstacle.start.x, 0.5, obstacle.start.z);
            const end = new THREE.Vector3(obstacle.end.x, 0.5, obstacle.end.z);
            
            const direction = end.clone().sub(start);
            const length = direction.length();
            direction.normalize();
            
            const wallGeometry = new THREE.BoxGeometry(length, 1, 1);
            const wallMaterial = new THREE.MeshBasicMaterial({ color: obstacle.color || 0xffffff });
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            
            // Position and rotate wall
            wall.position.copy(start.clone().add(end).multiplyScalar(0.5));
            wall.rotation.y = Math.atan2(direction.x, direction.z);
            
            // Add to scene
            this.scene.add(wall);
        });
    }
    
    setupTestMonitoring() {
        // Setup monitoring for test metrics
        this.testResults = {
            collisions: [],
            bikePaths: {},
            gameTime: 0,
            completed: false
        };
        
        // Set timeout if needed
        if (this.testConfig.timeLimit > 0) {
            setTimeout(() => this.completeTest('timeout'), this.testConfig.timeLimit);
        }
    }
    
    startTestLevel() {
        console.log('Starting automated test level');
        this.gameActive = true;
        this.roundActive = true;
    }
    
    completeTest(reason) {
        if (this.testResults && !this.testResults.completed) {
            this.testResults.completed = true;
            this.testResults.completionReason = reason;
            
            console.log('Test completed:', reason);
            console.log('Test results:', this.testResults);
            
            // Stop the game
            this.roundActive = false;
            this.gameActive = false;
        }
    }
    
    updateCamera() {
        // Update camera position to follow active bikes
        const activeBikes = this.bikes.filter(bike => bike.active);
        if (activeBikes.length > 0) {
            const targetBike = activeBikes[0];
            this.camera.position.set(
                targetBike.position.x,
                50,
                targetBike.position.z + 30
            );
            this.camera.lookAt(targetBike.position);
        }
    }
    
    turnLeft(bikeIndex) {
        const bike = this.bikes[bikeIndex];
        if (!bike.active) return false;
        
        // Turn left
        const oldDir = bike.direction.clone();
        bike.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
        bike.mesh.rotation.y += Math.PI/2;
        
        return true;
    }
    
    turnRight(bikeIndex) {
        const bike = this.bikes[bikeIndex];
        if (!bike.active) return false;
        
        // Turn right
        const oldDir = bike.direction.clone();
        bike.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2);
        bike.mesh.rotation.y -= Math.PI/2;
        
        return true;
    }
    
    animate() {
        if (!this.initialized) return;
        
        requestAnimationFrame(this.animate.bind(this));
        
        if (this.gameActive && this.roundActive) {
            // Update test metrics
            if (this.testResults) {
                this.testResults.gameTime += 1/60; // Approximate for 60fps
                
                // Record bike positions
                this.bikes.forEach(bike => {
                    if (bike.active) {
                        if (!this.testResults.bikePaths[bike.bikeIndex]) {
                            this.testResults.bikePaths[bike.bikeIndex] = [];
                        }
                        this.testResults.bikePaths[bike.bikeIndex].push({
                            x: bike.position.x,
                            z: bike.position.z,
                            time: this.testResults.gameTime
                        });
                    }
                });
            }
            
            // Move bikes
            this.bikes.forEach(bike => {
                if (!bike.active) return;
                
                // Move bike
                const speed = 1;
                const movement = bike.direction.clone().multiplyScalar(speed);
                bike.position.add(movement);
                
                // Check collisions
                if (this.checkCollisions(bike)) {
                    this.explodeBike(bike.bikeIndex);
                }
            });
            
            // Update AIs
            this.ais.forEach(ai => {
                if (this.bikes[ai.bikeIndex].active) {
                    ai.update();
                }
            });
            
            // Check for test completion
            if (this.testConfig.autoComplete && this.bikes.filter(bike => bike.active).length <= 1) {
                this.completeTest('winner_determined');
            }
            
            // Update camera
            this.updateCamera();
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    checkCollisions(bike) {
        // Check collision with walls
        if (
            bike.position.x < -this.gridSize/2 ||
            bike.position.x > this.gridSize/2 ||
            bike.position.z < -this.gridSize/2 ||
            bike.position.z > this.gridSize/2
        ) {
            this.recordCollision(bike.bikeIndex, 'wall', bike.position.clone());
            return true;
        }
        
        // Check collision with other bikes
        for (const otherBike of this.bikes) {
            if (otherBike === bike || !otherBike.active) continue;
            
            const distance = bike.position.distanceTo(otherBike.position);
            if (distance < 1) {
                this.recordCollision(bike.bikeIndex, 'bike', bike.position.clone());
                return true;
            }
        }
        
        return false;
    }
    
    explodeBike(bikeIndex) {
        const bike = this.bikes[bikeIndex];
        bike.active = false;
        
        // Create explosion
        const explosionGeometry = new THREE.SphereGeometry(2, 8, 8);
        const explosionMaterial = new THREE.MeshBasicMaterial({ color: bike.material.color, transparent: true });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(bike.position);
        this.scene.add(explosion);
        
        // Hide bike
        bike.mesh.visible = false;
        
        // Add explosion to list
        this.explosions.push({
            mesh: explosion,
            created: Date.now(),
            update: () => {
                const age = (Date.now() - explosion.created) / 1000;
                if (age > 1) {
                    this.scene.remove(explosion);
                    return false;
                }
                explosion.scale.set(1 + age * 2, 1 + age * 2, 1 + age * 2);
                explosionMaterial.opacity = 1 - age;
                return true;
            }
        });
    }
    
    recordCollision(bikeIndex, collisionType, position) {
        if (this.testResults) {
            this.testResults.collisions.push({
                bikeIndex,
                type: collisionType,
                position,
                time: this.testResults.gameTime
            });
        }
    }
} 