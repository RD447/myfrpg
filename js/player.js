// ======================== ПЕРЕМЕННЫЕ ИГРОКА (дополнительные) ========================
let playerExtraStr = 0;
let playerExtraDef = 0;
let playerExtraHp = 0;

// ============ КЛАССЫ ============= //
const characterClasses = {
    'Мечник': { name: '🗡️ Мечник', baseStr: 16, baseDef: 8, baseHp: 80, icon: '🗡️' },
    'Лучник': { name: '🏹 Лучник', baseStr: 14, baseDef: 6, baseHp: 75, icon: '🏹' },
    'Послушник': { name: '🙏 Послушник', baseStr: 13, baseDef: 9, baseHp: 55, icon: '🙏' },
    'Адепт': { name: '🔮 Адепт', baseStr: 18, baseDef: 4, baseHp: 65, icon: '🔮' },
    'Воришка': { name: '🗡️ Воришка', baseStr: 15, baseDef: 7, baseHp: 70, icon: '🗡️' }
};

async function savePlayerToCloud() {
    if (!supabaseClient || !currentPlayer?.id || !isLoggedIn) return;
    const stats = recalcStats();
    await supabaseClient.from("players").update({
        level: currentPlayer.level, exp: currentPlayer.exp, hp: currentPlayer.hp, max_hp: stats.maxHp,
        str: stats.str, def: stats.def, gold: currentPlayer.gold, wood: currentPlayer.wood, ore: currentPlayer.ore,
        skill_points: currentPlayer.skillPoints, upgrade_points: currentPlayer.upgradePoints,
        skill_power_strike: currentPlayer.skill_power_strike, skill_endurance: currentPlayer.skill_endurance,
        skill_berserk: currentPlayer.skill_berserk, character_class: currentPlayer.character_class,
        extra_str: playerExtraStr, extra_def: playerExtraDef, extra_hp: playerExtraHp,
        player_x: playerPos.x, player_y: playerPos.y
    }).eq("id", currentPlayer.id);
}

async function changeClass(newClass) {
    if (!isLoggedIn) return;
    if (getCurrentTile().type !== "safe") { addTechnicalLog("❌ Только в деревне"); return; }
    if (currentPlayer.gold < 100) { addTechnicalLog("❌ Нужно 100 монет"); return; }
    const cd = characterClasses[newClass];
    if (!cd) return;
    currentPlayer.gold -= 100;
    currentPlayer.character_class = newClass;
    currentPlayer.str = cd.baseStr; currentPlayer.def = cd.baseDef; currentPlayer.maxHp = cd.baseHp; currentPlayer.hp = cd.baseHp;
    addTechnicalLog(`✨ Вы сменили класс на ${cd.name}!`);
    updateUI(); savePlayerToCloud();
}

function upgradeStat(stat) {
    if (!isLoggedIn) return;
    if (currentPlayer.upgradePoints <= 0) { addTechnicalLog("❌ Нет очков статов"); return; }
    currentPlayer.upgradePoints--;
    if (stat === 'str') { playerExtraStr++; addTechnicalLog("⚔️ Сила +2"); }
    else if (stat === 'def') { playerExtraDef++; addTechnicalLog("🛡️ Защита +2"); }
    else if (stat === 'hp') { playerExtraHp++; currentPlayer.maxHp += 10; currentPlayer.hp += 10; addTechnicalLog("❤️ +10 HP"); }
    updateUI(); savePlayerToCloud();
}

function recalcStats() {
    let bonusAtk = (equipment.weapon?.atk||0) + (equipment.ring?.atk||0);
    let bonusDef = (equipment.armor?.def||0) + (equipment.ring?.def||0) + (skills?.endurance?.level||0)*2;
    return { 
        str: currentPlayer.str + playerExtraStr*2 + bonusAtk, 
        def: currentPlayer.def + playerExtraDef*2 + bonusDef, 
        maxHp: currentPlayer.maxHp + playerExtraHp*10 
    };
}

function updateUI() {
    if (!currentPlayer) return;
    const expNeeded = currentPlayer.level * 150;
    const stats = recalcStats();
    
    const heroHp = document.getElementById("heroHp");
    const heroMaxHp = document.getElementById("heroMaxHp");
    const heroLvl = document.getElementById("heroLvl");
    const heroExp = document.getElementById("heroExp");
    const heroExpNeed = document.getElementById("heroExpNeed");
    const heroGold = document.getElementById("heroGold");
    const heroStr = document.getElementById("heroStr");
    const heroDef = document.getElementById("heroDef");
    const heroWood = document.getElementById("heroWood");
    const heroOre = document.getElementById("heroOre");
    const heroSkillPoints = document.getElementById("heroSkillPoints");
    const heroUpgradePoints = document.getElementById("heroUpgradePoints");
    const questGoblins = document.getElementById("questGoblins");
    const questOre = document.getElementById("questOre");
    const questWood = document.getElementById("questWood");
    const campStatus = document.getElementById("campStatus");
    
    if (heroHp) heroHp.innerText = currentPlayer.hp;
    if (heroMaxHp) heroMaxHp.innerText = stats.maxHp;
    if (heroLvl) heroLvl.innerText = currentPlayer.level;
    if (heroExp) heroExp.innerText = currentPlayer.exp;
    if (heroExpNeed) heroExpNeed.innerText = expNeeded;
    if (heroGold) heroGold.innerText = currentPlayer.gold;
    if (heroStr) heroStr.innerHTML = `${stats.str}`;
    if (heroDef) heroDef.innerHTML = `${stats.def}`;
    if (heroWood) heroWood.innerText = currentPlayer.wood;
    if (heroOre) heroOre.innerText = currentPlayer.ore;
    if (heroSkillPoints) heroSkillPoints.innerText = currentPlayer.skillPoints;
    if (heroUpgradePoints) heroUpgradePoints.innerText = currentPlayer.upgradePoints;
    
    if (typeof quests !== 'undefined' && quests) {
        if (questGoblins) questGoblins.innerHTML = `${quests.goblins}/5`;
        if (questOre) questOre.innerHTML = `${quests.ore}/10`;
        if (questWood) questWood.innerHTML = `${quests.wood}/10`;
    }
    
    if (campStatus) campStatus.innerHTML = (typeof window.campActive !== 'undefined' && window.campActive) ? "🔥 Активен" : "Нет";
    
    updateLoginUI();
    
    const classDisplay = document.getElementById("heroClassDisplay");
    if (classDisplay && currentPlayer.character_class) {
        const classData = characterClasses[currentPlayer.character_class] || characterClasses['Мечник'];
        classDisplay.innerHTML = `${classData.icon || '⚔️'} ${currentPlayer.character_class}`;
    }
}