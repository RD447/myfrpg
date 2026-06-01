const enemies = { goblin:{ name:"Гоблин", baseHp:35, baseAtk:9, gold:8, exp:25, icon:"👺" }, troll:{ name:"Тролль", baseHp:55, baseAtk:13, gold:15, exp:40, icon:"🗿" }, bandit:{ name:"Разбойник", baseHp:45, baseAtk:11, gold:20, exp:35, icon:"🗡️" } };
let autoActive = false, autoType = null, autoInterval = null;
function startAutoCombat() {
    if (!isLoggedIn) { addTechnicalLog("❌ Войдите"); return; }
    if (autoActive) return;
    if (isMoving) { addTechnicalLog("❌ Нельзя в движении"); return; }
    let tile = getCurrentTile();
    if (tile.type !== "combat") { addTechnicalLog("❌ Нет врагов"); return; }
    autoActive = true; autoType = "combat";
    updateActionButtons();
    addTechnicalLog(`⚔️ Начат бой в ${tile.name}`);
    let skillCounter = 0;
    function fightLoop() {
        if (!autoActive || autoType !== "combat") return;
        let tile2 = getCurrentTile();
        if (tile2.type !== "combat") { stopAuto(); addTechnicalLog("❌ Локация изменилась"); return; }
        let enemy = { ...enemies[tile2.enemy], hp: enemies[tile2.enemy].baseHp + Math.floor(currentPlayer.level * 1.5), maxHp: enemies[tile2.enemy].baseHp + Math.floor(currentPlayer.level * 1.5), atk: enemies[tile2.enemy].baseAtk + Math.floor(currentPlayer.level * 0.5) };
        function step() {
            if (!autoActive || autoType !== "combat") return;
            let stats = recalcStats();
            if (currentPlayer.hp <= 0) {
                stopAuto();
                currentPlayer.hp = stats.maxHp;
                playerPos = { x: 5, y: 5 };
                drawMap(); updateActionButtons(); updateUI();
                addTechnicalLog("💀 Вы погибли, возврат в деревню");
                savePlayerToCloud();
                return;
            }
            if (enemy.hp <= 0) {
                currentPlayer.gold += enemy.gold; currentPlayer.exp += enemy.exp;
                if (tile2.enemy === "goblin") updateQuests('goblin', 1);
                if (Math.random() < 0.3) addItemToInventory(generateRandomItem());
                let need = currentPlayer.level * 150;
                if (currentPlayer.exp >= need) {
                    currentPlayer.level++; currentPlayer.exp -= need; currentPlayer.maxHp += 10; currentPlayer.hp = currentPlayer.maxHp;
                    currentPlayer.str += 2; currentPlayer.def += 1; currentPlayer.skillPoints++; currentPlayer.upgradePoints++;
                    renderSkills(); addTechnicalLog(`✨ УРОВЕНЬ ${currentPlayer.level}!`);
                }
                addTechnicalLog(`🏆 Победа над ${enemy.name}! +${enemy.gold}✨ +${enemy.exp} опыта`);
                updateUI(); savePlayerToCloud();
                setTimeout(() => fightLoop(), 500);
                return;
            }
            skillCounter++;
            let finalStr = stats.str;
            if (skills.powerStrike.level > 0 && skillCounter % 5 === 0) finalStr = stats.str * 1.5;
            let dmg = Math.floor(Math.random() * finalStr) + 5;
            enemy.hp -= dmg;
            let enemyDmg = Math.max(2, enemy.atk - Math.floor(stats.def / 2) + Math.random() * 4);
            currentPlayer.hp -= enemyDmg;
            updateUI();
            autoInterval = setTimeout(step, 1000);
        }
        step();
    }
    fightLoop();
}
function stopAuto() { if (autoInterval) clearTimeout(autoInterval); autoActive = false; autoType = null; updateActionButtons(); addTechnicalLog("⏹️ Действие остановлено"); }