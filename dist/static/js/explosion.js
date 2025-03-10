class Explosion {
    constructor(scene, position, color) {
        this.scene = scene;
        this.position = position;
        this.color = color;
        this.particles = [];
        this.particleCount = 150; // Increased from 50
        this.duration = 2000; // Increased from 1000 milliseconds
        this.startTime = Date.now();

        this.createParticles();
        this.createShockwave();
    }

    createParticles() {
        const geometry = new THREE.SphereGeometry(1.0, 8, 8); // Doubled size from 0.5
        const material = new THREE.MeshPhongMaterial({
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 3, // Increased from 2
            transparent: true
        });

        for (let i = 0; i < this.particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material.clone());
            particle.position.copy(this.position);

            // Further increased velocity and spread
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2.5, // Increased from 1.5
                Math.random() * 1.5,         // Increased from 1.0
                (Math.random() - 0.5) * 2.5  // Increased from 1.5
            );

            this.particles.push(particle);
            this.scene.add(particle);
        }
    }

    createShockwave() {
        const geometry = new THREE.RingGeometry(1, 4, 32); // Doubled size
        const material = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });

        this.shockwave = new THREE.Mesh(geometry, material);
        this.shockwave.position.copy(this.position);
        this.shockwave.rotation.x = -Math.PI / 2;
        this.scene.add(this.shockwave);
    }

    update() {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;

        if (progress >= 1) {
            this.cleanup();
            return false;
        }

        // More dramatic particle movement
        this.particles.forEach(particle => {
            particle.position.add(particle.velocity);
            particle.velocity.y -= 0.03;
            particle.material.opacity = 1 - progress;
            particle.scale.multiplyScalar(0.97);
        });

        // Even more dramatic shockwave expansion
        this.shockwave.scale.addScalar(0.6); // Increased from 0.4
        this.shockwave.material.opacity = 1 * (1 - progress);

        return true;
    }

    cleanup() {
        // Remove particles
        this.particles.forEach(particle => {
            this.scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
        });

        // Remove shockwave
        this.scene.remove(this.shockwave);
        this.shockwave.geometry.dispose();
        this.shockwave.material.dispose();
    }
}