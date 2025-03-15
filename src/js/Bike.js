class Bike {
    constructor(scene, position, direction, material, gridCellSize, bikeIndex) {
        this.scene = scene;
        this.gridCellSize = gridCellSize;
        this.bikeIndex = bikeIndex;
        
        // Create bike mesh
        const bikeGeometry = new THREE.BoxGeometry(1, 1, 1); // Basic bike shape
        this.mesh = new THREE.Mesh(bikeGeometry, material);
        
        // Set position and direction
        this.mesh.position.set(
            Math.round(position.x / gridCellSize) * gridCellSize,
            0.5,
            Math.round(position.z / gridCellSize) * gridCellSize
        );
        
        this.mesh.direction = direction.clone().normalize();
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;
        
        // Additional properties
        this.mesh.active = true;
        this.mesh.trailStartTime = Date.now() + (window.gameSettings?.trailDelay || 1000);
        this.mesh.lastGridPosition = this.mesh.position.clone();
        
        // Add to scene
        scene.add(this.mesh);
        
        console.log(`Bike ${bikeIndex} initialized:`, {
            position: `x:${this.mesh.position.x.toFixed(2)}, z:${this.mesh.position.z.toFixed(2)}`,
            direction: `x:${this.mesh.direction.x.toFixed(2)}, z:${this.mesh.direction.z.toFixed(2)}`,
            angle: angle.toFixed(2)
        });
    }
    
    get position() {
        return this.mesh.position;
    }
    
    get direction() {
        return this.mesh.direction;
    }
    
    get active() {
        return this.mesh.active;
    }
    
    set active(value) {
        this.mesh.active = value;
    }
    
    get visible() {
        return this.mesh.visible;
    }
    
    set visible(value) {
        this.mesh.visible = value;
    }
    
    get lastGridPosition() {
        return this.mesh.lastGridPosition;
    }
    
    set lastGridPosition(position) {
        this.mesh.lastGridPosition = position;
    }
    
    get trailStartTime() {
        return this.mesh.trailStartTime;
    }
    
    set trailStartTime(time) {
        this.mesh.trailStartTime = time;
    }
    
    get material() {
        return this.mesh.material;
    }
    
    move(speed) {
        const oldPos = this.position.clone();
        const movement = this.direction.clone().multiplyScalar(speed);
        this.position.add(movement);
        
        return {
            oldPosition: oldPos,
            newPosition: this.position.clone(),
            movement: movement
        };
    }
    
    turnLeft() {
        if (!this.active) return false;

        const onGrid = (
            Math.abs(this.position.x % this.gridCellSize) < 0.1 &&
            Math.abs(this.position.z % this.gridCellSize) < 0.1
        );

        console.log('Turn Left Attempt:', {
            position: `x:${this.position.x.toFixed(2)}, z:${this.position.z.toFixed(2)}`,
            onGrid: onGrid,
            modX: (this.position.x % this.gridCellSize).toFixed(2),
            modZ: (this.position.z % this.gridCellSize).toFixed(2)
        });

        if (onGrid) {
            const oldDir = this.direction.clone();
            this.mesh.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
            this.mesh.rotateY(Math.PI/2);
            console.log('Turn Left Executed:', {
                oldDirection: `x:${oldDir.x.toFixed(2)}, z:${oldDir.z.toFixed(2)}`,
                newDirection: `x:${this.direction.x.toFixed(2)}, z:${this.direction.z.toFixed(2)}`
            });
            return true;
        }
        
        return false;
    }
    
    turnRight() {
        if (!this.active) return false;

        const onGrid = (
            Math.abs(this.position.x % this.gridCellSize) < 0.1 &&
            Math.abs(this.position.z % this.gridCellSize) < 0.1
        );

        console.log('Turn Right Attempt:', {
            position: `x:${this.position.x.toFixed(2)}, z:${this.position.z.toFixed(2)}`,
            onGrid: onGrid,
            modX: (this.position.x % this.gridCellSize).toFixed(2),
            modZ: (this.position.z % this.gridCellSize).toFixed(2)
        });

        if (onGrid) {
            const oldDir = this.direction.clone();
            this.mesh.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2);
            this.mesh.rotateY(-Math.PI/2);
            console.log('Turn Right Executed:', {
                oldDirection: `x:${oldDir.x.toFixed(2)}, z:${oldDir.z.toFixed(2)}`,
                newDirection: `x:${this.direction.x.toFixed(2)}, z:${this.direction.z.toFixed(2)}`
            });
            return true;
        }
        
        return false;
    }
    
    reset(position, direction) {
        this.visible = true;
        this.active = true;
        
        // Set position to grid-aligned coordinates
        const gridAlignedPosition = new THREE.Vector3(
            Math.round(position.x / this.gridCellSize) * this.gridCellSize,
            0.5,
            Math.round(position.z / this.gridCellSize) * this.gridCellSize
        );
        
        this.position.copy(gridAlignedPosition);
        
        this.mesh.direction.copy(direction).normalize();
        this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        this.mesh.trailStartTime = Date.now() + (window.gameSettings?.trailDelay || 1000);
        this.mesh.lastGridPosition = this.position.clone();
    }
    
    remove() {
        this.scene.remove(this.mesh);
    }
}

// Export the Bike class
export default Bike; 