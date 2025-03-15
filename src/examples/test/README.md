# NeonLightRiders Test Runner (Standalone)

This directory contains a standalone version of the test runner for NeonLightRiders. It's designed to work independently of the main game's module system, making it easier to run tests without dealing with ES module compatibility issues.

## Files

- `TestLevel.js` - A standalone implementation of the TestLevel class that doesn't depend on the main game's modules
- `TestLevels.js` - Definitions for various test scenarios and the TestRunner class
- `test-runner.html` - The HTML interface for running tests

## How to Use

1. Start an HTTP server in the project root directory:
   ```
   http-server
   ```

2. Open the standalone test runner in your browser:
   ```
   http://localhost:8080/src/examples/test/test-runner.html
   ```

3. Click on individual test buttons to run specific tests, or click "Run All Tests" to run all tests in sequence.

## Available Tests

- **Collision Wall Test** - Tests collision detection with a wall
- **AI Navigation Test** - Tests AI navigation around obstacles
- **Bike Collision Test** - Tests bike vs bike collision
- **Corner Collision Test** - Tests corner cases in collision detection

## Notes

This standalone test runner is completely independent of the main game's module system. It uses its own implementation of the TestLevel class that doesn't rely on imports from the main game.

If you need to test with the actual game components, use the module-based test runner at:
```
http://localhost:8080/src/examples/test-runner.html
``` 