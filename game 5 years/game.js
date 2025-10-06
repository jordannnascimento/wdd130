document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos
    const player = document.getElementById('player');
    const messageBox = document.getElementById('message-box');
    
    // Itens e Objetivos
    const chest = document.getElementById('chest');
    const key = document.getElementById('key');
    const goalObject = document.getElementById('goal-object'); // Nosso antigo portal
    
    // Elementos da Fase (JUNTANDO TUDO QUE É PLATAFORMA OU OBSTÁCULO)
    const allPlatforms = document.querySelectorAll('.level-wall, .floor-rail, .t-platform');
    const allTraps = document.querySelectorAll('.ceiling-trap, #center-trap');

    // Quiz
    const quizModal = document.getElementById('quiz-modal');
    const optionButtons = document.querySelectorAll('.option');
    const correctAnswer = document.getElementById('correct-answer');
    const feedback = document.getElementById('feedback');

    // Configurações do jogo
    const gravity = 0.8;
    const moveSpeed = 4;
    const jumpForce = 15;
    const playerWidth = 20;
    const playerHeight = 30;

    // Estado do jogador
    let playerX, playerY, velocityY, isOnGround, hasKey;
    let keys = {};
    let messageTimeout;

    // Posições pré-calculadas
    let chestPos, keyPos, goalPos, trapPositions, platformPositions;
    
    function precalculatePositions() {
        chestPos = { left: chest.offsetLeft, top: chest.offsetTop, width: chest.offsetWidth, height: chest.offsetHeight };
        keyPos = { left: key.offsetLeft, top: key.offsetTop, width: key.offsetWidth, height: key.offsetHeight };
        goalPos = { left: goalObject.offsetLeft, top: goalObject.offsetTop, width: goalObject.offsetWidth, height: goalObject.offsetHeight };
        
        // COMBINANDO TODOS OS OBSTÁCULOS EM UMA SÓ LISTA
        trapPositions = Array.from(allTraps).map(trap => ({
            left: trap.offsetLeft, top: trap.offsetTop, width: trap.offsetWidth, height: trap.offsetHeight
        }));
        
        // COMBINANDO TODAS AS SUPERFÍCIES EM UMA SÓ LISTA
        platformPositions = Array.from(allPlatforms).map(p => ({
            left: p.offsetLeft, top: p.offsetTop, width: p.offsetWidth, height: p.offsetHeight
        }));
    }

    document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
    document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

    function showMessage(text, duration = 2000) {
        messageBox.textContent = text;
        messageBox.style.opacity = '1';
        clearTimeout(messageTimeout);
        messageTimeout = setTimeout(() => { messageBox.style.opacity = '0'; }, duration);
    }

    function gameLoop() {
        // Movimento e Pulo
        if (keys['a'] || keys['arrowleft']) { playerX -= moveSpeed; }
        if (keys['d'] || keys['arrowright']) { playerX += moveSpeed; }
        if ((keys[' '] || keys['arrowup'] || keys['w']) && isOnGround) {
            velocityY = -jumpForce;
            isOnGround = false;
        }
        
        velocityY += gravity;
        playerY += velocityY;
        isOnGround = false; 

        // Colisão com TODAS as plataformas
        platformPositions.forEach(platform => {
            // Colisão com o topo (pousando)
            if (playerX + playerWidth > platform.left && playerX < platform.left + platform.width &&
                playerY + playerHeight > platform.top && playerY < platform.top && velocityY >= 0) {
                playerY = platform.top - playerHeight;
                velocityY = 0;
                isOnGround = true;
            }
            // Colisão com a base (batendo a cabeça)
            else if (playerX + playerWidth > platform.left && playerX < platform.left + platform.width &&
                playerY < platform.top + platform.height && playerY + playerHeight > platform.top && velocityY < 0) {
                playerY = platform.top + platform.height;
                velocityY = 0;
            }
        });
        
        player.style.left = playerX + 'px';
        player.style.top = playerY + 'px';

        checkCollisionsWithObjects();
        requestAnimationFrame(gameLoop);
    }
    
    function checkCollisionsWithObjects() {
        const playerRect = { left: playerX, top: playerY, width: playerWidth, height: playerHeight };

        // Colisão com TODOS os obstáculos
        trapPositions.forEach(trap => {
            if (isColliding(playerRect, trap)) {
                resetPlayer();
                showMessage('Cuidado!');
            }
        });

        // Colisão com baú
        if (isColliding(playerRect, chestPos) && !hasKey && chest.style.display !== 'none') {
            quizModal.style.display = 'flex';
        }

        // Colisão com chave
        if (isColliding(playerRect, keyPos) && key.style.display !== 'none') {
            key.style.display = 'none';
            hasKey = true;
            showMessage('Chave!', 1500);
        }

        // Colisão com o objetivo final
        if (isColliding(playerRect, goalPos)) {
            if (hasKey) {
                showMessage('Você conseguiu! Te amo!', 3000);
                resetPlayer(true);
            } else {
                showMessage('Precisa da chave...', 1500);
            }
        }
    }

    function isColliding(rect1, rect2) {
        return (rect1.left < rect2.left + rect2.width && rect1.left + rect1.width > rect2.left &&
                rect1.top < rect2.top + rect2.height && rect1.top + rect1.height > rect2.top);
    }
    
    function resetPlayer(isWin = false) {
        playerX = 740; // Posição inicial no nicho da direita
        playerY = 400;
        velocityY = 0;
        if (!isWin) {
            hasKey = false;
            key.style.display = 'none';
            chest.style.display = 'block';
        }
    }

    // Lógica do Quiz
    optionButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button === correctAnswer) {
                feedback.textContent = 'Acertou!'; feedback.style.color = 'lime';
                setTimeout(() => {
                    quizModal.style.display = 'none';
                    key.style.display = 'block';
                    chest.style.display = 'none';
                    feedback.textContent = '';
                }, 1500);
            } else {
                feedback.textContent = 'Errado...'; feedback.style.color = 'red';
            }
        });
    });

    // Inicia o jogo
    precalculatePositions();
    resetPlayer();
    showMessage('Atravesse a sala!', 3000);
    gameLoop();
});