class DisplayLeaderboard {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.lastAnimationTimestamp = 0;
        this.lastRoundAnimationTimestamp = 0;
        this.isAnimating = false;
        this.isRoundAnimating = false;
        
        // Load gifIndex from localStorage to persist across page reloads
        this.gifIndex = parseInt(localStorage.getItem('currentGifIndex')) || 0;

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
        
        console.log('🎬 GIF rotation initialized with index:', this.gifIndex);
        
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
        // Check if there's a pending animation trigger that we haven't processed yet
        const animationTrigger = localStorage.getItem('animationTrigger');
        if (animationTrigger) {
            try {
                const trigger = JSON.parse(animationTrigger);
                if (trigger.timestamp > this.lastAnimationTimestamp) {
                    console.log('⏳ Animation trigger pending - BLOCKING regular update to preserve DOM state');
                    return; // Don't update until animation is processed
                }
            } catch (_) {
                // If there's a parsing error, remove the bad trigger
                localStorage.removeItem('animationTrigger');
            }
        }

        // Check if there's a pending round animation trigger
        const roundTrigger = localStorage.getItem('roundAnimationTrigger');
        if (roundTrigger) {
            try {
                const trigger = JSON.parse(roundTrigger);
                if (trigger.timestamp > this.lastRoundAnimationTimestamp) {
                    console.log('⏳ Round animation trigger pending - BLOCKING regular update');
                    return; // Don't update until round animation is processed
                }
            } catch (_) {
                localStorage.removeItem('roundAnimationTrigger');
            }
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
        // Get the last used GIF to avoid repeats
        const lastGif = localStorage.getItem('lastUsedGif');
        
        let selectedGif;
        let attempts = 0;
        
        do {
            selectedGif = this.availableGifs[this.gifIndex];
            
            // If it's the same as last time and we have more than 1 GIF, try next
            if (selectedGif === lastGif && this.availableGifs.length > 1 && attempts < this.availableGifs.length) {
                this.gifIndex = (this.gifIndex + 1) % this.availableGifs.length;
                attempts++;
            } else {
                break;
            }
        } while (attempts < this.availableGifs.length);
        
        console.log('🎯 Current GIF index:', this.gifIndex);
        console.log('🎯 Selected GIF:', selectedGif);
        console.log('🎯 Last used GIF was:', lastGif);
        
        // Move to next index for next time
        this.gifIndex = (this.gifIndex + 1) % this.availableGifs.length;
        
        // Save both the new index and the selected GIF
        localStorage.setItem('currentGifIndex', this.gifIndex.toString());
        localStorage.setItem('lastUsedGif', selectedGif);
        
        console.log('🔢 Next GIF index will be:', this.gifIndex);
        console.log('💾 Saved to localStorage - index:', this.gifIndex, 'lastGif:', selectedGif);
        
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
            
            // Step 1: Store the current DOM state as the "old" state before any changes
            console.log('📏 FLIP Step 1: Recording OLD positions (current DOM state)...');
            const oldPositions = this.recordPositions();
            console.log('✅ Recorded', oldPositions.size, 'old positions');
            
            // Step 2: Get the new data from localStorage
            const currentData = JSON.parse(localStorage.getItem('sportsLeaderboard'));
            if (!currentData || !currentData.players) {
                console.error('❌ No data found in localStorage');
                this.isAnimating = false;
                return;
            }

            // Step 3: Update our internal data to match localStorage
            this.players = currentData.players;
            
            // Step 4: Calculate new ranking
            const newRanking = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
            console.log('📊 NEW ranking:', newRanking.map((p, i) => `${i+1}. ${p.name}: ${p.totalScore}`));
            
            // Step 5: Find the scoring player's new position
            const scoringPlayer = this.players.find(p => p.id == trigger.playerId);
            const newPosition = newRanking.findIndex(p => p.id == trigger.playerId);
            
            console.log(`🎯 Player ${scoringPlayer.name} will be at position ${newPosition + 1}`);
            
            // Step 6: Update DOM to show new ranking without animation
            this.updateLeaderboardDOM(newRanking);
            
            // Force layout recalculation
            const leaderboardList = document.getElementById('leaderboardList');
            leaderboardList.offsetHeight;
            console.log('🔄 Forced layout recalculation');

            // Step 7: Record NEW positions (after DOM update)
            console.log('📏 FLIP Step 2: Recording NEW positions...');
            const newPositions = this.recordPositions();
            console.log('✅ Recorded', newPositions.size, 'new positions');
            
            // Step 8: Calculate animations needed
            console.log('🧮 FLIP Step 3: Calculating animations...');
            const animations = this.calculateAnimationsImproved(oldPositions, newPositions, trigger.playerId);
            
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
                const newRanking = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
                const newPosition = newRanking.findIndex(p => p.id == trigger.playerId) + 1;
                this.showScorePopup(player, trigger.score, newPosition);
            }, 200);
        }
    }

    updateLeaderboardDOM(sortedPlayers) {
        console.log('🔄 Updating DOM to show new ranking...');
        const leaderboardList = document.getElementById('leaderboardList');

        // Store current DOM order before reordering
        const currentOrder = Array.from(leaderboardList.children).map(el => el.getAttribute('data-player-id'));
        console.log('📋 Current DOM order:', currentOrder);
        
        // Create the new order based on sorted players
        const newOrder = sortedPlayers.map(player => String(player.id));
        console.log('📋 Target DOM order:', newOrder);
        
        // Check if reordering is actually needed
        const needsReordering = !currentOrder.every((id, index) => id === newOrder[index]);
        
        if (!needsReordering) {
            console.log('⚠️ DOM is already in correct order - no reordering needed');
            return;
        }
        
        console.log('🔄 DOM reordering IS needed - proceeding...');
        
        // Method 1: Clear and rebuild in correct order
        // This is more reliable than trying to move elements
        const fragment = document.createDocumentFragment();
        const elementMap = new Map();
        
        // First, collect all existing elements
        Array.from(leaderboardList.children).forEach(element => {
            const playerId = element.getAttribute('data-player-id');
            if (playerId) {
                elementMap.set(playerId, element);
            }
        });
        
        // Clear the container
        leaderboardList.innerHTML = '';
        
        // Add elements back in the new order
        sortedPlayers.forEach((player, targetIndex) => {
            const playerId = String(player.id);
            const element = elementMap.get(playerId);
            
            if (element) {
                console.log(`↕️ Placing ${player.name} at DOM position ${targetIndex}`);
                fragment.appendChild(element);
            } else {
                console.warn(`⚠️ Could not find DOM element for player ${playerId} (${player.name})`);
            }
        });
        
        // Add all elements back at once
        leaderboardList.appendChild(fragment);
        
        // Verify the new order
        const finalOrder = Array.from(leaderboardList.children).map(el => el.getAttribute('data-player-id'));
        console.log('📋 Final DOM order:', finalOrder);
        console.log('✅ DOM reordering complete - verification:', finalOrder.every((id, index) => id === newOrder[index]) ? 'SUCCESS' : 'FAILED');
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

    calculateAnimationsImproved(oldPositions, newPositions, scoringPlayerId) {
        const animations = [];
        
        console.log('🧮 Calculating animations with improved method...');
        
        for (const [playerId, newPos] of newPositions) {
            const oldPos = oldPositions.get(playerId);
            if (!oldPos) {
                console.log(`⚠️ No old position found for player ${playerId}`);
                continue;
            }

            const deltaX = oldPos.left - newPos.left;
            const deltaY = oldPos.top - newPos.top;
            
            // Check if there's any movement or if this is the scoring player
            const hasMovement = Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1;
            const isScoringPlayer = playerId == scoringPlayerId;

            console.log(`🔍 Player ${playerId}:`, {
                deltaX: Math.round(deltaX),
                deltaY: Math.round(deltaY),
                hasMovement,
                isScoringPlayer,
                shouldAnimate: hasMovement || isScoringPlayer
            });

            // Animate if there's movement OR if this is the scoring player (for highlight effect)
            if (hasMovement || isScoringPlayer) {
                console.log(`✅ Will animate player ${playerId}`);
                
                // Apply the inversion transform immediately
                newPos.element.style.transition = 'none';
                newPos.element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                newPos.element.style.zIndex = '10';
                
                // Force reflow
                newPos.element.offsetHeight;

                animations.push({
                    element: newPos.element,
                    playerId,
                    isScoring: isScoringPlayer,
                    deltaX, 
                    deltaY,
                    hasMovement
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