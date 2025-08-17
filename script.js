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

        // Add score to current round
        player.roundScores[this.currentRound - 1] = parseInt(score);
        player.totalScore += parseInt(score);

        // Show real-time leaderboard animation then popup
        this.animateLeaderboardUpdate(player, parseInt(score));

        // Clear inputs
        document.getElementById('playerSelect').value = '';
        document.getElementById('scoreInput').value = '';
    }

    animateLeaderboardUpdate(player, score) {
        // First update the leaderboard with animation
        this.updateDisplayWithAnimation(player.id);
        
        // After 3 seconds, show the popup
        setTimeout(() => {
            this.showSimplePopup(player, score);
        }, 3000);

        this.saveData();
    }

    updateDisplayWithAnimation(updatedPlayerId) {
        const leaderboardList = document.getElementById('leaderboardList');
        
        // Sort players by total score
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        
        // Clear and rebuild leaderboard
        leaderboardList.innerHTML = '';
        
        sortedPlayers.forEach((player, index) => {
            const rank = index + 1;
            const playerRow = document.createElement('div');
            playerRow.className = `player-row rank-${rank <= 3 ? rank : 'other'}`;
            playerRow.setAttribute('data-player-id', player.id);
            
            // Add special animation class for the updated player
            if (player.id === updatedPlayerId) {
                playerRow.classList.add('player-updating');
                // Remove animation class after 3 seconds
                setTimeout(() => {
                    playerRow.classList.remove('player-updating');
                }, 3000);
            }
            
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
            
            // Add slide-in animation with delay based on final position
            playerRow.style.animationDelay = `${index * 0.1}s`;
            playerRow.classList.add('slide-in');
            
            leaderboardList.appendChild(playerRow);
        });
        
        if (this.players.length === 0) {
            leaderboardList.innerHTML = '<div class="player-row"><div class="player-info"><div class="player-name">Nog geen spelers</div><div class="player-score">Voeg spelers toe om te beginnen!</div></div></div>';
        }

        // Update round display
        document.getElementById('currentRound').textContent = this.currentRound;
        this.updatePlayerSelect();
    }

    showSimplePopup(player, score) {
        const overlay = document.getElementById('animationOverlay');
        const animation = document.getElementById('scoreAnimation');
        const photoElement = document.getElementById('animationPlayerPhoto');
        const nameElement = document.getElementById('animationPlayerName');
        const scoreElement = document.getElementById('animationScore');
        const rankElement = document.getElementById('animationRank');

        // Set photo and name
        if (player.photo) {
            photoElement.innerHTML = `<img src="${player.photo}" alt="${player.name}" class="player-photo-big">`;
        } else {
            photoElement.innerHTML = `<div class="player-photo-big default">👑</div>`;
        }

        nameElement.textContent = player.name;
        scoreElement.textContent = `+${score} punten`;
        
        // Calculate rank
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        const rank = sortedPlayers.findIndex(p => p.id === player.id) + 1;
        const rankText = this.getRankText(rank);
        rankElement.textContent = rankText;

        // Show popup
        overlay.style.display = 'flex';
        
        setTimeout(() => {
            animation.classList.add('show');
        }, 100);

        // Hide popup after 3 seconds
        setTimeout(() => {
            animation.classList.remove('show');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }, 3000);
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