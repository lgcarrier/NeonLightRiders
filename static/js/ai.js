class AI {
    constructor(game, bikeIndex) {
        this.game = game;
        this.bikeIndex = bikeIndex;
        this.turnThreshold = 0.1;
        this.lookAheadDistance = 20;
    }

    update() {
        const bike = this.game.bikes[this.bikeIndex];
        if (!bike.active) return;

        const ahead = this.lookAhead(bike);
        if (this.willCollide(ahead)) {
            this.avoidCollision(bike);
        }
    }

    lookAhead(bike) {
        const direction = bike.direction.clone();
        return bike.position.clone().add(
            direction.multiplyScalar(this.lookAheadDistance)
        );
    }

    willCollide(position) {
        // Check collision with walls
        if (
            position.x < -this.game.gridSize/2 ||
            position.x > this.game.gridSize/2 ||
            position.z < -this.game.gridSize/2 ||
            position.z > this.game.gridSize/2
        ) {
            return true;
        }

        // Check collision with trails
        for (const trail of this.game.trails) {
            const distance = position.distanceTo(trail.position);
            if (distance < 2) {
                return true;
            }
        }

        return false;
    }

    avoidCollision(bike) {
        // Try turning left or right based on available space
        const leftTurn = this.checkTurnDirection(bike, Math.PI/2);
        const rightTurn = this.checkTurnDirection(bike, -Math.PI/2);

        if (leftTurn && !rightTurn) {
            this.game.turnLeft(this.bikeIndex);
        } else if (!leftTurn && rightTurn) {
            this.game.turnRight(this.bikeIndex);
        } else {
            // Random turn if both directions are possible
            Math.random() > 0.5 ? 
                this.game.turnLeft(this.bikeIndex) : 
                this.game.turnRight(this.bikeIndex);
        }
    }

    checkTurnDirection(bike, angle) {
        const direction = bike.direction.clone();
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        const newPosition = bike.position.clone().add(
            direction.multiplyScalar(this.lookAheadDistance)
        );
        return !this.willCollide(newPosition);
    }
}
