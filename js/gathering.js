// ======================== СБОР РЕСУРСОВ ========================
function startAutoGather() {
    if (!isLoggedIn) { addTechnicalLog("❌ Сначала войдите в аккаунт!"); return; }
    if (autoActive) { addTechnicalLog("❌ Автодействие уже активно!"); return; }
    if (isMoving) { addTechnicalLog("❌ Нельзя собирать во время перемещения!"); return; }
    const tile = getCurrentTile();
    if (tile.type !== "combat" || !tile.resource) { addTechnicalLog("❌ Здесь нельзя собирать ресурсы!"); return; }
    
    autoActive = true;
    autoType = "gather";
    updateActionButtons();
    const resource = tile.resource;
    addTechnicalLog(`⏳ Начат автосбор ${resource === "wood" ? "древесины" : "руды"} в ${tile.name}`);
    
    function gatherLoop() {
        if (!autoActive || autoType !== "gather") return;
        updateAutoPanel(resource === "wood" ? "🌲 СБОР ДРЕВЕСИНЫ" : "⛏️ ДОБЫЧА РУДЫ", `Сбор ресурсов...`, 0.3);
        
        setTimeout(() => {
            if (!autoActive) return;
            if (resource === "wood") {
                let amount = 2 + Math.floor(Math.random() * 4);
                currentPlayer.wood += amount;
                updateQuests('wood', amount);
                addTechnicalLog(`🌲 Вы собрали ${amount} древесины! Всего: ${currentPlayer.wood}`);
                updateAutoPanel(`🌲 СБОР ДРЕВЕСИНЫ`, `+${amount} древесины!`, 1);
            } else {
                let amount = 1 + Math.floor(Math.random() * 3);
                currentPlayer.ore += amount;
                updateQuests('ore', amount);
                addTechnicalLog(`⛏️ Вы добыли ${amount} руды! Всего: ${currentPlayer.ore}`);
                updateAutoPanel(`⛏️ ДОБЫЧА РУДЫ`, `+${amount} руды!`, 1);
            }
            updateUI();
            playSound("gather");
            savePlayerToCloud();
            setTimeout(() => { if (autoActive && autoType === "gather") gatherLoop(); }, 800);
        }, 2000);
    }
    gatherLoop();
}

function triggerRandomEvent() {
    const events = [
        { text: "🍄 Вы нашли грибы! +5 монет", gold: 5 },
        { text: "🌿 Вы нашли целебные травы! +10 HP", heal: 10 },
        { text: "💎 Вы нашли кристалл! +15 монет", gold: 15 },
        { text: "🐺 На вас напал волк! -5 HP", damage: 5 }
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    if (event.gold) currentPlayer.gold += event.gold;
    if (event.heal) currentPlayer.hp = Math.min(recalcStats().maxHp, currentPlayer.hp + event.heal);
    if (event.damage) currentPlayer.hp = Math.max(1, currentPlayer.hp - event.damage);
    addTechnicalLog(`✨ ${event.text}`);
    updateUI();
    savePlayerToCloud();
}

// ======================== ЛАГЕРЬ ========================
function toggleCamp() {
    if (!isLoggedIn) {
        addTechnicalLog("❌ Сначала войдите в аккаунт!");
        return;
    }
    if (isMoving) {
        addTechnicalLog("❌ Нельзя ставить лагерь во время перемещения!");
        return;
    }
    const tile = getCurrentTile();
    if (tile.type !== "combat" && tile.type !== "empty") {
        addTechnicalLog("❌ Лагерь можно ставить в лесу, горах, пещере, пустошах!");
        return;
    }
    
    // Используем window.campActive, так как переменная объявлена в main.js
    if (typeof window.campActive === 'undefined') {
        window.campActive = false;
    }
    window.campActive = !window.campActive;
    
    const campBtn = document.getElementById("campBtn");
    if (window.campActive) {
        campBtn.classList.add("active");
        campBtn.innerHTML = "🔥 СНЯТЬ ЛАГЕРЬ";
        addTechnicalLog("🏕️ Лагерь установлен! Можно лечиться (5 монет) и готовить еду (2 дерева)");
    } else {
        campBtn.classList.remove("active");
        campBtn.innerHTML = "🏕️ ЛАГЕРЬ";
        addTechnicalLog("🔥 Лагерь свёрнут.");
    }
    updateActionButtons();
    updateUI();
}

function campHeal() {
    if (!window.campActive) {
        addTechnicalLog("❌ Нет активного лагеря!");
        return;
    }
    const stats = recalcStats();
    if (currentPlayer.gold >= 5 && currentPlayer.hp < stats.maxHp) {
        currentPlayer.gold -= 5;
        let heal = 15 + Math.floor(Math.random() * 15);
        currentPlayer.hp = Math.min(stats.maxHp, currentPlayer.hp + heal);
        addTechnicalLog(`💊 Вы отдохнули в лагере и восстановили ${heal} HP. -5 монет`);
        updateUI();
        savePlayerToCloud();
    } else if (currentPlayer.hp >= stats.maxHp) {
        addTechnicalLog("💚 Вы уже полностью здоровы!");
    } else {
        addTechnicalLog("❌ Не хватает монет (нужно 5)");
    }
}

function campCook() {
    if (!window.campActive) {
        addTechnicalLog("❌ Нет активного лагеря!");
        return;
    }
    if (currentPlayer.wood < 2) {
        addTechnicalLog("❌ Не хватает древесины! Нужно 2");
        return;
    }
    currentPlayer.wood -= 2;
    let heal = 20 + Math.floor(Math.random() * 15);
    const stats = recalcStats();
    currentPlayer.hp = Math.min(stats.maxHp, currentPlayer.hp + heal);
    addTechnicalLog(`🍲 Вы приготовили еду на костре! +${heal} HP. -2 древесины`);
    updateUI();
    savePlayerToCloud();
}