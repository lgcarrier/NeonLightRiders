class BikeAnimations {
    constructor(bike) {
        this.bike = bike;
        this.isAnimating = false;
        this.currentAnimation = null;
        this.rotationSpeed = Math.PI; // One full rotation per second
        this.bounceHeight = 2;
        this.bounceSpeed = 4;
        this.startY = 0.5; // Original bike height
    }

    victory() {
        this.isAnimating = true;
        this.currentAnimation = 'victory';
        this.animationStartTime = Date.now();
        this.startY = this.bike.position.y;
    }

    emote(type) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.currentAnimation = type;
        this.animationStartTime = Date.now();
        this.startY = this.bike.position.y;
    }

    update() {
        if (!this.isAnimating) return;

        const elapsed = (Date.now() - this.animationStartTime) / 1000; // Convert to seconds

        switch (this.currentAnimation) {
            case 'victory':
                // Spin and bounce animation
                this.bike.rotation.y += this.rotationSpeed * 0.016; // Assuming 60fps
                this.bike.position.y = this.startY + Math.sin(elapsed * this.bounceSpeed) * this.bounceHeight;
                
                // Add particle effects for victory
                if (elapsed % 0.5 < 0.016) { // Create particles every 0.5 seconds
                    this.createVictoryParticles();
                }
                break;

            case 'happy':
                // Quick bounce animation
                this.bike.position.y = this.startY + Math.sin(elapsed * this.bounceSpeed * 2) * (this.bounceHeight / 2);
                if (elapsed > 1) {
                    this.stopAnimation();
                }
                break;

            case 'taunt':
                // Quick spin animation
                this.bike.rotation.y += this.rotationSpeed * 0.032;
                if (elapsed > 0.5) {
                    this.stopAnimation();
                }
                break;
        }
    }

    createVictoryParticles() {
        // Position for particles
        const position = this.bike.position.clone();
        position.y += 2; // Slightly above the bike

        // Create particles with bike's color
        const explosion = new Explosion(
            this.bike.parent, // scene
            position,
            this.bike.material.color,
            true // isVictory parameter for special victory particles
        );

        // Add to game's explosion array
        if (this.bike.parent.userData.game) {
            this.bike.parent.userData.game.explosions.push(explosion);
        }
    }

    stopAnimation() {
        this.isAnimating = false;
        this.currentAnimation = null;
        this.bike.position.y = this.startY;
    }
}
