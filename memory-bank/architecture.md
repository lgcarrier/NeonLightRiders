# Neon Light Riders Architecture

## Project Structure

```
NeonLightRiders/
├── src/                # Source code
│   ├── js/             # JavaScript files
│   │   ├── game.js     # Main game controller
│   │   ├── Bike.js     # Bike entity implementation
│   │   ├── Trail.js    # Trail system implementation
│   │   ├── Scene.js    # 3D scene setup and management
│   │   ├── ai.js       # AI opponent logic
│   │   ├── menu.js     # Menu system
│   │   ├── controls.js # Input handling
│   │   └── ...         # Other game components
│   ├── css/            # Stylesheets
│   │   ├── style.css   # Main game styles
│   │   └── menu.css    # Menu system styles
│   ├── utils/          # Utility functions
│   └── index.html      # Main HTML entry point
└── memory-bank/        # Project documentation
```

## Component Architecture

### Core Components

#### Game Controller (game.js)
- **Purpose**: Central controller managing game state and flow
- **Responsibilities**: 
  - Game initialization and loop
  - Player and AI management
  - Round management
  - Collision detection
  - Camera management
  - Game state transitions

#### Entity Components

- **Bike (Bike.js)**
  - Manages bike movement, positioning and orientation
  - Handles turning mechanics
  - Tracks bike state (active/inactive)
  - Manages bike visibility

- **Trail (Trail.js)**
  - Creates and manages light trails left by bikes
  - Handles trail visibility and rendering
  - Manages trail segments

- **Collision Manager (CollisionManager.js)**
  - Detects collisions between bikes and trails
  - Handles grid-based collision detection
  - Manages object boundaries

#### Visual Components

- **Scene Manager (Scene.js)**
  - Sets up Three.js scene, camera and renderer
  - Creates grid and environment
  - Manages lighting and visual effects

- **Camera Manager (CameraManager.js)**
  - Handles camera positioning and following
  - Manages camera transitions
  - Controls spectator mode camera

- **Explosion Effects (explosion.js)**
  - Creates particle-based explosion effects
  - Manages particle physics and animation

#### Interface Components

- **Controls (controls.js)**
  - Manages keyboard input
  - Handles touch controls for mobile
  - Processes player input for bike control

- **Radar (radar.js)**
  - Provides overhead view of game arena
  - Tracks positions of all bikes
  - Updates in real-time during gameplay

- **Menu System (menu.js)**
  - Manages main menu and UI elements
  - Handles game start, settings and transitions

#### Game Flow Components

- **Round Manager (RoundManager.js)**
  - Manages round progression
  - Handles round setup and cleanup
  - Tracks round state and counts

- **Score Manager (ScoreManager.js)**
  - Tracks player scores across rounds
  - Manages score calculations and display

- **Game End Screen (GameEndScreen.js)**
  - Displays game results
  - Handles game over state
  - Provides restart options

### AI System

- **AI Controller (ai.js)**
  - Controls AI bike movement decisions
  - Implements collision avoidance strategies
  - Makes directional decisions based on environment

## Communication Flow

1. **Input Phase**: Controls system captures user input
2. **Processing Phase**: Game controller processes input and AI decisions
3. **Physics Phase**: Collision detection and movement calculations
4. **Render Phase**: Scene updates and visual rendering
5. **UI Update Phase**: Radar and other UI elements update

## Design Patterns

- **Component System**: Game objects are broken down into focused components
- **Observer Pattern**: For event handling (bike destruction, round start/end)
- **State Machine**: For game state management (menu, playing, game over)
- **Factory Pattern**: For creating game entities (bikes, trails)

## Technical Implementation

- **Rendering**: Three.js for 3D graphics rendering
- **Physics**: Custom grid-based collision system
- **Input**: Browser event system for keyboard and touch input
- **Audio**: Web Audio API for game sounds and effects

This document will be updated as the architecture evolves.
