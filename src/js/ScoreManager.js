class ScoreManager {
    constructor() {
        this.scores = new Map();
    }

    addPoint(playerId) {
        const currentScore = this.scores.get(playerId) || 0;
        this.scores.set(playerId, currentScore + 1);
    }

    getScores() {
        return this.scores;
    }
}

export default ScoreManager;