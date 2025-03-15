import ScoreManager from './ScoreManager.js';

class RoundManager {
    constructor() {
        this.currentRound = 1; // Start at round 1 instead of 0
        this.totalRounds = 7;
        this.countdown = 5;
        this.countdownInterval = null;
        this.scoreManager = new ScoreManager();
    }

    startNewRound() {
        console.log('RoundManager - Starting Round:', this.currentRound);
        return new Promise((resolve) => {
            // Don't increment round here, just start countdown
            this.startCountdown(resolve);
        });
    }

    getCurrentRound() {
        return this.currentRound;
    }

    isGameOver() {
        console.log('Checking game over:', {
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            isOver: this.currentRound > this.totalRounds
        });
        return this.currentRound > this.totalRounds;
    }

    recordRoundWinner(playerId) {
        console.log('RoundManager - Recording Winner:', {
            round: this.currentRound,
            winner: playerId,
            previousScore: this.scoreManager.getScores().get(playerId) || 0
        });
        
        this.scoreManager.addPoint(playerId);
        
        console.log('RoundManager - Updated Scores:', 
            Array.from(this.scoreManager.getScores())
        );
    }

    getScores() {
        return this.scoreManager.getScores();
    }

    startCountdown(onComplete) {
        console.log('RoundManager - Starting Countdown for round:', this.currentRound);
        this.countdown = 5;
        const countdownElement = document.getElementById('countdown');
        countdownElement.classList.remove('hidden');
        
        // Update round display immediately
        document.getElementById('round-value').textContent = `${this.currentRound}/${this.totalRounds}`;
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        const updateDisplay = () => {
            console.log('Countdown Update:', {
                countdown: this.countdown,
                round: this.currentRound,
                totalRounds: this.totalRounds
            });
            countdownElement.textContent = `Round ${this.currentRound} starts in: ${this.countdown}`;
            document.getElementById('round-value').textContent = `${this.currentRound}/${this.totalRounds}`;
        };

        updateDisplay();

        this.countdownInterval = setInterval(() => {
            this.countdown--;
            if (this.countdown <= 0) {
                clearInterval(this.countdownInterval);
                countdownElement.classList.add('hidden');
                onComplete();
            } else {
                updateDisplay();
            }
        }, 1000);
    }

    getCountdown() {
        return this.countdown;
    }

    incrementRound() {
        this.currentRound++;
        console.log('Round incremented:', {
            newRound: this.currentRound,
            totalRounds: this.totalRounds
        });
    }
}

export default RoundManager;