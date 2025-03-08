class Explosion {
    constructor(scene, position, color) {
        this.scene = scene;
        this.position = position;
        this.color = color;
        this.particles = [];
        this.particleCount = 150; 
        this.duration = 2000; 
        this.startTime = Date.now();

        this.createParticles();
        this.createShockwave();
    }

    createParticles() {
        const geometry = new THREE.SphereGeometry(1.0, 8, 8); 
        const material = new THREE.MeshPhongMaterial({
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 3, 
            transparent: true
        });

        for (let i = 0; i < this.particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material.clone());
            particle.position.copy(this.position);

            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2.5, 
                Math.random() * 1.5,         
                (Math.random() - 0.5) * 2.5  
            );

            this.particles.push(particle);
            this.scene.add(particle);
        }
    }

    createShockwave() {
        const geometry = new THREE.RingGeometry(1, 4, 32); 
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

        this.particles.forEach(particle => {
            particle.position.add(particle.velocity);
            particle.velocity.y -= 0.03;
            particle.material.opacity = 1 - progress;
            particle.scale.multiplyScalar(0.97);
        });

        this.shockwave.scale.addScalar(0.6); 
        this.shockwave.material.opacity = 1 * (1 - progress);

        return true;
    }

    cleanup() {
        this.particles.forEach(particle => {
            this.scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
        });

        this.scene.remove(this.shockwave);
        this.shockwave.geometry.dispose();
        this.shockwave.material.dispose();
    }
}