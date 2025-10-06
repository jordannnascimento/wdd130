const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elementos da UI
const livesUI = document.getElementById('lives');
const scoreUI = document.getElementById('score');
const levelUI = document.getElementById('level');

// Canvas Responsivo
function resizeCanvas() {
  const aspectRatio = 4 / 3;
  let width = window.innerWidth * 0.9;
  let height = width / aspectRatio;
  if (height > window.innerHeight * 0.9) {
    height = window.innerHeight * 0.9;
    width = height * aspectRatio;
  }
  canvas.width = width;
  canvas.height = height;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Estado do Jogo
const game = {
  state: 'start', // start, playing, levelClear, gameOver, victory
  level: 1,
  score: 0,
  formationMoveDirection: 1,
};

const levelConfig = {
  1: { formation: 'grid', enemyShootCooldown: 100, enemyBulletSpeed: 3 },
  2: { formation: 'v_shape', enemyShootCooldown: 70, enemyBulletSpeed: 4.5 }
};

// Entidades do Jogo
const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 60,
  width: 40,
  height: 40,
  speed: 5,
  lives: 3,
  maxLives: 5,
  isInvincible: false,
  invincibilityTimer: 0
};

let boss = null;
const projectiles = { player: [], enemy: [] };
const powerUps = [];
const enemies = [];
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 1.5, speed: Math.random() * 0.5 });
}

// Controles
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Desenho da nave em pixel art
const heartShape = [
    [0, 1, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0]
];

function drawPlayer() {
    if (player.isInvincible && Math.floor(player.invincibilityTimer / 6) % 2 === 0) return;
    
    const pixelSize = player.width / heartShape[0].length;
    ctx.fillStyle = '#ff69b4';

    for (let r = 0; r < heartShape.length; r++) {
        for (let c = 0; c < heartShape[r].length; c++) {
            if (heartShape[r][c] === 1) {
                ctx.fillRect(player.x + c * pixelSize, player.y + r * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}

function drawProjectiles() {
  projectiles.player.forEach(p => { ctx.fillStyle = '#fff'; ctx.fillRect(p.x, p.y, p.width, p.height); });
  projectiles.enemy.forEach(p => { ctx.fillStyle = '#ff4500'; ctx.fillRect(p.x, p.y, p.width, p.height); });
}

function drawEnemies() {
  enemies.forEach(enemy => { ctx.fillStyle = '#8b00ff'; ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height); });
}

function drawPowerUps() {
    ctx.fillStyle = '#ff1493';
    powerUps.forEach(p => { ctx.font = '24px Arial'; ctx.fillText('♥', p.x, p.y); });
}

function drawBoss() {
    if (!boss) return;
    const colors = ['#8b00ff', '#ff00ff', '#ff0066'];
    ctx.fillStyle = colors[boss.phase - 1];
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
    // Barra de vida do chefe
    ctx.fillStyle = '#333';
    ctx.fillRect(boss.x, boss.y - 15, boss.width, 8);
    ctx.fillStyle = '#f00';
    ctx.fillRect(boss.x, boss.y - 15, boss.width * (boss.health / boss.maxHealth), 8);
}


// --- Lógica de Atualização ---
function updatePlayer() {
  if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
  if (keys['ArrowRight'] || keys['d']) player.x += player.speed;

  // Movimento vertical APENAS na Fase 3
  if (game.level === 3) {
      if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
      if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
  }
  
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

  if (keys[' '] && !keys.shootCooldown) {
    projectiles.player.push({ x: player.x + player.width / 2 - 2.5, y: player.y, width: 5, height: 15, speed: 8 });
    keys.shootCooldown = true;
    setTimeout(() => keys.shootCooldown = false, 300);
  }

  if (player.isInvincible) {
      player.invincibilityTimer--;
      if (player.invincibilityTimer <= 0) player.isInvincible = false;
  }
}

function updateEnemies() {
    if (game.level >= 3) return; // Inimigos não aparecem na fase do chefe
    const formationSpeed = 0.5;
    let changeDirection = false;
    enemies.forEach(enemy => {
        enemy.x += formationSpeed * game.formationMoveDirection;
        if (enemy.x <= 10 || enemy.x + enemy.width >= canvas.width - 10) changeDirection = true;

        if (Math.random() < 0.001 * game.level) {
            projectiles.enemy.push({
                x: enemy.x + enemy.width / 2 - 2, y: enemy.y + enemy.height,
                width: 4, height: 10, speed: levelConfig[game.level].enemyBulletSpeed
            });
        }
    });
    if (changeDirection) game.formationMoveDirection *= -1;
}

function updateBoss() {
    if (!boss) return;

    // Movimento e fases
    boss.x += boss.speed * boss.moveDirection;
    if (boss.x <= 0 || boss.x + boss.width >= canvas.width) boss.moveDirection *= -1;
    if (boss.health < boss.maxHealth * 0.5 && boss.phase === 1) boss.phase = 2;
    
    // Ataques
    boss.shootTimer--;
    if (boss.shootTimer <= 0) {
        if (boss.phase === 1) { // Fase 1: Tiro triplo
            for (let i = -1; i <= 1; i++) {
                projectiles.enemy.push({x: boss.x + boss.width / 2 - 4, y: boss.y + boss.height, width: 8, height: 15, speed: 4, vx: i * 2});
            }
            boss.shootTimer = 80;
        } else { // Fase 2: Ataque mais rápido e direcionado
            const dx = (player.x + player.width/2) - (boss.x + boss.width/2);
            const dy = (player.y + player.height/2) - (boss.y + boss.height/2);
            const dist = Math.sqrt(dx*dx + dy*dy);
            projectiles.enemy.push({x: boss.x + boss.width/2, y: boss.y + boss.height, width: 6, height: 18, speed: 0, vx: (dx/dist)*5, vy: (dy/dist)*5});
            boss.shootTimer = 60;
        }
    }
}

function updateProjectiles() {
  projectiles.player.forEach((p, i) => { p.y -= p.speed; if (p.y < 0) projectiles.player.splice(i, 1); });
  projectiles.enemy.forEach((p, i) => {
      p.x += p.vx || 0;
      p.y += p.vy || p.speed;
      if (p.y > canvas.height || p.x < 0 || p.x > canvas.width) projectiles.enemy.splice(i, 1);
  });
}

function updatePowerUps() {
    if(game.level === 3) return; // Na fase 3, corações ficam parados
    powerUps.forEach((p, i) => { p.y += p.speed; if (p.y > canvas.height) powerUps.splice(i, 1); });
}

function takeDamage() {
    if (player.isInvincible) return;
    player.lives--;
    player.isInvincible = true;
    player.invincibilityTimer = 90;
    if (player.lives <= 0) game.state = 'gameOver';
}

function checkCollisions() {
  // Lasers do jogador
  for (let i = projectiles.player.length - 1; i >= 0; i--) {
    const p = projectiles.player[i];
    // vs Inimigos
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (isColliding(p, enemies[j])) {
        projectiles.player.splice(i, 1);
        const killedEnemy = enemies.splice(j, 1)[0];
        game.score += 100;
        if (Math.random() < 0.2) powerUps.push({x: killedEnemy.x, y: killedEnemy.y, speed: 2});
        break; 
      }
    }
    if (!projectiles.player[i]) continue;
    // vs Chefe
    if (boss && isColliding(p, boss)) {
        projectiles.player.splice(i, 1);
        boss.health--;
        if (boss.health <= 0) game.state = 'victory';
    }
  }

  // Lasers inimigos vs Jogador
  for (let i = projectiles.enemy.length - 1; i >= 0; i--) {
    if (isColliding(projectiles.enemy[i], player)) {
      projectiles.enemy.splice(i, 1);
      takeDamage();
    }
  }

  // Naves Inimigas vs Jogador
  for (let i = enemies.length - 1; i >= 0; i--) {
      if(isColliding(enemies[i], player)) {
          enemies.splice(i, 1);
          takeDamage();
      }
  }

  // Jogador vs Power-ups
  for (let i = powerUps.length - 1; i >= 0; i--) {
    if (isColliding(powerUps[i], player)) {
        powerUps.splice(i, 1);
        if (player.lives < player.maxLives) player.lives++;
    }
  }
}

function isColliding(rect1, rect2) {
    const pWidth = rect1.width || 20; 
    const pHeight = rect1.height || 20;
    return rect1.x < rect2.x + rect2.width && rect1.x + pWidth > rect2.x &&
           rect1.y < rect2.y + rect2.height && rect1.y + pHeight > rect2.y;
}

function spawnFormation(level) {
    enemies.length = 0;
    const config = levelConfig[level];
    const rows = 4; const cols = 8; const enemySize = 30; const spacing = 15;
    const startX = (canvas.width - (cols * (enemySize + spacing))) / 2;
    const startY = 50;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (config.formation === 'v_shape' && (c < r || c >= cols - r)) continue;
            enemies.push({ x: startX + c * (enemySize + spacing), y: startY + r * (enemySize + spacing), width: enemySize, height: enemySize });
        }
    }
}

function setupLevel3() {
    enemies.length = 0;
    projectiles.player.length = 0;
    projectiles.enemy.length = 0;
    powerUps.length = 0;

    // Posiciona 3 corações fixos para recuperação
    powerUps.push({x: canvas.width * 0.2, y: canvas.height * 0.5});
    powerUps.push({x: canvas.width * 0.5, y: canvas.height * 0.3});
    powerUps.push({x: canvas.width * 0.8, y: canvas.height * 0.5});

    // Cria o chefe
    boss = {
        x: canvas.width/2 - 50, y: 50, width: 100, height: 80,
        health: 150, maxHealth: 150, speed: 2.5, moveDirection: 1,
        phase: 1, shootTimer: 0
    };
}


// --- Loop Principal e Estados do Jogo ---
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(s => { ctx.fillStyle = `rgba(255,255,255,${s.size})`; ctx.fillRect(s.x, s.y, s.size, s.size); s.y += s.speed; if (s.y > canvas.height) s.y = 0; });
  
  if (game.state === 'start' || game.state === 'levelClear' || game.state === 'gameOver' || game.state === 'victory') {
    drawMessageScreens();
    if (keys[' ']) resetForNextLevel();
    requestAnimationFrame(gameLoop);
    return;
  }
  
  updatePlayer();
  updateEnemies();
  updateBoss();
  updateProjectiles();
  updatePowerUps();
  checkCollisions();

  drawPlayer();
  drawEnemies();
  drawBoss();
  drawProjectiles();
  drawPowerUps();
  
  livesUI.textContent = '♥'.repeat(player.lives);
  scoreUI.textContent = game.score;
  levelUI.textContent = game.level;

  if (game.level < 3 && enemies.length === 0 && game.state === 'playing') {
      game.state = 'levelClear';
  }
  
  requestAnimationFrame(gameLoop);
}

function resetForNextLevel() {
    if (game.state === 'levelClear') game.level++;
    if(game.state === 'start' || game.state === 'gameOver') {
        game.level = 1;
        game.score = 0;
        player.lives = 3;
    }
    
    if (game.state === 'victory') { // Se venceu o jogo
        game.state = 'start';
        game.level = 1; // Reseta para o começo
        return;
    }

    game.state = 'playing';
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 60;
    player.isInvincible = false;
    projectiles.player.length = 0;
    projectiles.enemy.length = 0;
    powerUps.length = 0;
    
    if (game.level < 3) {
        spawnFormation(game.level);
    } else {
        setupLevel3();
    }
}

function drawMessageScreens() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff1493';
    ctx.textAlign = 'center';
    
    let title, line1, line2;
    if (game.state === 'start') {
        title = 'Coração Galáctico';
        line1 = 'Um presente para meu amor!';
        line2 = 'Pressione ESPAÇO para começar';
    } else if (game.state === 'levelClear') {
        title = `FASE ${game.level} COMPLETA!`;
        line1 = 'Nosso amor prevalece!';
        line2 = 'Pressione ESPAÇO para continuar';
    } else if (game.state === 'gameOver') {
        title = 'GAME OVER';
        line1 = 'Fomos atingidos...';
        line2 = 'Mas nosso amor é mais forte! ESPAÇO para tentar de novo';
    } else if (game.state === 'victory') {
        title = 'VITÓRIA!';
        line1 = 'Parabéns, meu amor!';
        line2 = 'Você protegeu nosso coração galáctico! Eu te amo!';
    }
    
    ctx.font = '24px "Press Start 2P"';
    ctx.fillText(title, canvas.width / 2, canvas.height / 3);
    ctx.fillStyle = '#fff';
    ctx.font = '14px "Press Start 2P"';
    ctx.fillText(line1, canvas.width / 2, canvas.height / 2);
    if(line2) ctx.fillText(line2, canvas.width / 2, canvas.height/2 + 40);
}

// Inicia o Jogo
gameLoop();