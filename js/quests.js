// ======================== КВЕСТЫ С СОХРАНЕНИЕМ ========================
// Переменная quests объявлена в config.js

async function saveQuestsToCloud() { 
    if (!supabaseClient || !window.currentPlayer?.id || !window.isLoggedIn) return; 
    await supabaseClient.from("players").update({ 
        quest_data: JSON.stringify(window.quests) 
    }).eq("id", window.currentPlayer.id); 
}

function loadQuestsFromCloud(qData) { 
    try { 
        if (qData && qData !== '{}') {
            window.quests = JSON.parse(qData);
        } else {
            window.quests = { goblins:0, ore:0, wood:0 };
        }
        updateUI(); 
    } catch(e) { 
        window.quests = { goblins:0, ore:0, wood:0 }; 
    } 
}

function updateQuests(type, amount) { 
    if (type === 'goblin') window.quests.goblins = Math.min(5, window.quests.goblins + amount);
    if (type === 'ore') window.quests.ore = Math.min(10, window.quests.ore + amount);
    if (type === 'wood') window.quests.wood = Math.min(10, window.quests.wood + amount);
    updateUI(); 
    saveQuestsToCloud(); 
    
    let completed = false; 
    if (window.quests.goblins >= 5) { 
        addTechnicalLog("📜 Квест 'Убить гоблинов' выполнен! +50 опыта, +30 монет"); 
        window.currentPlayer.exp += 50; 
        window.currentPlayer.gold += 30; 
        completed = true; 
    } 
    if (window.quests.ore >= 10) { 
        addTechnicalLog("📜 Квест 'Собрать руду' выполнен! +40 опыта, +50 монет"); 
        window.currentPlayer.exp += 40; 
        window.currentPlayer.gold += 50; 
        completed = true; 
    } 
    if (window.quests.wood >= 10) { 
        addTechnicalLog("📜 Квест 'Собрать древесину' выполнен! +40 опыта, +50 монет"); 
        window.currentPlayer.exp += 40; 
        window.currentPlayer.gold += 50; 
        completed = true; 
    } 
    if (completed) { 
        updateUI(); 
        savePlayerToCloud(); 
        saveQuestsToCloud(); 
    } 
}