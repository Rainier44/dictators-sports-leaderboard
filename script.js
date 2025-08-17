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

        // Check if player was first before scoring
        const sortedBefore = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        const wasFirst = sortedBefore.length > 0 && sortedBefore[0].id == playerId;

        // Add score to current round
        player.roundScores[this.currentRound - 1] = parseInt(score);
        player.totalScore += parseInt(score);

        // Check if player is now first
        const sortedAfter = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        const isNowFirst = sortedAfter[0].id == playerId;

        // Trigger animation on display page
        this.triggerDisplayAnimation(player, parseInt(score), wasFirst, isNowFirst);

        // Update and save
        this.updateDisplay();
        this.saveData();

        // Clear inputs
        document.getElementById('playerSelect').value = '';
        document.getElementById('scoreInput').value = '';
    }

    triggerDisplayAnimation(player, score, wasFirst, isNowFirst) {
        // Store animation trigger in localStorage for display page
        const animationData = {
            playerId: player.id,
            playerName: player.name,
            playerPhoto: player.photo,
            score: score,
            wasFirst: wasFirst,
            isNowFirst: isNowFirst,
            timestamp: Date.now(),
            trigger: true
        };
        
        localStorage.setItem('animationTrigger', JSON.stringify(animationData));
        console.log('🎬 Animation triggered for display page:', player.name, '+' + score);
    }

    updateDisplay() {
        this.updateSimpleLeaderboard();
        this.updatePlayerSelect();
        document.getElementById('currentRound').textContent = this.currentRound;
    }

    updateSimpleLeaderboard() {
        const leaderboardElement = document.getElementById('simpleLeaderboard');
        if (!leaderboardElement) return;
        
        // Sort players by total score
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        
        leaderboardElement.innerHTML = '';
        
        if (sortedPlayers.length === 0) {
            leaderboardElement.innerHTML = '<div class="simple-player"><div class="simple-name">Nog geen spelers toegevoegd</div></div>';
            return;
        }

        sortedPlayers.forEach((player, index) => {
            const rank = index + 1;
            const playerDiv = document.createElement('div');
            playerDiv.className = `simple-player rank-${rank <= 3 ? rank : 'other'}`;
            
            playerDiv.innerHTML = `
                <div class="simple-rank">${rank}</div>
                <div class="simple-name">${player.name}</div>
                <div class="simple-score">${player.totalScore}pts</div>
            `;
            
            leaderboardElement.appendChild(playerDiv);
        });
    }

    updatePlayerSelect() {
        const select = document.getElementById('playerSelect');
        if (!select) return;
        
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
            // Clear animation triggers
            localStorage.removeItem('animationTrigger');
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

// Test animation function
function testAnimation() {
    // Create a fake animation trigger for testing
    const testPlayer = leaderboard.players[0];
    if (testPlayer) {
        leaderboard.triggerDisplayAnimation(testPlayer, 10, false, true);
        alert('Test animatie verstuurd naar display pagina!');
    } else {
        alert('Voeg eerst een speler toe om de animatie te testen.');
    }
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