import Game from './game.js';

class TestLevel extends Game {
    constructor(config = {}) {
        super({ skipEventListeners: true });
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
    }

    init() {
        super.init();
        console.log('Test level initialized with config:', this.testConfig);
        
        // Override default game behavior for testing
        if (this.testConfig.autoRun) {
            this.startTestLevel();
        }
    }

    setupGame() {
        // Override the standard setupGame to use test configurations
        this.bikes = [];
        this.ais = [];
        this.explosions = [];
        
        // Use custom bike configurations or fall back to defaults
        if (this.testConfig.bikeConfigurations.length > 0) {
            this.setupCustomBikes();
        } else {
            super.setupGame(); // Use the standard setup
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
            
            const bike = new Bike(
                this.scene,
                position,
                new THREE.Vector3(config.direction.x, config.direction.y, config.direction.z),
                bikeMaterials[index % bikeMaterials.length],
                this.gridCellSize,
                index
            );
            
            this.bikes.push(bike);
            
            // Add AI if specified
            if (config.isAI) {
                this.ais.push(new AI(this, index));
            }
        });
        
        this.updateCamera();
    }
    
    addTestObstacles() {
        // Add predefined obstacles (trails) for testing
        this.testConfig.obstacles.forEach(obstacle => {
            // Create static trail segments
            this.trailManager.addStaticTrail(
                obstacle.start,
                obstacle.end,
                obstacle.color || 0xffffff
            );
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
                            x: bike.mesh.position.x,
                            z: bike.mesh.position.z,
                            time: this.testResults.gameTime
                        });
                    }
                });
            }
            
            // Standard game animation logic
            super.animate();
            
            // Check for test completion
            if (this.testConfig.autoComplete && this.bikes.filter(bike => bike.active).length <= 1) {
                this.completeTest('winner_determined');
            }
        }
    }
}

export { TestLevel };
export default TestLevel; 