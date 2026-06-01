let currentPlayer = { id: null, username: null, level: 1, exp: 0, hp: 70, maxHp: 70, str: 12, def: 5, gold: 150, wood: 0, ore: 0, skillPoints: 2, upgradePoints: 2, skill_power_strike: 0, skill_endurance: 0, skill_berserk: 0, character_class: 'Мечник' };
let isLoggedIn = false;
let playerExtraStr = 0, playerExtraDef = 0, playerExtraHp = 0;
const characterClasses = {
    'Мечник': { name: '🗡️ Мечник', baseStr: 16, baseDef: 8, baseHp: 80, icon: '🗡️' },
    'Лучник': { name: '🏹 Лучник', baseStr: 14, baseDef: 6, baseHp: 75, icon: '🏹' },
    'Послушник': { name: '🙏 Послушник', baseStr: 13, baseDef: 9, baseHp: 55, icon: '🙏' },
    'Адепт': { name: '🔮 Адепт', baseStr: 18, baseDef: 4, baseHp: 65, icon: '🔮' },
    'Воришка': { name: '🗡️ Воришка', baseStr: 15, baseDef: 7, baseHp: 70, icon: '🗡️' }
};
async function savePlayerToCloud() {
    if (!supabaseClient || !currentPlayer.id || !isLoggedIn) return;
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
    let bonusDef = (equipment.armor?.def||0) + (equipment.ring?.def||0) + (skills.endurance?.level||0)*2;
    return { str: currentPlayer.str + playerExtraStr*2 + bonusAtk, def: currentPlayer.def + playerExtraDef*2 + bonusDef, maxHp: currentPlayer.maxHp + playerExtraHp*10 };
}
function updateUI() {
    let stats = recalcStats(), need = currentPlayer.level * 150;
    document.getElementById("heroHp").innerText = currentPlayer.hp;
    document.getElementById("heroMaxHp").innerText = stats.maxHp;
    document.getElementById("heroLvl").innerText = currentPlayer.level;
    document.getElementById("heroExp").innerText = currentPlayer.exp;
    document.getElementById("heroExpNeed").innerText = need;
    document.getElementById("heroGold").innerText = currentPlayer.gold;
    document.getElementById("heroStr").innerHTML = stats.str;
    document.getElementById("heroDef").innerHTML = stats.def;
    document.getElementById("heroWood").innerText = currentPlayer.wood;
    document.getElementById("heroOre").innerText = currentPlayer.ore;
    document.getElementById("heroSkillPoints").innerText = currentPlayer.skillPoints;
    document.getElementById("heroUpgradePoints").innerText = currentPlayer.upgradePoints;
    if (typeof quests !== 'undefined') {
        document.getElementById("questGoblins").innerHTML = `${quests.goblins}/5`;
        document.getElementById("questOre").innerHTML = `${quests.ore}/10`;
        document.getElementById("questWood").innerHTML = `${quests.wood}/10`;
    }
    document.getElementById("campStatus").innerHTML = (typeof window.campActive !== 'undefined' && window.campActive) ? "🔥 Активен" : "Нет";
    updateLoginUI();
    let cd = document.getElementById("heroClassDisplay");
    if (cd && currentPlayer.character_class) cd.innerHTML = `${characterClasses[currentPlayer.character_class]?.icon || '⚔️'} ${currentPlayer.character_class}`;
}