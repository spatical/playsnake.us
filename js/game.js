const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to fill the screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Generate random gradient colors for snake
const gradientColors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3'];
let gradientIndex = Math.floor(Math.random() * gradientColors.length);
let snakeGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
snakeGradient.addColorStop(0, gradientColors[gradientIndex]);
snakeGradient.addColorStop(1, gradientColors[(gradientIndex + 1) % gradientColors.length]);

let backgroundColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
document.body.style.backgroundColor = backgroundColor;

// Snake and game settings
const snakeSize = 20;
let snake = [
    { x: 100, y: 50 },
    { x: 80, y: 50 },
    { x: 60, y: 50 },
    { x: 40, y: 50 },
    { x: 20, y: 50 },
];
let direction = 'right';
let food = generateRandomPosition(snakeSize);
let score = 0;
let topScore = parseInt(localStorage.getItem('snakeTopScore')) || 0;
let gamesPlayed = parseInt(localStorage.getItem('snakeGamesPlayed')) || 0;

// Implementing different bonus items
const bonuses = [
    { type: 'speed', duration: 5000, emoji: '⚡' },
    { type: 'slow', duration: 5000, emoji: '🐌' },
    { type: 'shrink', duration: 25000, emoji: '🦅' },
    { type: 'grow', duration: 25000, emoji: '🐁' },
    { type: 'invader', duration: 5000, emoji: '👾' },
    { type: 'regenWalls', duration: 0, emoji: '🧱' },
    { type: 'regenColors', duration: 0, emoji: '🎨' }
];

let activeBonus = null;
let bonusTimeout = null;
let bonus = generateRandomBonus();

// Function to generate random bonus item
function generateRandomBonus() {
    return {
        x: Math.floor(Math.random() * (canvas.width / snakeSize)) * snakeSize,
        y: Math.floor(Math.random() * (canvas.height / snakeSize)) * snakeSize,
        ...bonuses[Math.floor(Math.random() * bonuses.length)]
    };
}

// Function to draw the bonus item
function drawBonus() {
    if (bonus) {
        ctx.font = '20px Arial';
        ctx.fillText(bonus.emoji, bonus.x, bonus.y + 20);
    }
}

// Space invader settings
let invaders = [];
const invaderSpeed = 1;

// Function to generate random invaders
function generateInvaders() {
    invaders = [];
    for (let i = 0; i < 5; i++) {
        invaders.push({ 
            x: Math.floor(Math.random() * (canvas.width / snakeSize)) * snakeSize,
            y: 0
        });
    }
}

// Function to draw invaders
function drawInvaders() {
    ctx.font = '20px Arial';
    invaders.forEach(invader => {
        ctx.fillText('👾', invader.x, invader.y + 20);
    });
}

// Function to update invaders' position
function updateInvaders() {
    invaders.forEach(invader => {
        invader.y += invaderSpeed;
    });
}

// Function to apply the bonus effect
function applyBonus() {
    switch (bonus.type) {
        case 'speed':
            clearInterval(gameLoopInterval);
            gameLoopInterval = setInterval(gameLoop, 50);
            break;
        case 'slow':
            clearInterval(gameLoopInterval);
            gameLoopInterval = setInterval(gameLoop, 200);
            break;
        case 'shrink':
            snake.pop();
            break;
        case 'grow':
            for (let i = 0; i < 5; i++) {
                snake.push({ ...snake[snake.length - 1] });
            }
            break;
        case 'invader':
            generateInvaders();
            break;
        case 'regenWalls':
            generateWalls();
            break;
        case 'regenColors':
            regenerateColors();
            break;
    }

    activeBonus = bonus;
    if (bonus.duration > 0) {
        clearTimeout(bonusTimeout);
        bonusTimeout = setTimeout(clearBonus, bonus.duration);
    } else {
        clearBonus();
    }
}

// Function to clear the bonus effect
function clearBonus() {
    if (activeBonus && (activeBonus.type === 'speed' || activeBonus.type === 'slow')) {
        clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameLoop, 100);
    }
    activeBonus = null;
}

// Function to generate random position
function generateRandomPosition(size) {
    return { 
        x: Math.floor(Math.random() * (canvas.width / size)) * size,
        y: Math.floor(Math.random() * (canvas.height / size)) * size
    };
}

// Generate walls
let walls = [];
function generateWalls() {
    walls = [];
    const numWalls = Math.floor(Math.random() * 6) + 3;
    for (let i = 0; i < numWalls; i++) {
        generateRandomWall();
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    drawBonus();
    if (activeBonus && activeBonus.type === 'invader') {
        updateInvaders();
        drawInvaders();
        if (checkCollisions(snake[0], invaders, snakeSize)) {
            alert('Game Over. You were hit by an invader!');
            endGame();
        }
    }
}

function moveSnake() {
    const head = { ...snake[0] };
    switch (direction) {
        case 'right': head.x += snakeSize; break;
        case 'left': head.x -= snakeSize; break;
        case 'up': head.y -= snakeSize; break;
        case 'down': head.y += snakeSize; break;
    }

    // Wrap snake around the edges
    if (head.x >= canvas.width) head.x = 0;
    if (head.x < 0) head.x = canvas.width - snakeSize;
    if (head.y >= canvas.height) head.y = 0;
    if (head.y < 0) head.y = canvas.height - snakeSize;

    snake.unshift(head);
    return head;
}

function generateBonus() {
    bonus = generateRandomBonus();
    if (bonusTimeout) {
        clearTimeout(bonusTimeout);
    }
    bonusTimeout = setTimeout(() => {
        bonus = null;
    }, 15000);
}

// Call generateBonus every 5 seconds
setInterval(generateBonus, 5000);

// Update snake and game state
function update() {
    const head = moveSnake();
    
    // Check for food collision
    if (isCollision(head, food, snakeSize)) {
        score += 10;
        food = generateRandomPosition(snakeSize);
    } else {
        snake.pop();
    }

    // Check for bonus collision
    if (bonus && isCollision(head, bonus, snakeSize)) {
        applyBonus();
        bonus = null;
        if (bonusTimeout) {
            clearTimeout(bonusTimeout);
            bonusTimeout = null;
        }
    }

    // Check for wall collision
    if (checkCollisions(head, walls, snakeSize) || isSelfCollision(snake, snakeSize)) {
        endGame();
    }
}

// Function to handle game over
function endGame() {
    gamesPlayed++;
    localStorage.setItem('snakeGamesPlayed', gamesPlayed);
    if (score > topScore) {
        topScore = score;
        localStorage.setItem('snakeTopScore', topScore);
    }
    alert(`Game Over. Current Score: ${score}, Top Score: ${topScore}, Games Played: ${gamesPlayed}`);
    resetGame();
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = snakeGradient;
    
    snake.forEach((segment, index) => {
        if (index === 0) {
            ctx.beginPath();
            if (direction === 'right') {
                ctx.arc(segment.x + snakeSize, segment.y + snakeSize / 2, snakeSize / 2, -Math.PI / 2, Math.PI / 2);
                ctx.lineTo(segment.x, segment.y + snakeSize);
                ctx.lineTo(segment.x, segment.y);
            } else if (direction === 'left') {
                ctx.arc(segment.x, segment.y + snakeSize / 2, snakeSize / 2, Math.PI / 2, -Math.PI / 2);
                ctx.lineTo(segment.x + snakeSize, segment.y);
                ctx.lineTo(segment.x + snakeSize, segment.y + snakeSize);
            } else if (direction === 'up') {
                ctx.arc(segment.x + snakeSize / 2, segment.y, snakeSize / 2, Math.PI, 2 * Math.PI);
                ctx.lineTo(segment.x + snakeSize, segment.y + snakeSize);
                ctx.lineTo(segment.x, segment.y + snakeSize);
            } else if (direction === 'down') {
                ctx.arc(segment.x + snakeSize / 2, segment.y + snakeSize, snakeSize / 2, 0, Math.PI);
                ctx.lineTo(segment.x, segment.y);
                ctx.lineTo(segment.x + snakeSize, segment.y);
            }
            ctx.fill();
            ctx.closePath();
        } else {
            ctx.fillRect(segment.x, segment.y, snakeSize, snakeSize);
        }
    });

    ctx.fillStyle = 'red';
    ctx.fillRect(food.x, food.y, snakeSize, snakeSize);

    // Draw walls
    ctx.fillStyle = 'gray';
    walls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, snakeSize, snakeSize);
    });

    ctx.fillStyle = 'black';
    ctx.font = '20px Comic Sans MS';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillText(`Score: ${score} | Top Score: ${topScore} | Games Played: ${gamesPlayed}`, 10, 20);
}

// Handle keyboard input
window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowRight': if (direction !== 'left') direction = 'right'; break;
        case 'ArrowLeft': if (direction !== 'right') direction = 'left'; break;
        case 'ArrowUp': if (direction !== 'down') direction = 'up'; break;
        case 'ArrowDown': if (direction !== 'up') direction = 'down'; break;
    }
    // Prevent default scrolling behavior for arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
});

function generateRandomWall() {
    const wallSegments = Math.floor(Math.random() * 5) + 3; // Random length between 3 and 7
    const isHorizontal = Math.random() > 0.5; // Random orientation
    const startPosition = generateRandomPosition(snakeSize);
    
    for (let j = 0; j < wallSegments; j++) {
        if (isHorizontal) {
            walls.push({ x: startPosition.x + j * snakeSize, y: startPosition.y });
        } else {
            walls.push({ x: startPosition.x, y: startPosition.y + j * snakeSize });
        }
    }
}

// Function to regenerate colors
function regenerateColors() {
    gradientIndex = Math.floor(Math.random() * gradientColors.length);
    snakeGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    snakeGradient.addColorStop(0, gradientColors[gradientIndex]);
    snakeGradient.addColorStop(1, gradientColors[(gradientIndex + 1) % gradientColors.length]);
    backgroundColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
    document.body.style.backgroundColor = backgroundColor;
}

// Function to reset game
function resetGame() {
    snake = [
        { x: 100, y: 50 },
        { x: 80, y: 50 },
        { x: 60, y: 50 },
        { x: 40, y: 50 },
        { x: 20, y: 50 },
    ];
    direction = 'right';
    score = 0;
    generateWalls();
    regenerateColors();
    food = generateRandomPosition(snakeSize);
    bonus = generateRandomBonus();
    invaders = [];
}

// Mobile touch controls
const mobileKeypad = document.getElementById('mobileKeypad');
const upBtn = document.getElementById('upBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const downBtn = document.getElementById('downBtn');

function handleDirectionChange(newDirection) {
    switch (newDirection) {
        case 'right': if (direction !== 'left') direction = 'right'; break;
        case 'left': if (direction !== 'right') direction = 'left'; break;
        case 'up': if (direction !== 'down') direction = 'up'; break;
        case 'down': if (direction !== 'up') direction = 'down'; break;
    }
}

upBtn.addEventListener('touchstart', () => handleDirectionChange('up'));
leftBtn.addEventListener('touchstart', () => handleDirectionChange('left'));
rightBtn.addEventListener('touchstart', () => handleDirectionChange('right'));
downBtn.addEventListener('touchstart', () => handleDirectionChange('down'));

// Swipe gestures
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, false);

canvas.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, false);

function handleSwipe() {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        handleDirectionChange(diffX > 0 ? 'right' : 'left');
    } else {
        // Vertical swipe
        handleDirectionChange(diffY > 0 ? 'down' : 'up');
    }
}

// Prevent default touch behavior to avoid scrolling
document.body.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Initialize the game
generateWalls();
let gameLoopInterval = setInterval(gameLoop, 100);
