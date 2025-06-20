function initializeDashboardWidgets() {

    


// Dentro de initializeDashboardWidgets()
// --- LÓGICA DE LA PREGUNTA DEL DÍA (RETO DEL DÍA) ---
// Re-seleccionar elementos
answerChallengeBtn = document.getElementById('answer-challenge-btn');
challengeFeedback = document.getElementById('challenge-feedback');
dailyChallengeQuestionElement = document.getElementById('daily-challenge-question');
dailyChallengeOptions = document.getElementById('daily-challenge-options');

if (answerChallengeBtn) {
    // Asegurarse de que el listener sea para la lógica del reto del día
    answerChallengeBtn.removeEventListener('click', handleChallengeButtonClick); 
    answerChallengeBtn.addEventListener('click', handleChallengeButtonClick);
}

// --- NUEVO: Cargar una pregunta aleatoria para el Reto del Día ---
if (dailyChallengeQuestions.length > 0) {
    const randomIndex = Math.floor(Math.random() * dailyChallengeQuestions.length);
    currentDailyChallengeQuestion = dailyChallengeQuestions[randomIndex]; // Asignar la pregunta aleatoria
} else {
    currentDailyChallengeQuestion = { // Fallback si no hay preguntas cargadas
        question: "No hay preguntas para el Reto del Día. Por favor, añade más.",
        options: {},
        correctAnswer: "",
        explanation: ""
    };
}
// --- FIN NUEVO ---

// Cargar la pregunta aleatoria en el DOM
if (dailyChallengeQuestionElement && dailyChallengeOptions) {
    dailyChallengeQuestionElement.textContent = currentDailyChallengeQuestion.question;
    dailyChallengeOptions.innerHTML = ''; // Limpiar opciones existentes
    for (const key in currentDailyChallengeQuestion.options) {
        const label = document.createElement('label');
        label.className = 'inline-flex items-center';
        label.innerHTML = `
            <input type="radio" class="form-radio text-blue-600" name="daily_challenge" value="<span class="math-inline">\{key\}"\>




<span class="ml-2 text-gray-700">{key}) ${currentDailyChallengeQuestion.options[key]}</span>
`;
dailyChallengeOptions.appendChild(label);
}
// Restaurar estado de botones/radios al volver al dashboard
document.querySelectorAll('input[name="daily_challenge"]').forEach(radio => {
radio.disabled = false;
radio.checked = false; // Desmarcar cualquier opción previa
});
if(answerChallengeBtn) answerChallengeBtn.disabled = false;
if(challengeFeedback) challengeFeedback.classList.add('hidden'); // Ocultar feedback
}
```









    // --- LÓGICA DEL PROGRESO GENERAL ---
    const progressCircle = document.getElementById('progress-circle');
    const progressText = document.getElementById('progress-text');
    const savedProgress = localStorage.getItem('overallProgress');
    if (progressCircle && progressText) { // Asegurarse de que los elementos existan
        updateProgress(savedProgress ? parseInt(savedProgress) : 10); // Inicializa al 10% si no hay guardado
    }
    // Actualización del Widget 'Próximo Tema a Estudiar'
    const nextTopicText = document.getElementById('next-topic-text');
    const goToStudyBtn = document.getElementById('go-to-study-btn');
    
    if (nextTopicText && allTopicsData.length > 0 && allTopicsData[0].subtopics.length > 0) {
        nextTopicText.textContent = allTopicsData[0].subtopics[0].title;
        if (goToStudyBtn) {
            goToStudyBtn.onclick = (e) => { // Re-asignar el listener
                e.preventDefault();
                navigateTo('study-modules'); 
            };
        }
    }


    // --- LÓGICA DEL TEMPORIZADOR DE ESTUDIO (POMODORO) ---
    // Re-seleccionar elementos después de que el HTML ha sido cargado
    timerDisplay = document.getElementById('timer-display');
    startTimerBtn = document.getElementById('start-timer-btn');
    resetTimerBtn = document.getElementById('reset-timer-btn');

    if (timerDisplay) {
        timerDisplay.textContent = formatTime(timeLeft); // Asegurar que el tiempo se muestra correctamente
    }
    if (startTimerBtn) {
        startTimerBtn.removeEventListener('click', handleTimerButtonClick); // Remover si existe para evitar duplicados
        startTimerBtn.addEventListener('click', handleTimerButtonClick);
        startTimerBtn.textContent = isRunning ? 'Pausar' : 'Iniciar Sesión';
    }
    if (resetTimerBtn) {
        resetTimerBtn.removeEventListener('click', resetTimer);
        resetTimerBtn.addEventListener('click', resetTimer);
    }

    // --- LÓGICA DE LA PREGUNTA DEL DÍA (RETO DEL DÍA) ---
    // Re-seleccionar elementos
    answerChallengeBtn = document.getElementById('answer-challenge-btn');
    challengeFeedback = document.getElementById('challenge-feedback');
    dailyChallengeQuestionElement = document.getElementById('daily-challenge-question');
    dailyChallengeOptions = document.getElementById('daily-challenge-options');

    if (answerChallengeBtn) {
        answerChallengeBtn.removeEventListener('click', handleChallengeButtonClick); // Remover si existe
        answerChallengeBtn.addEventListener('click', handleChallengeButtonClick);
    }

    // Cargar la pregunta inicial al cargar la página
    if (dailyChallengeQuestionElement && dailyChallengeOptions) {
        dailyChallengeQuestionElement.textContent = currentQuestion.question;
        dailyChallengeOptions.innerHTML = ''; // Limpiar opciones existentes
        for (const key in currentQuestion.options) {
            const label = document.createElement('label');
            label.className = 'inline-flex items-center';
            label.innerHTML = `
                <input type="radio" class="form-radio text-blue-600" name="daily_challenge" value="${key}">
                <span class="ml-2 text-gray-700">${key}) ${currentQuestion.options[key]}</span>
            `;
            dailyChallengeOptions.appendChild(label);
        }
        // Restaurar estado de botones/radios al volver al dashboard
        document.querySelectorAll('input[name="daily_challenge"]').forEach(radio => {
            radio.disabled = false;
            radio.checked = false; // Desmarcar cualquier opción previa
        });
        if(answerChallengeBtn) answerChallengeBtn.disabled = false;
        if(challengeFeedback) challengeFeedback.classList.add('hidden'); // Ocultar feedback
    }

    // --- Manejo de Logros en Dashboard ---
    const viewAllAchievementsBtn = document.getElementById('view-all-achievements-btn');
    if (viewAllAchievementsBtn) {
        viewAllAchievementsBtn.removeEventListener('click', handleViewAllAchievementsClick); // Evitar duplicados
        viewAllAchievementsBtn.addEventListener('click', handleViewAllAchievementsClick);
    }
    displayDashboardAchievements(); // Asegurarse de que se muestren al cargar el dashboard
}