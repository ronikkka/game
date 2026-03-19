const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const healthEl = document.getElementById('health');

let levelEl = document.getElementById('level');
if (!levelEl) {
    const div = document.createElement('div');
    div.innerHTML = 'Уровень: <span id="level">1</span>';
    document.querySelector('.ui').prepend(div);
    levelEl = document.getElementById('level');
}

let gameState = {
    running: false,
    paused: false,
    score: 0,
    health: 3,
    level: 1
};

let keys = {};
let platforms = [];
let enemies = [];
let coins = [];

const bgImage = new Image();
bgImage.src = 'fon.png';

const coinImage = new Image();
coinImage.src = 'Coin.png';

const playerImage = new Image();
playerImage.src = 'Char_walk_1.png';

let facingRight = true;

const player = {
    x: 50,
    y: 480,
    width: 60,
    height: 60,
    speed: 5,
    vX: 0,
    vY: 0,
    grounded: false
};

function updateUI() {
    scoreEl.textContent = gameState.score;
    healthEl.textContent = gameState.health;
    if (levelEl) levelEl.textContent = gameState.level;
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateLevel(level) {
    platforms = [];
    enemies = [];
    coins = [];

    platforms.push({ x: 0, y: 570, width: 800, height: 30 });

    const platformCount = Math.min(4 + level, 9);
    let currentX = 120;
    let lastY = 480;

    for (let i = 0; i < platformCount; i++) {
        const width = randomInt(110, Math.max(120, 170 - level * 3));
        const gap = randomInt(70, Math.min(140 + level * 10, 220));
        const yChange = randomInt(-90, 90);

        let x = currentX + gap;
        let y = lastY + yChange;

        if (y < 180) y = 180;
        if (y > 520) y = 520;

        if (x + width > 760) break;

        const platform = { x, y, width, height: 20 };
        platforms.push(platform);

        const coinCount = Math.random() < 0.5 ? 1 : 2;
        for (let j = 0; j < coinCount; j++) {
            const coinX = x + 20 + j * 35;
            if (coinX + 35 < x + width) {
                coins.push({
                    x: coinX,
                    y: y - 40,
                    width: 35,
                    height: 35,
                    collected: false
                });
            }
        }

        if (level >= 2 && Math.random() < 0.6) {
            enemies.push({
                x: x + width / 2 - 15,
                y: y - 30,
                width: 30,
                height: 30,
                speed: Math.min(1.5 + level * 0.35, 5),
                dir: Math.random() < 0.5 ? -1 : 1,
                minX: x,
                maxX: x + width - 30
            });
        }

        currentX = x;
        lastY = y;
    }

    coins.push({
        x: 740,
        y: 520,
        width: 35,
        height: 35,
        collected: false
    });
}

function resetPlayerPosition() {
    player.x = 50;
    player.y = 500;
    player.vX = 0;
    player.vY = 0;
    player.grounded = false;
}

function init(fullReset = true) {
    gameState.running = false;
    gameState.paused = false;

    if (fullReset) {
        gameState.score = 0;
        gameState.health = 3;
        gameState.level = 1;
    }

    resetPlayerPosition();
    generateLevel(gameState.level);
    updateUI();
    keys = {};
}

function nextLevel() {
    gameState.level++;
    generateLevel(gameState.level);
    resetPlayerPosition();
    updateUI();
}

function handleCollisions() {
    let onPlatform = false;

    platforms.forEach(p => {
        if (checkCollision(player, p) && player.vY >= 0) {
            if (player.y + player.height - player.vY <= p.y + 15) {
                onPlatform = true;
                player.y = p.y - player.height;
                player.vY = 0;
            }
        }
    });

    player.grounded = onPlatform;

    enemies.forEach(e => {
        if (checkCollision(player, e)) {
            gameState.health--;
            gameState.score -= 300;
            updateUI();

            resetPlayerPosition();

            if (gameState.health <= 0) {
                setTimeout(() => endGame(false), 10);
            }
        }

        e.x += e.speed * e.dir;
        if (e.x <= e.minX || e.x >= e.maxX) {
            e.dir *= -1;
        }
    });

    coins.forEach(coin => {
        if (!coin.collected && checkCollision(player, coin)) {
            coin.collected = true;
            gameState.score += 100;
            updateUI();
        }
    });

    const allCollected = coins.length > 0 && coins.every(coin => coin.collected);
    if (allCollected) {
        nextLevel();
    }
}

function updatePlayer() {
    player.vX = 0;

    if (keys['ArrowLeft'] || keys['a'] || keys['A'] || keys['ф'] || keys['Ф']) {
        player.vX = -player.speed;
        facingRight = false;
    }

    if (keys['ArrowRight'] || keys['d'] || keys['D'] || keys['в'] || keys['В']) {
        player.vX = player.speed;
        facingRight = true;
    }

    if ((keys['ArrowUp'] || keys['w'] || keys['W'] || keys['ц'] || keys['Ц'] || keys[' ']) && player.grounded) {
        player.vY = -15;
        player.grounded = false;
    }

    if (!player.grounded) player.vY += 0.9;

    player.x += player.vX;
    player.y += player.vY;

    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) {
        player.x = canvas.width - player.width;
    }

    if (player.y > canvas.height + 60) {
        gameState.health--;
        updateUI();
        resetPlayerPosition();

        if (gameState.health <= 0) {
            endGame(false);
        }
    }

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
                ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });

    if (playerImage.complete && playerImage.naturalWidth !== 0) {
        ctx.save();

        if (!facingRight) {
            ctx.translate(player.x + player.width, player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(playerImage, 0, 0, player.width, player.height);
        } else {
            ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
        }

        ctx.restore();
    } else {
        ctx.fillStyle = '#3498DB';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(10, 10, 170, 40);
    ctx.fillStyle = '#222';
    ctx.font = '20px Arial';
    ctx.fillText(`Уровень: ${gameState.level}`, 20, 37);
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
        ctx.font = '42px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Нажмите СТАРТ', canvas.width / 2, canvas.height / 2);
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

function endGame(win) {
    if (win) {
        alert(`Победа! Счёт: ${gameState.score}`);
    } else {
        alert(`Игра окончена! Вы дошли до уровня ${gameState.level}. Счёт: ${gameState.score}`);
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
    init(true);
    startGameLoop();
};

document.getElementById('pause').onclick = () => gameState.paused = !gameState.paused;

document.getElementById('restart').onclick = () => {
    init(true);
    startGameLoop();
};

init(true);
gameLoop();
