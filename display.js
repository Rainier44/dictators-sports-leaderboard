class DisplayLeaderboard {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.lastAnimationTimestamp = 0;
        this.isAnimating = false;
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
    // ⚠️ If there’s a newer trigger we haven’t animated yet, don't touch the DOM
    const t = localStorage.getItem('animationTrigger');
    if (t) {
        try {
        const trigger = JSON.parse(t);
        if (trigger.timestamp > this.lastAnimationTimestamp) {
            return; // wait for performFLIPAnimation() to handle it
        }
        } catch (_) {}
    }

    const saved = localStorage.getItem('sportsLeaderboard');
    if (saved) {
        const data = JSON.parse(saved);
        const hasChanged = JSON.stringify(this.players) !== JSON.stringify(data.players) ||
                        this.currentRound !== data.currentRound;

        if (hasChanged && !this.isAnimating) {
        this.players = data.players || [];
        this.currentRound = data.currentRound || 1;
        this.updateDisplay();
        }
    }
    }

    updateLeaderboardPositionsOnly() {
    const leaderboardList = document.getElementById('leaderboardList');

    // Sort players by score (new order)
    const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);

    // Reorder DOM rows, but keep their innerHTML unchanged
    sortedPlayers.forEach((player, index) => {
        const row = leaderboardList.querySelector(`[data-player-id="${player.id}"]`);
        if (row) {
            leaderboardList.appendChild(row); // moves row to new position
        }
    });
}

    checkForAnimationTrigger() {
        const triggerData = localStorage.getItem('animationTrigger');
        if (triggerData && !this.isAnimating) {
            try {
                const trigger = JSON.parse(triggerData);
                
                // Only process if this is a new trigger
                if (trigger.timestamp > this.lastAnimationTimestamp) {
                    this.lastAnimationTimestamp = trigger.timestamp;
                    console.log('🎬 Animation trigger received:', trigger);
                    
                    // Perform the FLIP animation
                    this.performFLIPAnimation(trigger);
                    
                    // Clear the trigger
                    localStorage.removeItem('animationTrigger');
                }
            } catch (e) {
                console.error('Error parsing animation trigger:', e);
                localStorage.removeItem('animationTrigger');
            }
        }
    }

    performFLIPAnimation(trigger) {
        if (this.isAnimating) return;
        
        console.log('🎭 Starting FLIP animation for:', trigger.playerName);
        this.isAnimating = true;
        
        // FLIP: First - Record initial positions
        const firstPositions = this.recordPositions();
        
        // Update players data (for ranking only)
        this.players = JSON.parse(localStorage.getItem('sportsLeaderboard')).players || [];

        // Reorder leaderboard rows, but keep old score texts for now
        this.updateLeaderboardPositionsOnly();

        // Ensure layout is up-to-date before measuring
        document.getElementById('leaderboardList').offsetHeight;

        // Now measure "Last"
        const lastPositions = this.recordPositions();
        

        const animations = this.calculateInversions(firstPositions, lastPositions, trigger.playerId);
        
        // FLIP: Play - Animate to final positions
        this.playAnimations(animations, trigger);
    }

    recordPositions() {
        const leaderboardList = document.getElementById('leaderboardList');
        const rows = Array.from(leaderboardList.children);
        const positions = new Map();
        
        rows.forEach(row => {
            const playerId = row.getAttribute('data-player-id');
            if (playerId) {
                const rect = row.getBoundingClientRect();
                positions.set(playerId, {
                    element: row,
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
            }
        });
        
        return positions;
    }

    calculateInversions(firstPositions, lastPositions, scoringPlayerId) {
        const animations = [];
        const orderBefore = Array.from(firstPositions.keys());
        const orderAfter  = Array.from(lastPositions.keys());
        const epsilon = 0.1;

        for (const [playerId, lastPos] of lastPositions) {
            const firstPos = firstPositions.get(playerId);
            if (!firstPos) continue;

            let deltaX = firstPos.left - lastPos.left;
            let deltaY = firstPos.top  - lastPos.top;

            // If pixels say "no move", check if the rank index changed
            const oldIndex = orderBefore.indexOf(playerId);
            const newIndex = orderAfter.indexOf(playerId);
            const indexChanged = oldIndex !== newIndex;

            if (Math.abs(deltaX) > epsilon || Math.abs(deltaY) > epsilon || indexChanged) {
            lastPos.element.style.transition = 'none';
            lastPos.element.style.transform  = `translate(${deltaX}px, ${deltaY}px)`;
            // Force reflow so the inversion 'sticks'
            lastPos.element.offsetHeight;

            animations.push({
                element: lastPos.element,
                playerId,
                isScoring: playerId == scoringPlayerId,
                deltaX, deltaY
            });
            }
        }
        return animations;
        }


    playAnimations(animations, trigger) {
        // Set up transitions and animate to final positions
        animations.forEach(({ element, isScoring }) => {
            element.style.transition = 'transform 3.0s cubic-bezier(0.4, 0.0, 0.2, 1)';
            element.style.transform = 'translate(0px, 0px)';
            
            // Highlight the scoring player
            if (isScoring) {
                element.classList.add('player-updating');
            }
        });

        // Clean up after animation completes
        setTimeout(() => {
            animations.forEach(({ element, isScoring }) => {
                element.style.transition = '';
                element.style.transform = '';
                
                if (isScoring) {
                    element.classList.remove('player-updating');
                }
            });
            
            this.isAnimating = false;
            
            // Show popup after movement animation
            setTimeout(() => {
                const player = this.players.find(p => p.id == trigger.playerId);
                this.showScorePopup(player, trigger.score);
            }, 200);
            
        }, 3000);
    }

    updateLeaderboardSilent() {
        // Update without any visual effects
        const leaderboardList = document.getElementById('leaderboardList');
        
        // Sort players by total score
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        
        // Clear and rebuild
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

    showScorePopup(player, score) {
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

        // Hide popup after 4 seconds
        setTimeout(() => {
            animation.classList.remove('show');
            setTimeout(() => {
                overlay.style.display = 'none';

                this.updateLeaderboardSilent();
            }, 500);
        }, 4000);

        // Show confetti if they became first
        const isNowFirst = rank === 1;
        if (isNowFirst) {
            setTimeout(() => {
                console.log('🎊 Triggering confetti for new leader!');
                this.createConfetti();
            }, 2000);
        }
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
                angle: 315,
                spread: 55,
                origin: { x: 0.2, y: 0.0 },
                colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
            });
        }, 100);

        setTimeout(() => {
            confetti({
                particleCount: 120,
                angle: 225,
                spread: 55,
                origin: { x: 0.8, y: 0.0 },
                colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
            });
        }, 200);

        console.log('✅ Canvas-confetti fired successfully!');
    }

    updateDisplay() {
        if (!this.isAnimating) {
            this.updateLeaderboard();
        }
        document.getElementById('currentRound').textContent = this.currentRound;
    }

    updateLeaderboard() {
        // This is the non-animated version for normal updates
        this.updateLeaderboardSilent();
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