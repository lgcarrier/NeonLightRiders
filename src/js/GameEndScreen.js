class GameEndScreen {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '50%';
        this.container.style.left = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.padding = '20px';
        this.container.style.borderRadius = '10px';
        this.container.style.color = '#fff';
        this.container.style.display = 'none';
    }

    show(scores) {
        this.container.innerHTML = '<h2>Game Over!</h2><h3>Final Scores:</h3>';
        const scoresList = document.createElement('ul');
        
        Array.from(scores.entries())
            .sort(([, a], [, b]) => b - a)
            .forEach(([playerId, score]) => {
                const li = document.createElement('li');
                li.textContent = `Player ${int(playerId)+1}: ${score} points`;
                scoresList.appendChild(li);
            });

        this.container.appendChild(scoresList);
        this.container.style.display = 'block';
        document.body.appendChild(this.container);
    }

    hide() {
        this.container.style.display = 'none';
        // Remove from DOM completely
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}