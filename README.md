# NeonLightRiders

## Overview

NeonLightRiders is a game project that includes the following main components:
- **README.md**: Project overview and instructions.
- **Game Engine Files**: Core logic for game mechanics.
- **Assets**: Game resources like images, sounds, and configuration files.
- **Additional Modules**: Helper modules and utilities used throughout the game.

## Installation

1. Make sure you have [Node.js](https://nodejs.org/) and npm installed.
2. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/NeonLightRiders.git
   ```
3. Navigate into the project directory:
   ```bash
   cd NeonLightRiders
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

## Running the Game

You can run the game using one of the following methods:

### Using http-server
1. Make sure you have http-server installed globally:
```bash
npm install -g http-server
```

2. Navigate to the project directory and run:
```bash
cd /path/to/NeonLightRiders && http-server
```

For example:
```bash
cd NeonLightRiders && http-server
```

3. Open your browser and go to one of the URLs displayed in the terminal (typically http://127.0.0.1:8080)

## Game Mechanics

### Overview
NeonLightRiders is a TRON-like light cycle game where players leave light trails behind their bikes and must avoid colliding with walls, trails, and other players.

### Players
- Up to 4 players can participate
- Player 1 is human-controlled, Players 2-4 are AI-controlled
- Each player has a uniquely colored bike and matching trail

### Controls
- **Keyboard**: Use Left/Right arrow keys to turn
- **Touch**: Use on-screen left/right buttons on mobile devices
- **Tab**: Switch camera views in ghost mode (after player death)

### Rules
1. Bikes move forward continuously at a constant speed
2. Players can only turn left or right at 90-degree angles
3. Each bike leaves a permanent light trail behind
4. Collision results in bike explosion:
   - Hitting walls
   - Hitting light trails (your own or others)
   - Colliding with other bikes
5. Last bike surviving wins

### Special Features
- Radar map shows positions of all active bikes
- Ghost mode activates after player death
- Explosion effects with particle systems
- Neon visual style with grid arena

