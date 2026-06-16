// ============================================================
//  СОСТОЯНИЕ ИГРЫ
// ============================================================
let gameState = {
    day: 1,
    money: 500,
    health: 100,
    satiety: 100,
    mood: 100,
    gender: null
};

const simpleTexts = {
    eat: [
        "Ты выпил протеиновый коктейль со вкусом банана. Мышцы растут!",
        "Закупился BCAA и спортпитом. Энергия на высоте!",
        "Съел правильный обед: куриная грудка и брокколи. Чистая масса!"
    ],
    rest: [
        "Ты ушел со смены пораньше и хорошенько выспался. Силы восстановлены!",
        "Сходил на спортивный массаж. Мышцы расслабились, готов к новым рекордам.",
        "Провел день без тренировок. Отдых — важная часть прогресса!"
    ]
};

// --- БАЗА ВОПРОСОВ ПО АНАТОМИИ (КУРСЫ) ---
const coursesQuestions = [
    // ... (ваши вопросы, они есть в вашем коде, не меняю)
];

// --- БАЗА ЭКСПЕРТНЫХ КЕЙСОВ (ТРЕНИРОВКА) ---
const trainingCases = [
    // ... (ваши кейсы, они есть в вашем коде, не меняю)
];

// ============================================================
//  МУЗЫКА ЧЕРЕЗ WEB AUDIO API (БЕЗ СИСТЕМНОГО ПЛЕЕРА)
// ============================================================
let audioContext = null;
let audioBuffer = null;
let audioSource = null;
let isMusicPlaying = false;
let musicLoaded = false;
let _musicWasPlaying = false;
const musicToggleBtn = document.getElementById('musicToggleBtn');

// Загрузка музыки
async function loadMusic() {
    try {
        const response = await fetch('bg-music.mp3');
        const arrayBuffer = await response.arrayBuffer();
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        musicLoaded = true;
        console.log('🎵 Музыка загружена через Web Audio API');
        updateMusicUI();
    } catch (e) {
        console.warn('Ошибка загрузки музыки (файл bg-music.mp3 отсутствует):', e);
        musicLoaded = false;
    }
}

// Воспроизведение
function playMusic() {
    if (!musicLoaded || !audioBuffer || !audioContext) return;
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    if (audioSource) {
        audioSource.stop();
        audioSource.disconnect();
        audioSource = null;
    }
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.loop = true;
    audioSource.connect(audioContext.destination);
    audioSource.start(0);
    isMusicPlaying = true;
    updateMusicUI();
    console.log('🎵 Музыка играет');
}

// Остановка
function pauseMusic() {
    if (audioSource) {
        audioSource.stop();
        audioSource.disconnect();
        audioSource = null;
    }
    isMusicPlaying = false;
    if (audioContext) {
        audioContext.suspend();
    }
    updateMusicUI();
    console.log('🔇 Музыка остановлена');
}

// Переключение по кнопке
function toggleMusic() {
    if (isMusicPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

// Обновление иконки кнопки
function updateMusicUI() {
    if (!musicToggleBtn) return;
    musicToggleBtn.textContent = isMusicPlaying ? '🔊' : '🔇';
    musicToggleBtn.title = isMusicPlaying ? 'Выключить музыку' : 'Включить музыку';
}

// Первый запуск (после клика)
function tryPlayMusic() {
    if (!isMusicPlaying && musicLoaded) {
        playMusic();
    }
}

// Обработка сворачивания через VK Bridge
function initVKMusicHandlers() {
    if (typeof vkBridge !== 'undefined' && vkBridge) {
        vkBridge.subscribe((e) => {
            if (e.detail.type === 'VKWebAppUpdateConfig') {
                const data = e.detail.data;
                if (data && data.is_app_hidden) {
                    if (isMusicPlaying) {
                        pauseMusic();
                        _musicWasPlaying = true;
                    }
                } else if (_musicWasPlaying) {
                    playMusic();
                    _musicWasPlaying = false;
                }
            }
        });
    } else {
        // fallback через visibilitychange (для теста вне VK)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (isMusicPlaying) {
                    pauseMusic();
                    _musicWasPlaying = true;
                }
            } else if (_musicWasPlaying) {
                playMusic();
                _musicWasPlaying = false;
            }
        });
    }
}

// --- АВТОМАТИЧЕСКИЙ ЗАПУСК ИГРЫ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("Запуск игры после полной сборки страницы...");
        loadGame();
        loadMusic(); // загружаем музыку
        initVKMusicHandlers();
        // Вешаем обработчик на кнопку
        if (musicToggleBtn) {
            musicToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMusic();
            });
        }
        // Запуск музыки после первого клика по странице
        document.addEventListener('click', tryPlayMusic, { once: true });
        document.addEventListener('touchstart', tryPlayMusic, { once: true });
    });
} else {
    console.log("Страница уже готова, запускаем игру...");
    loadGame();
    loadMusic();
    initVKMusicHandlers();
    if (musicToggleBtn) {
        musicToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMusic();
        });
    }
    document.addEventListener('click', tryPlayMusic, { once: true });
    document.addEventListener('touchstart', tryPlayMusic, { once: true });
}

// --- ВЫБОР ТРЕНЕРА ---
function selectGender(gender) {
    gameState.gender = gender;
    document.getElementById("start-screen").style.display = "none";
    updateUI();
    saveGame();
    console.log("Персонаж выбран, игра сохранена.");
}

// --- ОБНОВЛЕНИЕ АВАТАРА ТРЕНЕРА ---
function updateAvatar() {
    const avatarBlock = document.getElementById("avatar-block");
    if (!avatarBlock || !gameState.gender) return;
    let imageName = "";
    if (gameState.health < 30 || gameState.satiety < 30) {
        imageName = gameState.gender === "boy" ? "boy_sad.png" : "girl_sad.png";
    } else {
        imageName = gameState.gender === "boy" ? "boy.png" : "girl.png";
    }
    avatarBlock.innerHTML = `<img src="${imageName}" alt="Тренер">`;
}

// --- ПРОВЕРКА ОТВЕТОВ В ТЕСТАХ ---
function checkAnswer(selectedOption, correctAnswer, type) {
    const quizBlock = document.getElementById("quiz-options-block");
    if (quizBlock) quizBlock.style.display = "none";
    document.getElementById("main-actions-block").style.display = "block";
    document.getElementById("ad-block").style.display = "block";

    let resultText = "";
    if (selectedOption === correctAnswer) {
        if (type === 'study') {
            gameState.satiety += 25;
            gameState.mood += 15;
            resultText = "✅ Великолепный ответ! Ты успешно прошел курсы. Твой авторитет и репутация взлетели!";
        } else if (type === 'work') {
            gameState.mood += 15;
            resultText = "✅ Отличное решение кейса! Репутация клуба растет!";
        }
    } else {
        if (type === 'study') {
            gameState.satiety -= 15;
            resultText = `❌ Ошибка! Правильно: "${correctAnswer}". Ты провалил экзамен.`;
        } else if (type === 'work') {
            gameState.mood -= 20;
            gameState.health -= 10;
            resultText = `❌ Неверный выбор! Правильно: "${correctAnswer}". Репутация клуба пострадала.`;
        }
    }
    updateLog(resultText);
    finalizeTurn();
}

// --- ЗАВЕРШЕНИЕ ХОДА И ПРОВЕРКА ЛИМИТОВ ---
function finalizeTurn() {
    gameState.health = Math.min(100, Math.max(0, gameState.health));
    gameState.satiety = Math.min(100, Math.max(0, gameState.satiety));
    gameState.mood = Math.min(100, Math.max(0, gameState.mood));

    if (gameState.health <= 0 || gameState.satiety <= 0 || gameState.mood <= 0) {
        updateUI();
        showGameOverModal();
        return;
    }
    updateUI();
    saveGame();
}

// --- ОБНОВЛЕНИЕ ИНТЕРФЕЙСА НА ЭКРАНЕ ---
function updateUI() {
    const healthVal = document.getElementById('val-health');
    const satietyVal = document.getElementById('val-satiety');
    const moodVal = document.getElementById('val-mood');
    const dayStat = document.getElementById('stat-day');
    const moneyStat = document.getElementById('stat-money');

    if (healthVal) healthVal.innerText = Math.floor(gameState.health);
    if (satietyVal) satietyVal.innerText = Math.floor(gameState.satiety);
    if (moodVal) moodVal.innerText = Math.floor(gameState.mood);
    if (dayStat) dayStat.innerText = gameState.day;
    if (moneyStat) moneyStat.innerText = Math.floor(gameState.money);

    const healthBar = document.getElementById('bar-health');
    const satietyBar = document.getElementById('bar-satiety');
    const moodBar = document.getElementById('bar-mood');

    if (healthBar) healthBar.style.width = gameState.health + '%';
    if (satietyBar) satietyBar.style.width = gameState.satiety + '%';
    if (moodBar) moodBar.style.width = gameState.mood + '%';

    updateAvatar();
}

// --- БЕЗОПАСНАЯ ОБЁРТКА ДЛЯ VK BRIDGE ---
function safeVkBridgeSend(method, params) {
    if (typeof vkBridge !== 'undefined' && vkBridge) {
        return vkBridge.send(method, params);
    } else {
        console.warn(`VK Bridge не доступен, вызов ${method} пропущен`);
        return Promise.reject(new Error("VK Bridge not available"));
    }
}

// --- ФУНКЦИИ ДЛЯ РЕКЛАМЫ ВКОНТАКТЕ ---
function watchAdForMoney() {
    safeVkBridgeSend('VKWebAppShowNativeAds', { ad_format: 'reward' })
        .then((data) => {
            if (data.result) {
                gameState.money += 1500;
                updateUI();
                updateLog("📺 Вы посмотрели рекламу и заработали 1500 ₽!");
                saveGame();
            }
        })
        .catch((error) => {
            console.error("Ошибка рекламы ВК:", error);
            updateLog("❌ Не удалось загрузить рекламу. Попробуйте позже.");
        });
}

function watchAdForRevive() {
    safeVkBridgeSend('VKWebAppShowNativeAds', { ad_format: 'reward' })
        .then((data) => {
            if (data.result) {
                gameState.health = 50;
                gameState.satiety = 50;
                gameState.mood = 50;
                document.getElementById("game-over-modal").style.display = "none";
                updateLog("✨ Ты посмотрел рекламу, восстановил силы и вернулся на работу тренером!");
                finalizeTurn();
            }
        })
        .catch((error) => {
            console.error('Ошибка рекламы в ВК:', error);
            gameState.health = 50;
            gameState.satiety = 50;
            gameState.mood = 50;
            document.getElementById("game-over-modal").style.display = "none";
            updateLog("✨ Ошибка сети! Силы тренера восстановлены автоматически на 50%.");
            finalizeTurn();
        });
}

// --- СОХРАНЕНИЕ И ЗАГРУЗКА ПРОГРЕССА ---
function saveGame() {
    localStorage.setItem("trainer_sim_save_final_v4", JSON.stringify(gameState));
}

function loadGame() {
    safeVkBridgeSend('VKWebAppInit', {})
        .then(() => console.log('VK Bridge успешно инициализирован'))
        .catch(err => console.warn('VK Bridge init ошибка (не страшно)', err));

    const save = localStorage.getItem("trainer_sim_save_final_v4");
    if (save) {
        const loaded = JSON.parse(save);
        if (loaded.gender) {
            gameState = loaded;
            const startScreen = document.getElementById("start-screen");
            if (startScreen) startScreen.style.display = "none";
        }
    }
    updateUI();
}

function showGameOverModal() {
    const finalDay = document.getElementById("final-day");
    const modal = document.getElementById("game-over-modal");
    if (finalDay) finalDay.textContent = gameState.day;
    if (modal) modal.style.display = "flex";
}

function restartGame() {
    gameState = { day: 1, money: 500, health: 100, satiety: 100, mood: 100, gender: null };
    const modal = document.getElementById("game-over-modal");
    const startScreen = document.getElementById("start-screen");
    if (modal) modal.style.display = "none";
    if (startScreen) startScreen.style.display = "flex";
    updateUI();
    saveGame();
}

// --- ФУНКЦИЯ ДЛЯ ЗАПУСКА КВЕСТОВ И ТЕСТОВ ---
function startTrainerQuiz(type) {
    const quizBlock = document.getElementById("quiz-options-block");
    const mainActions = document.getElementById("main-actions-block");
    const adBlock = document.getElementById("ad-block");

    if (!quizBlock || !mainActions || !adBlock) return;

    mainActions.style.display = "none";
    adBlock.style.display = "none";
    quizBlock.style.display = "block";
    quizBlock.innerHTML = "";

    if (type === 'study') {
        if (gameState.money < 500) {
            updateLog("❌ У тебя недостаточно денег на курсы по анатомии! Нужно 500 ₽.");
            quizBlock.style.display = "none";
            mainActions.style.display = "block";
            adBlock.style.display = "block";
            return;
        }
        gameState.money -= 500;
        updateUI();

        const randomQuestion = coursesQuestions[Math.floor(Math.random() * coursesQuestions.length)];
        updateLog(`🎓 Курсы повышения квалификации. Вопрос: ${randomQuestion.question}`);

        randomQuestion.options.forEach(option => {
            const btn = document.createElement("button");
            btn.className = "btn btn-quiz";
            btn.textContent = option;
            btn.onclick = () => checkAnswer(option, randomQuestion.correct, 'study');
            quizBlock.appendChild(btn);
        });
    } else if (type === 'work') {
        if (gameState.health < 20) {
            updateLog("❌ Ты слишком устал для проведения тренировки! Отдохни или выпей спортпит.");
            quizBlock.style.display = "none";
            mainActions.style.display = "block";
            adBlock.style.display = "block";
            return;
        }
        gameState.health -= 20;
        updateUI();

        const randomCase = trainingCases[Math.floor(Math.random() * trainingCases.length)];
        updateLog(`👟 Тренировка клиента. Кейс: ${randomCase.question}`);

        randomCase.options.forEach(option => {
            const btn = document.createElement("button");
            btn.className = "btn btn-quiz";
            btn.textContent = option;
            btn.onclick = () => {
                checkAnswer(option, randomCase.correct, 'work');
                if (option === randomCase.correct) {
                    gameState.money += 1000;
                    updateLog(`💰 За квалифицированную тренировку вы получили +1000 ₽.`);
                } else {
                    gameState.money += 500;
                    updateLog(`💰 Клиент заплатил 500 ₽ за занятие.`);
                }
                gameState.day += 1;
                updateUI();
                finalizeTurn();
            };
            quizBlock.appendChild(btn);
        });
    }
}

// --- ФУНКЦИЯ ДЛЯ ПРОСТЫХ ДЕЙСТВИЙ (ЕДА И ОТДЫХ) ---
function makeAction(type) {
    if (type === 'eat') {
        if (gameState.money < 300) {
            updateLog("❌ Нет денег на спортпит! Нужно 300 ₽.");
            return;
        }
        gameState.money -= 300;
        gameState.health += 20;
        gameState.satiety += 10;
        const textArray = simpleTexts.eat;
        updateLog(textArray[Math.floor(Math.random() * textArray.length)]);
    } else if (type === 'rest') {
        gameState.health += 40;
        gameState.mood += 10;
        gameState.day += 1;
        const textArray = simpleTexts.rest;
        updateLog(textArray[Math.floor(Math.random() * textArray.length)]);
    }
    finalizeTurn();
}

function updateLog(text) {
    const log = document.getElementById('text-log');
    if (log) log.textContent = text;
}
