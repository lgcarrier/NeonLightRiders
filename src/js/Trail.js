class Trail {
    constructor(scene) {
        this.scene = scene;
        this.trails = [];
        this.initialTrailCreated = {}; // Track if initial trail has been created for each bike
    }

    createTrail(bike, gridCellSize) {
        // For the first trail segment, we need a special approach
        if (!this.initialTrailCreated[bike.bikeIndex]) {
            // Mark that we've created the initial trail for this bike
            this.initialTrailCreated[bike.bikeIndex] = true;
            
            // Set the lastGridPosition to the current position
            // This ensures the first trail segment will be small
            bike.lastGridPosition = bike.position.clone();
            
            // Skip creating a trail segment on the first call
            return;
        }
        
        // Position the trail exactly one unit behind the bike
        const trailPosition = bike.position.clone().sub(bike.direction.clone().multiplyScalar(gridCellSize));

        const currentGridPos = new THREE.Vector3(
            Math.round(trailPosition.x / gridCellSize) * gridCellSize,
            0.5,
            Math.round(trailPosition.z / gridCellSize) * gridCellSize
        );

        if (currentGridPos.distanceTo(bike.lastGridPosition) < gridCellSize / 2) {
            return;
        }

        // Create the trail segment between the last position and current position
        const trailGeometry = new THREE.BoxGeometry(
            Math.abs(currentGridPos.x - bike.lastGridPosition.x) || 1,
            8,
            Math.abs(currentGridPos.z - bike.lastGridPosition.z) || 1
        );

        const trailMaterial = new THREE.MeshPhongMaterial({
            color: bike.material.color,
            transparent: true,
            opacity: 1
        });

        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.set(
            (currentGridPos.x + bike.lastGridPosition.x) / 2,
            4,
            (currentGridPos.z + bike.lastGridPosition.z) / 2
        );

        trail.bikeId = bike.bikeIndex;
        this.trails.push(trail);
        this.scene.add(trail);

        bike.lastGridPosition = currentGridPos.clone();
    }

    removeTrailsForBike(bikeIndex) {
        const remainingTrails = this.trails.filter(trail => trail.bikeId !== bikeIndex);
        this.trails.forEach(trail => {
            if (trail.bikeId === bikeIndex) {
                this.scene.remove(trail);
            }
        });
        this.trails = remainingTrails;
        // Reset the initial trail created flag for this bike
        delete this.initialTrailCreated[bikeIndex];
    }

    clearAllTrails() {
        this.trails.forEach(trail => this.scene.remove(trail));
        this.trails = [];
        // Reset all initial trail created flags
        this.initialTrailCreated = {};
    }

    getTrails() {
        return this.trails;
    }
}

export default Trail; 