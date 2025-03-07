class Explosion {
    constructor(scene, position, color) {
        this.scene = scene;
        this.position = position;
        this.color = color;
        this.particles = [];
        this.particleCount = 50;
        this.duration = 1000; // milliseconds
        this.startTime = Date.now();
        
        this.createParticles();
        this.createShockwave();
    }

    createParticles() {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshPhongMaterial({
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.5,
            transparent: true
        });

        for (let i = 0; i < this.particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material.clone());
            particle.position.copy(this.position);
            
            // Random velocity
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.2,
                (Math.random() - 0.5) * 0.3
            );
            
            this.particles.push(particle);
            this.scene.add(particle);
        }
    }

    createShockwave() {
        const geometry = new THREE.RingGeometry(0.1, 0.5, 32);
        const material = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        this.shockwave = new THREE.Mesh(geometry, material);
        this.shockwave.position.copy(this.position);
        this.shockwave.rotation.x = -Math.PI / 2; // Lay flat on the ground
        this.scene.add(this.shockwave);
    }

    update() {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;

        if (progress >= 1) {
            this.cleanup();
            return false;
        }

        // Update particles
        this.particles.forEach(particle => {
            particle.position.add(particle.velocity);
            particle.velocity.y -= 0.01; // Gravity
            particle.material.opacity = 1 - progress;
            particle.scale.multiplyScalar(0.98);
        });

        // Update shockwave
        this.shockwave.scale.addScalar(0.2);
        this.shockwave.material.opacity = 0.8 * (1 - progress);

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
