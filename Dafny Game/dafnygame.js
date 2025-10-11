document.addEventListener('DOMContentLoaded', () => {

    // ****** ÁREA DE EDIÇÃO ****** //
    // Organize suas perguntas de múltipla escolha aqui.
    // 'correct' é o número da opção correta, começando em 0.
    const quizData = [
        {
            question: "Qual foi a primeira surpresa que você fez para mim?",
            options: [
                "uma cartinha",
                "um bilhete motivacional com chocolate", // Opção 1 (correta)
                "um iFood (açaí)"
            ],
            correct: 1, // << MUDE AQUI se a resposta correta for outra
            passwordChar: "A" // Primeira letra da senha
        },
        {
            question: "Qual o nome do primeiro filme que vimos juntos no cinema?",
            options: [
                "Vingadores", // Opção 0
                "Homem-Aranha", // Opção 1 (correta)
                "Batman"
            ],
            correct: 1,
            passwordChar: "M"
        },
        {
            question: "Onde demos nosso primeiro beijo?",
            options: [
                "No parque",
                "Na porta da sua casa", // Opção 1
                "No carro" // Opção 2 (correta)
            ],
            correct: 2,
            passwordChar: "O"
        },
        // Adicione mais perguntas aqui para completar a primeira parte da senha...
    ];
    // ****** FIM DA ÁREA DE EDIÇÃO ****** //


    // --- Lógica do Jogo (Não precisa editar) ---
    let currentQuestionIndex = 0;
    
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const feedbackText = document.getElementById('feedback-text');
    const passwordBoxesContainer = document.getElementById('password-boxes');
    const finalMessage = document.getElementById('final-message');
    const quizArea = document.getElementById('quiz-area');
    const passwordArea = document.getElementById('password-area');

    function startGame() {
        createPasswordBoxes();
        showQuestion();
    }

    function createPasswordBoxes() {
        passwordBoxesContainer.innerHTML = '';
        quizData.forEach(() => {
            const box = document.createElement('div');
            box.classList.add('password-box');
            passwordBoxesContainer.appendChild(box);
        });
    }

    function showQuestion() {
        // Limpa a pergunta e opções anteriores
        optionsContainer.innerHTML = '';
        feedbackText.textContent = '';
        
        const currentQuiz = quizData[currentQuestionIndex];
        questionText.textContent = currentQuiz.question;

        // Cria os botões de opção
        currentQuiz.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.classList.add('option-btn');
            button.textContent = option;
            button.addEventListener('click', () => checkAnswer(index, button));
            optionsContainer.appendChild(button);
        });
    }

    function checkAnswer(selectedIndex, selectedButton) {
        const currentQuiz = quizData[currentQuestionIndex];
        const correctIndex = currentQuiz.correct;
        
        // Desabilita todos os botões para evitar múltiplos cliques
        document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);

        if (selectedIndex === correctIndex) {
            feedbackText.textContent = "CORRETO! 🎉";
            feedbackText.className = 'correct';
            selectedButton.classList.add('correct'); // Pinta o botão correto
            
            // Revela a letra da senha
            document.querySelectorAll('.password-box')[currentQuestionIndex].textContent = currentQuiz.passwordChar;
            
            currentQuestionIndex++;
            setTimeout(() => {
                if (currentQuestionIndex < quizData.length) {
                    showQuestion();
                } else {
                    endGame(); // Vai para a próxima fase
                }
            }, 1500);

        } else {
            feedbackText.textContent = "OPS, NÃO FOI ESSA! 😉";
            feedbackText.className = 'incorrect';
            selectedButton.classList.add('incorrect'); // Pinta o botão incorreto
            // Pinta o botão correto também para mostrar a resposta
            document.querySelectorAll('.option-btn')[correctIndex].classList.add('correct');
            
            // Tenta a mesma pergunta de novo
            setTimeout(showQuestion, 2500);
        }
    }

    // Esta função te levará para a Fase 2
    function endGame() {
        quizArea.classList.add('hidden');
        passwordArea.classList.add('hidden');

        finalMessage.classList.remove('hidden');
        finalMessage.innerHTML = `
            <h2>FASE 1 COMPLETA!</h2>
            <p>Você é incrível! Já desvendou a primeira parte do código.</p>
            <p>Anote o que você descobriu e prepare-se, pois sua memória será testada agora!</p>
            <br>
            <a href="memoria.html" class="link-fase">IR PARA A FASE 2</a>
        `;
    }

    startGame();
});