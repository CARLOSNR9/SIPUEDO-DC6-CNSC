// main.js

// =======================================================
// VARIABLES GLOBALES
// =======================================================
let allTopicsData = []; // Para almacenar todos los datos de topics.json
let allQuestionsData = []; // Para almacenar todos los datos de questions.json
let dailyChallengeQuestions = []; // NUEVA: Para las preguntas del reto del día
let currentDailyChallengeQuestion = null; // NUEVA: Para la pregunta actual del reto del día
const contentArea = document.getElementById('content-area'); // Contenedor principal para el contenido dinámico

// Variables para el temporizador (declaradas fuera de DOMContentLoaded para ser globales)
let timerInterval;
let timeLeft = 25 * 60; // 25 minutos en segundos (para un pomodoro)
let isRunning = false;
let timerDisplay; // Se inicializará en initializeDashboardWidgets
let startTimerBtn; // Se inicializará en initializeDashboardWidgets
let resetTimerBtn; // Se inicializará en initializeDashboardWidgets

// Variables para la pregunta del día (declaradas fuera de DOMContentLoaded para ser globales)
let answerChallengeBtn; // Se inicializará en initializeDashboardWidgets
let challengeFeedback; // Se inicializará en initializeDashboardWidgets
let dailyChallengeQuestionElement; // Se inicializará en initializeDashboardWidgets
let dailyChallengeOptions; // Se inicializará en initializeDashboardWidgets

// Pregunta de ejemplo. Idealmente, la cargaríamos desde questions.json más adelante.
// Por ahora, la mantenemos aquí para la funcionalidad inmediata.
const currentQuestion = {
    question: "¿Cuál es la entidad encargada de organizar los concursos de méritos para ingresar al empleo público en Colombia?",
    options: {
        A: "Departamento Administrativo de la Función Pública",
        B: "Comisión Nacional del Servicio Civil (CNSC)",
        C: "Presidencia de la República"
    },
    correctAnswer: "B",
    explanation: "La Comisión Nacional del Servicio Civil (CNSC) es la entidad encargada de organizar y llevar a cabo los concursos de méritos para ingresar y ascender en los empleos públicos de carrera administrativa en Colombia."
};

// Variables para simulacros
let currentQuizQuestions = []; // Preguntas para el simulacro actual
let currentQuestionIndex = 0; // Índice de la pregunta actual
let quizScore = 0; // Puntaje del simulacro
let quizStartTime; // Para el temporizador del simulacro
let quizTimerInterval; // Intervalo para el temporizador del simulacro


// --- Variables y definiciones para Logros ---
let userAchievements = JSON.parse(localStorage.getItem('userAchievements')) || {}; // Logros obtenidos por el usuario
// Definición de todos los logros posibles
const achievementsDefinitions = [
    { id: 'first_module_completed', name: 'Primer Tema Completo', description: 'Completa tu primer subtema de estudio.', type: 'subtopic_completion', subtopicId: null, targetCount: 1, icon: 'https://via.placeholder.com/60x60/4CAF50/ffffff?text=🌟', color: 'bg-green-500' },
    { id: 'all_integrity_modules', name: 'Maestro de la Integridad', description: 'Completa todos los módulos de Integridad.', type: 'topic_completion', topicId: 'integridad', icon: 'https://via.placeholder.com/60x60/FFC107/000000?text=⚖️', color: 'bg-yellow-500' },
    { id: 'first_quiz_passed', name: 'Simulacro Aprobado', description: 'Aprueba tu primer simulacro con 65% o más.', type: 'quiz_score', targetScore: 65, icon: 'https://via.placeholder.com/60x60/2196F3/ffffff?text=✅', color: 'bg-blue-500' },
    { id: 'study_streak_3', name: 'Racha de 3 Días', description: 'Estudia 3 días consecutivos.', type: 'streak', days: 3, icon: 'https://via.placeholder.com/60x60/FF5722/ffffff?text=🔥', color: 'bg-orange-500' },
    { id: 'all_functional_specifics', name: 'Experto en TI IDU', description: 'Completa todos los módulos de Competencias Funcionales Específicas.', type: 'topic_completion', topicId: 'funcionales-especificas', icon: 'https://via.placeholder.com/60x60/9C27B0/ffffff?text=💻', color: 'bg-purple-500' }
    // Puedes añadir más logros aquí, por ejemplo:
    // { id: 'first_5_quizzes', name: 'Aprendiz Imparable', description: 'Completa 5 simulacros.', type: 'quiz_count', targetCount: 5, icon: '...', color: '...' },
    // { id: 'perfect_quiz', name: 'Puntaje Perfecto', description: 'Logra 100% en un simulacro.', type: 'quiz_score', targetScore: 100, icon: '...', color: '...' },
];


// =======================================================
// DOMContentLoaded: Se ejecuta cuando todo el HTML ha sido cargado
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el contenido principal
    initContent();

    // Event Listeners para la navegación principal en la cabecera
    const navLinks = document.querySelectorAll('header nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir el comportamiento por defecto del enlace

            const linkText = e.target.textContent.toLowerCase();
            if (linkText.includes('inicio')) {
                navigateTo('dashboard');
            } else if (linkText.includes('módulos de estudio')) {
                navigateTo('study-modules');
            } else if (linkText.includes('simulacros')) {
                navigateTo('simulacros');
            } else if (linkText.includes('mi cronograma')) {
                navigateTo('cronograma');
            } else if (e.target.id === 'view-all-achievements-btn') { // Este es el botón del widget del dashboard
                navigateTo('achievements');
            }
            // Puedes añadir más aquí para otros enlaces de la cabecera
        });
    });
});


// =======================================================
// FUNCIONES GENERALES DE CARGA DE DATOS
// =======================================================

// Función para cargar datos de un archivo JSON
async function loadJSON(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading JSON from ${filePath}:`, error);
        return null;
    }
}

// Función principal para iniciar la carga de datos y renderizar el dashboard
async function initContent() {
    const topicsData = await loadJSON('./data/topics.json');
    if (topicsData) {
        allTopicsData = topicsData;
    }

    const questionsData = await loadJSON('./data/questions.json');
    if (questionsData) {
        allQuestionsData = questionsData;
    }

    // --- NUEVO: Cargar preguntas del reto del día ---
    const dcQuestionsData = await loadJSON('./data/daily-challenge-questions.json');
    if (dcQuestionsData) {
        dailyChallengeQuestions = dcQuestionsData;
    }
    // --- FIN NUEVO ---

    navigateTo('dashboard');
}

// =======================================================
// GESTIÓN DE VISTAS (SPA - Single Page Application)
// =======================================================

// HTML del dashboard (copia el HTML que estaba dentro de <div id="content-area"> en index.html)
const dashboardHTML = `
    <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">¡Bienvenido, Carlos! Tu Centro de Conquista al IDU</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        <div class="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center">
            <h3 class="text-xl font-semibold mb-4 text-center">Mi Progreso General</h3>
            <div class="relative w-32 h-32">
                <svg class="w-full h-32 transform rotate-[-90deg]">
                    <circle class="text-gray-300" stroke-width="12" stroke="currentColor" fill="transparent" r="52" cx="64" cy="64"/>
                    <circle id="progress-circle" class="text-green-500" stroke-width="12" stroke-dasharray="326.72" stroke-dashoffset="294.048" stroke-linecap="round" stroke="currentColor" fill="transparent" r="52" cx="64" cy="64"/>
                </svg>
                <span id="progress-text" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-green-600">10%</span>
            </div>
            <p class="mt-4 text-gray-600">¡Sigue avanzando hacia tu objetivo!</p>
        </div>

        <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg flex flex-col justify-between">
            <h3 class="text-xl font-semibold mb-3">Próximo Tema a Estudiar</h3>
            <p id="next-topic-text" class="text-2xl font-bold mb-4">Cargando...</p>
            <a href="#" id="go-to-study-btn" class="bg-white text-blue-700 px-6 py-3 rounded-full font-semibold hover:bg-blue-100 transition duration-300 text-center">Ir a Estudiar Ahora</a>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-lg">
            <h3 class="text-xl font-semibold mb-3">Mis Simulacros</h3>
            <p class="text-gray-600 mb-2">Último Simulacro: <span class="font-bold text-blue-600">72%</span> <span class="text-green-500">(+5% vs. anterior)</span></p>
            <p class="text-gray-600 mb-4">Mejor Puntaje: <span class="font-bold text-green-600">85%</span></p>
            <a href="#" class="text-blue-700 hover:underline">Ver Historial de Simulacros &rarr;</a>
        </div>

        <div class="bg-yellow-100 p-6 rounded-lg shadow-lg md:col-span-2 lg:col-span-1">
            <h3 class="text-xl font-semibold mb-3">Reto del Día</h3>
            <p id="daily-challenge-question" class="text-gray-700 mb-4 font-medium">Cargando pregunta...</p>
            <div id="daily-challenge-options" class="flex flex-col space-y-2 mb-4">
                </div>
            <button id="answer-challenge-btn" class="bg-yellow-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition duration-300">Responder</button>
            <p id="challenge-feedback" class="mt-3 text-sm hidden"></p>
        </div>

        <div class="bg-purple-100 p-6 rounded-lg shadow-lg">
            <h3 class="text-xl font-semibold mb-3">Temporizador de Estudio</h3>
            <div class="flex flex-col items-center justify-center space-y-4">
                <p id="timer-display" class="text-5xl font-bold text-purple-700">25:00</p>
                <div class="flex space-x-4">
                    <button id="start-timer-btn" class="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700 transition duration-300">Iniciar Sesión</button>
                    <button id="reset-timer-btn" class="bg-gray-400 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-500 transition duration-300">Reiniciar</button>
                </div>
            </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center">
            <h3 class="text-xl font-semibold mb-4">Mis Logros</h3>
            <div id="achievements-display" class="grid grid-cols-3 gap-4">
                </div>
            <a href="#" id="view-all-achievements-btn" class="mt-4 text-blue-700 hover:underline">Ver Todos los Logros &rarr;</a>
        </div>

    </div>
`;

function navigateTo(view) {
    if (view === 'dashboard') {
        contentArea.innerHTML = dashboardHTML;
        initializeDashboardWidgets(); // Re-inicializar elementos y listeners del dashboard
        // displayDashboardAchievements(); // Esta llamada ya está dentro de initializeDashboardWidgets()
    } else if (view === 'study-modules') {
        renderStudyModulesView();
    } else if (view === 'simulacros') {
        renderSimulacrosView();
    } else if (view === 'cronograma') {
        renderCronogramaView();
    } else if (view === 'achievements') {
        renderAchievementsView();
    }
}

// Función para re-inicializar los listeners y elementos del dashboard
// Es CRUCIAL llamarla CADA VEZ que el dashboardHTML es re-inyectado en el DOM


function initializeDashboardWidgets() {
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
        // Asegurarse de que el listener sea para la lógica del reto del día
        answerChallengeBtn.removeEventListener('click', handleChallengeButtonClick); 
        answerChallengeBtn.addEventListener('click', handleChallengeButtonClick);
    }

    // Cargar una pregunta aleatoria para el Reto del Día
    if (dailyChallengeQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * dailyChallengeQuestions.length);
        currentDailyChallengeQuestion = dailyChallengeQuestions[randomIndex]; // Asignar la pregunta aleatoria
    } else {
        // Fallback si no hay preguntas cargadas en dailyChallengeQuestions
        currentDailyChallengeQuestion = {
            question: "No hay preguntas para el Reto del Día. Por favor, añade más.",
            options: {},
            correctAnswer: "",
            explanation: ""
        };
    }

    // Cargar la pregunta aleatoria en el DOM
    if (dailyChallengeQuestionElement && dailyChallengeOptions) {
        dailyChallengeQuestionElement.textContent = currentDailyChallengeQuestion.question;
        dailyChallengeOptions.innerHTML = ''; // Limpiar opciones existentes
        for (const key in currentDailyChallengeQuestion.options) {
            const label = document.createElement('label');
            label.className = 'inline-flex items-center';
            label.innerHTML = `
                <input type="radio" class="form-radio text-blue-600" name="daily_challenge" value="${key}">
                <span class="ml-2 text-gray-700">${key}) ${currentDailyChallengeQuestion.options[key]}</span>
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





// =======================================================
// FUNCIONES DEL TEMPORIZADOR
// =======================================================
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startTimerBtn.textContent = 'Pausar';

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = formatTime(timeLeft);

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            timerDisplay.textContent = '00:00';
            alert('¡Tiempo de estudio completado! Tómate un descanso.');
            startTimerBtn.textContent = 'Iniciar Sesión';
            timeLeft = 25 * 60;
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startTimerBtn.textContent = 'Continuar';
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = 25 * 60;
    timerDisplay.textContent = formatTime(timeLeft);
    startTimerBtn.textContent = 'Iniciar Sesión';
}

// Manejador para el botón del temporizador (para poder remover/añadir listener)
function handleTimerButtonClick() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

// =======================================================
// FUNCIONES DEL WIDGET DE PROGRESO (se usa en initializeDashboardWidgets)
// =======================================================
function updateProgress(percentage) {
    const progressCircle = document.getElementById('progress-circle');
    const progressText = document.getElementById('progress-text');

    if (!progressCircle || !progressText) return; // Asegurarse de que los elementos existan

    const radius = progressCircle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = offset;
    progressText.textContent = `${percentage}%`;

    localStorage.setItem('overallProgress', percentage);
}


// =======================================================
// FUNCIONES DE LA PREGUNTA DEL DÍA
// =======================================================

// Manejador para el botón de reto del día (para poder remover/añadir listener)



function handleChallengeButtonClick() {
    // Selecciona la opción de radio marcada
    const selectedOption = document.querySelector('input[name="daily_challenge"]:checked');

    // Verifica si no se ha seleccionado ninguna opción
    if (!selectedOption) {
        challengeFeedback.textContent = 'Por favor, selecciona una opción.';
        challengeFeedback.className = 'mt-3 text-sm text-red-600'; // Estilo para mensaje de error
        challengeFeedback.classList.remove('hidden'); // Asegura que el mensaje sea visible
        return; // Detiene la ejecución si no hay selección
    }

    // Prepara el área de feedback: la hace visible y la vacía
    challengeFeedback.classList.remove('hidden');
    challengeFeedback.innerHTML = '';

    // Compara la respuesta seleccionada con la respuesta correcta de la pregunta actual
    // Asegúrate de que 'currentDailyChallengeQuestion' esté definida y accesible globalmente
    if (selectedOption.value === currentDailyChallengeQuestion.correctAnswer) {
        challengeFeedback.className = 'mt-3 text-sm text-green-700 font-semibold'; // Estilo para respuesta correcta
        challengeFeedback.textContent = '¡Correcto! 🎉';
    } else {
        challengeFeedback.className = 'mt-3 text-sm text-red-700 font-semibold'; // Estilo para respuesta incorrecta
        challengeFeedback.textContent = `Incorrecto. La respuesta correcta es ${currentDailyChallengeQuestion.correctAnswer}).`;
    }

    // Retraso para mostrar la explicación
    setTimeout(() => {
        challengeFeedback.innerHTML += `<br><strong>Explicación:</strong> ${currentDailyChallengeQuestion.explanation}`;
    }, 1000); // Muestra la explicación después de 1 segundo

    // Deshabilita todas las opciones de radio después de responder
    document.querySelectorAll('input[name="daily_challenge"]').forEach(radio => {
        radio.disabled = true;
    });
    // Deshabilita el botón de responder
    answerChallengeBtn.disabled = true;
}







// =======================================================
// RENDERIZADO DE LA VISTA DE MÓDULOS DE ESTUDIO
// =======================================================

function renderStudyModulesView() {
    contentArea.innerHTML = `
        <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Módulos de Estudio</h2>
        <div class="flex flex-col lg:flex-row gap-8">
            <nav class="lg:w-1/4 bg-white p-6 rounded-lg shadow-lg">
                <h3 class="text-xl font-semibold mb-4">Ejes Temáticos</h3>
                <ul id="main-topics-list"></ul>
            </nav>
            
            <section id="module-content-display" class="flex-1 bg-white p-6 rounded-lg shadow-lg">
                <h3 class="text-2xl font-bold text-blue-700 mb-4">Selecciona un tema para empezar</h3>
                <p class="text-gray-600">Navega por los ejes temáticos y sus subtemas para acceder al material de estudio detallado, recursos y preguntas rápidas.</p>
            </section>
        </div>
    `;

    const mainTopicsList = document.getElementById('main-topics-list');
    const moduleContentDisplay = document.getElementById('module-content-display');

   
// Función para renderizar el contenido de un subtema específico
function renderSubtopicContent(subtopic) {
    // El innerHTML completo de la sección del contenido del módulo
    moduleContentDisplay.innerHTML = `
        <h3 class="text-2xl font-bold text-blue-700 mb-4">${subtopic.title}</h3>
        <div class="prose max-w-none text-gray-800">
            <p>${subtopic.content}</p>
            ${subtopic.resources && subtopic.resources.length > 0 ? `
                <h4 class="text-xl font-semibold mt-6 mb-2">Recursos Recomendados:</h4>
                <ul class="list-disc list-inside ml-5">
                    ${subtopic.resources.map(res => `<li>${res}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
        
        ${subtopic.id === 'organizacion-distrito' ? `
            <div class="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500 text-blue-800">
                <p class="font-semibold mb-3">¡Pon a prueba tu conocimiento de la Organización del Distrito Capital!</p>
                <button id="start-org-quiz-btn" 
                        class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 transform hover:scale-105">
                    Realizar Simulacro de este Tema
                </button>
            </div>
        ` : ''}
        <button id="mark-completed-btn" class="mt-6 bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition duration-300" data-subtopic-id="${subtopic.id}">Marcar como Completado</button>
        `;

    // Listener para el botón "Marcar como Completado"
    const markCompletedBtn = document.getElementById('mark-completed-btn');
    if (markCompletedBtn) {
        markCompletedBtn.addEventListener('click', (e) => {
            const subtopicId = e.target.dataset.subtopicId;
            markSubtopicAsCompleted(subtopicId, true);
            alert(`¡"${subtopic.title}" marcado como completado!`);
            e.target.disabled = true; // Deshabilitar el botón
            e.target.textContent = 'Completado';
            checkAchievements(); // Verificar logros al completar un subtema
        });
        // Si ya está completado, deshabilitar al cargar
        if (getSubtopicCompletionStatus(subtopic.id)) {
            markCompletedBtn.disabled = true;
            markCompletedBtn.textContent = 'Completado';
        }
    }

    // === NUEVO: Listener para el botón del simulacro específico ===
    // Solo se añade si el subtema actual es 'organizacion-distrito'
    if (subtopic.id === 'organizacion-distrito') {
        const startOrgQuizBtn = document.getElementById('start-org-quiz-btn');
        if (startOrgQuizBtn) {
            startOrgQuizBtn.addEventListener('click', () => {
                // Navegar a la vista de simulacros
                navigateTo('simulacros');
                // Y, lo más importante, precargar la selección en el dropdown del simulacro
                setTimeout(() => { // Pequeño delay para que la vista de simulacros se cargue primero
                    const quizTypeSelect = document.getElementById('quiz-type-select');
                    if (quizTypeSelect) {
                        quizTypeSelect.value = 'organizacion-distrito';
                        alert('Selecciona "Organización del Distrito Capital" en el menú desplegable y haz clic en "Iniciar Simulacro" para comenzar.');
                    }
                }, 100); 
            });
        }
    }
    // === FIN NUEVO LISTENER ===
}




    // Llenar el menú lateral de ejes temáticos
    allTopicsData.forEach(topic => {
        const topicItem = document.createElement('li');
        topicItem.className = 'mb-2';
        topicItem.innerHTML = `
            <a href="#" class="block text-blue-700 hover:text-blue-900 font-semibold py-2 px-3 rounded-md hover:bg-blue-50 transition duration-300">${topic.title}</a>
            <ul class="ml-4 mt-1 space-y-1">
                ${topic.subtopics.map(subtopic => `
                    <li>
                        <a href="#" class="block text-gray-600 hover:text-gray-900 py-1 px-2 rounded-md hover:bg-gray-100 transition duration-300" data-subtopic-id="${subtopic.id}">
                            ${subtopic.title}
                            ${getSubtopicCompletionStatus(subtopic.id) ? '<span class="ml-2 text-green-500 text-xs">(Completado)</span>' : ''}
                        </a>
                    </li>
                `).join('')}
            </ul>
        `;
        mainTopicsList.appendChild(topicItem);
    });

    // Añadir Event Listeners a los subtemas para cargar el contenido
    mainTopicsList.addEventListener('click', (event) => {
        event.preventDefault();
        const target = event.target;
        if (target.tagName === 'A' && target.dataset.subtopicId) {
            const subtopicId = target.dataset.subtopicId;
            let selectedSubtopic = null;
            for (const topic of allTopicsData) {
                selectedSubtopic = topic.subtopics.find(sub => sub.id === subtopicId);
                if (selectedSubtopic) break;
            }
            if (selectedSubtopic) {
                renderSubtopicContent(selectedSubtopic);
            }
        }
    });
}


// =======================================================
// LÓGICA DE SIMULACROS
// =======================================================

function renderSimulacrosView() {
    contentArea.innerHTML = `
        <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Simulacros de Preparación</h2>
        <div id="quiz-options" class="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h3 class="text-xl font-semibold mb-4">Configura tu Simulacro</h3>
            <div class="flex flex-col md:flex-row gap-4 items-center">
                <select id="quiz-type-select" class="p-2 border rounded-md">
                    <option value="all">Simulacro General (Todas las preguntas)</option>
                    <option value="organizacion-distrito">Organización del Distrito Capital (20 Preguntas)</option>
                    <option value="funcionales-generales">Funcionales Generales (Otros temas)</option>
                    <option value="funcionales-especificas">Funcionales Específicas</option>
                    <option value="integridad">Integridad (IDU)</option>
                    <option value="competencias-comportamentales">Comportamentales</option>
                </select>
                <button id="start-quiz-btn" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-300">Iniciar Simulacro</button>
            </div>
        </div>
        
        <div id="quiz-container" class="bg-white p-8 rounded-lg shadow-lg hidden">
            <div class="flex justify-between items-center mb-6">
                <span id="question-counter" class="text-lg font-medium text-blue-700">Pregunta 1 de X</span>
                <span id="quiz-timer" class="text-lg font-bold text-red-600">00:00</span>
            </div>
            <h3 id="quiz-case" class="text-md italic text-gray-700 mb-4"></h3>
            <h4 id="quiz-question" class="text-xl font-semibold mb-6"></h4>
            <div id="quiz-options-container" class="flex flex-col space-y-4">
                </div>
            <button id="next-question-btn" class="mt-8 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-300 w-full md:w-auto">Siguiente Pregunta</button>
        </div>

        <div id="quiz-results" class="bg-white p-8 rounded-lg shadow-lg text-center hidden">
            <h3 class="text-3xl font-bold text-green-700 mb-4">¡Simulacro Completado!</h3>
            <p class="text-xl text-gray-700 mb-2">Tu puntaje: <span id="final-score" class="font-bold text-blue-600"></span></p>
            <p class="text-lg text-gray-600 mb-6">Tiempo total: <span id="final-time" class="font-bold"></span></p>
            <div id="quiz-feedback-summary" class="mb-6 text-left mx-auto max-w-2xl">
                </div>
            <button id="retake-quiz-btn" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 mr-4">Volver a Intentar</button>
            <button id="review-answers-btn" class="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition duration-300">Revisar Respuestas</button>
        </div>
    `;

    // Obtener elementos DOM para simulacros
    const quizTypeSelect = document.getElementById('quiz-type-select');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const quizOptionsDiv = document.getElementById('quiz-options');
    const quizContainer = document.getElementById('quiz-container');
    const questionCounter = document.getElementById('question-counter');
    const quizTimer = document.getElementById('quiz-timer');
    const quizCase = document.getElementById('quiz-case');
    const quizQuestion = document.getElementById('quiz-question');
    const quizOptionsContainer = document.getElementById('quiz-options-container');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const quizResultsDiv = document.getElementById('quiz-results');
    const finalScore = document.getElementById('final-score');
    const finalTime = document.getElementById('final-time');
    const quizFeedbackSummary = document.getElementById('quiz-feedback-summary');
    const retakeQuizBtn = document.getElementById('retake-quiz-btn');
    const reviewAnswersBtn = document.getElementById('review-answers-btn');

    // Event Listeners para la sección de simulacros
    startQuizBtn.addEventListener('click', startQuiz);
    nextQuestionBtn.addEventListener('click', () => {
        handleAnswerSubmission();
    });
    retakeQuizBtn.addEventListener('click', renderSimulacrosView); // Vuelve a la vista de configuración
    reviewAnswersBtn.addEventListener('click', reviewQuizAnswers);


    // --- LÓGICA DEL SIMULACRO ---
    function startQuiz() {
        const selectedType = quizTypeSelect.value;
        if (selectedType === 'all') {
            currentQuizQuestions = [...allQuestionsData]; // Si es un simulacro general, toma todas las preguntas
        } else if (selectedType === 'organizacion-distrito') { 
            const filteredQuestions = allQuestionsData.filter(q => q.subtopic_id === 'organizacion-distrito');
            // Tomar hasta 20 preguntas aleatoriamente de las filtradas
            currentQuizQuestions = filteredQuestions.sort(() => Math.random() - 0.5).slice(0, 20);
            if (currentQuizQuestions.length < 20) {
                alert(`Advertencia: Solo se encontraron ${currentQuizQuestions.length} preguntas de 'Organización del Distrito Capital'. Se recomienda añadir más preguntas para un simulacro completo de 20.`);
            }
        } else {
            // Lógica para otros tipos de simulacros (funcionales, integridad, comportamentales)
            currentQuizQuestions = allQuestionsData.filter(q => q.topic_id === selectedType);
        }

        // Asegurarse de que haya preguntas para el simulacro
        if (currentQuizQuestions.length === 0) {
            alert('No hay preguntas disponibles para el tipo de simulacro seleccionado. Por favor, añade más preguntas.');
            return;
        }

        currentQuestionIndex = 0;
        quizScore = 0;
        quizStartTime = new Date().getTime(); // Registrar tiempo de inicio
        updateQuizTimer(); // Iniciar temporizador visual del quiz

        quizOptionsDiv.classList.add('hidden'); // Ocultar opciones de configuración
        quizContainer.classList.remove('hidden'); // Mostrar contenedor del quiz
        quizResultsDiv.classList.add('hidden'); // Asegurarse de que los resultados estén ocultos

        loadQuestion();
    }

    function updateQuizTimer() {
        clearInterval(quizTimerInterval); // Limpiar cualquier intervalo anterior
        quizTimerInterval = setInterval(() => {
            const elapsedSeconds = Math.floor((new Date().getTime() - quizStartTime) / 1000);
            const minutes = Math.floor(elapsedSeconds / 60);
            const seconds = elapsedSeconds % 60;
            quizTimer.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }, 1000);
    }

    function loadQuestion() {
        if (currentQuestionIndex < currentQuizQuestions.length) {
            const questionData = currentQuizQuestions[currentQuestionIndex];
            questionCounter.textContent = `Pregunta ${currentQuestionIndex + 1} de ${currentQuizQuestions.length}`;
            quizCase.textContent = questionData.case ? `Caso: ${questionData.case}` : ''; // Mostrar caso si existe
            quizQuestion.textContent = questionData.question;
            quizOptionsContainer.innerHTML = ''; // Limpiar opciones anteriores

            // Renderizar opciones basadas en el tipo de pregunta
            for (const key in questionData.options) {
                const label = document.createElement('label');
                label.className = 'inline-flex items-center mb-2 cursor-pointer'; // Añadir cursor-pointer para mejor UX
                label.innerHTML = `
                    <input type="radio" class="form-radio text-blue-600 h-5 w-5" name="quiz_question_option" value="${key}">
                    <span class="ml-3 text-gray-800 text-lg">${key}) ${questionData.options[key]}</span>
                `;
                quizOptionsContainer.appendChild(label);
            }
            nextQuestionBtn.textContent = (currentQuestionIndex === currentQuizQuestions.length - 1) ? 'Finalizar Simulacro' : 'Siguiente Pregunta';
        } else {
            endQuiz();
        }
    }

    function handleAnswerSubmission() {
        const selectedOption = document.querySelector('input[name="quiz_question_option"]:checked');
        const currentQuestionData = currentQuizQuestions[currentQuestionIndex];

        if (!selectedOption) {
            alert('Por favor, selecciona una opción antes de continuar.');
            return;
        }

        if (selectedOption.value === currentQuestionData.correctAnswer) {
            quizScore++;
        }
        
        // Opcional: Guardar la respuesta del usuario para revisión posterior
        currentQuizQuestions[currentQuestionIndex].userAnswer = selectedOption.value;

        currentQuestionIndex++;
        loadQuestion();
    }

    function endQuiz() {
        clearInterval(quizTimerInterval); // Detener el temporizador del simulacro
        const endTime = new Date().getTime();
        const totalTimeSeconds = Math.floor((endTime - quizStartTime) / 1000);
        const totalMinutes = Math.floor(totalTimeSeconds / 60);
        const remainingSeconds = totalTimeSeconds % 60;

        quizContainer.classList.add('hidden');
        quizResultsDiv.classList.remove('hidden');

        const percentageScore = (quizScore / currentQuizQuestions.length) * 100;
        finalScore.textContent = `${percentageScore.toFixed(2)}% (${quizScore} de ${currentQuizQuestions.length} correctas)`;
        finalTime.textContent = `${totalMinutes} minutos y ${remainingSeconds} segundos`;

        // Generar resumen de feedback (ejemplo básico, se puede mejorar)
        quizFeedbackSummary.innerHTML = `
            <h4 class="text-xl font-semibold mb-2 text-center">Resumen de Respuestas:</h4>
            <div class="space-y-2">
                ${currentQuizQuestions.map((q, index) => `
                    <p class="text-sm">
                        <span class="font-bold">Pregunta ${index + 1}:</span> 
                        ${q.userAnswer === q.correctAnswer ? '<span class="text-green-600">Correcta</span> 🎉' : '<span class="text-red-600">Incorrecta</span> ❌'}
                        (<span class="italic">Tu respuesta: ${q.userAnswer || 'No respondida'}</span>, Correcta: ${q.correctAnswer})
                        <br><strong>Explicación:</strong> ${q.explanation}
                    </p>
                `).join('')}
            </div>
        `;
        // Verificar logros al finalizar un simulacro
        if (percentageScore >= 65) { 
            grantAchievement('first_quiz_passed');
        }
        checkAchievements(); // También llamar a la verificación general por si acaso
    }

    function reviewQuizAnswers() {
        // Mejorar la vista de revisión
        quizContainer.classList.remove('hidden'); // Mostrar el contenedor del quiz de nuevo
        quizResultsDiv.classList.add('hidden'); // Ocultar resultados

        currentQuestionIndex = 0; // Reiniciar para empezar a revisar desde la primera pregunta
        loadReviewQuestion(); // Cargar la primera pregunta para revisión
        
        nextQuestionBtn.textContent = "Siguiente Pregunta (Revisión)";
        // Para asegurar que el listener sea el correcto para revisión
        nextQuestionBtn.removeEventListener('click', handleAnswerSubmission); 
        nextQuestionBtn.onclick = () => { handleReviewNavigation(1); }; 
        
        // Crear botón para ir atrás en la revisión
        let prevQuestionBtn = document.getElementById('prev-question-btn');
        if (!prevQuestionBtn) { // Solo crearlo si no existe
            prevQuestionBtn = document.createElement('button');
            prevQuestionBtn.id = 'prev-question-btn';
            prevQuestionBtn.className = 'mt-8 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition duration-300 w-full md:w-auto mr-4';
            prevQuestionBtn.textContent = 'Pregunta Anterior (Revisión)';
            nextQuestionBtn.parentNode.insertBefore(prevQuestionBtn, nextQuestionBtn);
        }
        prevQuestionBtn.onclick = () => { handleReviewNavigation(-1); };
        
        // Ocultar temporizador de simulacro durante la revisión
        document.getElementById('quiz-timer').classList.add('hidden');
    }

    function loadReviewQuestion() {
        if (currentQuestionIndex >= 0 && currentQuestionIndex < currentQuizQuestions.length) {
            const questionData = currentQuizQuestions[currentQuestionIndex];
            questionCounter.textContent = `Revisión Pregunta ${currentQuestionIndex + 1} de ${currentQuizQuestions.length}`;
            quizCase.textContent = questionData.case ? `Caso: ${questionData.case}` : '';
            quizQuestion.textContent = questionData.question;
            quizOptionsContainer.innerHTML = '';

            for (const key in questionData.options) {
                const label = document.createElement('label');
                label.className = 'inline-flex items-center mb-2 cursor-pointer';
                let radioHtml = `<input type="radio" class="form-radio h-5 w-5" name="quiz_question_option" value="${key}" disabled>`;
                
                let optionClass = 'text-gray-800';
                if (key === questionData.correctAnswer) {
                    optionClass = 'text-green-600 font-bold'; // Respuesta correcta en verde
                    radioHtml = `<input type="radio" class="form-radio text-green-600 h-5 w-5" name="quiz_question_option" value="${key}" checked disabled>`;
                } else if (key === questionData.userAnswer && key !== questionData.correctAnswer) {
                    optionClass = 'text-red-600 font-bold line-through'; // Respuesta del usuario incorrecta en rojo y tachada
                    radioHtml = `<input type="radio" class="form-radio text-red-600 h-5 w-5" name="quiz_question_option" value="${key}" checked disabled>`;
                }
                
                label.innerHTML = `${radioHtml}<span class="ml-3 text-lg ${optionClass}">${key}) ${questionData.options[key]}</span>`;
                quizOptionsContainer.appendChild(label);
            }

            // Mostrar la explicación
            const explanationDiv = document.createElement('div');
            explanationDiv.className = 'mt-4 p-4 bg-gray-100 rounded-lg text-gray-700';
            explanationDiv.innerHTML = `<strong>Explicación:</strong> ${questionData.explanation}`;
            quizOptionsContainer.appendChild(explanationDiv);

            // Ajustar visibilidad de botones de navegación de revisión
            const prevBtn = document.getElementById('prev-question-btn');
            if(prevBtn) prevBtn.style.display = (currentQuestionIndex === 0) ? 'none' : 'block';
            nextQuestionBtn.textContent = (currentQuestionIndex === currentQuizQuestions.length - 1) ? 'Volver al inicio de simulacros' : 'Siguiente Pregunta (Revisión)';
            nextQuestionBtn.onclick = () => { 
                if (currentQuestionIndex === currentQuizQuestions.length - 1) {
                    renderSimulacrosView(); // Si es la última, vuelve a la vista principal de simulacros
                } else {
                    handleReviewNavigation(1); // Si no, avanza
                }
            };

        } else {
            // Si no hay más preguntas para revisar, volver a la vista de resultados o configuración
            renderSimulacrosView(); // O redirigir a una vista de resumen de revisión
        }
    }

    function handleReviewNavigation(direction) {
        currentQuestionIndex += direction;
        if (currentQuestionIndex >= currentQuizQuestions.length) {
            currentQuestionIndex = currentQuizQuestions.length - 1; // Evitar que se pase
        }
        if (currentQuestionIndex < 0) {
            currentQuestionIndex = 0; // Evitar que vaya antes del inicio
        }
        loadReviewQuestion();
    }

}

// =======================================================
// LÓGICA DEL CRONOGRAMA DE ESTUDIO
// =======================================================

// Mapa de cronograma simplificado (Puedes expandirlo según tu cronograma detallado)
// Asigna subtemas a fechas específicas. 'YYYY-MM-DD'
const studyPlan = {
    "2025-06-19": [ // Jueves 19 de junio
        {"subtopicId": "organizacion-distrito", "type": "study"},
        {"subtopicId": "integridad-compromiso", "type": "study"}
    ],
    "2025-06-20": [ // Viernes 20 de junio
        {"subtopicId": "arquitectura-empresarial", "type": "study"},
        {"subtopicId": "integridad-diligencia", "type": "study"}
    ],
    "2025-06-21": [ // Sábado 21 de junio
        {"subtopicId": "contratacion-publica", "type": "study"},
        {"subtopicId": "razonamiento-analitico", "type": "study"}
    ],
    "2025-06-22": [ // Domingo 22 de junio
        {"subtopicId": "desarrollo-software", "type": "study"},
        {"subtopicId": "integridad-honestidad", "type": "study"}
    ],
    "2025-06-23": [ // Lunes 23 de junio
        {"subtopicId": "diseno-bases-datos", "type": "study"},
        {"subtopicId": "comportamental-adaptacion-cambio", "type": "study"}
    ],
    "2025-06-24": [ // Martes 24 de junio
        {"subtopicId": "formulacion-proyectos-informaticos", "type": "study"},
        {"subtopicId": "integridad-innovacion", "type": "study"}
    ],
    "2025-06-25": [ // Miércoles 25 de junio
        {"subtopicId": "seguridad-informacion", "type": "study"},
        {"subtopicId": "comportamental-aprendizaje-continuo", "type": "study"}
    ],
    "2025-06-26": [ // Jueves 26 de junio
        {"subtopicId": "seguridad-tecnologica", "type": "study"},
        {"subtopicId": "integridad-justicia", "type": "study"}
    ],
    "2025-06-27": [ // Viernes 27 de junio
        {"subtopicId": "sistemas-informacion", "type": "study"},
        {"subtopicId": "comportamental-compromiso-organizacion", "type": "study"}
    ],
    "2025-06-28": [ // Sábado 28 de junio
        {"subtopicId": "organizacion-distrito", "type": "review"}, // Repaso
        {"subtopicId": "arquitectura-empresarial", "type": "review"}, // Repaso
        {"type": "simulacro-parcial"} // Indicar un simulacro parcial
    ],
    "2025-06-29": [ // Domingo 29 de junio
        {"subtopicId": "integridad-respeto", "type": "study"},
        {"subtopicId": "comportamental-comunicacion-efectiva", "type": "study"}
    ],
    "2025-06-30": [ // Lunes 30 de junio
        {"subtopicId": "contratacion-publica", "type": "review"},
        {"subtopicId": "desarrollo-software", "type": "review"}
    ],
    "2025-07-01": [ // Martes 1 de julio
        {"subtopicId": "integridad-trabajo-en-red", "type": "study"},
        {"subtopicId": "comportamental-gestion-procedimientos", "type": "study"}
    ],
    "2025-07-02": [ // Miércoles 2 de julio
        {"subtopicId": "diseno-bases-datos", "type": "review"},
        {"subtopicId": "formulacion-proyectos-informaticos", "type": "review"}
    ],
    "2025-07-03": [ // Jueves 3 de julio
        {"subtopicId": "seguridad-informacion", "type": "review"},
        {"subtopicId": "seguridad-tecnologica", "type": "review"},
        {"type": "simulacro-parcial"}
    ],
    "2025-07-04": [ // Viernes 4 de julio
        {"subtopicId": "sistemas-informacion", "type": "review"},
        {"subtopicId": "razonamiento-analitico", "type": "review"}
    ],
    "2025-07-05": [ // Sábado 5 de julio
        {"type": "simulacro-general-1"} // Primer simulacro general
    ],
    "2025-07-06": [ // Domingo 6 de julio
        {"type": "review-simulacro-1"}, // Revisión del simulacro
        {"type": "rest"}
    ],
    "2025-07-07": [ // Lunes 7 de julio
        {"subtopicId": "comportamental-instrumentacion-decisiones", "type": "study"},
        {"subtopicId": "comportamental-orientacion-resultado", "type": "study"}
    ],
    "2025-07-08": [ // Martes 8 de julio
        {"subtopicId": "comportamental-orientacion-usuario-ciudadano", "type": "study"},
        {"subtopicId": "comportamental-trabajo-equipo", "type": "study"}
    ],
    "2025-07-09": [ // Miércoles 9 de julio
        {"type": "review-all-weaknesses"}, // Revisar todas las debilidades
        {"type": "simulacro-general-2"} // Segundo simulacro general
    ],
    "2025-07-10": [ // Jueves 10 de julio
        {"type": "final-review-flashcards"}, // Repaso final con tarjetas
        {"type": "check-logistics"} // Revisar logística de la prueba
    ],
    "2025-07-11": [ // Viernes 11 de julio
        {"type": "light-review"}, // Repaso ligero
        {"type": "rest"}
    ],
    "2025-07-12": [ // Sábado 12 de julio
        {"type": "full-rest"} // Descanso total
    ],
    "2025-07-13": [ // Domingo 13 de julio - Día de la prueba
        {"type": "exam-day"}
    ]
};

// Función para obtener el estado de un subtema (completado/no completado)
function getSubtopicCompletionStatus(subtopicId) {
    return localStorage.getItem(`completed_${subtopicId}`) === 'true';
}

// Función para marcar un subtema como completado
function markSubtopicAsCompleted(subtopicId, isCompleted) {
    localStorage.setItem(`completed_${subtopicId}`, isCompleted);
    updateOverallProgress(); // Llamar a la función que calcula el progreso total
}

// Función para calcular y actualizar el progreso general
function updateOverallProgress() {
    let totalSubtopics = 0;
    let completedSubtopics = 0;

    allTopicsData.forEach(topic => {
        topic.subtopics.forEach(subtopic => {
            totalSubtopics++;
            if (getSubtopicCompletionStatus(subtopic.id)) {
                completedSubtopics++;
            }
        });
    });

    const progressPercentage = totalSubtopics > 0 ? (completedSubtopics / totalSubtopics) * 100 : 0;
    updateProgress(Math.round(progressPercentage)); 
}


function renderCronogramaView() {
    contentArea.innerHTML = `
        <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Mi Cronograma de Estudio</h2>
        <div class="bg-white p-6 rounded-lg shadow-lg">
            <h3 class="text-xl font-semibold mb-4">Progreso Diario</h3>
            <div id="cronograma-container" class="space-y-6">
                </div>
        </div>
    `;

    const cronogramaContainer = document.getElementById('cronograma-container');

    // Función para obtener el nombre del mes
    const getMonthName = (monthIndex) => {
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return months[monthIndex];
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Para comparar solo la fecha

    // Iterar sobre el studyPlan para construir el cronograma
    for (const dateKey in studyPlan) {
        const [year, month, day] = dateKey.split('-').map(Number);
        const currentDate = new Date(year, month - 1, day); // Month is 0-indexed

        const dayElement = document.createElement('div');
        dayElement.className = `border-b pb-4 mb-4 ${currentDate.getTime() === today.getTime() ? 'bg-blue-50 border-blue-600 border-2 p-3 rounded-lg shadow-md' : 'border-gray-200'}`; // Resaltar el día actual

        let dateString = `${currentDate.getDate()} de ${getMonthName(currentDate.getMonth())} de ${currentDate.getFullYear()}`;
        if (currentDate.getTime() === today.getTime()) {
            dateString += " (HOY)";
        } else if (currentDate.getTime() < today.getTime()) {
            dateString += " (Pasado)";
        }

        dayElement.innerHTML = `
            <h4 class="text-xl font-bold text-blue-700 mb-2">${dateString}</h4>
            <ul class="list-disc pl-5 space-y-1" id="tasks-for-${dateKey}"></ul>
        `;
        cronogramaContainer.appendChild(dayElement);

        const tasksList = document.getElementById(`tasks-for-${dateKey}`);
        studyPlan[dateKey].forEach(task => {
            const taskItem = document.createElement('li');
            let taskContent = '';
            let isCompleted = false;
            let currentId = '';

            if (task.type === 'study' || task.type === 'review') {
                // Encontrar el subtema correspondiente en allTopicsData
                let subtopicTitle = 'Tema desconocido';
                let foundSubtopic = null;
                for (const topic of allTopicsData) {
                    foundSubtopic = topic.subtopics.find(sub => sub.id === task.subtopicId);
                    if (foundSubtopic) {
                        subtopicTitle = foundSubtopic.title;
                        break;
                    }
                }
                taskContent = `${task.type === 'study' ? 'Estudiar' : 'Repasar'}: ${subtopicTitle}`;
                currentId = task.subtopicId;
                isCompleted = getSubtopicCompletionStatus(currentId);

                taskItem.className = `text-gray-700 ${isCompleted ? 'line-through text-green-600' : ''}`;
                taskItem.innerHTML = `
                    <input type="checkbox" id="task-${currentId}" class="mr-2" data-subtopic-id="${currentId}" ${isCompleted ? 'checked' : ''}>
                    <label for="task-${currentId}">${taskContent}</label>
                `;
                tasksList.appendChild(taskItem);

            } else if (task.type.includes('simulacro')) {
                taskContent = `Realizar ${task.type.replace(/-/g, ' ').replace('1',' Uno').replace('2',' Dos').replace('general',' General').replace('parcial',' Parcial').replace('del dia', ' del Día').trim()}`; // Formatear nombre
                taskItem.className = `text-purple-700 font-medium`;
                taskItem.innerHTML = `<span>${taskContent}</span> <a href="#" class="ml-2 text-blue-500 hover:underline" data-nav-target="simulacros">(Ir a Simulacros)</a>`;
                tasksList.appendChild(taskItem);
            } else if (task.type.includes('review-simulacro')) {
                 taskContent = `Revisar ${task.type.replace(/-/g, ' ').replace('1','Uno').trim()}`;
                 taskItem.className = `text-orange-700 font-medium`;
                 taskItem.innerHTML = `<span>${taskContent}</span> <a href="#" class="ml-2 text-blue-500 hover:underline" data-nav-target="simulacros">(Ver Resultados)</a>`;
                 tasksList.appendChild(taskItem);
            } else if (task.type === 'final-review-flashcards' || task.type === 'check-logistics' || task.type === 'light-review' || task.type === 'full-rest' || task.type === 'exam-day' || task.type === 'rest' || task.type === 'review-all-weaknesses') {
                const taskDisplayMap = {
                    "final-review-flashcards": "Repaso Final: Tarjetas y Puntos Clave",
                    "check-logistics": "Logística del Examen (Documentos, Ruta)",
                    "light-review": "Repaso Ligero / Descanso Activo",
                    "full-rest": "¡Descanso Total!",
                    "exam-day": "DÍA DEL EXAMEN",
                    "rest": "Descanso",
                    "review-all-weaknesses": "Repasar todas las debilidades identificadas"
                };
                taskContent = taskDisplayMap[task.type] || task.type; // Usar el mapeo o el tipo
                taskItem.className = `text-gray-800 italic`;
                if (task.type === 'exam-day' || task.type === 'full-rest') {
                    taskItem.className += ' font-bold text-red-600';
                } else if (task.type === 'rest' || task.type === 'light-review') {
                    taskItem.className += ' text-green-600';
                }
                taskItem.innerHTML = `<span>${taskContent}</span>`;
                tasksList.appendChild(taskItem);
            }
        });
    }

    // Añadir Event Listener para los checkboxes de completar tarea
    cronogramaContainer.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox' && event.target.dataset.subtopicId) {
            const subtopicId = event.target.dataset.subtopicId;
            const isChecked = event.target.checked;
            markSubtopicAsCompleted(subtopicId, isChecked);

            // Actualizar la apariencia del texto
            const label = event.target.nextElementSibling;
            if (isChecked) {
                label.classList.add('line-through', 'text-green-600');
            } else {
                label.classList.remove('line-through', 'text-green-600');
            }
        }
    });

    // Event listener para los enlaces "Ir a Simulacros" dentro del cronograma
    cronogramaContainer.addEventListener('click', (event) => {
        const target = event.target;
        if (target.tagName === 'A' && target.dataset.navTarget === 'simulacros') {
            event.preventDefault();
            navigateTo('simulacros');
        }
    });

    // Actualizar el progreso general al cargar la vista del cronograma
    updateOverallProgress();
}

// =======================================================
// LÓGICA DE LOGROS (ACHIEVEMENTS)
// =======================================================

// Manejador para el click del botón "Ver Todos los Logros" del dashboard
function handleViewAllAchievementsClick(e) {
    e.preventDefault();
    navigateTo('achievements');
}

// Función para obtener un logro por su ID
function getAchievementDefinition(id) {
    return achievementsDefinitions.find(ach => ach.id === id);
}

// Función para añadir un logro
function grantAchievement(achievementId) {
    if (!userAchievements[achievementId]) {
        userAchievements[achievementId] = {
            obtained: true,
            date: new Date().toISOString()
        };
        localStorage.setItem('userAchievements', JSON.stringify(userAchievements));
        const achDef = getAchievementDefinition(achievementId);
        if (achDef) {
            alert(`¡Nuevo Logro Desbloqueado! 🎉\n${achDef.name}: ${achDef.description}`);
        }
        displayDashboardAchievements(); // Actualizar widget del dashboard
    }
}

// Función para verificar logros (llamada desde puntos clave)
function checkAchievements() {
    // Logro: Primer Tema Completo (si el cronograma lo usa)
    // Esto se verifica cuando se marca un subtema como completado
    const completedSubtopics = Object.keys(localStorage).filter(key => key.startsWith('completed_') && localStorage.getItem(key) === 'true');
    if (!userAchievements['first_module_completed'] && completedSubtopics.length > 0) {
        grantAchievement('first_module_completed');
    }

    // Logros de completar todos los subtemas de un tópico
    achievementsDefinitions.filter(ach => ach.type === 'topic_completion').forEach(achDef => {
        if (!userAchievements[achDef.id]) {
            const topic = allTopicsData.find(t => t.id === achDef.topicId);
            if (topic) {
                const allSubtopicsCompletedInTopic = topic.subtopics.every(sub => getSubtopicCompletionStatus(sub.id));
                if (allSubtopicsCompletedInTopic) {
                    grantAchievement(achDef.id);
                }
            }
        }
    });

    // Logros de racha de estudio (esto requeriría un registro más complejo por día)
    // Placeholder conceptual.

    // Logros de simulacros (ya integrado en endQuiz)
}

// Función para mostrar los logros en el widget del dashboard
function displayDashboardAchievements() {
    const achievementsDisplay = document.getElementById('achievements-display');
    if (!achievementsDisplay) return; // Asegurarse de que el elemento exista

    achievementsDisplay.innerHTML = ''; // Limpiar placeholders

    const obtainedAchievements = Object.keys(userAchievements).filter(achId => userAchievements[achId].obtained);
    const achievementsToShow = obtainedAchievements.slice(0, 3); // Mostrar los primeros 3 o los más recientes

    if (achievementsToShow.length === 0) {
        // Mostrar placeholders grises si no hay logros obtenidos
        for (let i = 0; i < 3; i++) {
            const img = document.createElement('img');
            img.src = "https://via.placeholder.com/60x60/d1d5db/ffffff?text=?";
            img.alt = "Logro Pendiente";
            img.title = "Logro Pendiente";
            img.className = "w-16 h-16 rounded-full bg-gray-200 p-2 opacity-50";
            achievementsDisplay.appendChild(img);
        }
        return;
    }

    achievementsToShow.forEach(achId => {
        const achDef = getAchievementDefinition(achId);
        if (achDef) {
            const img = document.createElement('img');
            img.src = achDef.icon;
            img.alt = achDef.name;
            img.title = `${achDef.name}: ${achDef.description}`; // Tooltip
            img.className = `w-16 h-16 rounded-full p-2 ${achDef.color} transition duration-300 transform hover:scale-110`;
            achievementsDisplay.appendChild(img);
        }
    });

    // Añadir placeholders si hay menos de 3 logros obtenidos
    for (let i = achievementsToShow.length; i < 3; i++) {
        const img = document.createElement('img');
        img.src = "https://via.placeholder.com/60x60/d1d5db/ffffff?text=?";
        img.alt = "Logro Pendiente";
        img.title = "Logro Pendiente";
        img.className = "w-16 h-16 rounded-full bg-gray-200 p-2 opacity-50";
        achievementsDisplay.appendChild(img);
    }
}

// Función para renderizar la vista completa de logros
function renderAchievementsView() {
    contentArea.innerHTML = `
        <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Mis Logros</h2>
        <div class="bg-white p-6 rounded-lg shadow-lg">
            <p class="text-gray-600 mb-6 text-center">Aquí están todos los hitos que has alcanzado en tu camino hacia el éxito en la Convocatoria Distrito Capital 6.</p>
            <div id="all-achievements-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                </div>
        </div>
    `;
    const allAchievementsGrid = document.getElementById('all-achievements-grid');

    achievementsDefinitions.forEach(achDef => {
        const isObtained = userAchievements[achDef.id] && userAchievements[achDef.id].obtained;
        const achievementCard = document.createElement('div');
        achievementCard.className = `p-4 rounded-lg shadow-md flex flex-col items-center text-center transition duration-300 ${isObtained ? achDef.color : 'bg-gray-100 opacity-60'}`;
        
        achievementCard.innerHTML = `
            <img src="${isObtained ? achDef.icon : 'https://via.placeholder.com/60x60/d1d5db/ffffff?text=?'}" 
                 alt="${achDef.name}" 
                 class="w-20 h-20 rounded-full p-2 mb-3 border-4 ${isObtained ? 'border-white' : 'border-gray-300'}">
            <h4 class="text-lg font-semibold ${isObtained ? 'text-white' : 'text-gray-800'} mb-1">${achDef.name}</h4>
            <p class="text-sm ${isObtained ? 'text-white' : 'text-gray-600'}">${achDef.description}</p>
            ${isObtained ? `<p class="text-xs ${achDef.color.replace('bg-', 'text-')} mt-2">Obtenido el: ${new Date(userAchievements[achDef.id].date).toLocaleDateString()}</p>` : '<p class="text-xs text-gray-500 mt-2">Aún no desbloqueado</p>'}
        `;
        allAchievementsGrid.appendChild(achievementCard);
    });
}