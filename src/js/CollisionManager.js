class CollisionManager {
    constructor(scene, gridSize, gridCellSize) {
        this.scene = scene;
        this.gridSize = gridSize;
        this.gridCellSize = gridCellSize;
    }

    checkCollisions(bike, bikes, trails) {
        // Wall collision check
        if (this.checkWallCollision(bike)) {
            return true;
        }

        // Trail collision check
        if (this.checkTrailCollision(bike, trails)) {
            return true;
        }

        // Bike-to-bike collision check
        if (this.checkBikeCollision(bike, bikes)) {
            return true;
        }

        return false;
    }

    checkWallCollision(bike) {
        const buffer = 3;
        if (
            Math.abs(bike.position.x) > (this.gridSize/2 - buffer) ||
            Math.abs(bike.position.z) > (this.gridSize/2 - buffer)
        ) {
            return true;
        }
        return false;
    }

    checkTrailCollision(bike, trails) {
        // Check multiple points along the bike's body for collisions
        const bikeCenter = bike.position.clone();
        const bikeForward = bike.position.clone().add(
            bike.direction.clone().multiplyScalar(this.gridCellSize * 0.5)
        );
        const bikeBack = bike.position.clone().sub(
            bike.direction.clone().multiplyScalar(this.gridCellSize * 0.5)
        );
        
        // Create a more comprehensive set of points to check
        const positionsToCheck = [bikeCenter, bikeForward, bikeBack];

        // Trail collision check
        for (const trail of trails) {
            // Skip trails from the same bike - this is now configurable via game settings
            // We'll keep this check for now, but it can be disabled in the game settings
            if (trail.bikeId === bike.bikeIndex && !window.gameSettings?.allowSelfCollision) {
                continue;
            }

            // Get trail bounds
            const isVertical = trail.scale.z > trail.scale.x;
            const halfLength = isVertical ? trail.scale.z / 2 : trail.scale.x / 2;
            const halfWidth = 0.5; // Reduced collision width

            const trailBounds = {
                minX: trail.position.x - (isVertical ? halfWidth : halfLength),
                maxX: trail.position.x + (isVertical ? halfWidth : halfLength),
                minZ: trail.position.z - (isVertical ? halfLength : halfWidth),
                maxZ: trail.position.z + (isVertical ? halfLength : halfWidth)
            };

            // Check if any of the positions intersect with trail bounds
            for (const position of positionsToCheck) {
                if (position.x >= trailBounds.minX && 
                    position.x <= trailBounds.maxX && 
                    position.z >= trailBounds.minZ && 
                    position.z <= trailBounds.maxZ) {
                    
                    // Debug visualization if enabled
                    if (window.gameSettings?.debug) {
                        this.visualizeCollision(position);
                    }
                    
                    return true;
                }
            }
        }
        
        return false;
    }

    checkBikeCollision(bike, bikes) {
        for (let i = 0; i < bikes.length; i++) {
            const otherBike = bikes[i];
            
            // Skip self or inactive bikes
            if (otherBike.bikeIndex === bike.bikeIndex || !otherBike.active) {
                continue;
            }
            
            const toOtherBike = otherBike.position.clone().sub(bike.position);
            const distance = toOtherBike.length();

            // Check for close-range collisions (including T-bone)
            if (distance < this.gridCellSize * 2) {
                // Normalize the vector between bikes
                toOtherBike.normalize();
                
                // Calculate dot products to detect collision angle
                const dotWithOther = toOtherBike.dot(bike.direction);
                const dotWithSelf = toOtherBike.dot(otherBike.direction);
                
                // If either bike is hitting the other from the side (perpendicular)
                // or if they're heading towards each other
                if (Math.abs(dotWithOther) < 0.7 || // Side collision detection
                    Math.abs(dotWithSelf) < 0.7 ||  // Other bike being hit from side
                    (dotWithOther > 0 && dotWithSelf < 0)) { // Head-on collision
                    
                    return true;
                }
            }
        }
        
        return false;
    }

    // Helper method to visualize collision points for debugging
    visualizeCollision(position) {
        const collisionMarker = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        collisionMarker.position.copy(position);
        this.scene.add(collisionMarker);
        
        // Remove after 2 seconds
        setTimeout(() => {
            this.scene.remove(collisionMarker);
        }, 2000);
    }
}

export default CollisionManager; 