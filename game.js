const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game states
const GAME_STATE = {
    NAME_ENTRY: 'nameEntry',
    WELCOME: 'welcome',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

// Game variables
let currentState = GAME_STATE.NAME_ENTRY;
let score = 0;

// Bird object
const bird = {
    x: 50,
    y: canvas.height / 2,
    velocity: 0,
    width: 30,
    height: 30
};

// Game constants
const GRAVITY = 0.5;
const FLAP_SPEED = -8;
const PIPE_SPEED = 2;
const PIPE_SPAWN_INTERVAL = 1800;
const PIPE_GAP = 180;
const PIPE_WIDTH = 52;
const PIPE_HEAD_HEIGHT = 24;  // Height of pipe's end cap

// Pipes array
let pipes = [];

// Add at the top with other constants
const birdImage = new Image();
const pipeImage = new Image();

birdImage.src = 'bird.png';
pipeImage.src = 'pipe-green.png';

// Add error handling for images
birdImage.onerror = function() {
    console.error('Error loading bird image');
    birdImage.failed = true;
};

pipeImage.onerror = function() {
    console.error('Error loading pipe image');
    pipeImage.failed = true;
};

// Create new pipe
function createPipe() {
    if (currentState === GAME_STATE.PLAYING) {
        const gapPosition = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
        pipes.push({
            x: canvas.width,
            topHeight: gapPosition,
            bottomY: gapPosition + PIPE_GAP,
            scored: false,
            width: PIPE_WIDTH
        });
    }
}

// Game initialization
function init() {
    currentState = GAME_STATE.NAME_ENTRY;
    resetGame();
    setInterval(createPipe, PIPE_SPAWN_INTERVAL);
    requestAnimationFrame(gameLoop);
}

// Reset game
function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    score = 0;
}

// Add visual constants
const GROUND_HEIGHT = 100;
const GROUND_SPEED = 2;
let groundOffset = 0;

// Add score effect array
let scoreEffects = [];

// Update draw function
function draw() {
    // Clear canvas with gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4BB6EF');  // Light blue at top
    gradient.addColorStop(1, '#89CFF0');  // Darker blue at bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw scrolling ground
    const grassGradient = ctx.createLinearGradient(0, canvas.height - GROUND_HEIGHT, 0, canvas.height);
    grassGradient.addColorStop(0, '#90EE90');  // Light green
    grassGradient.addColorStop(1, '#228B22');  // Dark green
    ctx.fillStyle = grassGradient;
    
    // Draw two ground segments for seamless scrolling
    for (let i = 0; i < 2; i++) {
        ctx.fillRect(
            -groundOffset + i * canvas.width, 
            canvas.height - GROUND_HEIGHT,
            canvas.width,
            GROUND_HEIGHT
        );
        
        // Add grass detail
        ctx.fillStyle = '#006400';
        for (let x = 0; x < canvas.width; x += 30) {
            const grassX = (-groundOffset + i * canvas.width + x) % canvas.width;
            ctx.beginPath();
            ctx.moveTo(grassX, canvas.height - GROUND_HEIGHT);
            ctx.lineTo(grassX + 15, canvas.height - GROUND_HEIGHT - 10);
            ctx.lineTo(grassX + 30, canvas.height - GROUND_HEIGHT);
            ctx.fill();
        }
    }

    // Draw score effects
    scoreEffects = scoreEffects.filter(effect => {
        effect.y -= 2;  // Move up
        effect.opacity -= 0.02;  // Fade out
        
        if (effect.opacity > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${effect.opacity})`;
            ctx.font = 'bold 24px Arial';
            ctx.fillText('+1', effect.x, effect.y);
            return true;
        }
        return false;
    });

    // Draw bird with shadow
    ctx.save();
    if (!birdImage.failed) {
        // Add shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.drawImage(birdImage, bird.x, bird.y, bird.width, bird.height);
    } else {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
    }
    ctx.restore();

    // Draw pipes with enhanced style
    pipes.forEach(pipe => {
        if (pipeImage.failed) {
            // Enhanced Mario-style pipes
            const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
            pipeGradient.addColorStop(0, '#208838');
            pipeGradient.addColorStop(0.5, '#30C040');
            pipeGradient.addColorStop(1, '#208838');
            ctx.fillStyle = pipeGradient;
            
            // Top pipe
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
            // Bottom pipe
            ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY);
            
            // Pipe caps
            ctx.fillStyle = '#145828';
            ctx.fillRect(pipe.x - 3, pipe.topHeight - PIPE_HEAD_HEIGHT, PIPE_WIDTH + 6, PIPE_HEAD_HEIGHT);
            ctx.fillRect(pipe.x - 3, pipe.bottomY, PIPE_WIDTH + 6, PIPE_HEAD_HEIGHT);
        } else {
            // Use pipe image with shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 5;
            
            // Draw pipes with images
            ctx.drawImage(pipeImage, pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY);
            
            // Draw flipped top pipe
            ctx.translate(pipe.x + PIPE_WIDTH/2, pipe.topHeight);
            ctx.scale(1, -1);
            ctx.drawImage(pipeImage, -PIPE_WIDTH/2, 0, PIPE_WIDTH, pipe.topHeight);
            ctx.restore();
        }
    });

    // Draw UI based on game state
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';

    switch (currentState) {
        case GAME_STATE.NAME_ENTRY:
            ctx.fillText("Welcome to Joyce's Flappy Bird!", canvas.width/2, canvas.height/3);
            ctx.fillText('Please Enter Your Name:', canvas.width/2, canvas.height/2 - 30);
            
            // Draw input box
            const inputWidth = 200;
            const inputHeight = 30;
            const inputX = canvas.width/2 - inputWidth/2;
            const inputY = canvas.height/2 - 10;
            
            ctx.strokeStyle = 'white';
            ctx.strokeRect(inputX, inputY, inputWidth, inputHeight);
            
            ctx.fillText(playerName + '|', canvas.width/2, canvas.height/2 + 15);
            ctx.fillText('Press Enter to Start', canvas.width/2, canvas.height/2 + 45);
            break;

        case GAME_STATE.WELCOME:
            ctx.fillText(`Welcome ${playerName}!`, canvas.width/2, canvas.height/3);
            ctx.fillText('Click or Press Space to Start', canvas.width/2, canvas.height/2);
            break;

        case GAME_STATE.PLAYING:
            ctx.textAlign = 'left';
            ctx.fillText(`Player: ${playerName}`, 10, 30);
            ctx.fillText(`Score: ${score}`, 10, 60);
            break;

        case GAME_STATE.GAME_OVER:
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', canvas.width/2, canvas.height/4);
            ctx.fillText(`${playerName}'s Final Score: ${score}`, canvas.width/2, canvas.height/3);
            
            // Display high scores
            const highScores = getHighScores();
            if (highScores.length > 0) {
                ctx.fillText('High Scores:', canvas.width/2, canvas.height/2);
                highScores.forEach((highScore, index) => {
                    ctx.fillText(
                        `${index + 1}. ${highScore.name} - ${highScore.score} (${highScore.date})`,
                        canvas.width/2,
                        canvas.height/2 + 30 * (index + 1)
                    );
                });
            }
            ctx.fillText('Click or Press Space to Restart', canvas.width/2, canvas.height - 50);
            break;
    }
}

// Update game loop
function update() {
    if (currentState !== GAME_STATE.PLAYING) return;

    // Update ground scroll
    groundOffset = (groundOffset + GROUND_SPEED) % canvas.width;

    // Existing update code...
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Check ground collision
    if (bird.y + bird.height > canvas.height - GROUND_HEIGHT) {
        bird.y = canvas.height - GROUND_HEIGHT - bird.height;
        currentState = GAME_STATE.GAME_OVER;
        return;
    }

    // Check top collision
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }

    // Update pipes and check collisions
    pipes.forEach(pipe => {
        pipe.x -= PIPE_SPEED;

        if (bird.x + bird.width > pipe.x && bird.x < pipe.x + PIPE_WIDTH) {
            if (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY) {
                currentState = GAME_STATE.GAME_OVER;
            }
        }

        // Add score effect when passing pipe
        if (pipe.x + PIPE_WIDTH < bird.x && !pipe.scored) {
            score++;
            pipe.scored = true;
            // Add score effect
            scoreEffects.push({
                x: bird.x + bird.width + 20,
                y: bird.y,
                opacity: 1
            });
        }
    });

    // Remove off-screen pipes
    pipes = pipes.filter(pipe => pipe.x > -PIPE_WIDTH);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Handle input
function handleInput() {
    switch (currentState) {
        case GAME_STATE.WELCOME:
            currentState = GAME_STATE.PLAYING;
            break;

        case GAME_STATE.PLAYING:
            bird.velocity = FLAP_SPEED;
            break;

        case GAME_STATE.GAME_OVER:
            if (score > 0) {
                saveHighScore(playerName, score);
            }
            currentState = GAME_STATE.WELCOME;
            resetGame();
            break;
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (currentState === GAME_STATE.NAME_ENTRY) {
        if (e.key === 'Enter' && playerName.trim()) {
            currentState = GAME_STATE.WELCOME;
        } else if (e.key === 'Backspace') {
            playerName = playerName.slice(0, -1);
            e.preventDefault();
        } else if (e.key.length === 1 && playerName.length < 15) {
            playerName += e.key;
        }
        e.preventDefault();
    } else if (e.code === 'Space') {
        handleInput();
    }
});

canvas.addEventListener('click', () => {
    if (currentState !== GAME_STATE.NAME_ENTRY) {
        handleInput();
    }
});

// Add ranking system constants
const MAX_HIGH_SCORES = 5;
const HIGH_SCORES_KEY = 'flappyBirdHighScores';
let playerName = '';
let isEnteringName = false;

// Add function to get high scores
function getHighScores() {
    try {
        const scores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY) || '[]');
        return Array.isArray(scores) ? scores : [];
    } catch (e) {
        console.error('Error loading high scores:', e);
        return [];
    }
}

// Add function to save high score
function saveHighScore(name, score) {
    try {
        let highScores = getHighScores();
        
        // Add new score
        highScores.push({
            name: name || 'Anonymous',
            score: score,
            date: new Date().toLocaleDateString()
        });
        
        // Sort by score (highest first)
        highScores.sort((a, b) => b.score - a.score);
        
        // Keep only top scores
        highScores = highScores.slice(0, MAX_HIGH_SCORES);
        
        // Save to localStorage
        localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores));
        
        return highScores;
    } catch (e) {
        console.error('Error saving high score:', e);
        return [];
    }
}

// Start the game
init(); 