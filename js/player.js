// ======================== ДОПОЛНИТЕЛЬНЫЕ ПЕРЕМЕННЫЕ ========================
window.playerExtraStr = window.playerExtraStr || 0;
window.playerExtraDef = window.playerExtraDef || 0;
window.playerExtraHp = window.playerExtraHp || 0;

// ============ КЛАССЫ ============= //
const characterClasses = {
    'Мечник': { name: '🗡️ Мечник', baseStr: 16, baseDef: 8, baseHp: 80, icon: '🗡️' },
    'Лучник': { name: '🏹 Лучник', baseStr: 14, baseDef: 6, baseHp: 75, icon: '🏹' },
    'Послушник': { name: '🙏 Послушник', baseStr: 13, baseDef: 9, baseHp: 55, icon: '🙏' },
    'Адепт': { name: '🔮 Адепт', baseStr: 18, baseDef: 4, baseHp: 65, icon: '🔮' },
    'Воришка': { name: '🗡️ Воришка', baseStr: 15, baseDef: 7, baseHp: 70, icon: '🗡️' }
};

async function savePlayerToCloud() {
    if (!supabaseClient || !window.currentPlayer?.id || !window.isLoggedIn) return;
    const stats = recalcStats();
    await supabaseClient.from("players").update({
        level: window.currentPlayer.level,
        exp: window.currentPlayer.exp,
        hp: window.currentPlayer.hp,
        max_hp: stats.maxHp,
        str: stats.str,
        def: stats.def,
        gold: window.currentPlayer.gold,
        wood: window.currentPlayer.wood,
        ore: window.currentPlayer.ore,
        skill_points: window.currentPlayer.skillPoints,
        upgrade_points: window.currentPlayer.upgradePoints,
        skill_power_strike: window.currentPlayer.skill_power_strike,
        skill_endurance: window.currentPlayer.skill_endurance,
        skill_berserk: window.currentPlayer.skill_berserk,
        character_class: window.currentPlayer.character_class,
        extra_str: window.playerExtraStr,
        extra_def: window.playerExtraDef,
        extra_hp: window.playerExtraHp,
        player_x: window.playerPos.x,
        player_y: window.playerPos.y
    }).eq("id", window.currentPlayer.id);
}

async function changeClass(newClass) {
    if (!window.isLoggedIn) return;
    if (getCurrentTile().type !== "safe") { addTechnicalLog("❌ Только в деревне"); return; }
    if (window.currentPlayer.gold < 100) { addTechnicalLog("❌ Нужно 100 монет"); return; }
    const cd = characterClasses[newClass];
    if (!cd) return;
    window.currentPlayer.gold -= 100;
    window.currentPlayer.character_class = newClass;
    window.currentPlayer.str = cd.baseStr;
    window.currentPlayer.def = cd.baseDef;
    window.currentPlayer.maxHp = cd.baseHp;
    window.currentPlayer.hp = cd.baseHp;
    addTechnicalLog(`✨ Вы сменили класс на ${cd.name}!`);
    updateUI(); savePlayerToCloud();
}

function upgradeStat(stat) {
    if (!window.isLoggedIn) return;
    if (window.currentPlayer.upgradePoints <= 0) { addTechnicalLog("❌ Нет очков статов"); return; }
    window.currentPlayer.upgradePoints--;
    if (stat === 'str') { window.playerExtraStr++; addTechnicalLog("⚔️ Сила +2"); }
    else if (stat === 'def') { window.playerExtraDef++; addTechnicalLog("🛡️ Защита +2"); }
    else if (stat === 'hp') { window.playerExtraHp++; window.currentPlayer.maxHp += 10; window.currentPlayer.hp += 10; addTechnicalLog("❤️ +10 HP"); }
    updateUI(); savePlayerToCloud();
}

function recalcStats() {
    let bonusAtk = (window.equipment.weapon?.atk||0) + (window.equipment.ring?.atk||0);
    let bonusDef = (window.equipment.armor?.def||0) + (window.equipment.ring?.def||0) + (window.skills?.endurance?.level||0)*2;
    return {
        str: window.currentPlayer.str + window.playerExtraStr*2 + bonusAtk,
        def: window.currentPlayer.def + window.playerExtraDef*2 + bonusDef,
        maxHp: window.currentPlayer.maxHp + window.playerExtraHp*10
    };
}

function updateUI() {
    if (!window.currentPlayer) return;
    const expNeeded = window.currentPlayer.level * 150;
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
    
    if (heroHp) heroHp.innerText = window.currentPlayer.hp;
    if (heroMaxHp) heroMaxHp.innerText = stats.maxHp;
    if (heroLvl) heroLvl.innerText = window.currentPlayer.level;
    if (heroExp) heroExp.innerText = window.currentPlayer.exp;
    if (heroExpNeed) heroExpNeed.innerText = expNeeded;
    if (heroGold) heroGold.innerText = window.currentPlayer.gold;
    if (heroStr) heroStr.innerHTML = `${stats.str}`;
    if (heroDef) heroDef.innerHTML = `${stats.def}`;
    if (heroWood) heroWood.innerText = window.currentPlayer.wood;
    if (heroOre) heroOre.innerText = window.currentPlayer.ore;
    if (heroSkillPoints) heroSkillPoints.innerText = window.currentPlayer.skillPoints;
    if (heroUpgradePoints) heroUpgradePoints.innerText = window.currentPlayer.upgradePoints;
    
    if (window.quests) {
        if (questGoblins) questGoblins.innerHTML = `${window.quests.goblins}/5`;
        if (questOre) questOre.innerHTML = `${window.quests.ore}/10`;
        if (questWood) questWood.innerHTML = `${window.quests.wood}/10`;
    }
    
    if (campStatus) campStatus.innerHTML = window.campActive ? "🔥 Активен" : "Нет";
    
    updateLoginUI();
    
    const classDisplay = document.getElementById("heroClassDisplay");
    if (classDisplay && window.currentPlayer.character_class) {
        const classData = characterClasses[window.currentPlayer.character_class] || characterClasses['Мечник'];
        classDisplay.innerHTML = `${classData.icon || '⚔️'} ${window.currentPlayer.character_class}`;
    }
}