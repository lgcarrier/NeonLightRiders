class RadarMap {
    constructor() {
        this.canvas = document.getElementById('radarCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.size = 150;
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.padding = 10;
        this.dotSize = 4;
    }

    update(bikes, gridSize) {
        // Clear the canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.size, this.size);

        // Draw border
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.padding, this.padding, 
            this.size - 2 * this.padding, 
            this.size - 2 * this.padding);

        // Draw active bikes
        bikes.forEach((bike, index) => {
            if (!bike.active) return;

            // Map bike position from game grid to radar
            const x = this.mapRange(bike.position.x, -gridSize/2, gridSize/2, 
                this.padding, this.size - this.padding);
            const z = this.mapRange(bike.position.z, -gridSize/2, gridSize/2, 
                this.padding, this.size - this.padding);

            // Draw bike dot
            this.ctx.fillStyle = bike.material.color.getStyle();
            this.ctx.beginPath();
            this.ctx.arc(x, z, this.dotSize, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    mapRange(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
}
