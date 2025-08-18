class DisplayLeaderboard {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.lastAnimationTimestamp = 0;
        this.loadData();
        this.updateDisplay();
        this.startWatching();
    }

    loadData() {
        const saved = localStorage.getItem('sportsLeaderboard');
        if (saved) {
            const data = JSON.parse(saved);
            this.players = data.players || [];
            this.currentRound = data.currentRound || 1;
        }
    }

    startWatching() {
        // Watch for data changes every 500ms
        setInterval(() => {
            this.checkForUpdates();
        }, 500);

        // Watch for animation triggers every 100ms
        setInterval(() => {
            this.checkForAnimationTrigger();
        }, 100);
    }

    checkForUpdates() {
        const saved = localStorage.getItem('sportsLeaderboard');
        if (saved) {
            const data = JSON.parse(saved);
            const hasChanged = JSON.stringify(this.players) !== JSON.stringify(data.players) || 
                             this.currentRound !== data.currentRound;
            
            if (hasChanged) {
                this.players = data.players || [];
                this.currentRound = data.currentRound || 1;
                this.updateDisplay();
            }
        }
    }

    checkForAnimationTrigger() {
        const triggerData = localStorage.getItem('animationTrigger');
        if (triggerData) {
            try {
                const trigger = JSON.parse(triggerData);
                
                // Only process if this is a new trigger
                if (trigger.timestamp > this.lastAnimationTimestamp) {
                    this.lastAnimationTimestamp = trigger.timestamp;
                    console.log('🎬 Animation trigger received:', trigger);
                    
                    // Start the animation sequence
                    this.performAnimation(trigger);
                    
                    // Clear the trigger
                    localStorage.removeItem('animationTrigger');
                }
            } catch (e) {
                console.error('Error parsing animation trigger:', e);
                localStorage.removeItem('animationTrigger');
            }
        }
    }

    performAnimation(trigger) {
        console.log('🎭 Starting animation sequence for:', trigger.playerName);
        
        // First: Show the leaderboard rank movement animation
        this.animateLeaderboardMovement(trigger, () => {
            // Then: show the score popup animation
            this.showScorePopup(trigger);
            
            // Finally: show confetti if they became first
            if (!trigger.wasFirst && trigger.isNowFirst) {
                setTimeout(() => {
                    console.log('🎊 Triggering confetti for new leader!');
                    this.createConfetti();
                }, 2000); // Show confetti 2 seconds after popup
            }
        });
    }

    animateLeaderboardMovement(trigger, callback) {
        console.log('📊 Starting leaderboard rank animation for:', trigger.playerName);
        
        // Calculate the player's old and new positions
        const playersBeforeScore = [...this.players];
        const playerIndex = playersBeforeScore.findIndex(p => p.id === trigger.playerId);
        
        if (playerIndex === -1) {
            console.log('❌ Player not found for rank animation');
            callback();
            return;
        }

        // Simulate the score change to calculate new position
        const playersBefore = playersBeforeScore.map(p => ({
            ...p,
            totalScore: p.id === trigger.playerId ? p.totalScore - trigger.score : p.totalScore
        }));
        
        const sortedBefore = [...playersBefore].sort((a, b) => b.totalScore - a.totalScore);
        const sortedAfter = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        
        const oldRank = sortedBefore.findIndex(p => p.id === trigger.playerId) + 1;
        const newRank = sortedAfter.findIndex(p => p.id === trigger.playerId) + 1;
        
        console.log(`📈 Player ${trigger.playerName} moved from rank ${oldRank} to rank ${newRank}`);
        
        // Highlight and animate the player's row
        const playerRow = document.querySelector(`[data-player-id="${trigger.playerId}"]`);
        if (playerRow) {
            // Add special highlighting class
            playerRow.classList.add('player-updating');
            
            // Create a pill element that moves up/down
            this.createMovingPill(trigger, oldRank, newRank, () => {
                // Remove highlighting after pill animation
                setTimeout(() => {
                    playerRow.classList.remove('player-updating');
                    callback();
                }, 500);
            });
        } else {
            console.log('❌ Player row not found in DOM');
            callback();
        }
    }

    createMovingPill(trigger, oldRank, newRank, callback) {
        console.log(`🏃 Creating moving pill animation from rank ${oldRank} to ${newRank}`);
        
        // Only animate if there's actual movement
        if (oldRank === newRank) {
            console.log('📍 No rank change, skipping pill animation');
            setTimeout(callback, 1000);
            return;
        }
        
        // Create a temporary pill element
        const pill = document.createElement('div');
        pill.className = 'moving-pill';
        pill.innerHTML = `
            <div class="pill-photo">
                ${trigger.playerPhoto ? 
                    `<img src="${trigger.playerPhoto}" alt="${trigger.playerName}" />` : 
                    '👑'
                }
            </div>
            <div class="pill-name">${trigger.playerName}</div>
            <div class="pill-score">+${trigger.score}</div>
        `;
        
        // Add pill to the leaderboard container
        const leaderboard = document.getElementById('leaderboardList');
        leaderboard.appendChild(pill);
        
        // Calculate start and end positions
        const playerRows = Array.from(leaderboard.children).filter(el => 
            el.classList.contains('player-row')
        );
        
        const startIndex = Math.min(oldRank - 1, playerRows.length - 1);
        const endIndex = Math.min(newRank - 1, playerRows.length - 1);
        
        const startRow = playerRows[startIndex];
        const endRow = playerRows[endIndex];
        
        if (startRow && endRow) {
            const startRect = startRow.getBoundingClientRect();
            const endRect = endRow.getBoundingClientRect();
            const leaderboardRect = leaderboard.getBoundingClientRect();
            
            // Position pill at start position
            pill.style.position = 'absolute';
            pill.style.left = '20px';
            pill.style.top = (startRect.top - leaderboardRect.top) + 'px';
            pill.style.zIndex = '999';
            
            // Force reflow
            pill.offsetHeight;
            
            // Animate to end position
            pill.style.transition = 'all 1.5s cubic-bezier(0.4, 0.0, 0.2, 1)';
            pill.style.transform = `translateY(${endRect.top - startRect.top}px)`;
            
            // Add glow effect during movement
            setTimeout(() => {
                pill.classList.add('pill-moving');
            }, 100);
            
            // Remove pill after animation and call callback
            setTimeout(() => {
                pill.remove();
                callback();
            }, 1800);
        } else {
            console.log('❌ Could not find start or end row for pill animation');
            pill.remove();
            setTimeout(callback, 500);
        }
    }

    showScorePopup(trigger) {
        const overlay = document.getElementById('animationOverlay');
        const animation = document.getElementById('scoreAnimation');
        const photoElement = document.getElementById('animationPlayerPhoto');
        const nameElement = document.getElementById('animationPlayerName');
        const scoreElement = document.getElementById('animationScore');
        const rankElement = document.getElementById('animationRank');

        // Set photo and name
        if (trigger.playerPhoto) {
            photoElement.innerHTML = `<img src="${trigger.playerPhoto}" alt="${trigger.playerName}" class="player-photo-big">`;
        } else {
            photoElement.innerHTML = `<div class="player-photo-big default">👑</div>`;
        }

        nameElement.textContent = trigger.playerName;
        scoreElement.textContent = `+${trigger.score} punten`;
        
        // Calculate current rank
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        const rank = sortedPlayers.findIndex(p => p.id === trigger.playerId) + 1;
        const rankText = this.getRankText(rank);
        rankElement.textContent = rankText;

        // Show popup
        overlay.style.display = 'flex';
        
        setTimeout(() => {
            animation.classList.add('show');
        }, 100);

        // Hide popup after 4 seconds
        setTimeout(() => {
            animation.classList.remove('show');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }, 4000);
    }

    createConfetti() {
        console.log('🎊 createConfetti() called!');
        
        // Check if confetti library is loaded
        if (typeof confetti === 'undefined') {
            console.error('❌ Canvas-confetti library not loaded!');
            return;
        }

        console.log('✅ Canvas-confetti library is available');
        console.log('🚀 Firing confetti from bottom corners to center!');

        // Fire confetti from left bottom corner towards center
        confetti({
            particleCount: 120,
            angle: 60,
            spread: 55,
            origin: { x: 0.2, y: 1.0 },
            colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9FF3', '#54A0FF']
        });

        // Fire confetti from right bottom corner towards center (slight delay)
        setTimeout(() => {
            confetti({
                particleCount: 120,
                angle: 120,
                spread: 55,
                origin: { x: 0.8, y: 1.0 },
                colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9FF3', '#54A0FF']
            });
        }, 150);

        // Fire confetti from center bottom straight up (more delay)
        setTimeout(() => {
            confetti({
                particleCount: 100,
                angle: 90,
                spread: 100,
                origin: { x: 0.5, y: 1.0 },
                colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9FF3', '#54A0FF']
            });
        }, 300);

        setTimeout(() => {
            confetti({
                particleCount: 120,
                angle: 315,                // Shoots down-right (315° = -45°)
                spread: 55,
                origin: { x: 0.2, y: 0.0 }, // Top left (x: 10%, y: 10%)
                colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
            });
        }, 100);

        setTimeout(() => {
            confetti({
                particleCount: 120,
                angle: 225,                // Shoots down-left (225° = -135°)
                spread: 55,
                origin: { x: 0.8, y: 0.0 }, // Top right (x: 90%, y: 10%)
                colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
            });
        }, 200);

        console.log('✅ Canvas-confetti fired successfully!');
    }


    updateDisplay() {
        this.updateLeaderboard();
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
            leaderboardList.innerHTML = `
                <div class="player-row">
                    <div class="player-info">
                        <div class="player-name">Nog geen spelers</div>
                        <div class="player-score">Wacht op de admin om spelers toe te voegen...</div>
                    </div>
                </div>`;
        }
    }

    getRankText(rank) {
        if (rank === 1) return '👑 HEERSER! 👑';
        if (rank === 2) return '🥈 2de Plaats';
        if (rank === 3) return '🥉 3de Plaats';
        return `${rank}de Plaats`;
    }
}

// Initialize the display leaderboard
const displayLeaderboard = new DisplayLeaderboard();

// Test function for manual confetti (can be called from console)
function testConfetti() {
    console.log('🧪 Testing confetti on display page...');
    displayLeaderboard.createConfetti();
}

// Add some visual feedback when the page loads
console.log('📺 Display page loaded - watching for animation triggers...');
