function startAutoGather() {
    if (!isLoggedIn) { addTechnicalLog("❌ Войдите"); return; }
    if (autoActive) return;
    if (isMoving) { addTechnicalLog("❌ Нельзя в движении"); return; }
    let tile = getCurrentTile();
    if (tile.type !== "combat" || !tile.resource) { addTechnicalLog("❌ Нет ресурсов"); return; }
    autoActive = true; autoType = "gather";
    updateActionButtons();
    let res = tile.resource;
    addTechnicalLog(`⏳ Сбор ${res==='wood'?'древесины':'руды'} в ${tile.name}`);
    function gatherLoop() {
        if (!autoActive || autoType !== "gather") return;
        autoInterval = setTimeout(() => {
            if (!autoActive) return;
            if (res === "wood") { let a = 2+Math.floor(Math.random()*4); currentPlayer.wood += a; updateQuests('wood', a); addTechnicalLog(`🌲 +${a} древесины`); }
            else { let a = 1+Math.floor(Math.random()*3); currentPlayer.ore += a; updateQuests('ore', a); addTechnicalLog(`⛏️ +${a} руды`); }
            updateUI(); savePlayerToCloud(); gatherLoop();
        }, 2000);
    }
    gatherLoop();
}
function triggerRandomEvent() {
    let events = [{ text:"🍄 Грибы! +5 монет", gold:5 }, { text:"🌿 Травы! +10 HP", heal:10 }, { text:"💎 Кристалл! +15 монет", gold:15 }, { text:"🐺 Волк! -5 HP", damage:5 }];
    let e = events[Math.floor(Math.random()*4)];
    if (e.gold) currentPlayer.gold += e.gold;
    if (e.heal) currentPlayer.hp = Math.min(recalcStats().maxHp, currentPlayer.hp + e.heal);
    if (e.damage) currentPlayer.hp = Math.max(1, currentPlayer.hp - e.damage);
    addTechnicalLog(`✨ ${e.text}`); updateUI(); savePlayerToCloud();
}
function toggleCamp() {
    if (!isLoggedIn) return;
    if (isMoving) { addTechnicalLog("❌ Нельзя в движении"); return; }
    let tile = getCurrentTile();
    if (tile.type !== "combat" && tile.type !== "empty") { addTechnicalLog("❌ Нельзя ставить лагерь тут"); return; }
    window.campActive = !window.campActive;
    let btn = document.getElementById("campBtn");
    if (window.campActive) { btn.classList.add("active"); btn.innerHTML = "🔥 Снять лагерь"; addTechnicalLog("🏕️ Лагерь установлен"); }
    else { btn.classList.remove("active"); btn.innerHTML = "🏕️ Лагерь"; addTechnicalLog("🔥 Лагерь снят"); }
    updateActionButtons(); updateUI();
}
function campHeal() {
    if (!window.campActive) { addTechnicalLog("❌ Нет лагеря"); return; }
    let stats = recalcStats();
    if (currentPlayer.gold >= 5 && currentPlayer.hp < stats.maxHp) {
        currentPlayer.gold -= 5;
        let heal = 15+Math.floor(Math.random()*15);
        currentPlayer.hp = Math.min(stats.maxHp, currentPlayer.hp + heal);
        addTechnicalLog(`💊 Восстановлено ${heal} HP`);
        updateUI(); savePlayerToCloud();
    } else addTechnicalLog("❌ Нужно 5 монет или здоровье полно");
}
function campCook() {
    if (!window.campActive) { addTechnicalLog("❌ Нет лагеря"); return; }
    if (currentPlayer.wood >= 2) {
        currentPlayer.wood -= 2;
        let heal = 20+Math.floor(Math.random()*15);
        let stats = recalcStats();
        currentPlayer.hp = Math.min(stats.maxHp, currentPlayer.hp + heal);
        addTechnicalLog(`🍲 Восстановлено ${heal} HP`);
        updateUI(); savePlayerToCloud();
    } else addTechnicalLog("❌ Нужно 2 древесины");
}
function restHeal() {
    let tile = getCurrentTile();
    if (tile.type !== "safe") { addTechnicalLog("❌ Только в деревне"); return; }
    let stats = recalcStats();
    if (currentPlayer.gold >= 5 && currentPlayer.hp < stats.maxHp) {
        currentPlayer.gold -= 5;
        let heal = 10+Math.floor(Math.random()*10);
        currentPlayer.hp = Math.min(stats.maxHp, currentPlayer.hp + heal);
        addTechnicalLog(`💊 Отдых в деревне: +${heal} HP`);
        updateUI(); savePlayerToCloud();
    } else addTechnicalLog("❌ Нужно 5 монет или здоровье полно");
}