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
    addTechnicalLog(`⏳ Начат БЕСКОНЕЧНЫЙ автосбор ${resource === "wood" ? "древесины" : "руды"} в ${tile.name}`);
    
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