class DisplayLeaderboard {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.lastAnimationTimestamp = 0;
        this.lastRoundAnimationTimestamp = 0;
        this.isAnimating = false;
        this.isRoundAnimating = false;
        this.gifIndex = 0; // Counter for iterating through GIFs

        
        // Available GIFs for round animations (you can add real GIFs here)
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
            this.checkForRoundAnimationTrigger();
        }, 100);
    }

    checkForUpdates() {
        // ⚠️ If there's a newer trigger we haven't animated yet, don't touch the DOM
        const t = localStorage.getItem('animationTrigger');
        if (t) {
            try {
                const trigger = JSON.parse(t);
                if (trigger.timestamp > this.lastAnimationTimestamp) {
                    console.log('⏳ Waiting for animation trigger to be processed...');
                    return; // wait for performFLIPAnimation() to handle it
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
                this.players = data.players || [];
                this.currentRound = data.currentRound || 1;
                this.updateDisplay();
            }
        }
    }

    checkForRoundAnimationTrigger() {
        const triggerData = localStorage.getItem('roundAnimationTrigger');
        if (triggerData && !this.isRoundAnimating && !this.isAnimating) {
            try {
                const trigger = JSON.parse(triggerData);
                
                // Only process if this is a new trigger
                if (trigger.timestamp > this.lastRoundAnimationTimestamp) {
                    this.lastRoundAnimationTimestamp = trigger.timestamp;
                    console.log('🎬 Round animation trigger received:', trigger);
                    
                    // Perform the round animation
                    this.performRoundAnimation(trigger);
                    
                    // Clear the trigger
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

        // Update internal round number
        this.currentRound = trigger.roundNumber;

        // Select a next GIF
        const nextGif = this.getNextGif();

        console.log('🎯 Selected GIF:', nextGif);

        // Get animation elements
        const overlay = document.getElementById('roundAnimationOverlay');
        const animation = document.getElementById('roundAnimation');
        const titleElement = document.getElementById('roundTitle');
        const numberElement = document.getElementById('roundNumber');
        const gifElement = document.getElementById('roundGif');

        // Set content
        titleElement.textContent = 'NEXT ROUND';
        numberElement.textContent = trigger.roundNumber;
        gifElement.src = nextGif;

        // Show overlay
        overlay.style.display = 'flex';

        // Start animation after brief delay
        setTimeout(() => {
            animation.classList.add('show');
        }, 100);

        // Trigger confetti
        setTimeout(() => {
            this.createConfetti();
        }, 800);

        // Hide animation after 5 seconds
        setTimeout(() => {
            animation.classList.remove('show');
            setTimeout(() => {
                overlay.style.display = 'none';
                this.isRoundAnimating = false;
                
                // Update display with new round number
                this.updateDisplay();
                console.log('✅ Round animation completed');
            }, 600);
        }, 5000);
    }

    getNextGif() {
        // Get the current GIF
        const selectedGif = this.availableGifs[this.gifIndex];
        
        // Move to next GIF for next time
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
            
            // Get the current DOM order (before any changes)
            const leaderboardList = document.getElementById('leaderboardList');
            const currentDOMOrder = Array.from(leaderboardList.children).map(row => ({
                element: row,
                playerId: row.getAttribute('data-player-id')
            }));
            
            console.log('📋 Current DOM order:', currentDOMOrder.map(item => {
                const player = this.players.find(p => p.id == item.playerId);
                return player ? `${player.name}: ${player.totalScore}` : 'Unknown';
            }));
            
            // FLIP: First - Record initial positions (current state)
            console.log('📏 FLIP Step 1: Recording initial positions...');
            const firstPositions = this.recordPositions();
            console.log('✅ Recorded', firstPositions.size, 'initial positions');
            
            // MANUALLY update the scoring player's score first, then check positions
            console.log('🔧 Manually applying score update for animation');
            const currentData = JSON.parse(localStorage.getItem('sportsLeaderboard'));
            if (!currentData || !currentData.players) {
                console.error('❌ No data found in localStorage');
                this.isAnimating = false;
                return;
            }

            // Find the scoring player and add the score
            const updatedPlayers = currentData.players.map(player => {
                if (player.id == trigger.playerId) {
                    console.log(`🎯 Updating ${player.name}: ${player.totalScore} + ${trigger.score} = ${player.totalScore + trigger.score}`);
                    return {
                        ...player,
                        totalScore: player.totalScore + trigger.score,
                        roundScores: [...player.roundScores, trigger.score]
                    };
                }
                return player;
            });

            // Update player data with the manual calculation
            this.players = updatedPlayers;
            
            // Calculate what the new order SHOULD be
            const newRanking = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
            console.log('📊 Target ranking:', newRanking.map(p => `${p.name}: ${p.totalScore}`));
            
            // Check if the scoring player's rank actually changed
            const scoringPlayer = this.players.find(p => p.id == trigger.playerId);
            const oldRankIndex = currentDOMOrder.findIndex(item => item.playerId == trigger.playerId);
            const newRankIndex = newRanking.findIndex(p => p.id == trigger.playerId);
            
            console.log(`🎯 Player ${scoringPlayer.name}: position ${oldRankIndex} → ${newRankIndex}`);
            
            if (oldRankIndex === newRankIndex) {
                console.log('⚠️ No position change - just highlight the player');
                const scoringElement = currentDOMOrder[oldRankIndex]?.element;
                if (scoringElement) {
                    scoringElement.classList.add('player-updating');
                    setTimeout(() => {
                        scoringElement.classList.remove('player-updating');
                        this.isAnimating = false;
                        setTimeout(() => {
                            this.showScorePopup(scoringPlayer, trigger.score);
                        }, 200);
                    }, 500);
                }
                return;
            }
            
            // Reorder DOM to match new ranking
            this.updateLeaderboardPositionsOnly();
            
            // Force layout recalculation
            leaderboardList.offsetHeight;
            console.log('🔄 Forced layout recalculation');

            // FLIP: Last - Record final positions
            console.log('📏 FLIP Step 2: Recording final positions...');
            const lastPositions = this.recordPositions();
            console.log('✅ Recorded', lastPositions.size, 'final positions');
            
            // FLIP: Invert - Calculate differences and prepare animations
            console.log('🧮 FLIP Step 3: Calculating inversions...');
            const animations = this.calculateInversions(firstPositions, lastPositions, trigger.playerId);
            
            if (animations.length === 0) {
                console.log('⚠️ No animations calculated despite position change - checking manually...');
                
                // Manual check: did the scoring player actually move?
                const scoringFirstPos = firstPositions.get(trigger.playerId);
                const scoringLastPos = lastPositions.get(trigger.playerId);
                
                if (scoringFirstPos && scoringLastPos) {
                    const deltaY = scoringFirstPos.top - scoringLastPos.top;
                    console.log(`🔍 Manual check: ${scoringPlayer.name} moved ${deltaY}px vertically`);
                    
                    if (Math.abs(deltaY) > 5) {
                        // Force the animation manually
                        console.log('🎯 Forcing manual animation');
                        scoringLastPos.element.style.transition = 'none';
                        scoringLastPos.element.style.transform = `translateY(${deltaY}px)`;
                        scoringLastPos.element.style.zIndex = '10';
                        scoringLastPos.element.offsetHeight; // Force reflow
                        
                        // Animate back
                        setTimeout(() => {
                            scoringLastPos.element.style.transition = 'all 2.0s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                            scoringLastPos.element.style.transform = 'translateY(0px)';
                            scoringLastPos.element.classList.add('player-updating');
                            
                            setTimeout(() => {
                                scoringLastPos.element.style.transition = '';
                                scoringLastPos.element.style.transform = '';
                                scoringLastPos.element.style.zIndex = '';
                                scoringLastPos.element.classList.remove('player-updating');
                                
                                this.isAnimating = false;
                                setTimeout(() => {
                                    this.showScorePopup(scoringPlayer, trigger.score);
                                }, 200);
                            }, 2000);
                        }, 50);
                        
                        return;
                    }
                }
                
                // Fallback: just highlight
                this.isAnimating = false;
                setTimeout(() => {
                    this.showScorePopup(scoringPlayer, trigger.score);
                }, 200);
                return;
            }
            
            // FLIP: Play - Animate to final positions
            console.log('🎬 FLIP Step 4: Playing animations...');
            this.playAnimations(animations, trigger);
            
        } catch (error) {
            console.error('❌ Error in performFLIPAnimation:', error);
            this.isAnimating = false;
            // Still show popup even if animation fails
            setTimeout(() => {
                const player = this.players.find(p => p.id == trigger.playerId);
                this.showScorePopup(player, trigger.score);
            }, 200);
        }
    }

    updateLeaderboardPositionsOnly() {
        console.log('🔄 Reordering DOM elements for new positions...');
        const leaderboardList = document.getElementById('leaderboardList');

        // Sort players by NEW scores (target order)
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        console.log('📋 Target DOM order:', sortedPlayers.map(p => `${p.name}: ${p.totalScore}`));

        // Create a document fragment to hold the reordered elements
        const fragment = document.createDocumentFragment();
        
        // Add elements in the new order
        sortedPlayers.forEach((player, targetIndex) => {
            const row = leaderboardList.querySelector(`[data-player-id="${player.id}"]`);
            if (row) {
                console.log(`↕️ Moving ${player.name} to position ${targetIndex}`);
                fragment.appendChild(row); // Remove from current position and add to fragment
            } else {
                console.warn(`⚠️ Could not find DOM element for player ${player.id} (${player.name})`);
            }
        });
        
        // Add all reordered elements back to the leaderboard
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
                    index: index
                };
                positions.set(playerId, position);
                
                console.log(`📍 Player ${playerId} at:`, {
                    domIndex: index,
                    top: Math.round(rect.top),
                    left: Math.round(rect.left)
                });
            }
        });
        
        return positions;
    }

    calculateInversions(firstPositions, lastPositions, scoringPlayerId) {
        const animations = [];
        
        console.log('🧮 Calculating inversions...');
        console.log('📊 First positions:', Array.from(firstPositions.keys()));
        console.log('📊 Last positions:', Array.from(lastPositions.keys()));
        
        for (const [playerId, lastPos] of lastPositions) {
            const firstPos = firstPositions.get(playerId);
            if (!firstPos) {
                console.log(`⚠️ No first position found for player ${playerId}`);
                continue;
            }

            const deltaX = firstPos.left - lastPos.left;
            const deltaY = firstPos.top - lastPos.top;
            const indexChanged = firstPos.index !== lastPos.index;

            console.log(`🔍 Player ${playerId}:`, {
                deltaX: Math.round(deltaX),
                deltaY: Math.round(deltaY),
                oldIndex: firstPos.index,
                newIndex: lastPos.index,
                indexChanged,
                shouldAnimate: Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1 || indexChanged
            });

            // Animate if there's ANY movement or index change
            if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1 || indexChanged) {
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
                    oldIndex: firstPos.index,
                    newIndex: lastPos.index
                });
            } else {
                console.log(`❌ No animation needed for player ${playerId}`);
            }
        }
        
        console.log(`🎬 Total animations prepared: ${animations.length}`);
        return animations;
    }

    playAnimations(animations, trigger) {
        console.log('🎭 Playing', animations.length, 'animations');
        
        // Start the animations
        animations.forEach(({ element, playerId, isScoring, deltaX, deltaY, oldIndex, newIndex }) => {
            console.log(`🎬 Starting animation for ${playerId}: ${Math.round(deltaX)}px, ${Math.round(deltaY)}px`);
            
            // Long, smooth transition for dramatic effect
            element.style.transition = 'all 4.0s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            element.style.transform = 'translate(0px, 0px)';
            element.style.zIndex = '1';
            
            if (isScoring) {
                element.classList.add('player-updating');
                console.log(`⭐ Highlighting scoring player: ${playerId}`);
            }
        });

        console.log('⏰ Animation will complete in 4 seconds...');

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
            
            // Show popup after movement animation
            setTimeout(() => {
                const player = this.players.find(p => p.id == trigger.playerId);
                console.log('🎉 Showing score popup for:', player?.name);
                this.showScorePopup(player, trigger.score);
            }, 300);
            
        }, 4000);
    }

    showScorePopup(player, score) {
        console.log('🎉 Showing score popup for:', player?.name, 'Score:', score);
        
        const overlay = document.getElementById('animationOverlay');
        const animation = document.getElementById('scoreAnimation');
        const photoElement = document.getElementById('animationPlayerPhoto');
        const nameElement = document.getElementById('animationPlayerName');
        const scoreElement = document.getElementById('animationScore');
        const rankElement = document.getElementById('animationRank');

        // Set photo and name
        if (player.photo) {
            photoElement.className = 'player-photo-popup-container'; // Change the container class
            photoElement.innerHTML = `<img src="${player.photo}" alt="${player.name}" class="player-photo-popup">`;
        } else {
            photoElement.className = 'player-photo-popup-container';
            photoElement.innerHTML = `<div class="player-photo-popup default">👑</div>`;
        }

        nameElement.textContent = player.name;
        scoreElement.textContent = `+${score} punten`;
        
        // Calculate rank
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        const rank = sortedPlayers.findIndex(p => p.id === player.id) + 1;
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
                // NOW update the leaderboard content with new scores
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
        console.log('🔇 Silent leaderboard update');
        const leaderboardList = document.getElementById('leaderboardList');
        
        // Sort players by total score
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        
        // Clear and rebuild with updated scores
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
        if (!this.isAnimating && !this.isRoundAnimating) {
            this.updateLeaderboard();
        }
        document.getElementById('currentRound').textContent = this.currentRound;
    }

    updateLeaderboard() {
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

console.log('📺 Display page loaded - Enhanced debugging enabled!');
console.log('🔧 Test functions: testConfetti(), testFLIPAnimation(), testRoundAnimation()');
