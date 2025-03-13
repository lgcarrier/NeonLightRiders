# Neon Light Riders Architecture

## Project Structure

```
NeonLightRiders/
├── assets/          # Game assets (images, sounds, etc.)
├── src/            # Source code
│   ├── core/       # Core game logic
│   ├── entities/   # Game entities (players, vehicles, etc.)
│   ├── scenes/     # Game scenes/levels
│   └── utils/      # Utility functions
└── memory-bank/    # Project documentation
```

## Key Components

### Core
- **Game Loop**: Manages the game's main update and render cycle
- **Input Manager**: Handles player input (keyboard, gamepad)
- **Physics Engine**: Manages collision detection and response

### Entities
- **Player**: Represents the player character with their light trail
- **Vehicle**: Contains vehicle physics and movement logic
- **Light Trail**: Manages the neon trail left behind by players

### Scenes
- **Game Scene**: Main gameplay area where players compete
- **Menu Scene**: Title screen and game options
- **Results Scene**: Displays winner and match statistics

### Utils
- **Asset Loader**: Handles loading and caching of game assets
- **Renderer**: Manages rendering of game objects and effects
- **Sound Manager**: Controls game audio and sound effects

## Design Patterns
- **Singleton**: Used for managers (Input, Sound, etc.)
- **Component System**: For entity behaviors and attributes
- **Observer**: For event handling and game state changes
- **State Machine**: Managing game states and transitions
```

This document will be updated as the architecture evolves.
