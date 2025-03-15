class CameraManager {
    constructor(camera) {
        this.camera = camera;
        this.ghostMode = false;
        this.ghostCameraIndex = 0;
    }

    updateCamera(followedBike) {
        const cameraDistance = 80;
        const cameraHeight = 40;

        const targetPosition = new THREE.Vector3(
            followedBike.position.x - followedBike.direction.x * cameraDistance,
            cameraHeight,
            followedBike.position.z - followedBike.direction.z * cameraDistance
        );

        this.camera.position.lerp(targetPosition, 0.1);

        const lookAtPosition = new THREE.Vector3(
            followedBike.position.x,
            0,
            followedBike.position.z
        );
        this.camera.lookAt(lookAtPosition);
    }

    cycleGhostCamera(activeBikes) {
        if (activeBikes.length > 1) {
            this.ghostCameraIndex = (this.ghostCameraIndex + 1) % activeBikes.length;
            const followedBike = activeBikes[this.ghostCameraIndex];
            console.log(`Ghost camera following bike ${followedBike.bikeIndex}`);
        }
    }

    getActivePlayerBike(bikes, playerBikeIndex = 0) {
        if (!this.ghostMode) {
            return bikes[playerBikeIndex];
        }

        const activeBikes = bikes.filter(bike => bike.active);
        if (activeBikes.length === 0) return bikes[playerBikeIndex];

        return activeBikes[this.ghostCameraIndex % activeBikes.length];
    }

    enableGhostMode() {
        this.ghostMode = true;
        this.ghostCameraIndex = 0;
    }

    disableGhostMode() {
        this.ghostMode = false;
    }
    
    isGhostMode() {
        return this.ghostMode;
    }
}

export default CameraManager; 