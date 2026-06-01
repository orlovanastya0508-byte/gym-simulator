// ========== МУЗЫКА И КНОПКА (УЛУЧШЕННАЯ) ==========
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('musicToggleBtn');
    const audio = document.getElementById('bgMusic') || new Audio('bg-music.mp3');
    
    if (!audio.loop) audio.loop = true;
    if (!audio.volume) audio.volume = 0.3;
    
    let musicOn = localStorage.getItem('music_enabled') !== 'false'; // по умолчанию вкл
    
    function updateButton() {
        if (!btn) return;
        btn.textContent = musicOn ? '🔊' : '🔇';
        if (musicOn) {
            audio.play().catch(e => console.log('Автовоспроизведение заблокировано, кликни по странице'));
        } else {
            audio.pause();
        }
    }
    
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            musicOn = !musicOn;
            localStorage.setItem('music_enabled', musicOn);
            updateButton();
        });
    }
    
    // Первый клик по странице – включаем музыку (обходим блокировку)
    const startMusicOnInteraction = () => {
        if (musicOn) audio.play().catch(e => console.warn(e));
        document.removeEventListener('click', startMusicOnInteraction);
        document.removeEventListener('touchstart', startMusicOnInteraction);
    };
    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('touchstart', startMusicOnInteraction);
    
    updateButton();
});// --- СОСТОЯНИЕ ИГРЫ ТРЕНЕРА ---
let gameState = {
    day: 1,
    money: 500,
    health: 100,  // Энергия
    satiety: 100, // Авторитет
    mood: 100,    // Репутация
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
    {
        question: "Какая из мышечных групп выполняет функцию основного синергиста при выполнении жима штанги лежа на горизонтальной скамье?",
        options: ["Широчайшая мышца спины", "Передние пучки дельтовидных мышц и трицепсы", "Малая круглая мышца"],
        correct: "Передние пучки дельтовидных мышц и трицепсы"
    },
    {
        question: "Что происходит с мышечным волокном при накоплении ионов водорода (H+) во время интенсивного анаэробного гликолиза?",
        options: ["Резко увеличивается синтез белка", "Повышается чувствительность к ионам кальция", "Снижается pH среды, блокируя ферменты и нарушая сократимость"],
        correct: "Снижается pH среды, блокируя ферменты и нарушая сократимость"
    },
    {
        question: "Какая мышца голени отвечает за удержание равновесия при согнутом коленном суставе и задействуется в упражнении «Подъемы на носки сидя»?",
        options: ["Икроножная мышца", "Камбаловидная мышца", "Подошвенная мышца"],
        correct: "Камбаловидная мышца"
    },
    {
        question: "Какое явление описывает закон Хеннемана применительно к рекрутированию двигательных единиц во время силового тренинга?",
        options: ["Двигательные единицы включаются хаотично", "Сначала рекрутируются мелкие низкопороговые волокна, а по мере роста нагрузки — крупные высокопороговые", "Скорость сокращения волокон падает пропорционально их объему"],
        correct: "Сначала рекрутируются мелкие низкопороговые волокна, а по мере роста нагрузки — крупные высокопороговые"
    },
    {
        question: "Как называется период в процессе восстановления после тренировки, когда показатели физических качеств или мышечного объема временно превышают исходный уровень?",
        options: ["Фаза декомпенсации", "Фаза суперкомпенсации", "Окна анаболического плато"],
        correct: "Фаза суперкомпенсации"
    },
    {
        question: "Какая мышца выполняет функцию основного стабилизатора таза во фронтальной плоскости при ходьбе, беге и выполнении упражнений на одной ноге?",
        options: ["Большая ягодичная мышца", "Прямая мышца бедра", "Средняя ягодичная мышца"],
        correct: "Средняя ягодичная мышца"
    },
    {
        question: "Какая глубокая мышца ко́ра при сокращении повышает внутрибрюшное давление и опоясывает талию наподобие корсета, обеспечивая жесткую стабилизацию поясничного отдела?",
        options: ["Прямая мышца живота", "Внутренняя косая мышца живота", "Поперечная мышца живота"],
        correct: "Поперечная мышца живота"
    }
];

// --- БАЗА ЭКСПЕРТНЫХ КЕЙСОВ (ТРЕНИРОВКА) ---
const trainingCases = [
    {
        question: "На персональной тренировке клиент с гипертонией в анамнезе выполняет жим ногами. На 8-м повторении он начинает задерживать дыхание (натуживаться). Твои действия?",
        options: [
            "Остановить подход, объяснить опасность эффекта Вальсальвы и скорректировать выдох на усилии",
            "Похвалить за усердие и крикнуть: «Давай еще два повторения, держи натяжение!»"
        ],
        correct: "Остановить подход, объяснить опасность эффекта Вальсальвы и скорректировать выдох на усилии"
    },
    {
        question: "Девушка просит составить программу тренировок для «локального жиросжигания исключительно в области внутренней поверхности бедра». Как поступишь?",
        options: [
            "Даешь ей комплекс из 5 упражнений на приводящие мышцы на тренажере-сведении",
            "Объясняешь системность липолиза через дефицит калорий, ставишь в план базовые многосуставные упражнения"
        ],
        correct: "Объясняешь системность липолиза через дефицит калорий, ставишь в план базовые многосуставные упражнения"
    },
    {
        question: "Клиент после перенесенного надрыва сухожилия длинной головки бицепса (прошло 4 месяца) требует вернуть в программу тяжелые подтягивания супинированным хватом. Твои действия?",
        options: [
            "Отказываешь, заменяешь на изолированные упражнения в эксцентрической фазе с минимальным весом",
            "Разрешаешь, но просишь делать аккуратно и контролировать боль"
        ],
        correct: "Отказываешь, заменяешь на изолированные упражнения в эксцентрической фазе с минимальным весом"
    },
    {
        question: "Во время приседаний со штангой у клиента заметно «заваливаются» колени внутрь (вальгус коленного сустава). С чего начнешь исправление?",
        options: [
            "Скажешь сильнее упираться пятками в пол и заматываешь колени бинтами",
            "Снизишь вес, добавишь фитнес-резинку на бедра для активации средней ягодичной мышцы"
        ],
        correct: "Снизишь вес, добавишь фитнес-резинку на бедра для активации средней ягодичной мышцы"
    },
    {
        question: "Опытный клиент жалуется на острую «простреливающую» боль в передней части плеча при выполнении жима штанги лежа в нижней точке амплитуды. Как отреагируешь?",
        options: [
            "Исключаешь жим штанги, заменяешь на жим гантелей с нейтральным хватом в ограниченной амплитуде",
            "Рекомендуешь помазать плечо разогревающей мазью перед следующим подходом и продолжить"
        ],
        correct: "Исключаешь жим штанги, заменяешь на жим гантелей с нейтральным хватом в ограниченной амплитуде"
    },
    {
        question: "Клиент после тяжелого рабочего дня пришел на тренировку вялым, заторможенным и жалуется на сильную головную боль. Какое решение примет профессионал?",
        options: [
            "Даешь ему предтренировочный комплекс с кофеином, чтобы взбодрить перед тяжелым приседом",
            "Отменяешь силовую работу, проводишь легкую МФР-прокатку (релиз) и тренировку на мобильность/стретчинг"
        ],
        correct: "Отменяешь силовую работу, проводишь легкую МФР-прокатку (релиз) и тренировку на мобильность/стретчинг"
    }
];

// --- АВТОМАТИЧЕСКИЙ ЗАПУСК ИГРЫ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("Запуск игры после полной сборки страницы...");
        loadGame();
    });
} else {
    console.log("Страница уже готова, запускаем игру...");
    loadGame();
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
    if (gameState.health > 100) gameState.health = 100;
    if (gameState.satiety > 100) gameState.satiety = 100;
    if (gameState.mood > 100) gameState.mood = 100;

    if (gameState.health <= 0 || gameState.satiety <= 0 || gameState.mood <= 0) {
        if (gameState.health < 0) gameState.health = 0;
        if (gameState.satiety < 0) gameState.satiety = 0;
        if (gameState.mood < 0) gameState.mood = 0;
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

// --- БЕЗОПАСНАЯ ОБЁРТКА ДЛЯ VK BRIDGE (падает, но не ломает игру) ---
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
    // Инициализация VK Bridge (безопасно)
    safeVkBridgeSend('VKWebAppInit', {})
        .then(() => console.log('VK Bridge успешно инициализирован'))
        .catch(err => console.warn('VK Bridge init ошибка (не страшно)', err));

    // Загрузка сохранения
    const save = localStorage.getItem("trainer_sim_save_final_v4");
    if (save) { 
        const loaded = JSON.parse(save);
        // обновляем только если есть gender, иначе остаёмся на стартовом экране
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

// --- ФУНКЦИЯ ДЛЯ ЗАПУСКА КВЕСТОВ И ТЕСТОВ (ИСПРАВЛЕНА: ТРЕНИРОВКА ОТКРЫВАЕТ КЕЙСЫ) ---
function startTrainerQuiz(type) {
    const quizBlock = document.getElementById("quiz-options-block");
    const mainActions = document.getElementById("main-actions-block");
    const adBlock = document.getElementById("ad-block");

    if (!quizBlock || !mainActions || !adBlock) return;

    // Скрываем обычные кнопки, показываем блок с тестом
    mainActions.style.display = "none";
    adBlock.style.display = "none";
    quizBlock.style.display = "block";
    quizBlock.innerHTML = ""; // Очищаем старые кнопки

    if (type === 'study') {
        // Курсы: проверка денег
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
    } 
    else if (type === 'work') {
        // Тренировка: теперь открывается случайный кейс из trainingCases
        if (gameState.health < 20) {
            updateLog("❌ Ты слишком устал для проведения тренировки! Отдохни или выпей спортпит.");
            quizBlock.style.display = "none";
            mainActions.style.display = "block";
            adBlock.style.display = "block";
            return;
        }
        // Снимаем энергию ДО вопроса (логично: клиент уже ждёт)
        gameState.health -= 20;
        updateUI();

        const randomCase = trainingCases[Math.floor(Math.random() * trainingCases.length)];
        updateLog(`👟 Тренировка клиента. Кейс: ${randomCase.question}`);

        randomCase.options.forEach(option => {
            const btn = document.createElement("button");
            btn.className = "btn btn-quiz";
            btn.textContent = option;
            btn.onclick = () => {
                // В случае успеха/неудачи добавим деньги и день, а также вызовем checkAnswer
                // Но checkAnswer уже содержит начисление репутации и штрафов.
                // Нужно добавить +1000 ₽ и +1 день после ответа.
                // Проще: переопределим checkAnswer для work, либо вызовем свою логику.
                // Сделаем так: вызываем checkAnswer, а после него добавим деньги и день.
                checkAnswer(option, randomCase.correct, 'work');
                // После обработки ответа добавляем награду за проведённую тренировку
                if (option === randomCase.correct) {
                    gameState.money += 1000;
                    updateLog(`💰 За квалифицированную тренировку вы получили +1000 ₽.`);
                } else {
                    gameState.money += 500; // хоть что-то
                    updateLog(`💰 Клиент заплатил 500 ₽ за занятие.`);
                }
                gameState.day += 1;
                updateUI();
                finalizeTurn(); // finalizeTurn уже вызывается внутри checkAnswer, но повторный вызов не страшен
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
