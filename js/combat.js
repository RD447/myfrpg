// ======================== БОЙ ========================
// Переменные autoActive, autoType, autoInterval объявлены в config.js

const enemies = {
    goblin: { name: "Гоблин", baseHp: 35, baseAtk: 9, gold: 8, exp: 25, quest: "goblins", icon: "👺" },
    troll: { name: "Тролль", baseHp: 55, baseAtk: 13, gold: 15, exp: 40, icon: "🗿" },
    bandit: { name: "Разбойник", baseHp: 45, baseAtk: 11, gold: 20, exp: 35, icon: "🗡️" }
};

function startAutoCombat() {
    if (!window.isLoggedIn) { addTechnicalLog("❌ Сначала войдите в аккаунт!"); return; }
    if (window.autoActive) { addTechnicalLog("❌ Автодействие уже активно!"); return; }
    if (window.isMoving) { addTechnicalLog("❌ Нельзя начать бой во время перемещения!"); return; }
    const tile = getCurrentTile();
    if (tile.type !== "combat") { addTechnicalLog("❌ Здесь нет врагов!"); return; }
    
    window.autoActive = true;
    window.autoType = "combat";
    updateActionButtons();
    addTechnicalLog(`⚔️ Начат БЕСКОНЕЧНЫЙ автобой в ${tile.name}`);
    
    let skillCombatCounter = 0;
    
    function fightLoop() {
        if (!window.autoActive || window.autoType !== "combat") return;
        const tile2 = getCurrentTile();
        if (tile2.type !== "combat") {
            addTechnicalLog(`❌ Локация изменилась, автобой остановлен.`);
            stopAuto();
            return;
        }
        
        const enemyTemplate = enemies[tile2.enemy];
        let enemy = {
            ...enemyTemplate,
            hp: enemyTemplate.baseHp + Math.floor(window.currentPlayer.level * 1.5),
            maxHp: enemyTemplate.baseHp + Math.floor(window.currentPlayer.level * 1.5),
            atk: enemyTemplate.baseAtk + Math.floor(window.currentPlayer.level * 0.5)
        };
        
        addTechnicalLog(`⚔️ Новый враг: ${enemy.name} (${enemy.hp} HP)`);
        updateAutoPanel(`⚔️ БИТВА С ${enemy.name}`, `Начало боя!`, 0);
        
        function fightStep() {
            if (!window.autoActive || window.autoType !== "combat") return;
            const stats = recalcStats();
            if (window.currentPlayer.hp <= 0) {
                addTechnicalLog(`💀 Вы пали в бою! Возврат в деревню.`);
                stopAuto();
                window.currentPlayer.hp = stats.maxHp;
                window.playerPos = { x: 5, y: 5 };
                drawMap();
                updateActionButtons();
                updateUI();
                savePlayerToCloud();
                return;
            }
            if (enemy.hp <= 0) {
                window.currentPlayer.gold += enemy.gold;
                window.currentPlayer.exp += enemy.exp;
                if (tile2.enemy === "goblin") updateQuests('goblin', 1);
                
                if (Math.random() < 0.3) {
                    const item = generateRandomItem();
                    addItemToInventory(item);
                    addTechnicalLog(`🎁 Выпал предмет: ${item.name}!`);
                }
                
                let leveled = false;
                const expNeeded = window.currentPlayer.level * 150;
                if (window.currentPlayer.exp >= expNeeded) {
                    window.currentPlayer.level++;
                    window.currentPlayer.exp -= expNeeded;
                    window.currentPlayer.maxHp += 10;
                    window.currentPlayer.hp = window.currentPlayer.maxHp;
                    window.currentPlayer.str += 2;
                    window.currentPlayer.def += 1;
                    window.currentPlayer.skillPoints++;
                    window.currentPlayer.upgradePoints++;
                    leveled = true;
                    renderSkills();
                }
                addTechnicalLog(`🏆 Победа над ${enemy.name}! +${enemy.gold} монет, +${enemy.exp} опыта`);
                if (leveled) addTechnicalLog(`✨ УРОВЕНЬ ${window.currentPlayer.level}! +1 очко умений, +1 очко статов`);
                playSound("levelup");
                updateUI();
                savePlayerToCloud();
                
                setTimeout(() => { if (window.autoActive && window.autoType === "combat") fightLoop(); }, 500);
                return;
            }
            
            skillCombatCounter++;
            const baseStats = getCurrentStats();
            const now = Date.now();
            
            let finalPlayerStr = baseStats.str;
            let critMsg = "";
            
            if (window.skills.powerStrike.level > 0 && skillCombatCounter % 5 === 0) {
                finalPlayerStr = baseStats.str * 1.5;
                critMsg = " 💥 МОЩНЫЙ УДАР!";
            }
            
            if (window.skills.berserk.level > 0) {
                if (!window.skills.berserk.lastTrigger) window.skills.berserk.lastTrigger = 0;
                if (now - window.skills.berserk.lastTrigger > 10000) {
                    finalPlayerStr = baseStats.str * 1.3;
                    window.skills.berserk.lastTrigger = now;
                    critMsg = " ⚔️ БЕРСЕРК! +30% к атаке!";
                }
            }
            
            let dmg = Math.floor(Math.random() * finalPlayerStr) + 5;
            if (critMsg) addTechnicalLog(critMsg);
            enemy.hp -= dmg;
            
            let enemyDmg = Math.max(2, enemy.atk - Math.floor(baseStats.def / 2) + Math.floor(Math.random() * 4));
            window.currentPlayer.hp -= enemyDmg;
            
            const progress = 1 - (enemy.hp / enemy.maxHp);
            updateAutoPanel(`⚔️ БИТВА С ${enemy.name}`, `${enemy.icon} наносит ${enemyDmg} урона | ❤️ ${window.currentPlayer.hp}/${stats.maxHp} | 👺 ${Math.max(0, Math.floor(enemy.hp))}/${enemy.maxHp}`, progress);
            updateUI();
            playSound("combat");
            
            window.autoInterval = setTimeout(fightStep, 1000);
        }
        fightStep();
    }
    fightLoop();
}

function getCurrentStats() {
    const stats = recalcStats();
    return { str: stats.str, def: stats.def };
}

function stopAuto() {
    if (window.autoInterval) clearTimeout(window.autoInterval);
    window.autoActive = false;
    window.autoType = null;
    updateAutoPanel("⚔️ АВТОБОЙ", "Остановлен", 0);
    updateActionButtons();
    addTechnicalLog(`⏹️ Автодействие остановлено.`);
}