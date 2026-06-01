// ======================== КВЕСТЫ ========================
let quests = { goblins: 0, ore: 0, wood: 0 };

function updateQuests(type, amount) {
    if (type === 'goblin') quests.goblins = Math.min(5, quests.goblins + amount);
    if (type === 'ore') quests.ore = Math.min(10, quests.ore + amount);
    if (type === 'wood') quests.wood = Math.min(10, quests.wood + amount);
    
    updateUI();
    
    // Проверка на завершение квестов
    if (quests.goblins >= 5) {
        addTechnicalLog("📜 Квест 'Убить гоблинов' выполнен! +50 опыта, +30 монет");
        currentPlayer.exp += 50;
        currentPlayer.gold += 30;
        quests.goblins = 5; // замораживаем
        updateUI();
    }
    if (quests.ore >= 10) {
        addTechnicalLog("📜 Квест 'Собрать руду' выполнен! +40 опыта, +50 монет");
        currentPlayer.exp += 40;
        currentPlayer.gold += 50;
        quests.ore = 10;
        updateUI();
    }
    if (quests.wood >= 10) {
        addTechnicalLog("📜 Квест 'Собрать древесину' выполнен! +40 опыта, +50 монет");
        currentPlayer.exp += 40;
        currentPlayer.gold += 50;
        quests.wood = 10;
        updateUI();
    }
    
    savePlayerToCloud();
}

// Сброс квестов (можно добавить ежедневные)
function resetQuests() {
    quests = { goblins: 0, ore: 0, wood: 0 };
    updateUI();
    addTechnicalLog("📜 Квесты обновлены!");
}