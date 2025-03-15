// Collection of test levels
const TestLevels = {
    // Test collision detection with a wall
    collisionWallTest: () => {
        return new TestLevel({
            autoRun: true,
            bikeConfigurations: [
                {
                    position: { x: 0, z: 0 },
                    direction: { x: 1, y: 0, z: 0 },
                    isAI: false
                }
            ],
            obstacles: [
                { 
                    start: { x: 100, z: -50 },
                    end: { x: 100, z: 50 },
                    color: 0xff0000
                }
            ],
            autoComplete: true
        });
    },
    
    // Test AI navigation around obstacles
    aiNavigationTest: () => {
        return new TestLevel({
            autoRun: true,
            bikeConfigurations: [
                {
                    position: { x: -200, z: -200 },
                    direction: { x: 1, y: 0, z: 0 },
                    isAI: true
                }
            ],
            obstacles: [
                { 
                    start: { x: 0, z: -100 },
                    end: { x: 0, z: 100 },
                    color: 0xffffff
                }
            ],
            timeLimit: 15000, // 15 seconds
            autoComplete: true
        });
    },
    
    // Test bike vs bike collision
    bikeCollisionTest: () => {
        return new TestLevel({
            autoRun: true,
            bikeConfigurations: [
                {
                    position: { x: -50, z: 0 },
                    direction: { x: 1, y: 0, z: 0 },
                    isAI: false
                },
                {
                    position: { x: 50, z: 0 },
                    direction: { x: -1, y: 0, z: 0 },
                    isAI: false
                }
            ],
            autoComplete: true
        });
    },
    
    // Test corner cases in collision detection
    cornerCollisionTest: () => {
        return new TestLevel({
            autoRun: true,
            bikeConfigurations: [
                {
                    position: { x: -100, z: -100 },
                    direction: { x: 1, y: 0, z: 1 },
                    isAI: false
                }
            ],
            obstacles: [
                { 
                    start: { x: 0, z: 0 },
                    end: { x: 100, z: 0 },
                    color: 0xff0000
                },
                { 
                    start: { x: 0, z: 0 },
                    end: { x: 0, z: 100 },
                    color: 0xff0000
                }
            ],
            autoComplete: true
        });
    }
};

// Test runner for automated testing
class TestRunner {
    constructor() {
        this.results = {};
    }
    
    async runAll() {
        const testNames = Object.keys(TestLevels);
        for (const testName of testNames) {
            console.log(`Running test: ${testName}`);
            await this.runTest(testName);
        }
        
        console.log("All tests completed!");
        console.log(this.results);
        return this.results;
    }
    
    async runTest(testName) {
        return new Promise(resolve => {
            const test = TestLevels[testName]();
            test.init();
            
            // Check for completion every second
            const checkInterval = setInterval(() => {
                if (test.testResults && test.testResults.completed) {
                    clearInterval(checkInterval);
                    this.results[testName] = test.testResults;
                    
                    // Allow time for cleanup
                    setTimeout(resolve, 500);
                }
            }, 1000);
        });
    }
} 