class SportsLeaderboard {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.loadData();
        this.updateDisplay();
    }

    addPlayer(name, photoFile = null) {
        console.log('➕ ADDING PLAYER:', name);
        console.log('📊 Players before add:', this.players.length);
        
        if (!name.trim()) {
            alert('Voer een speler naam in!');
            return;
        }
        
        if (this.players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
            alert('Speler bestaat al!');
            console.log('❌ Player already exists:', name);
            return;
        }

        const player = {
            id: Date.now(),
            name: name.trim(),
            totalScore: 0,
            roundScores: [],
            photo: null
        };

        console.log('👤 Created player object:', player);

        // Handle photo if provided
        if (photoFile) {
            console.log('📸 Original file size:', Math.round(photoFile.size/1024), 'KB');
            
            // Check if compression function exists
            if (typeof this.compressImage !== 'function') {
                console.error('❌ compressImage function not found!');
                alert('Error: Image compression not available. Add images without photos for now.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('📸 Base64 size before compression:', Math.round(e.target.result.length/1024), 'KB');
                
                // Compress the image before saving
                this.compressImage(e.target.result, (compressedImage) => {
                    player.photo = compressedImage;
                    console.log('📸 Compressed photo for:', player.name);
                    this.players.push(player);
                    console.log('📊 Players after add (with photo):', this.players.length);
                    this.updateDisplay();
                    this.saveData();
                    
                    // Clear inputs after successful save
                    document.getElementById('playerName').value = '';
                    document.getElementById('playerPhoto').value = '';
                    console.log('✅ addPlayer() completed for:', name);
                });
            };
            reader.onerror = (e) => {
                console.error('❌ Photo read error:', e);
                // Still add player without photo
                this.players.push(player);
                this.updateDisplay();
                this.saveData();
                
                // Clear inputs
                document.getElementById('playerName').value = '';
                document.getElementById('playerPhoto').value = '';
                console.log('✅ addPlayer() completed for:', name, '(without photo due to error)');
            };
            reader.readAsDataURL(photoFile);
        } else {
            // No photo case
            this.players.push(player);
            this.updateDisplay();
            this.saveData();
            
            // Clear inputs
            document.getElementById('playerName').value = '';
            document.getElementById('playerPhoto').value = '';
            console.log('✅ addPlayer() completed for:', name, '(no photo)');
        }
    }

    compressImage(dataUrl, callback) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Set small dimensions for leaderboard photos
            const maxWidth = 500;
            const maxHeight = 500;
            
            let { width, height } = img;
            
            // Calculate new dimensions (maintain aspect ratio)
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to compressed JPEG with 60% quality
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            console.log('📸 Compressed from', Math.round(dataUrl.length/1024), 'KB to', Math.round(compressedDataUrl.length/1024), 'KB');
            callback(compressedDataUrl);
        };
        
        img.src = dataUrl;
    }

    addScore(playerId, score) {
        const player = this.players.find(p => p.id == playerId);
        if (!player) {
            alert('Selecteer een speler!');
            return;
        }

        // Enhanced validation to prevent NaN scores
        const scoreValue = parseFloat(score);
        if (score === '' || score === null || score === undefined || isNaN(scoreValue) || scoreValue < 0) {
            alert('Voer een geldige score in! (0 of hoger)');
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

        // Add score to current round - use scoreValue (parsed float) instead of parseInt
        player.roundScores[this.currentRound - 1] = scoreValue;
        player.totalScore += scoreValue;

        // Check if player is now first
        const sortedAfter = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        const isNowFirst = sortedAfter[0].id == playerId;

        // Trigger animation on display page
        this.triggerDisplayAnimation(player, scoreValue, wasFirst, isNowFirst);

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

    triggerRoundAnimation(newRound) {
        // Store round animation trigger in localStorage for display page
        const roundAnimationData = {
            type: 'nextRound',
            roundNumber: newRound,
            timestamp: Date.now()
        };
        
        localStorage.setItem('roundAnimationTrigger', JSON.stringify(roundAnimationData));
        console.log('🎬 Round animation triggered for display page: Round', newRound);
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
        
        // Trigger the round animation on display page
        this.triggerRoundAnimation(this.currentRound);
        
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

    resetAllScores() {
        if (confirm('Weet je zeker dat je alle scores wilt resetten? Dit zet alle scores op 0 en gaat terug naar Ronde 1, maar houdt de spelers.')) {
            // Reset all player scores but keep the players
            this.players.forEach(player => {
                player.totalScore = 0;
                player.roundScores = [];
            });
            
            // Reset to round 1
            this.currentRound = 1;
            
            this.updateDisplay();
            this.saveData();
            
            // Clear animation triggers
            localStorage.removeItem('animationTrigger');
            localStorage.removeItem('roundAnimationTrigger');
            
            alert('Alle scores zijn gereset! Spelers blijven behouden.');
        }
    }

    removeAllPlayers() {
        if (confirm('Weet je zeker dat je alle spelers wilt verwijderen? Dit verwijdert alle spelers en reset de competitie volledig. Dit kan niet ongedaan worden gemaakt!')) {
            this.players = [];
            this.currentRound = 1;
            this.updateDisplay();
            this.saveData();
            
            // Clear animation triggers
            localStorage.removeItem('animationTrigger');
            localStorage.removeItem('roundAnimationTrigger');
            
            alert('Alle spelers zijn verwijderd en de competitie is volledig gereset!');
        }
    }

    // Legacy function - keeping for backward compatibility but redirecting to removeAllPlayers
    resetAll() {
        this.removeAllPlayers();
    }

    saveData() {
        const data = {
            players: this.players,
            currentRound: this.currentRound
        };
        
        // Add debugging
        console.log('💾 SAVING DATA:', {
            playerCount: this.players.length,
            playerNames: this.players.map(p => p.name),
            currentRound: this.currentRound
        });
        
        localStorage.setItem('sportsLeaderboard', JSON.stringify(data));
        
        // Verify the save worked
        setTimeout(() => {
            const saved = localStorage.getItem('sportsLeaderboard');
            if (saved) {
                const parsed = JSON.parse(saved);
                console.log('✅ SAVE VERIFIED:', {
                    savedPlayerCount: parsed.players.length,
                    savedPlayerNames: parsed.players.map(p => p.name)
                });
            }
        }, 100);
    }

    loadData() {
        const saved = localStorage.getItem('sportsLeaderboard');
        if (saved) {
            const data = JSON.parse(saved);
            this.players = data.players || [];
            this.currentRound = data.currentRound || 1;
            
            // Add debugging
            console.log('📖 ADMIN LOADED DATA:', {
                playerCount: this.players.length,
                playerNames: this.players.map(p => p.name),
                currentRound: this.currentRound
            });
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
    leaderboard.addScore(playerId, score);
}

function nextRound() {
    leaderboard.nextRound();
}

function resetRound() {
    leaderboard.resetRound();
}

function resetAllScores() {
    leaderboard.resetAllScores();
}

function removeAllPlayers() {
    leaderboard.removeAllPlayers();
}

// Legacy function - keeping for backward compatibility
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

// Test round animation function
function testRoundAnimation() {
    leaderboard.triggerRoundAnimation(leaderboard.currentRound + 1);
    alert('Test ronde animatie verstuurd naar display pagina!');
}

function debugSync() {
    console.log('🔧 ADMIN DEBUG - Current state:');
    console.log('📊 Admin players count:', leaderboard.players.length);
    console.log('📋 Admin player names:', leaderboard.players.map(p => p.name));
    
    // Force save and check
    leaderboard.saveData();
    
    // Check what's actually in localStorage
    setTimeout(() => {
        const raw = localStorage.getItem('sportsLeaderboard');
        if (raw) {
            const parsed = JSON.parse(raw);
            console.log('📦 localStorage contains:', parsed.players.length, 'players');
            console.log('📦 localStorage names:', parsed.players.map(p => p.name));
        }
    }, 200);
}

function forceReloadData() {
    console.log('🔄 FORCING DATA RELOAD...');
    
    // Clear current data
    leaderboard.players = [];
    
    // Reload from localStorage
    leaderboard.loadData();
    
    // Update all displays
    leaderboard.updateDisplay();
    
    console.log('✅ Reload complete. New player count:', leaderboard.players.length);
    console.log('📋 New player names:', leaderboard.players.map(p => p.name));
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
