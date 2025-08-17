class SportsLeaderboard {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.loadData();
        this.updateDisplay();
    }

    addPlayer(name, photoFile = null) {
        if (!name.trim()) {
            alert('Voer een speler naam in!');
            return;
        }
        
        if (this.players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
            alert('Speler bestaat al!');
            return;
        }

        const player = {
            id: Date.now(),
            name: name.trim(),
            totalScore: 0,
            roundScores: [],
            photo: null
        };

        // Handle photo if provided
        if (photoFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                player.photo = e.target.result;
                this.players.push(player);
                this.updateDisplay();
                this.saveData();
            };
            reader.readAsDataURL(photoFile);
        } else {
            this.players.push(player);
            this.updateDisplay();
            this.saveData();
        }
        
        // Clear inputs
        document.getElementById('playerName').value = '';
        document.getElementById('playerPhoto').value = '';
    }

    addScore(playerId, score) {
        const player = this.players.find(p => p.id == playerId);
        if (!player) {
            alert('Selecteer een speler!');
            return;
        }

        if (score === '' || score < 0) {
            alert('Voer een geldige score in!');
            return;
        }

        // Check if player already has a score for this round
        if (player.roundScores[this.currentRound - 1] !== undefined) {
            alert(`${player.name} heeft al een score voor Ronde ${this.currentRound}!`);
            return;
        }

        // Store old position for animation
        const oldPosition = this.getPlayerPosition(player.id);

        // Add score to current round
        player.roundScores[this.currentRound - 1] = parseInt(score);
        player.totalScore += parseInt(score);

        // Calculate new position
        const newPosition = this.getPlayerPosition(player.id);

        // Show suspenseful animation
        this.showSuspenseAnimation(player, oldPosition, newPosition, parseInt(score));

        // Clear inputs
        document.getElementById('playerSelect').value = '';
        document.getElementById('scoreInput').value = '';
    }

    getPlayerPosition(playerId) {
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        return sortedPlayers.findIndex(p => p.id === playerId) + 1;
    }

    showSuspenseAnimation(player, oldPosition, newPosition, score) {
        const overlay = document.getElementById('animationOverlay');
        const animation = document.getElementById('scoreAnimation');
        const photoElement = document.getElementById('animationPlayerPhoto');
        const nameElement = document.getElementById('animationPlayerName');
        const positionElement = document.getElementById('animationPosition');
        const scoreElement = document.getElementById('animationScore');
        const rankElement = document.getElementById('animationRank');

        // Hide all elements initially
        positionElement.style.display = 'none';
        scoreElement.style.display = 'none';
        rankElement.style.display = 'none';

        // Set photo and name
        if (player.photo) {
            photoElement.innerHTML = `<img src="${player.photo}" alt="${player.name}" class="player-photo-big">`;
        } else {
            photoElement.innerHTML = `<div class="player-photo-big default">👑</div>`;
        }

        nameElement.textContent = player.name;
        
        overlay.style.display = 'flex';
        
        setTimeout(() => {
            animation.classList.add('show');
        }, 100);

        // Phase 1: Show current position (2 seconds)
        setTimeout(() => {
            positionElement.style.display = 'block';
            positionElement.textContent = `Huidige positie: ${oldPosition}`;
            positionElement.classList.add('position-show');
        }, 600);

        // Phase 2: Show movement animation (3 seconds)
        setTimeout(() => {
            if (newPosition < oldPosition) {
                // Moving up
                this.animatePositionChange(positionElement, oldPosition, newPosition, true);
            } else if (newPosition > oldPosition) {
                // Moving down
                this.animatePositionChange(positionElement, oldPosition, newPosition, false);
            } else {
                // No position change
                positionElement.textContent = `Blijft op positie: ${oldPosition}`;
                positionElement.className = 'position-no-change';
            }
        }, 2600);

        // Phase 3: Reveal score (1 second)
        setTimeout(() => {
            scoreElement.style.display = 'block';
            scoreElement.textContent = `+${score} punten`;
            scoreElement.classList.add('score-reveal');
        }, 5600);

        // Phase 4: Show final rank (1 second)
        setTimeout(() => {
            rankElement.style.display = 'block';
            const rankText = this.getRankText(newPosition);
            rankElement.textContent = rankText;
            rankElement.classList.add('rank-reveal');
        }, 6600);

        // Phase 5: Update leaderboard and cleanup
        setTimeout(() => {
            this.updateDisplay();
            this.saveData();
            
            // Hide animation
            animation.classList.remove('show');
            setTimeout(() => {
                overlay.style.display = 'none';
                // Reset classes
                positionElement.className = '';
                scoreElement.className = 'score-display';
                rankElement.className = '';
            }, 500);
        }, 8100);
    }

    animatePositionChange(element, oldPos, newPos, movingUp) {
        const positions = [];
        const step = movingUp ? -1 : 1;
        
        for (let i = oldPos; movingUp ? i >= newPos : i <= newPos; i += step) {
            positions.push(i);
        }

        let currentIndex = 0;
        element.className = movingUp ? 'position-moving-up' : 'position-moving-down';

        const interval = setInterval(() => {
            if (currentIndex < positions.length) {
                element.textContent = `${movingUp ? '⬆️' : '⬇️'} Positie: ${positions[currentIndex]}`;
                currentIndex++;
            } else {
                clearInterval(interval);
                element.textContent = `Nieuwe positie: ${newPos}!`;
                element.className = movingUp ? 'position-final-up' : 'position-final-down';
            }
        }, 300);
    }

    getRankText(rank) {
        if (rank === 1) return '👑 HEERSER! 👑';
        if (rank === 2) return '🥈 2de Plaats';
        if (rank === 3) return '🥉 3de Plaats';
        return `${rank}de Plaats`;
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
            
            // Show all round scores
            const roundScoresDisplay = player.roundScores.map((score, idx) => 
                `R${idx + 1}: ${score !== undefined ? score : '-'}`
            ).join(', ') || 'Nog geen scores';
            
            // Create photo element
            const photoHtml = player.photo 
                ? `<img src="${player.photo}" alt="${player.name}" class="player-photo">`
                : `<div class="player-photo default">👑</div>`;
            
            playerRow.innerHTML = `
                <div class="rank-number">${rank}</div>
                ${photoHtml}
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-score">${roundScoresDisplay}</div>
                </div>
                <div class="total-score">${player.totalScore}</div>
            `;
            
            leaderboardList.appendChild(playerRow);
        });
        
        if (this.players.length === 0) {
            leaderboardList.innerHTML = '<div class="player-row"><div class="player-info"><div class="player-name">Nog geen spelers</div><div class="player-score">Voeg spelers toe om te beginnen!</div></div></div>';
        }
    }

    updatePlayerSelect() {
        const select = document.getElementById('playerSelect');
        select.innerHTML = '<option value="">Selecteer Speler</option>';
        
        this.players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id;
            
            // Check if player already has a score for current round
            const hasScoreThisRound = player.roundScores[this.currentRound - 1] !== undefined;
            const scoreText = hasScoreThisRound ? ' ✅' : '';
            
            option.textContent = `${player.name} (${player.totalScore} pts)${scoreText}`;
            
            // Disable option if player already scored this round
            if (hasScoreThisRound) {
                option.disabled = true;
                option.style.color = '#666';
            }
            
            select.appendChild(option);
        });
    }

    nextRound() {
        this.currentRound++;
        this.updateDisplay();
        this.saveData();
    }

    resetRound() {
        if (this.currentRound === 1) {
            alert('Kan Ronde 1 niet resetten!');
            return;
        }

        if (confirm(`Weet je zeker dat je Ronde ${this.currentRound} wilt resetten? Dit verwijdert alle scores van deze ronde.`)) {
            this.players.forEach(player => {
                // Remove the score from current round if it exists
                if (player.roundScores[this.currentRound - 1] !== undefined) {
                    player.totalScore -= player.roundScores[this.currentRound - 1];
                    player.roundScores[this.currentRound - 1] = undefined;
                }
            });
            
            this.updateDisplay();
            this.saveData();
        }
    }

    resetAll() {
        if (confirm('Weet je zeker dat je alles wilt resetten? Dit kan niet ongedaan worden gemaakt!')) {
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
    const photoInput = document.getElementById('playerPhoto');
    const photoFile = photoInput.files[0];
    
    leaderboard.addPlayer(name, photoFile);
}

function addScore() {
    const playerId = document.getElementById('playerSelect').value;
    const score = document.getElementById('scoreInput').value;
    leaderboard.addScore(playerId, parseInt(score));
}

function nextRound() {
    leaderboard.nextRound();
}

function resetRound() {
    leaderboard.resetRound();
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