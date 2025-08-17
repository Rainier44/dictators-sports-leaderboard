class DisplayLeaderboard {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.lastUpdateHash = '';
        this.loadData();
        this.updateDisplay();
        this.startAutoRefresh();
    }

    loadData() {
        const saved = localStorage.getItem('sportsLeaderboard');
        if (saved) {
            const data = JSON.parse(saved);
            this.players = data.players || [];
            this.currentRound = data.currentRound || 1;
        }
    }

    startAutoRefresh() {
        // Check for updates every 2 seconds
        setInterval(() => {
            this.checkForUpdates();
        }, 2000);
    }

    checkForUpdates() {
        const saved = localStorage.getItem('sportsLeaderboard');
        if (saved) {
            // Create a hash of the data to detect changes
            const currentHash = this.createHash(saved);
            
            if (currentHash !== this.lastUpdateHash) {
                console.log('🔄 Data updated, refreshing display...');
                
                // Store old first place for confetti detection
                const oldFirstPlace = this.getFirstPlace();
                
                // Load new data
                const data = JSON.parse(saved);
                this.players = data.players || [];
                this.currentRound = data.currentRound || 1;
                
                // Check for new first place
                const newFirstPlace = this.getFirstPlace();
                
                // Trigger confetti if someone new became first
                if (oldFirstPlace && newFirstPlace && 
                    oldFirstPlace.id !== newFirstPlace.id) {
                    setTimeout(() => {
                        this.createConfetti();
                    }, 500);
                }
                
                this.updateDisplay();
                this.lastUpdateHash = currentHash;
            }
        }
    }

    createHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    getFirstPlace() {
        if (this.players.length === 0) return null;
        const sorted = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        return sorted[0];
    }

    createConfetti() {
        console.log('🎊 Confetti triggered on display page!');
        
        // Check if confetti library is loaded
        if (typeof confetti === 'undefined') {
            console.error('❌ Canvas-confetti library not loaded!');
            return;
        }

        // Fire confetti from left bottom corner towards center
        confetti({
            particleCount: 80,
            angle: 60,
            spread: 70,
            startVelocity: 60,
            origin: { x: 0.1, y: 0.9 },
            colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9FF3', '#54A0FF']
        });

        // Fire confetti from right bottom corner towards center
        setTimeout(() => {
            confetti({
                particleCount: 80,
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
                particleCount: 60,
                angle: 90,
                spread: 100,
                startVelocity: 70,
                origin: { x: 0.5, y: 1.0 },
                colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9FF3', '#54A0FF']
            });
        }, 300);

        // Add top corners for extra effect
        setTimeout(() => {
            confetti({
                particleCount: 60,
                angle: 315,
                spread: 55,
                startVelocity: 50,
                origin: { x: 0.1, y: 0.1 },
                colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9FF3', '#54A0FF']
            });
        }, 100);

        setTimeout(() => {
            confetti({
                particleCount: 60,
                angle: 225,
                spread: 55,
                startVelocity: 50,
                origin: { x: 0.9, y: 0.1 },
                colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9FF3', '#54A0FF']
            });
        }, 250);

        console.log('✅ Full corner confetti display fired!');
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

// Add some visual feedback when the page loads
console.log('📺 Display page loaded - watching for updates...');

// Test function for manual confetti (can be called from console)
function testConfetti() {
    console.log('🧪 Testing confetti on display page...');
    displayLeaderboard.createConfetti();
}

// Visual indicator that auto-refresh is working
let refreshIndicator = 0;
setInterval(() => {
    refreshIndicator = (refreshIndicator + 1) % 4;
    const dots = '.'.repeat(refreshIndicator + 1);
    const refreshElement = document.querySelector('.auto-refresh');
    if (refreshElement) {
        refreshElement.textContent = `🔄 Automatisch ververst elke 2 seconden${dots}`;
    }
}, 500);