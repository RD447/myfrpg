// ======================== УМЕНИЯ С СОХРАНЕНИЕМ ========================
// Переменная skills объявлена в config.js

async function saveSkillsToCloud() { 
    if (!supabaseClient || !window.currentPlayer?.id || !window.isLoggedIn) return; 
    const skillsData = {
        powerStrike: window.skills.powerStrike.level,
        endurance: window.skills.endurance.level,
        berserk: window.skills.berserk.level
    };
    await supabaseClient.from("players").update({ 
        skills_data: JSON.stringify(skillsData) 
    }).eq("id", window.currentPlayer.id); 
}

function loadSkillsFromCloud(skData) { 
    try { 
        if (skData && skData !== '{}') { 
            let d = JSON.parse(skData); 
            window.skills.powerStrike.level = d.powerStrike || 0; 
            window.skills.endurance.level = d.endurance || 0; 
            window.skills.berserk.level = d.berserk || 0; 
        } 
        renderSkills(); 
    } catch(e) {} 
}

function renderSkills() { 
    let cont = document.getElementById("skillsList"); 
    if (!cont) return; 
    cont.innerHTML = `
        <div class="skill-item"><span>💥 Мощный удар (${window.skills.powerStrike.level}/${window.skills.powerStrike.maxLevel})</span><button class="small-btn" onclick="upgradeSkill('powerStrike')">+</button></div>
        <div class="skill-item"><span>🛡️ Стойкость (${window.skills.endurance.level}/${window.skills.endurance.maxLevel})</span><button class="small-btn" onclick="upgradeSkill('endurance')">+</button></div>
        <div class="skill-item"><span>⚔️ Берсерк (${window.skills.berserk.level}/${window.skills.berserk.maxLevel})</span><button class="small-btn" onclick="upgradeSkill('berserk')">+</button></div>
        <div>⭐ Очков умений: ${window.currentPlayer.skillPoints}</div>
    `; 
}

function upgradeSkill(sn) { 
    if (!window.isLoggedIn) return; 
    if (window.currentPlayer.skillPoints <= 0) { 
        addTechnicalLog("❌ Нет очков умений"); 
        return; 
    } 
    if (window.skills[sn].level >= window.skills[sn].maxLevel) { 
        addTechnicalLog("❌ Максимальный уровень"); 
        return; 
    } 
    window.skills[sn].level++; 
    window.currentPlayer.skillPoints--; 
    window.currentPlayer[`skill_${sn === 'powerStrike' ? 'power_strike' : sn}`] = window.skills[sn].level; 
    renderSkills(); 
    updateUI(); 
    savePlayerToCloud(); 
    saveSkillsToCloud(); 
    addTechnicalLog(`✨ Улучшено!`); 
}

function getSkillBonuses() { 
    return { bonusDef: window.skills.endurance.level * 2 }; 
}