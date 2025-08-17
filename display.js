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
        
        // First: show the score popup animation
        this.showScorePopup(trigger);
        
        // Then: show confetti if they became first
        if (!trigger.wasFirst && trigger.isNowFirst) {
            setTimeout(() => {
                console.log('🎊 Triggering confetti for new leader!');
                this.createConfetti();
            }, 2000); // Show confetti 2 seconds after popup
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
        console.log('🎊 Creating confetti display!');
        
        // Check if confetti library is loaded
        if (typeof confetti === 'undefined') {
            console.error('❌ Canvas-confetti library not loaded!');
            return;
        }

        // Fire confetti from left bottom corner towards center
        confetti({
            particleCount: 100,
            angle: 60,
            spread: 70,
            startVelocity: 60,
            origin: { x: 0.1, y: 0.9 },
            colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9FF3', '#54A0FF']
        });

        // Fire confetti from right bottom corner towards center
        setTimeout(() => {
            confetti({
                particleCount: 100,
                angle: 120,
                spread: 70,
                startVelocity: 60,
                origin: { x: 0.9, y: 0.9 },
                colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9FF3', '#54A0FF']
            });
        }, 150);

        // Fire confetti from center bottom straight up
        setTimeout(() => {
            confetti({
                particleCount: 80,
                angle: 90,
                spread: 100,
                startVelocity: 70,
                origin: { x: 0.5, y: 1.0 },
                colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9FF3', '#54A0FF']
            });
        }, 300);

        // Add top corners for extra spectacular effect
        setTimeout(() => {
            confetti({
                particleCount: 70,
                angle: 315,
                spread: 55,
                startVelocity: 50,
                origin: { x: 0.1, y: 0.1 },
                colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9FF3', '#54A0FF']
            });
        }, 100);

        setTimeout(() => {
            confetti({
                particleCount: 70,
                angle: 225,
                spread: 55,
                startVelocity: 50,
                origin: { x: 0.9, y: 0.1 },
                colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9FF3', '#54A0FF']
            });
        }, 250);

        console.log('✅ Full spectacular confetti display fired!');
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