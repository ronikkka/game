const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const healthEl = document.getElementById('health');

let gameState = { running: false, paused: false, score: 0, health: 3 };
let keys = {};

const bgImage = new Image();
bgImage.src = 'fon.png';

const coinImage = new Image();
coinImage.src = 'Coin.png';

const charIdle = new Image();
charIdle.src = 'Char1.png';

const charWalk = [
    new Image(), new Image(), new Image(), 
    new Image(), new Image(), new Image()
];
charWalk[0].src = 'Char_walk_0.png';
charWalk[1].src = 'Char_walk_1.png';
charWalk[2].src = 'Char_walk_2.png';
charWalk[3].src = 'Char_walk_3.png';
charWalk[4].src = 'Char_walk_4.png';
charWalk[5].src = 'Char_walk_5.png';

let frameIndex = 0;
let lastFrameTime = Date.now(); 
let facingRight = true;

const player = {
    x: 50, y: 480, width: 60, height: 60, speed: 5, vX: 0, vY: 0, grounded: false
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
    {x: 100, y: 530, width: 35, height: 35, collected: false},
    {x: 250, y: 410, width: 35, height: 35, collected: false},
    {x: 350, y: 410, width: 35, height: 35, collected: false},
    {x: 500, y: 310, width: 35, height: 35, collected: false},
    {x: 680, y: 210, width: 35, height: 35, collected: false},
    {x: 750, y: 530, width: 35, height: 35, collected: false},
    {x: 150, y: 370, width: 35, height: 35, collected: false},
    {x: 550, y: 260, width: 35, height: 35, collected: false},
    {x: 600, y: 440, width: 35, height: 35, collected: false},
    {x: 750, y: 170, width: 35, height: 35, collected: false}
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
    frameIndex = 0;
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
            gameState.score -= 300;
            updateUI(); 
            
            player.x = 50; player.y = 500; player.vX = 0; player.vY = 0;
            
            if (gameState.health <= 0) {
                setTimeout(() => {
                    endGame(false);
                }, 10);
            }
        }
        e.x += e.speed * e.dir;
        if (e.x <= 200 || e.x >= 500) e.dir *= -1;
    });

    coins.forEach(coin => {
        if (!coin.collected && checkCollision(player, coin)) {
            coin.collected = true;
            gameState.score += 100;
            updateUI();
        }
    });
}

function updatePlayer() {
    player.vX = 0;
    let isMoving = false;

    if (keys['ArrowLeft'] || keys['a'] || keys['A'] || keys['ф'] || keys['Ф']) {
        player.vX = -player.speed;
        facingRight = false;
        isMoving = true;
    }

    if (keys['ArrowRight'] || keys['d'] || keys['D'] || keys['в'] || keys['В']) {
        player.vX = player.speed;
        facingRight = true;
        isMoving = true;
    }

    if ((keys['ArrowUp'] || keys['w'] || keys['W'] || keys['ц'] || keys['Ц'] || keys[' ']) && player.grounded) {
        player.vY = -14;
        player.grounded = false;
    }

    if (isMoving && player.grounded) {
        let currentTime = Date.now();
        if (currentTime - lastFrameTime >= 500) { 
            frameIndex++;
            if (frameIndex >= charWalk.length) {
                frameIndex = 0;
            }
            lastFrameTime = currentTime;
        }
    } else {
        frameIndex = 0;
        lastFrameTime = Date.now();
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

    if (bgImage.complete && bgImage.naturalWidth !== 0) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = '#8c27ae';
    platforms.forEach(p => {
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeStyle = '#300748';
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
            if (coinImage.complete && coinImage.naturalWidth !== 0) {
                ctx.drawImage(coinImage, coin.x, coin.y, coin.width, coin.height);
            } else {
                ctx.fillStyle = 'gold';
                ctx.beginPath();
                ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI*2);
                ctx.fill();
            }
        }
    });

    let currentImage;
    if (player.vX === 0 || !player.grounded) {
        currentImage = charIdle;
    } else {
        currentImage = charWalk[frameIndex];
    }

    if (currentImage && currentImage.complete && currentImage.naturalWidth !== 0) {
        ctx.save();
        if (!facingRight) {
            ctx.translate(player.x + player.width, player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(currentImage, 0, 0, player.width, player.height);
        } else {
            ctx.drawImage(currentImage, player.x, player.y, player.width, player.height);
        }
        ctx.restore();
    } else {
        ctx.fillStyle = '#3498DB';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}

let gameLoopId = null;

function gameLoop() {
    if (gameState.running && !gameState.paused) {  
        updatePlayer();
        updateUI();
        draw();
    } else if (!gameState.running) {
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
        alert(`Победа! Вы собрали монеток на сумму: ${gameState.score}`);
    } else {
        alert(`Поражение! Счёт: ${gameState.score}`);
    }
    gameState.paused = true;
    gameState.running = false;
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
