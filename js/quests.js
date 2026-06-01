// ======================== КВЕСТЫ С СОХРАНЕНИЕМ ========================
let quests = { goblins: 0, ore: 0, wood: 0 };

// Сохранение квестов в БД
async function saveQuestsToCloud() {
    if (!supabaseClient || !currentPlayer.id || !isLoggedIn) return;
    
    try {
        await supabaseClient
            .from("players")
            .update({
                quest_data: JSON.stringify(quests),
                updated_at: new Date().toISOString()
            })
            .eq("id", currentPlayer.id);
    } catch (e) {
        console.error("Ошибка сохранения квестов:", e);
    }
}

// Загрузка квестов из БД
function loadQuestsFromCloud(questData) {
    try {
        if (questData && questData !== '{}') {
            quests = JSON.parse(questData);
        } else {
            quests = { goblins: 0, ore: 0, wood: 0 };
        }
        updateUI();
    } catch (e) {
        console.error("Ошибка загрузки квестов:", e);
        quests = { goblins: 0, ore: 0, wood: 0 };
    }
}

function updateQuests(type, amount) {
    if (type === 'goblin') quests.goblins = Math.min(5, quests.goblins + amount);
    if (type === 'ore') quests.ore = Math.min(10, quests.ore + amount);
    if (type === 'wood') quests.wood = Math.min(10, quests.wood + amount);
    
    updateUI();
    saveQuestsToCloud();
    
    // Проверка на завершение квестов
    let questCompleted = false;
    
    if (quests.goblins >= 5) {
        addTechnicalLog("📜 Квест 'Убить гоблинов' выполнен! +50 опыта, +30 монет");
        currentPlayer.exp += 50;
        currentPlayer.gold += 30;
        quests.goblins = 5;
        questCompleted = true;
    }
    if (quests.ore >= 10) {
        addTechnicalLog("📜 Квест 'Собрать руду' выполнен! +40 опыта, +50 монет");
        currentPlayer.exp += 40;
        currentPlayer.gold += 50;
        quests.ore = 10;
        questCompleted = true;
    }
    if (quests.wood >= 10) {
        addTechnicalLog("📜 Квест 'Собрать древесину' выполнен! +40 опыта, +50 монет");
        currentPlayer.exp += 40;
        currentPlayer.gold += 50;
        quests.wood = 10;
        questCompleted = true;
    }
    
    if (questCompleted) {
        updateUI();
        savePlayerToCloud();
        saveQuestsToCloud();
    }
}

function resetQuests() {
    quests = { goblins: 0, ore: 0, wood: 0 };
    updateUI();
    saveQuestsToCloud();
    addTechnicalLog("📜 Квесты обновлены!");
}