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

        // Store old positions before updating
        const oldPositions = this.getCurrentPositions();
        
        // Check if player was first before scoring
        const sortedBefore = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        const wasFirst = sortedBefore.length > 0 && sortedBefore[0].id == playerId;

        console.log(`Player ${player.name} was first before: ${wasFirst}`);

        // Add score to current round
        player.roundScores[this.currentRound - 1] = parseInt(score);
        player.totalScore += parseInt(score);

        // Check if player is now first
        const sortedAfter = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        const isNowFirst = sortedAfter[0].id == playerId;

        console.log(`Player ${player.name} is now first: ${isNowFirst}`);

        // Show confetti if someone just became first
        if (!wasFirst && isNowFirst) {
            console.log('🎉 CONFETTI SHOULD TRIGGER! Player became #1');
            setTimeout(() => {
                this.createConfetti();
            }, 1600);
        } else {
            console.log('No confetti - either was already first or not first now');
        }

        // Animate the movement, then show popup
        this.animateToNewPositions(oldPositions, playerId, parseInt(score));

        // Clear inputs
        document.getElementById('playerSelect').value = '';
        document.getElementById('scoreInput').value = '';
    }

    createConfetti() {
        console.log('🎊 createConfetti() called!');
        
        // Check if tsParticles is loaded
        if (typeof tsParticles === 'undefined') {
            console.error('❌ tsParticles library not loaded!');
            return;
        }

        console.log('✅ tsParticles library is available');

        // Clear any existing particles
        try {
            const container = tsParticles.domItem(0);
            if (container) {
                container.destroy();
            }
        } catch (e) {
            console.log('No existing particles to clean up');
        }

        console.log('🚀 Loading confetti particles...');

        // Confetti configuration that shoots from bottom corners to center
        const confettiConfig = {
            fullScreen: {
                enable: true,
                zIndex: 999999
            },
            fpsLimit: 120,
            particles: {
                number: {
                    value: 0 // We'll use emitters instead
                },
                color: {
                    value: ["#ffd700", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ff9ff3", "#54a0ff"]
                },
                shape: {
                    type: ["circle", "square"]
                },
                opacity: {
                    value: { min: 0.3, max: 1 },
                    animation: {
                        enable: true,
                        speed: 3,
                        startValue: "max",
                        destroy: "min"
                    }
                },
                size: {
                    value: { min: 4, max: 8 }
                },
                life: {
                    duration: {
                        sync: false,
                        value: { min: 2, max: 4 }
                    },
                    count: 1
                },
                move: {
                    enable: true,
                    gravity: {
                        enable: true,
                        acceleration: 9.81,
                        maxSpeed: 50
                    },
                    speed: { min: 15, max: 25 },
                    decay: 0.1,
                    direction: "none",
                    straight: false,
                    outModes: {
                        default: "destroy",
                        top: "none"
                    }
                },
                rotate: {
                    value: { min: 0, max: 360 },
                    direction: "random",
                    animation: {
                        enable: true,
                        speed: 30
                    }
                }
            },
            emitters: [
                // Left bottom corner
                {
                    life: {
                        count: 60,
                        duration: 0.1,
                        delay: 0
                    },
                    rate: {
                        delay: 0.1,
                        quantity: 10
                    },
                    size: {
                        width: 0,
                        height: 0
                    },
                    position: {
                        x: 10,
                        y: 95
                    },
                    direction: "top",
                    particles: {
                        move: {
                            angle: {
                                offset: 45,
                                value: 45
                            }
                        }
                    }
                },
                // Right bottom corner
                {
                    life: {
                        count: 60,
                        duration: 0.1,
                        delay: 0.15
                    },
                    rate: {
                        delay: 0.1,
                        quantity: 10
                    },
                    size: {
                        width: 0,
                        height: 0
                    },
                    position: {
                        x: 90,
                        y: 95
                    },
                    direction: "top",
                    particles: {
                        move: {
                            angle: {
                                offset: 135,
                                value: 135
                            }
                        }
                    }
                },
                // Center bottom
                {
                    life: {
                        count: 40,
                        duration: 0.1,
                        delay: 0.3
                    },
                    rate: {
                        delay: 0.05,
                        quantity: 15
                    },
                    size: {
                        width: 10,
                        height: 0
                    },
                    position: {
                        x: 50,
                        y: 100
                    },
                    direction: "top",
                    particles: {
                        move: {
                            angle: {
                                offset: 90,
                                value: 90
                            }
                        }
                    }
                }
            ]
        };

        // Load the particles
        tsParticles.load("tsparticles", confettiConfig).then(container => {
            console.log('✅ Confetti particles loaded successfully!');
            
            // Auto cleanup after 5 seconds
            setTimeout(() => {
                console.log('🧹 Cleaning up confetti...');
                container.destroy();
            }, 5000);
        }).catch(error => {
            console.error('❌ Error loading confetti:', error);
        });
    }

    getCurrentPositions() {
        const leaderboardList = document.getElementById('leaderboardList');
        const rows = Array.from(leaderboardList.children);
        const positions = {};
        
        rows.forEach((row, index) => {
            const playerId = row.getAttribute('data-player-id');
            if (playerId) {
                positions[playerId] = {
                    element: row,
                    oldIndex: index,
                    rect: row.getBoundingClientRect()
                };
            }
        });
        
        return positions;
    }

    animateToNewPositions(oldPositions, scoringPlayerId, score) {
        // Sort players by new scores
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        const leaderboardList = document.getElementById('leaderboardList');
        
        // Calculate new positions
        const newPositions = {};
        sortedPlayers.forEach((player, newIndex) => {
            newPositions[player.id] = newIndex;
        });

        // Update content but keep elements in old positions temporarily
        this.updatePlayerRowContents();

        // Animate each row to its new position
        Object.keys(oldPositions).forEach(playerId => {
            const oldPos = oldPositions[playerId];
            const newIndex = newPositions[playerId];
            const element = oldPos.element;
            
            if (oldPos.oldIndex !== newIndex) {
                // Calculate the distance to move
                const rowHeight = 115; // approximate height + gap
                const moveDistance = (newIndex - oldPos.oldIndex) * rowHeight;
                
                // Start from old position
                element.style.transform = `translateY(0px)`;
                element.style.transition = 'none';
                
                // Force reflow
                element.offsetHeight;
                
                // Animate to new position
                element.style.transition = 'transform 1.5s ease-in-out';
                element.style.transform = `translateY(${moveDistance}px)`;
            }

            // Highlight the scoring player
            if (playerId == scoringPlayerId) {
                element.classList.add('player-updating');
                setTimeout(() => {
                    element.classList.remove('player-updating');
                }, 2000);
            }
        });

        // After animation completes, rebuild leaderboard properly
        setTimeout(() => {
            this.updateDisplay();
            this.saveData();
            
            // Show popup after movement animation
            setTimeout(() => {
                const player = this.players.find(p => p.id == scoringPlayerId);
                this.showSimplePopup(player, score);
            }, 200);
        }, 1500);
    }

    updatePlayerRowContents() {
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        const leaderboardList = document.getElementById('leaderboardList');
        const rows = Array.from(leaderboardList.children);
        
        // Update content of existing rows
        sortedPlayers.forEach((player, index) => {
            if (rows[index]) {
                const rank = index + 1;
                const row = rows[index];
                
                // Update rank number
                const rankElement = row.querySelector('.rank-number');
                if (rankElement) rankElement.textContent = rank;
                
                // Update total score
                const scoreElement = row.querySelector('.total-score');
                if (scoreElement) scoreElement.textContent = player.totalScore;
                
                // Update round scores
                const roundScoresDisplay = player.roundScores.map((score, idx) => 
                    `R${idx + 1}: ${score !== undefined ? score : '-'}`
                ).join(', ') || 'Nog geen scores';
                
                const playerScoreElement = row.querySelector('.player-score');
                if (playerScoreElement) playerScoreElement.textContent = roundScoresDisplay;
                
                // Update row classes
                row.className = `player-row rank-${rank <= 3 ? rank : 'other'}`;
                row.setAttribute('data-player-id', player.id);
            }
        });
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
            playerRow.setAttribute('data-player-id', player.id);
            
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

// Test confetti function (for debugging)
function testConfetti() {
    console.log('🧪 Testing confetti manually...');
    leaderboard.createConfetti();
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