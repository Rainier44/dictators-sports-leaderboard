class SportsLeaderboard {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.loadData();
        this.updateDisplay();
    }

    addPlayer(name) {
        if (!name.trim()) {
            alert('Please enter a player name!');
            return;
        }
        
        if (this.players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
            alert('Player already exists!');
            return;
        }

        const player = {
            id: Date.now(),
            name: name.trim(),
            totalScore: 0,
            roundScores: []
        };

        this.players.push(player);
        this.updateDisplay();
        this.saveData();
        
        // Clear input
        document.getElementById('playerName').value = '';
    }

    addScore(playerId, score) {
        const player = this.players.find(p => p.id == playerId);
        if (!player) {
            alert('Please select a player!');
            return;
        }

        if (score === '' || score < 0) {
            alert('Please enter a valid score!');
            return;
        }

        // Add score to current round
        if (!player.roundScores[this.currentRound - 1]) {
            player.roundScores[this.currentRound - 1] = 0;
        }
        
        player.roundScores[this.currentRound - 1] += parseInt(score);
        player.totalScore += parseInt(score);

        // Show animation
        this.showScoreAnimation(player.name, score);

        this.updateDisplay();
        this.saveData();
        
        // Clear inputs
        document.getElementById('playerSelect').value = '';
        document.getElementById('scoreInput').value = '';
    }

    showScoreAnimation(playerName, score) {
        const overlay = document.getElementById('animationOverlay');
        const animation = document.getElementById('scoreAnimation');
        const nameElement = document.getElementById('animationPlayerName');
        const scoreElement = document.getElementById('animationScore');
        const rankElement = document.getElementById('animationRank');

        nameElement.textContent = playerName;
        scoreElement.textContent = `+${score} points`;
        
        // Calculate new rank
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        const rank = sortedPlayers.findIndex(p => p.name === playerName) + 1;
        const rankText = this.getRankText(rank);
        
        rankElement.textContent = rankText;

        overlay.style.display = 'flex';
        
        setTimeout(() => {
            animation.classList.add('show');
        }, 100);

        setTimeout(() => {
            animation.classList.remove('show');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }, 2500);
    }

    getRankText(rank) {
        if (rank === 1) return '👑 LEADER! 👑';
        if (rank === 2) return '🥈 2nd Place';
        if (rank === 3) return '🥉 3rd Place';
        return `${rank}th Place`;
    }

    updateDisplay() {
        this.updateLeaderboard();
        this.updatePlayerSelect();
        document.getElementById('currentRound').textContent = this.currentRound;
    }

    updateLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        
        // Sort players by total score
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        
        leaderboardList.innerHTML = '';
        
        sortedPlayers.forEach((player, index) => {
            const rank = index + 1;
            const playerRow = document.createElement('div');
            playerRow.className = `player-row rank-${rank <= 3 ? rank : 'other'}`;
            
            playerRow.innerHTML = `
                <div class="rank-number">${rank}</div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-score">Round ${this.currentRound} scores: ${player.roundScores.join(', ') || 'No scores yet'}</div>
                </div>
                <div class="total-score">${player.totalScore}</div>
            `;
            
            leaderboardList.appendChild(playerRow);
        });
        
        if (this.players.length === 0) {
            leaderboardList.innerHTML = '<div class="player-row"><div class="player-info"><div class="player-name">No players yet</div><div class="player-score">Add players to get started!</div></div></div>';
        }
    }

    updatePlayerSelect() {
        const select = document.getElementById('playerSelect');
        select.innerHTML = '<option value="">Select Player</option>';
        
        this.players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = `${player.name} (${player.totalScore} pts)`;
            select.appendChild(option);
        });
    }

    nextRound() {
        this.currentRound++;
        this.updateDisplay();
        this.saveData();
    }

    resetAll() {
        if (confirm('Are you sure you want to reset everything? This cannot be undone!')) {
            this.players = [];
            this.currentRound = 1;
            this.updateDisplay();
            this.saveData();
        }
    }

    saveData() {
        const data = {
            players: this.players,
            currentRound: this.currentRound
        };
        localStorage.setItem('sportsLeaderboard', JSON.stringify(data));
    }

    loadData() {
        const saved = localStorage.getItem('sportsLeaderboard');
        if (saved) {
            const data = JSON.parse(saved);
            this.players = data.players || [];
            this.currentRound = data.currentRound || 1;
        }
    }
}

// Initialize the leaderboard
const leaderboard = new SportsLeaderboard();

// Global functions for HTML buttons
function addPlayer() {
    const name = document.getElementById('playerName').value;
    leaderboard.addPlayer(name);
}

function addScore() {
    const playerId = document.getElementById('playerSelect').value;
    const score = document.getElementById('scoreInput').value;
    leaderboard.addScore(playerId, parseInt(score));
}

function nextRound() {
    leaderboard.nextRound();
}

function resetAll() {
    leaderboard.resetAll();
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.id === 'playerName') {
            addPlayer();
        } else if (activeElement.id === 'scoreInput') {
            addScore();
        }
    }
});