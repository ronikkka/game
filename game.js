const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const healthEl = document.getElementById('health');

let gameState = { running: false, paused: false, score: 0, health: 3 };
let keys = {};

const player = {
    x: 50, y: 500, width: 40, height: 40, speed: 5, vX: 0, vY: 0, grounded: false
};

const platforms = [
    { x: 0, y: 570, width: 800, height: 30 }, 
    { x: 200, y: 450, width: 150, height: 20 },
    { x: 450, y: 350, width: 150, height: 20 },
    { x: 650, y: 250, width: 150, height: 20 }
];

const enemies = [ 
    { x: 300, y: 530, width: 30, height: 30, speed: 2, dir: 1 }
];

const coins = [
    {x: 100, y: 545, width: 20, height: 20, collected: false},
    {x: 250, y: 430, width: 20, height: 20, collected: false},
    {x: 350, y: 400, width: 20, height: 20, collected: false},
    {x: 500, y: 330, width: 20, height: 20, collected: false},
    {x: 650, y: 230, width: 20, height: 20, collected: false},
    {x: 700, y: 200, width: 20, height: 20, collected: false},
    {x: 150, y: 300, width: 20, height: 20, collected: false},
    {x: 550, y: 150, width: 20, height: 20, collected: false},
    {x: 750, y: 100, width: 20, height: 20, collected: false},
    {x: 750, y: 400, width: 20, height: 20, collected: false} 
];

function init() {
    gameState.running = false;
    gameState.paused = false;
    player.x = 50; 
    player.y = 500; 
    player.vX = 0; 
    player.vY = 0; 
    player.grounded = false;
    gameState.score = 0; 
    gameState.health = 3;
    coins.forEach(coin => coin.collected = false);
    enemies[0].x = 300; 
    enemies[0].dir = 1;
    updateUI();
    keys = {};
}

function updateUI() {
    scoreEl.textContent = gameState.score;
    healthEl.textContent = gameState.health;
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function handleCollisions() {
    let onPlatform = false;
    platforms.forEach(p => {
        if (checkCollision(player, p) && player.vY >= 0) {
            onPlatform = true;
            player.y = p.y - player.height;
            player.vY = 0;
        }
    });
    player.grounded = onPlatform;

    enemies.forEach(e => {
        if (checkCollision(player, e)) {
            gameState.health--;
            player.x = 50; player.y = 500; player.vX = 0; player.vY = 0;
            if (gameState.health <= 0) endGame(false);
        }

        e.x += e.speed * e.dir;
        if (e.x <= 200 || e.x >= 500) e.dir *= -1;
    });

    coins.forEach (coin => {
        if (!coin.collected && checkCollision(player, coin)) {
            coin.collected = true;
            gameState.score += 100;
            updateUI();
        }
    });
}

function updatePlayer() {
    player.vX = 0;

    if (
        keys['ArrowLeft'] ||
        keys['a'] || keys['A'] ||
        keys['ф'] || keys['Ф']
    ) {
        player.vX = -player.speed;
    }

    if (
        keys['ArrowRight'] ||
        keys['d'] || keys['D'] ||
        keys['в'] || keys['В']
    ) {
        player.vX = player.speed;
    }

    if (
        (keys['ArrowUp'] ||
         keys['w'] || keys['W'] ||
         keys['ц'] || keys['Ц'] ||
         keys[' ']) &&
        player.grounded
    ) {
        player.vY = -14;
        player.grounded = false;
    }

    if (!player.grounded) player.vY += 0.9;
    player.x += player.vX;
    player.y += player.vY;

    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) {
        player.x = canvas.width - player.width;
        endGame(true);
    }
    if (player.y > canvas.height + 50) endGame(false);

    handleCollisions();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98D8E8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#27AE60';
    platforms.forEach(p => {
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeStyle = '#229954';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.width, p.height);
    });

    enemies.forEach(e => {
        ctx.fillStyle = '#E74C3C';
        ctx.fillRect(e.x, e.y, e.width, e.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(e.x + 5, e.y + 8, 6, 6);
        ctx.fillRect(e.x + 18, e.y + 8, 6, 6);
    });

    coins.forEach(coin => {
        if (!coin.collected) {
            ctx.fillStyle = 'gold';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI*2);
            ctx.fill();
            ctx.strokeStyle = 'orange';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    ctx.fillStyle = '#3498DB';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x + 8, player.y + 10, 6, 6);
    ctx.fillRect(player.x + 25, player.y + 10, 6, 6);
    ctx.fillStyle = 'black';
    ctx.fillRect(player.x + 10, player.y + 12, 2, 2);
    ctx.fillRect(player.x + 27, player.y + 12, 2, 2);
}

let gameLoopId = null;

function gameLoop() {
    console.log('running=', gameState.running);
    if (gameState.running && !gameState.paused) {  
        updatePlayer();
        updateUI();
        draw();
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.fillStyle = '#87CEEB'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '48px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Нажмите СТАРТ', canvas.width/2, canvas.height/2);
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}


function endGame(win) {
    if (win) {
        let timeBonus = Math.max(0, 5000 - gameState.score);
        gameState.score += timeBonus;
        updateUI();
        alert(`Победа! Счёт: ${gameState.score} (+${timeBonus} бонус за скорость)`);
    } else {
        alert(`Поражение! Счёт: ${gameState.score}`);
    }
    gameState.paused = true;
}

function startGameLoop() { 
    gameState.running = true; 
    gameState.paused = false;
}

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

document.getElementById('start').onclick = () => {
    init();
    startGameLoop();  
};

document.getElementById('pause').onclick = () => gameState.paused = !gameState.paused;
document.getElementById('restart').onclick = () => {
    init();
    startGameLoop();
};

init();       
gameLoop();    
