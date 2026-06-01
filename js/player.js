// ======================== ПЕРЕМЕННЫЕ ИГРОКА ========================
let currentPlayer = {
    id: null,
    username: null,
    level: 1, exp: 0, hp: 70, maxHp: 70, str: 12, def: 5,
    gold: 150, wood: 0, ore: 0,
    skillPoints: 2,
    upgradePoints: 2,
    skill_power_strike: 0, skill_endurance: 0, skill_berserk: 0,
    character_class: 'Мечник'
};

let isLoggedIn = false;
let playerExtraStr = 0;
let playerExtraDef = 0;
let playerExtraHp = 0;

// ============ КЛАССЫ ============= //
const characterClasses = {
    'Мечник': { 
        name: '🗡️ Мечник', 
        baseStr: 16, baseDef: 8, baseHp: 80,
        skillBonus: 'powerStrike',
        icon: '🗡️',
        desc: 'Мастер ближнего боя, высокий урон и защита'
    },
    'Лучник': { 
        name: '🏹 Лучник', 
        baseStr: 14, baseDef: 6, baseHp: 75,
        skillBonus: 'berserk',
        icon: '🏹',
        desc: 'Дальний бой, высокий критический урон'
    },
    'Послушник': { 
        name: '🙏 Послушник', 
        baseStr: 13, baseDef: 9, baseHp: 55,
        skillBonus: 'endurance',
        icon: '🙏',
        desc: 'Поддержка и лечение'
    },
    'Адепт': { 
        name: '🔮 Адепт', 
        baseStr: 18, baseDef: 4, baseHp: 65,
        skillBonus: 'powerStrike',
        icon: '🔮',
        desc: 'Мощные заклинания, но хрупкая защита'
    },
    'Воришка': { 
        name: '🗡️ Воришка', 
        baseStr: 15, baseDef: 7, baseHp: 70,
        skillBonus: 'berserk',
        icon: '🗡️',
        desc: 'Скрытность и быстрые атаки'
    }
};

async function savePlayerToCloud() {
    if (!supabaseClient || !currentPlayer.id || !isLoggedIn) return;
    
    const stats = recalcStats();
    
    await supabaseClient
        .from("players")
        .update({
            level: currentPlayer.level,
            exp: currentPlayer.exp,
            hp: currentPlayer.hp,
            max_hp: stats.maxHp,
            str: stats.str,
            def: stats.def,
            gold: currentPlayer.gold,
            wood: currentPlayer.wood,
            ore: currentPlayer.ore,
            skill_points: currentPlayer.skillPoints,
            upgrade_points: currentPlayer.upgradePoints,
            skill_power_strike: currentPlayer.skill_power_strike,
            skill_endurance: currentPlayer.skill_endurance,
            skill_berserk: currentPlayer.skill_berserk,
            character_class: currentPlayer.character_class,
            extra_str: playerExtraStr,
            extra_def: playerExtraDef,
            extra_hp: playerExtraHp,
            player_x: playerPos.x,
            player_y: playerPos.y,
            updated_at: new Date().toISOString()
        })
        .eq("id", currentPlayer.id);
}

// ======================== СМЕНА КЛАССА ========================
async function changeClass(newClass) {
    if (!isLoggedIn) return;
    const tile = getCurrentTile();
    if (tile.type !== "safe") {
        addTechnicalLog("❌ Сменить класс можно только в деревне!");
        return;
    }
    if (currentPlayer.gold < 100) {
        addTechnicalLog("❌ Смена класса стоит 100 монет!");
        return;
    }
    
    const classData = characterClasses[newClass];
    if (!classData) return;
    
    currentPlayer.gold -= 100;
    currentPlayer.character_class = newClass;
    
    currentPlayer.str = classData.baseStr;
    currentPlayer.def = classData.baseDef;
    currentPlayer.maxHp = classData.baseHp;
    currentPlayer.hp = classData.baseHp;
    
    addTechnicalLog(`✨ Вы сменили класс на ${classData.name}! -100 монет`);
    updateUI();
    savePlayerToCloud();
}

function showClassSelector() {
    const modal = document.getElementById("classModal");
    const overlay = document.getElementById("modalOverlay");
    const container = document.getElementById("classButtons");
    
    container.innerHTML = "";
    for (const [key, data] of Object.entries(characterClasses)) {
        const btn = document.createElement("button");
        btn.className = "small-btn";
        btn.style.margin = "6px";
        btn.style.padding = "10px";
        btn.style.width = "calc(100% - 12px)";
        btn.innerHTML = `${data.icon || data.name} ${data.name}<br><span style="font-size:0.6rem;">⚔️${data.baseStr} 🛡️${data.baseDef} ❤️${data.baseHp}</span>`;
        btn.onclick = () => {
            changeClass(key);
            modal.style.display = "none";
            overlay.style.display = "none";
        };
        container.appendChild(btn);
    }
    
    modal.style.display = "block";
    overlay.style.display = "block";
}

// ======================== ПРОКАЧКА СТАТОВ ========================
function upgradeStat(stat) {
    if (!isLoggedIn) {
        addTechnicalLog("❌ Сначала войдите в аккаунт!");
        return;
    }
    if (currentPlayer.upgradePoints <= 0) {
        addTechnicalLog("❌ Нет очков улучшения статов!");
        return;
    }
    
    currentPlayer.upgradePoints--;
    
    if (stat === 'str') {
        playerExtraStr++;
        addTechnicalLog("⚔️ Сила увеличена! +2 к атаке");
    } else if (stat === 'def') {
        playerExtraDef++;
        addTechnicalLog("🛡️ Защита увеличена! +2 к защите");
    } else if (stat === 'hp') {
        playerExtraHp++;
        currentPlayer.maxHp += 10;
        currentPlayer.hp += 10;
        addTechnicalLog("❤️ Выносливость увеличена! +10 HP");
    }
    
    updateUI();
    savePlayerToCloud();
}

function recalcStats() {
    let bonusAtk = 0, bonusDef = 0;
    if (equipment.weapon) bonusAtk += equipment.weapon.atk;
    if (equipment.armor) bonusDef += equipment.armor.def;
    if (equipment.ring) { bonusAtk += equipment.ring.atk; bonusDef += equipment.ring.def; }
    const skillBonuses = getSkillBonuses();
    bonusDef += skillBonuses.bonusDef;
    const totalStr = currentPlayer.str + playerExtraStr * 2 + bonusAtk;
    const totalDef = currentPlayer.def + playerExtraDef * 2 + bonusDef;
    const totalMaxHp = currentPlayer.maxHp + playerExtraHp * 10;
    return { str: totalStr, def: totalDef, maxHp: totalMaxHp };
}

function updateUI() {
    const expNeeded = currentPlayer.level * 150;
    const stats = recalcStats();
    
    document.getElementById("heroHp").innerText = currentPlayer.hp;
    document.getElementById("heroMaxHp").innerText = stats.maxHp;
    document.getElementById("heroLvl").innerText = currentPlayer.level;
    document.getElementById("heroExp").innerText = currentPlayer.exp;
    document.getElementById("heroExpNeed").innerText = expNeeded;
    document.getElementById("heroGold").innerText = currentPlayer.gold;
    document.getElementById("heroStr").innerHTML = `${stats.str} <span style="color:#4caf50;">(+${playerExtraStr * 2 + (equipment.weapon?.atk || 0)})</span>`;
    document.getElementById("heroDef").innerHTML = `${stats.def} <span style="color:#4caf50;">(+${playerExtraDef * 2 + (equipment.armor?.def || 0) + (equipment.ring?.def || 0)})</span>`;
    document.getElementById("heroWood").innerText = currentPlayer.wood;
    document.getElementById("heroOre").innerText = currentPlayer.ore;
    document.getElementById("heroSkillPoints").innerText = currentPlayer.skillPoints;
    document.getElementById("heroUpgradePoints").innerText = currentPlayer.upgradePoints;

    if (typeof quests !== 'undefined') {
        document.getElementById("questGoblins").innerHTML = `${quests.goblins}/5`;
        document.getElementById("questOre").innerHTML = `${quests.ore}/10`;
        document.getElementById("questWood").innerHTML = `${quests.wood}/10`;
    }
    
    document.getElementById("campStatus").innerHTML = campActive ? "🔥 Активен" : "Нет";
    
    updateLoginUI();
    
    const classDisplay = document.getElementById("heroClassDisplay");
    if (classDisplay && currentPlayer.character_class) {
        const classData = characterClasses[currentPlayer.character_class] || characterClasses['Мечник'];
        classDisplay.innerHTML = `${classData.icon || '⚔️'} ${currentPlayer.character_class}`;
    }
}