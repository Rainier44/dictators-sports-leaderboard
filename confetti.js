// Add this confetti function to your script.js file

function createConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);
    
    // Create confetti pieces from both bottom corners
    for (let i = 0; i < 50; i++) {
        createConfettiPiece(confettiContainer, 'left');
        createConfettiPiece(confettiContainer, 'right');
    }
    
    // Remove confetti container after animation
    setTimeout(() => {
        document.body.removeChild(confettiContainer);
    }, 3000);
}

function createConfettiPiece(container, side) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // Position from bottom corners
    if (side === 'left') {
        confetti.style.left = Math.random() * 20 + '%';
    } else {
        confetti.style.left = Math.random() * 20 + 80 + '%';
    }
    
    confetti.style.bottom = '0px';
    
    // Random delay for staggered effect
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    
    // Random size variation
    const size = Math.random() * 8 + 6;
    confetti.style.width = size + 'px';
    confetti.style.height = size + 'px';
    
    container.appendChild(confetti);
}

// To trigger confetti, add this to your scoring logic:
// Call createConfetti() when someone reaches first place!