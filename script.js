// --- СОСТОЯНИЕ ИГРЫ ТРЕНЕРА ---
vkBridge.send('VKWebAppInit')
  .then((data) => {
    if (data.result) {
      console.log('VK Bridge успешно запущен');
    }
  })
  .catch((error) => {
    console.error('Ошибка инициализации VK Bridge', error);
  });

let gameState = {
    day: 1,
    money: 500,
    health: 100,  // Энергия
    satiety: 100, // Авторитет
    mood: 100,    // Репутация
    gender: null
};

// Переменные для интеграции SDK Яндекса
let ysdk = null;
let player = null;

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
        question: "Во время приседаний со штангой у клиента заметно «заваливаются» колени внутнь (вальгус коленного сустава). С чего начнешь исправление?",
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

// --- УМНЫЙ ЗАПУСК С СКРИПТОМ ЯНДЕКСА ---
window.onload = function() {
    console.log("Проверка окружения...");
    if (typeof YaGames !== 'undefined') {
        YaGames.init().then(initYsdk => {
            console.log("Яндекс SDK успешно подключен!");
            ysdk = initYsdk;
            ysdk.getPlayer().then(_player => {
                player = _player;
                loadGame();
            }).catch(err => { loadGame(); });
        }).catch(err => { loadGame(); });
    } else {
        console.log("Локальный запуск на ПК. Яндекс SDK отсутствует.");
        loadGame();
    }
};

// --- ВЫБОР ТРЕНЕРА И СИГНАЛ GAME READY ---
function selectGender(gender) {
    gameState.gender = gender;
    document.getElementById("start-screen").style.display = "none";
    updateUI();
    saveGame();

    // Отправляем критически важный сигнал модераторам Яндекса
    if (ysdk && ysdk.features && ysdk.features.LoadingAPI) {
        ysdk.features.LoadingAPI.ready();
        console.log("Вызван API: Game Ready!");
    }
}

function updateAvatar() {
    const avatarBlock = document.getElementById("avatar-block");
    if (!gameState.gender) return;

    let imageName = "";
    if (gameState.health < 30 || gameState.satiety < 30) {
        imageName = gameState.gender === "boy" ? "boy_sad.png" : "girl_sad.png";
    } else {
        imageName = gameState.gender === "boy" ? "boy.png" : "girl.png";
    }
    avatarBlock.innerHTML = `<img src="${imageName}" alt="Тренер">`;
}

function updateUI() {
    if (!gameState.gender) {
        document.getElementById("start-screen").style.display = "flex";
        return;
    } else {
        document.getElementById("start-screen").style.display = "none";
    }

    document.getElementById("stat-day").textContent = gameState.day;
    document.getElementById("stat-money").textContent = gameState.money;
    document.getElementById("val-health").textContent = Math.round(gameState.health);
    document.getElementById("val-satiety").textContent = Math.round(gameState.satiety);
    document.getElementById("val-mood").textContent = Math.round(gameState.mood);

    document.getElementById("bar-health").style.width = gameState.health + "%";
    document.getElementById("bar-satiety").style.width = gameState.satiety + "%";
    document.getElementById("bar-mood").style.width = gameState.mood + "%";

    updateAvatar();

    if (gameState.health <= 0 || gameState.satiety <= 0) {
        showGameOverModal();
    }
}

function makeAction(type) {
    if (gameState.health <= 0 || gameState.satiety <= 0) return;

    gameState.day += 1;
    gameState.satiety -= 8;

    const phrases = simpleTexts[type];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    document.getElementById("text-log").textContent = randomPhrase;

    if (type === 'eat') {
        if (gameState.money >= 300) {
            gameState.money -= 300;
            gameState.health += 35;
            gameState.satiety += 5;
        } else {
            document.getElementById("text-log").textContent = "❌ Нет денег на спортивное питание!";
        }
    } else if (type === 'rest') {
        gameState.health += 40;
        gameState.mood += 15;
    }

    finalizeTurn();
}

function startTrainerQuiz(type) {
    if (gameState.health <= 0 || gameState.satiety <= 0) return;
if (type === 'study' && gameState.money < 500) {
        document.getElementById("text-log").textContent = "❌ Не хватает 500 ₽ на продвинутые курсы!";
        return;
    }

    gameState.day += 1;
    gameState.satiety -= 8;

    let currentItem = null;

    if (type === 'study') {
        gameState.money -= 500;
        currentItem = coursesQuestions[Math.floor(Math.random() * coursesQuestions.length)];
    } else if (type === 'work') {
        gameState.money += 1000;
        gameState.health -= 25;
        currentItem = trainingCases[Math.floor(Math.random() * trainingCases.length)];
    }

    document.getElementById("text-log").textContent = currentItem.question;

    document.getElementById("main-actions-block").style.display = "none";
    document.getElementById("ad-block").style.display = "none";

    const quizBlock = document.getElementById("quiz-options-block");
    quizBlock.innerHTML = "";
    quizBlock.style.display = "flex";

    currentItem.options.forEach(option => {
        const button = document.createElement("button");
        button.className = "btn btn-quiz";
        button.textContent = option;
        button.onclick = function() {
            checkAnswer(option, currentItem.correct, type);
        };
        quizBlock.appendChild(button);
    });
}

function checkAnswer(selectedOption, correctAnswer, type) {
    const quizBlock = document.getElementById("quiz-options-block");
    
    quizBlock.style.display = "none";
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

    document.getElementById("text-log").textContent = resultText;
    finalizeTurn();
}

function finalizeTurn() {
    if (gameState.health > 100) gameState.health = 100;
    if (gameState.satiety > 100) gameState.satiety = 100;
    if (gameState.mood > 100) gameState.mood = 100;

    if (gameState.health < 0) gameState.health = 0;
    if (gameState.satiety < 0) gameState.satiety = 0;

    updateUI();
    saveGame();
}

function watchAdForMoney() {
    if (ysdk) {
        ysdk.adv.showRewardedVideo({
            callbacks: {
                onOpen: () => console.log('Реклама запущена'),
                onRewarded: () => {
                    gameState.money += 1500;
                    document.getElementById("text-log").textContent = "💰 Рекламный спонсор выплатил тебе премию +1500 ₽ за продвижение фитнес-бренда!";
                    finalizeTurn();
                },
                onClose: () => console.log('Реклама закрыта')
            }
        });
    } else {
        gameState.money += 1500;
        document.getElementById("text-log").textContent = "📺 Тестовый режим на ПК: начислено +1500 ₽ за просмотр рекламы!";
        finalizeTurn();
    }
}

function watchAdForRevive() {
    if (ysdk) {
        ysdk.adv.showRewardedVideo({
            callbacks: {
                onRewarded: () => {
                    gameState.health = 50;
                    gameState.satiety = 50;
                    gameState.mood = 50;
                    document.getElementById("game-over-modal").style.display = "none";
                    document.getElementById("text-log").textContent = "✨ Ты восстановил силы и вернулся на работу тренером!";
                    finalizeTurn();
                },
                onClose: () => console.log('Модалка закрыта')
            }
        });
    } else {
        gameState.health = 50;
        gameState.satiety = 50;
        gameState.mood = 50;
        document.getElementById("game-over-modal").style.display = "none";
        document.getElementById("text-log").textContent = "✨ Тестовое воскрешение на ПК! Все параметры тренера подняты до 50%.";
        finalizeTurn();
    }
}

function saveGame() {
    if (player) {
        player.setData({ gameState: JSON.stringify(gameState) });
    } else {
        localStorage.setItem("trainer_sim_save_final_v4", JSON.stringify(gameState));
    }
}

// Посмотрите внимательно ниже: вот загрузка и сброс
function loadGame() {
    if (player) {
        player.getData(["gameState"]).then(data => {
            if (data.gameState) { gameState = JSON.parse(data.gameState); }
            updateUI();
        });
    } else {
        const save = localStorage.getItem("trainer_sim_save_final_v4");
        if (save) { gameState = JSON.parse(save); }
        updateUI();
    }
}

function showGameOverModal() {
    document.getElementById("final-day").textContent = gameState.day;
    document.getElementById("game-over-modal").style.display = "flex";
}

function restartGame() {
    gameState = { day: 1, money: 500, health: 100, satiety: 100, mood: 100, gender: null };
    document.getElementById("game-over-modal").style.display = "none";
    updateUI();
    saveGame();
}

