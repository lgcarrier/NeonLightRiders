Here’s a set of 8 rules I’d follow as a senior game developer specializing in ThreeJS and WebSocket for a multiplayer 3D game, with a focus on optimization and clean code:

1. **Leverage ThreeJS Efficiently for Performance**  
   Use ThreeJS best practices like minimizing draw calls (e.g., batching geometries), reusing materials and textures, and employing Level of Detail (LOD) for distant objects to ensure the game runs smoothly across devices, even in complex 3D scenes.

2. **Optimize WebSocket Communication**  
   Keep network payloads small and efficient by sending minimal, compressed data (e.g., JSON with short keys or binary formats like MessagePack). Implement delta updates—only send changes in player state (position, rotation) rather than full state each tick.

3. **Enforce Modularity Across Files**  
   Break the codebase into logical, reusable modules (e.g., separate files for rendering, physics, networking, and game logic). Avoid a monolithic single-file structure to improve maintainability, readability, and team collaboration.

4. **Implement Robust Client-Server Synchronization**  
   Use WebSocket for real-time updates with a clear client-server architecture. Predict client-side movement with interpolation and reconcile with server authoritative updates to minimize latency perception, ensuring a smooth multiplayer experience.

5. **Maintain Clean, Readable Code**  
   Follow consistent naming conventions (e.g., camelCase for variables, PascalCase for classes) and write self-documenting code with minimal comments—let the logic speak for itself. Refactor regularly to eliminate technical debt.

6. **Prioritize Frame Rate Optimization**  
   Cap expensive operations like physics calculations or raycasting to specific intervals (e.g., every few frames) and use requestAnimationFrame for rendering. Profile with tools like Chrome DevTools or ThreeJS’s Stats.js to identify bottlenecks.

7. **Design for Scalability in Multiplayer**  
   Structure WebSocket handling to support growing player counts—use room-based or instanced systems on the server to limit broadcast scope and prevent overloading clients with irrelevant data.

8. **Test and Debug Proactively**  
   Build unit tests for core systems (e.g., collision detection, network serialization) and use browser-based debugging tools to trace ThreeJS/WebSocket issues. Simulate high-latency conditions to ensure the game degrades gracefully.

These rules balance performance, scalability, and code quality, tailored to the challenges of real-time 3D multiplayer games with ThreeJS and WebSocket.