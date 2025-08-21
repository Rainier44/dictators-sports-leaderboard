class DisplayLeaderboard {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.lastAnimationTimestamp = 0;
        this.lastRoundAnimationTimestamp = 0;
        this.isAnimating = false;
        this.isRoundAnimating = false;
        this.gifIndex = 0;

        // Available GIFs for round animations
        this.availableGifs = [
            './gifs/running-fail.gif',
            './gifs/paralympics1.gif',
            './gifs/paralympics2.gif',
            './gifs/paralympics3.gif',
            './gifs/fail1.gif',
            './gifs/fail3.gif',
            './gifs/fail4.gif',
        ];
        
        this.loadData();
        this.updateDisplay();
        this.startWatching();
        this.logPlayerCount();
    }

    logPlayerCount() {
        console.log('🔍 DEBUGGING PLAYER COUNT:');
        console.log('📊 Total players loaded:', this.players.length);
        console.log('📋 Player names:', this.players.map(p => p.name));
        
        const rawData = localStorage.getItem('sportsLeaderboard');
        if (rawData) {
            try {
                const parsed = JSON.parse(rawData);
                console.log('📦 Raw localStorage data players count:', parsed.players ? parsed.players.length : 0);
                console.log('📦 Raw localStorage player names:', parsed.players ? parsed.players.map(p => p.name) : []);
            } catch (e) {
                console.error('❌ Error parsing localStorage:', e);
            }
        } else {
            console.log('📦 No localStorage data found');
        }
        
        setTimeout(() => {
            const leaderboardList = document.getElementById('leaderboardList');
            if (leaderboardList) {
                const domElements = leaderboardList.children.length;
                console.log('🏠 DOM elements in leaderboard:', domElements);
                console.log('🏠 DOM element player IDs:', Array.from(leaderboardList.children).map(el => el.getAttribute('data-player-id')));
            }
        }, 1000);
    }

    loadData() {
        const saved = localStorage.getItem('sportsLeaderboard');
        if (saved) {
            const data = JSON.parse(saved);
            this.players = data.players || [];
            this.currentRound = data.currentRound || 1;
            
            console.log('📥 Data loaded from localStorage:');
            console.log('📊 Players count:', this.players.length);
            console.log('📋 Current round:', this.currentRound);
        } else {
            console.log('📥 No saved data found in localStorage');
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
            this.checkForRoundAnimationTrigger();
        }, 100);
    }

    checkForUpdates() {
        // If there's a newer trigger we haven't animated yet, don't touch the DOM
        const t = localStorage.getItem('animationTrigger');
        if (t) {
            try {
                const trigger = JSON.parse(t);
                if (trigger.timestamp > this.lastAnimationTimestamp) {
                    console.log('⏳ Waiting for animation trigger to be processed...');
                    return;
                }
            } catch (_) {}
        }

        const saved = localStorage.getItem('sportsLeaderboard');
        if (saved) {
            const data = JSON.parse(saved);
            const hasChanged = JSON.stringify(this.players) !== JSON.stringify(data.players) ||
                            this.currentRound !== data.currentRound;

            if (hasChanged && !this.isAnimating && !this.isRoundAnimating) {
                console.log('📊 Data changed, updating display (no animation)');
                console.log('📊 New player count:', data.players ? data.players.length : 0);
                this.players = data.players || [];
                this.currentRound = data.currentRound || 1;
                this.updateDisplay();
                this.logPlayerCount();
            }
        }
    }

    checkForRoundAnimationTrigger() {
        const triggerData = localStorage.getItem('roundAnimationTrigger');
        if (triggerData && !this.isRoundAnimating && !this.isAnimating) {
            try {
                const trigger = JSON.parse(triggerData);
                
                if (trigger.timestamp > this.lastRoundAnimationTimestamp) {
                    this.lastRoundAnimationTimestamp = trigger.timestamp;
                    console.log('🎬 Round animation trigger received:', trigger);
                    
                    this.performRoundAnimation(trigger);
                    localStorage.removeItem('roundAnimationTrigger');
                }
            } catch (e) {
                console.error('❌ Error parsing round animation trigger:', e);
                localStorage.removeItem('roundAnimationTrigger');
            }
        }
    }

    performRoundAnimation(trigger) {
        console.log('🎬 Starting round animation for round:', trigger.roundNumber);
        this.isRoundAnimating = true;
        this.currentRound = trigger.roundNumber;

        const nextGif = this.getNextGif();
        console.log('🎯 Selected GIF:', nextGif);

        const overlay = document.getElementById('roundAnimationOverlay');
        const animation = document.getElementById('roundAnimation');
        const titleElement = document.getElementById('roundTitle');
        const numberElement = document.getElementById('roundNumber');
        const gifElement = document.getElementById('roundGif');

        titleElement.textContent = 'NEXT ROUND';
        numberElement.textContent = trigger.roundNumber;
        gifElement.src = nextGif;

        overlay.style.display = 'flex';

        setTimeout(() => {
            animation.classList.add('show');
        }, 100);

        setTimeout(() => {
            this.createConfetti();
        }, 800);

        setTimeout(() => {
            animation.classList.remove('show');
            setTimeout(() => {
                overlay.style.display = 'none';
                this.isRoundAnimating = false;
                this.updateDisplay();
                console.log('✅ Round animation completed');
            }, 600);
        }, 5000);
    }

    getNextGif() {
        const selectedGif = this.availableGifs[this.gifIndex];
        this.gifIndex = (this.gifIndex + 1) % this.availableGifs.length;
        
        console.log('🎯 Selected GIF (iterative):', selectedGif);
        console.log('🔢 Next GIF index will be:', this.gifIndex);
        
        return selectedGif;
    }

    checkForAnimationTrigger() {
        const triggerData = localStorage.getItem('animationTrigger');
        if (triggerData && !this.isAnimating && !this.isRoundAnimating) {
            try {
                const trigger = JSON.parse(triggerData);
                
                if (trigger.timestamp > this.lastAnimationTimestamp) {
                    this.lastAnimationTimestamp = trigger.timestamp;
                    console.log('🎬 Animation trigger received:', trigger);
                    
                    this.performFLIPAnimation(trigger);
                    localStorage.removeItem('animationTrigger');
                }
            } catch (e) {
                console.error('❌ Error parsing animation trigger:', e);
                localStorage.removeItem('animationTrigger');
            }
        }
    }

    performFLIPAnimation(trigger) {
        try {
            if (this.isAnimating || this.isRoundAnimating) {
                console.log('⚠️ Animation already in progress, skipping...');
                return;
            }
            
            console.log('🎭 Starting FLIP animation for:', trigger.playerName);
            this.isAnimating = true;
            
            // Step 1: Get current state from localStorage (the source of truth)
            const currentData = JSON.parse(localStorage.getItem('sportsLeaderboard'));
            if (!currentData || !currentData.players) {
                console.error('❌ No data found in localStorage');
                this.isAnimating = false;
                return;
            }

            // Step 2: Calculate the old ranking (before the score was added)
            const oldPlayers = currentData.players.map(player => {
                if (player.id == trigger.playerId) {
                    // Subtract the new score to get the old state
                    const oldPlayer = {...player};
                    oldPlayer.totalScore = player.totalScore - trigger.score;
                    oldPlayer.roundScores = [...player.roundScores];
                    oldPlayer.roundScores[oldPlayer.roundScores.length - 1] = undefined; // Remove last score
                    return oldPlayer;
                }
                return player;
            });
            
            const oldRanking = [...oldPlayers].sort((a, b) => b.totalScore - a.totalScore);
            const newRanking = [...currentData.players].sort((a, b) => b.totalScore - a.totalScore);
            
            console.log('📊 OLD ranking:', oldRanking.map((p, i) => `${i+1}. ${p.name}: ${p.totalScore}`));
            console.log('📊 NEW ranking:', newRanking.map((p, i) => `${i+1}. ${p.name}: ${p.totalScore}`));
            
            // Step 3: Check if the scoring player actually changed position
            const scoringPlayer = currentData.players.find(p => p.id == trigger.playerId);
            const oldPosition = oldRanking.findIndex(p => p.id == trigger.playerId);
            const newPosition = newRanking.findIndex(p => p.id == trigger.playerId);
            
            console.log(`🎯 Player ${scoringPlayer.name}: position ${oldPosition + 1} → ${newPosition + 1}`);
            
            if (oldPosition === newPosition) {
                console.log('⚠️ No position change - just highlight and show popup');
                this.highlightPlayerAndShowPopup(scoringPlayer, trigger.score, newPosition + 1);
                return;
            }
            
            // Step 4: Update our internal data to match localStorage
            this.players = currentData.players;
            
            // Step 5: Record current DOM positions (showing old ranking)
            console.log('📏 FLIP Step 1: Recording initial positions...');
            const firstPositions = this.recordPositions();
            console.log('✅ Recorded', firstPositions.size, 'initial positions');
            
            // Step 6: Update DOM to show new ranking without animation
            this.updateLeaderboardDOM(newRanking);
            
            // Force layout recalculation
            const leaderboardList = document.getElementById('leaderboardList');
            leaderboardList.offsetHeight;
            console.log('🔄 Forced layout recalculation');

            // Step 7: Record final positions (showing new ranking)
            console.log('📏 FLIP Step 2: Recording final positions...');
            const lastPositions = this.recordPositions();
            console.log('✅ Recorded', lastPositions.size, 'final positions');
            
            // Step 8: Calculate animations needed
            console.log('🧮 FLIP Step 3: Calculating animations...');
            const animations = this.calculateAnimations(firstPositions, lastPositions, trigger.playerId, oldRanking, newRanking);
            
            if (animations.length === 0) {
                console.log('⚠️ No animations calculated - falling back to simple highlight');
                this.highlightPlayerAndShowPopup(scoringPlayer, trigger.score, newPosition + 1);
                return;
            }
            
            // Step 9: Play the animations
            console.log('🎬 FLIP Step 4: Playing animations...');
            this.playAnimations(animations, trigger, newPosition + 1);
            
        } catch (error) {
            console.error('❌ Error in performFLIPAnimation:', error);
            this.isAnimating = false;
            setTimeout(() => {
                const player = this.players.find(p => p.id == trigger.playerId);
                this.showScorePopup(player, trigger.score, 1);
            }, 200);
        }
    }

    updateLeaderboardDOM(sortedPlayers) {
        console.log('🔄 Updating DOM to show new ranking...');
        const leaderboardList = document.getElementById('leaderboardList');

        // Create a document fragment with the new order
        const fragment = document.createDocumentFragment();
        
        sortedPlayers.forEach((player, targetIndex) => {
            const row = leaderboardList.querySelector(`[data-player-id="${player.id}"]`);
            if (row) {
                console.log(`↕️ Moving ${player.name} to DOM position ${targetIndex}`);
                fragment.appendChild(row);
            } else {
                console.warn(`⚠️ Could not find DOM element for player ${player.id} (${player.name})`);
            }
        });
        
        leaderboardList.appendChild(fragment);
        console.log('✅ DOM reordering complete');
    }

    recordPositions() {
        const leaderboardList = document.getElementById('leaderboardList');
        const rows = Array.from(leaderboardList.children);
        const positions = new Map();
        
        console.log('📍 Recording positions for', rows.length, 'rows');
        
        rows.forEach((row, index) => {
            const playerId = row.getAttribute('data-player-id');
            if (playerId) {
                const rect = row.getBoundingClientRect();
                const position = {
                    element: row,
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    domIndex: index
                };
                positions.set(playerId, position);
                
                console.log(`📍 Player ${playerId} at DOM index ${index}:`, {
                    top: Math.round(rect.top),
                    left: Math.round(rect.left)
                });
            }
        });
        
        return positions;
    }

    calculateAnimations(firstPositions, lastPositions, scoringPlayerId, oldRanking, newRanking) {
        const animations = [];
        
        console.log('🧮 Calculating animations for position changes...');
        
        // Create a map of old and new positions by player ID
        const oldPositionMap = new Map();
        const newPositionMap = new Map();
        
        oldRanking.forEach((player, index) => {
            oldPositionMap.set(player.id, index);
        });
        
        newRanking.forEach((player, index) => {
            newPositionMap.set(player.id, index);
        });
        
        for (const [playerId, lastPos] of lastPositions) {
            const firstPos = firstPositions.get(playerId);
            if (!firstPos) {
                console.log(`⚠️ No first position found for player ${playerId}`);
                continue;
            }

            const deltaX = firstPos.left - lastPos.left;
            const deltaY = firstPos.top - lastPos.top;
            
            const oldRankPosition = oldPositionMap.get(playerId);
            const newRankPosition = newPositionMap.get(playerId);
            const rankChanged = oldRankPosition !== newRankPosition;

            console.log(`🔍 Player ${playerId}:`, {
                deltaX: Math.round(deltaX),
                deltaY: Math.round(deltaY),
                oldRank: oldRankPosition + 1,
                newRank: newRankPosition + 1,
                rankChanged,
                shouldAnimate: Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1 || rankChanged
            });

            // Animate if there's movement or rank change
            if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1 || rankChanged) {
                console.log(`✅ Will animate player ${playerId}`);
                
                // Apply the inversion transform immediately
                lastPos.element.style.transition = 'none';
                lastPos.element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                lastPos.element.style.zIndex = '10';
                
                // Force reflow
                lastPos.element.offsetHeight;

                animations.push({
                    element: lastPos.element,
                    playerId,
                    isScoring: playerId == scoringPlayerId,
                    deltaX, 
                    deltaY,
                    oldRank: oldRankPosition + 1,
                    newRank: newRankPosition + 1
                });
            } else {
                console.log(`❌ No animation needed for player ${playerId}`);
            }
        }
        
        console.log(`🎬 Total animations prepared: ${animations.length}`);
        return animations;
    }

    playAnimations(animations, trigger, newRank) {
        console.log('🎭 Playing', animations.length, 'animations');
        
        // Start the animations
        animations.forEach(({ element, playerId, isScoring, deltaX, deltaY, oldRank, newRank }) => {
            console.log(`🎬 Starting animation for ${playerId}: ${Math.round(deltaX)}px, ${Math.round(deltaY)}px (${oldRank} → ${newRank})`);
            
            // Smooth transition for the sliding effect
            element.style.transition = 'all 3.0s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            element.style.transform = 'translate(0px, 0px)';
            element.style.zIndex = '1';
            
            if (isScoring) {
                element.classList.add('player-updating');
                console.log(`⭐ Highlighting scoring player: ${playerId}`);
            }
        });

        console.log('⏰ Animation will complete in 3 seconds...');

        // Clean up after animation completes
        setTimeout(() => {
            console.log('🧹 Cleaning up animations...');
            
            animations.forEach(({ element, isScoring, playerId }) => {
                element.style.transition = '';
                element.style.transform = '';
                element.style.zIndex = '';
                
                if (isScoring) {
                    element.classList.remove('player-updating');
                }
            });
            
            this.isAnimating = false;
            console.log('✅ FLIP animation sequence completed');
            
            // Show popup with correct rank after movement animation
            setTimeout(() => {
                const player = this.players.find(p => p.id == trigger.playerId);
                console.log(`🎉 Showing score popup for: ${player?.name} at rank ${newRank}`);
                this.showScorePopup(player, trigger.score, newRank);
            }, 300);
            
        }, 3000);
    }

    highlightPlayerAndShowPopup(player, score, rank) {
        const leaderboardList = document.getElementById('leaderboardList');
        const playerElement = leaderboardList.querySelector(`[data-player-id="${player.id}"]`);
        
        if (playerElement) {
            playerElement.classList.add('player-updating');
            setTimeout(() => {
                playerElement.classList.remove('player-updating');
                this.isAnimating = false;
                setTimeout(() => {
                    this.showScorePopup(player, score, rank);
                }, 200);
            }, 1000);
        } else {
            this.isAnimating = false;
            setTimeout(() => {
                this.showScorePopup(player, score, rank);
            }, 200);
        }
    }

    showScorePopup(player, score, rank) {
        console.log('🎉 Showing score popup for:', player?.name, 'Score:', score, 'Rank:', rank);
        
        const overlay = document.getElementById('animationOverlay');
        const animation = document.getElementById('scoreAnimation');
        const photoElement = document.getElementById('animationPlayerPhoto');
        const nameElement = document.getElementById('animationPlayerName');
        const scoreElement = document.getElementById('animationScore');
        const rankElement = document.getElementById('animationRank');

        // Set photo and name
        if (player.photo) {
            photoElement.className = 'player-photo-popup-container';
            photoElement.innerHTML = `<img src="${player.photo}" alt="${player.name}" class="player-photo-popup">`;
        } else {
            photoElement.className = 'player-photo-popup-container';
            photoElement.innerHTML = `<div class="player-photo-popup default">👑</div>`;
        }

        nameElement.textContent = player.name;
        scoreElement.textContent = `+${score} punten`;
        
        // Use the passed rank directly instead of recalculating
        const rankText = this.getRankText(rank);
        rankElement.textContent = rankText;

        console.log(`🏆 Player ${player.name} is now rank ${rank}: ${rankText}`);

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
                // Update the leaderboard content with new scores
                console.log('🔄 Updating leaderboard content with new scores');
                this.updateLeaderboardSilent();
            }, 500);
        }, 4000);

        // Show confetti if they became first
        const isNowFirst = rank === 1;
        if (isNowFirst) {
            setTimeout(() => {
                console.log('🎊 Triggering confetti for new leader!');
                this.createConfetti();
            }, 500);
        }
    }

    updateLeaderboardSilent() {
        console.log('🔇 Silent leaderboard update - START');
        console.log('🔇 About to render', this.players.length, 'players');
        
        const leaderboardList = document.getElementById('leaderboardList');
        if (!leaderboardList) {
            console.error('❌ leaderboardList element not found!');
            return;
        }
        
        // Sort players by total score
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        console.log('🔇 Sorted players:', sortedPlayers.map(p => `${p.name}: ${p.totalScore}`));
        
        // Clear and rebuild with updated scores
        leaderboardList.innerHTML = '';
        console.log('🔇 Cleared leaderboard DOM');
        
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
            console.log(`✅ Added player ${rank}: ${player.name} (ID: ${player.id}) to DOM`);
        });
        
        if (this.players.length === 0) {
            leaderboardList.innerHTML = `
                <div class="player-row">
                    <div class="player-info">
                        <div class="player-name">Nog geen spelers</div>
                        <div class="player-score">Wacht op de admin om spelers toe te voegen...</div>
                    </div>
                </div>`;
            console.log('🔇 Added "no players" message');
        }
        
        console.log('🔇 Final DOM children count:', leaderboardList.children.length);
        console.log('🔇 Final DOM player IDs:', Array.from(leaderboardList.children).map(el => el.getAttribute('data-player-id')));
        console.log('🔇 Silent leaderboard update - END');
    }

    createConfetti() {
        console.log('🎊 createConfetti() called!');
        
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

        setTimeout(() => {
            confetti({
                particleCount: 120,
                angle: 120,
                spread: 55,
                origin: { x: 0.8, y: 1.0 },
                colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9FF3', '#54A0FF']
            });
        }, 150);

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
        if (!this.isAnimating && !this.isRoundAnimating) {
            this.updateLeaderboard();
        }
        document.getElementById('currentRound').textContent = this.currentRound;
    }

    updateLeaderboard() {
        console.log('🔄 updateLeaderboard() called');
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

// Test functions
function testConfetti() {
    console.log('🧪 Testing confetti...');
    displayLeaderboard.createConfetti();
}

function testFLIPAnimation() {
    console.log('🧪 Testing FLIP animation...');
    if (displayLeaderboard.players.length === 0) {
        console.error('❌ No players available for testing');
        return;
    }
    
    const fakeTrigger = {
        timestamp: Date.now(),
        playerId: displayLeaderboard.players[0].id,
        playerName: displayLeaderboard.players[0].name,
        score: 5
    };
    console.log('🎬 Triggering fake animation with:', fakeTrigger);
    displayLeaderboard.performFLIPAnimation(fakeTrigger);
}

function testRoundAnimation() {
    console.log('🧪 Testing round animation...');
    const fakeRoundTrigger = {
        type: 'nextRound',
        roundNumber: displayLeaderboard.currentRound + 1,
        timestamp: Date.now()
    };
    console.log('🎬 Triggering fake round animation with:', fakeRoundTrigger);
    displayLeaderboard.performRoundAnimation(fakeRoundTrigger);
}

// Debug function to manually check player count
function debugPlayerCount() {
    console.log('🔧 MANUAL DEBUG CHECK:');
    displayLeaderboard.logPlayerCount();
    
    // Force refresh from localStorage
    displayLeaderboard.loadData();
    displayLeaderboard.updateDisplay();
    
    setTimeout(() => {
        displayLeaderboard.logPlayerCount();
    }, 500);
}

// Debug function to force show all players
function forceShowAllPlayers() {
    console.log('🔧 FORCING DISPLAY OF ALL PLAYERS');
    const rawData = localStorage.getItem('sportsLeaderboard');
    if (rawData) {
        const data = JSON.parse(rawData);
        console.log('🔧 Raw data has', data.players.length, 'players');
        
        displayLeaderboard.players = data.players;
        displayLeaderboard.updateLeaderboardSilent();
    }
}

console.log('📺 Display page loaded - Enhanced debugging enabled!');
console.log('🔧 Test functions: testConfetti(), testFLIPAnimation(), testRoundAnimation()');
console.log('🔧 Debug functions: debugPlayerCount(), forceShowAllPlayers()');
console.log('🔧 To debug: Open browser console and run debugPlayerCount() or forceShowAllPlayers()');