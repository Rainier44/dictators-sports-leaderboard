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
        // Check if there's a pending animation trigger that we haven't processed yet
        const animationTrigger = localStorage.getItem('animationTrigger');
        if (animationTrigger) {
            try {
                const trigger = JSON.parse(animationTrigger);
                if (trigger.timestamp > this.lastAnimationTimestamp) {
                    console.log('⏳ Animation pending - blocking regular update');
                    return; // Don't update until animation is processed
                }
            } catch (_) {
                localStorage.removeItem('animationTrigger');
            }
        }

        // Check if there's a pending round animation trigger
        const roundTrigger = localStorage.getItem('roundAnimationTrigger');
        if (roundTrigger) {
            try {
                const trigger = JSON.parse(roundTrigger);
                if (trigger.timestamp > this.lastRoundAnimationTimestamp) {
                    console.log('⏳ Round animation pending - blocking regular update');
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
                
                if (trigger.timestamp > this.lastRoundAnimationTimestamp) {
                    this.lastRoundAnimationTimestamp = trigger.timestamp;
                    console.log('🎬 Round animation trigger received');
                    
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
        
        console.log('🎯 Selected GIF:', selectedGif);
        
        // Move to next index for next time
        this.gifIndex = (this.gifIndex + 1) % this.availableGifs.length;
        
        // Save both the new index and the selected GIF
        localStorage.setItem('currentGifIndex', this.gifIndex.toString());
        localStorage.setItem('lastUsedGif', selectedGif);
        
        return selectedGif;
    }

    checkForAnimationTrigger() {
        const triggerData = localStorage.getItem('animationTrigger');
        if (triggerData && !this.isAnimating && !this.isRoundAnimating) {
            try {
                const trigger = JSON.parse(triggerData);
                
                if (trigger.timestamp > this.lastAnimationTimestamp) {
                    this.lastAnimationTimestamp = trigger.timestamp;
                    console.log('🎬 Animation trigger received for:', trigger.playerName);
                    
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
            
            console.log('🎭 Starting ocean split animation for:', trigger.playerName);
            this.isAnimating = true;
            
            // Step 1: Get fresh data from localStorage
            const currentData = JSON.parse(localStorage.getItem('sportsLeaderboard'));
            if (!currentData || !currentData.players) {
                console.error('❌ No data found in localStorage');
                this.isAnimating = false;
                return;
            }

            // Step 2: Update our internal data to match localStorage
            this.players = currentData.players;
            
            // Step 3: Find the scoring player in the NEW data
            const scoringPlayer = this.players.find(p => p.id == trigger.playerId);
            if (!scoringPlayer) {
                console.error('❌ Could not find scoring player in new data');
                this.isAnimating = false;
                return;
            }
            
            // Step 4: Calculate new ranking based on NEW data
            const newRanking = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
            
            // Step 5: Find the scoring player's NEW position in the ranking
            const newPosition = newRanking.findIndex(p => p.id == trigger.playerId);
            const actualRank = newPosition + 1;
            
            console.log(`🎯 Player ${scoringPlayer.name} new rank: ${actualRank} (score: ${scoringPlayer.totalScore})`);
            
            // Step 6: Calculate target position WITHOUT changing DOM yet
            const targetPosition = this.calculateTargetPositionInCurrentDOM(trigger.playerId, actualRank);
            
            if (!targetPosition) {
                console.log('⚠️ Could not calculate target position - falling back to highlight');
                this.highlightPlayerAndShowPopup(scoringPlayer, trigger.score, actualRank);
                return;
            }
            
            // Step 7: Perform the ocean split animation
            this.performOceanSplitAnimation(trigger, scoringPlayer, targetPosition, actualRank, newRanking);
            
        } catch (error) {
            console.error('❌ Error in performFLIPAnimation:', error);
            this.isAnimating = false;
            // Fallback with fresh calculation
            setTimeout(() => {
                const freshData = JSON.parse(localStorage.getItem('sportsLeaderboard'));
                const freshRanking = [...freshData.players].sort((a, b) => b.totalScore - a.totalScore);
                const freshPosition = freshRanking.findIndex(p => p.id == trigger.playerId) + 1;
                const player = freshData.players.find(p => p.id == trigger.playerId);
                this.showScorePopup(player, trigger.score, freshPosition);
            }, 200);
        }
    }

    calculateTargetPositionInCurrentDOM(playerId, newRank) {
        const leaderboardList = document.getElementById('leaderboardList');
        const allElements = Array.from(leaderboardList.children);
        const scoringElement = leaderboardList.querySelector(`[data-player-id="${playerId}"]`);
        
        if (!scoringElement) {
            console.error('❌ Could not find scoring element');
            return null;
        }
        
        const currentRect = scoringElement.getBoundingClientRect();
        
        // Find where to position the player (between the elements at newRank-1 and newRank)
        let targetY;
        
        if (newRank === 1) {
            // Moving to first position - go above the current first element
            const firstElement = allElements[0];
            const firstRect = firstElement.getBoundingClientRect();
            targetY = firstRect.top;
        } else if (newRank > allElements.length) {
            // Moving to last position - go below the current last element
            const lastElement = allElements[allElements.length - 1];
            const lastRect = lastElement.getBoundingClientRect();
            targetY = lastRect.bottom;
        } else {
            // Moving to middle position - go between the elements
            const beforeElement = allElements[newRank - 2]; // Element that will be above
            const afterElement = allElements[newRank - 1];  // Element that will be below
            
            const beforeRect = beforeElement.getBoundingClientRect();
            const afterRect = afterElement.getBoundingClientRect();
            
            // Position between them
            targetY = beforeRect.bottom + ((afterRect.top - beforeRect.bottom) / 2);
        }
        
        const deltaX = 0; // No horizontal movement
        const deltaY = targetY - currentRect.top;
        
        console.log(`🎯 Target: rank ${newRank}, deltaY: ${Math.round(deltaY)}px`);
        
        return {
            deltaX,
            deltaY,
            targetY
        };
    }

    performOceanSplitAnimation(trigger, scoringPlayer, targetPosition, actualRank, finalRanking) {
        const leaderboardList = document.getElementById('leaderboardList');
        const scoringElement = leaderboardList.querySelector(`[data-player-id="${trigger.playerId}"]`);

        console.log('🔍 Debug - Animation starting with:', {
            playerId: trigger.playerId,
            playerName: trigger.playerName,
            score: trigger.score,
            actualRank,
            deltaY: targetPosition.deltaY,
            scoringPlayerScore: scoringPlayer.totalScore
        });
        
        if (!scoringElement) {
            console.error('❌ Could not find scoring player element');
            this.isAnimating = false;
            return;
        }
        
        console.log('🌊 Phase 1: Player swims to target position');
        
        // Find current position of scoring player to determine who should move
        const allElements = Array.from(leaderboardList.children);
        const currentPosition = allElements.findIndex(el => el.getAttribute('data-player-id') == trigger.playerId) + 1;
        
        console.log(`Player moving from position ${currentPosition} to position ${actualRank}`);
        
        // Phase 1: Move the scoring player to their target position (no space yet)
        scoringElement.style.transition = 'none';
        scoringElement.style.transform = 'translate(0px, 0px)';
        scoringElement.style.zIndex = '30'; // High z-index to go over others
        scoringElement.classList.add('player-updating');
        
        // Force reflow
        scoringElement.offsetHeight;
        
        // Calculate timing based on distance for physics-like movement
        const distance = Math.abs(targetPosition.deltaY);
        const minTime = 2.0; // minimum animation time (seconds)
        const maxTime = 5.0; // maximum animation time (seconds)
        const baseSpeed = 100; // pixels per second

        // Calculate time based on distance, but keep it within reasonable bounds
        let animationTime = Math.max(minTime, Math.min(maxTime, distance / baseSpeed));

        // Use a custom cubic-bezier that simulates acceleration -> constant -> deceleration
        // This bezier starts slow, speeds up quickly, stays fast, then slows down at the end
        const physicsEasing = 'cubic-bezier(0.05, 0, 0.95, 1)';

        console.log(`🏃‍♂️ Player movement: ${animationTime.toFixed(2)}s for ${distance}px distance`);

        // Start the movement to target position
        scoringElement.style.transition = `transform ${animationTime}s ${physicsEasing}`;
        scoringElement.style.transform = `translate(${targetPosition.deltaX}px, ${targetPosition.deltaY}px)`;
        
        // Phase 2: After player reaches position, smoothly split the ocean AT DESTINATION ONLY
        setTimeout(() => {
            console.log('🌊 Phase 2: Smoothly splitting the ocean at destination');
            
            // Only move elements that are at or after the DESTINATION position
            // AND only if the player is moving UP in the rankings (to a lower position number)
            const elementsToMoveDown = [];
            
            if (actualRank < currentPosition) {
                // Player is moving up - need to make space at destination
                allElements.forEach((element, index) => {
                    const elementPlayerId = element.getAttribute('data-player-id');
                    const elementPosition = index + 1;
                    
                    // Skip the scoring player
                    if (elementPlayerId == trigger.playerId) {
                        return;
                    }
                    
                    // Only move elements at or after the DESTINATION position
                    if (elementPosition >= actualRank && elementPosition < currentPosition) {
                        elementsToMoveDown.push({
                            element: element,
                            playerId: elementPlayerId,
                            currentIndex: index
                        });
                    }
                });
            }
            // If player is moving down (actualRank > currentPosition), no elements need to move
            
            console.log(`🌊 Moving ${elementsToMoveDown.length} elements down to make space`);
            
            if (elementsToMoveDown.length > 0) {
                // Calculate row height for smooth movement
                const rowHeight = scoringElement.getBoundingClientRect().height + 10; // 10px for margin
                
                // Smoothly animate elements moving down
                elementsToMoveDown.forEach(({ element, playerId }) => {
                    element.style.transition = 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    element.style.transform = `translateY(${rowHeight}px)`;
                    element.style.zIndex = '5';
                });
            }
            
            // Phase 3: After the ocean has split, update DOM and settle player
            setTimeout(() => {
                console.log('🌊 Phase 3: Settling into final position');
                
                // First, get a reference to the scoring element before DOM update
                const currentScoringElement = leaderboardList.querySelector(`[data-player-id="${trigger.playerId}"]`);
                
                // Update DOM to final order (this will put everything in correct positions)
                this.updateLeaderboardDOM(finalRanking);
                
                // Get the scoring element after DOM update (it might be a different element now)
                const newScoringElement = leaderboardList.querySelector(`[data-player-id="${trigger.playerId}"]`);
                
                // Reset all transforms for other elements since DOM is now correct
                elementsToMoveDown.forEach(({ element }) => {
                    // Only reset if the element still exists in the DOM
                    if (element.parentNode) {
                        element.style.transition = 'transform 0.5s ease-out';
                        element.style.transform = 'translateY(0px)';
                    }
                });
                
                // For the scoring element, we need to handle it carefully
                if (newScoringElement) {
                    // Clear any existing transforms and transitions immediately
                    newScoringElement.style.transition = 'none';
                    newScoringElement.style.transform = 'translate(0px, 0px)';
                    newScoringElement.style.zIndex = '';
                    newScoringElement.classList.remove('player-updating');
                    
                    // Force reflow to ensure the reset takes effect
                    newScoringElement.offsetHeight;
                }
                
            }, (animationTime * 1000) + 1200); // Wait for ocean split animation to complete
            
        }, (animationTime * 1000) - 200);
        
        // Phase 4: Final cleanup and show popup
       setTimeout(() => {
            console.log('🌊 Phase 4: Cleanup and show popup');
            
            // Clean up all remaining transforms and transitions
            const allElementsAfter = Array.from(leaderboardList.children);
            allElementsAfter.forEach((element) => {
                element.style.transition = '';
                element.style.transform = '';
                element.style.zIndex = '';
                element.classList.remove('player-updating');
            });
            
            this.isAnimating = false;
            console.log('✅ Smooth ocean split animation completed');
            
            // Show popup immediately since the player is now in the correct position
            this.showScorePopup(scoringPlayer, trigger.score, actualRank);
            
        }, (animationTime * 1000) + 1500); // Give a bit more time for everything to settle
    }

    updateLeaderboardDOM(sortedPlayers) {
        const leaderboardList = document.getElementById('leaderboardList');

        // Store current DOM order before reordering
        const currentOrder = Array.from(leaderboardList.children).map(el => el.getAttribute('data-player-id'));
        
        // Create the new order based on sorted players
        const newOrder = sortedPlayers.map(player => String(player.id));
        
        // Check if reordering is actually needed
        const needsReordering = !currentOrder.every((id, index) => id === newOrder[index]);
        
        if (!needsReordering) {
            return;
        }
        
        // Clear and rebuild in correct order
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
                fragment.appendChild(element);
            }
        });
        
        // Add all elements back at once
        leaderboardList.appendChild(fragment);
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

        console.log(`🎉 Showing popup: ${player.name} at rank ${rank}`);

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
        const leaderboardList = document.getElementById('leaderboardList');
        if (!leaderboardList) {
            console.error('❌ leaderboardList element not found!');
            return;
        }
        
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
        if (typeof confetti === 'undefined') {
            console.error('❌ Canvas-confetti library not loaded!');
            return;
        }

        // Fire confetti from multiple angles for dramatic effect
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

// Test functions for debugging
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

console.log('📺 Display page loaded!');
console.log('🔧 Test functions: testConfetti(), testFLIPAnimation(), testRoundAnimation()');