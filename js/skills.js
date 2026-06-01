// ======================== УМЕНИЯ С СОХРАНЕНИЕМ ========================
let skills = {
    powerStrike: { level: 0, maxLevel: 5, name: "💥 Мощный удар", desc: "Каждые 5 ударов наносит 100% дополнительного урона" },
    endurance: { level: 0, maxLevel: 5, name: "🛡️ Стойкость", desc: "Пассивно увеличивает защиту на +2 за уровень" },
    berserk: { level: 0, maxLevel: 5, name: "⚔️ Берсерк", desc: "Каждые 10 секунд увеличивает атаку на 30% на 3 секунды" }
};

// Сохранение умений в БД
async function saveSkillsToCloud() {
    if (!supabaseClient || !currentPlayer.id || !isLoggedIn) return;
    
    const skillsData = {
        powerStrike: skills.powerStrike.level,
        endurance: skills.endurance.level,
        berserk: skills.berserk.level
    };
    
    try {
        await supabaseClient
            .from("players")
            .update({
                skills_data: JSON.stringify(skillsData),
                updated_at: new Date().toISOString()
            })
            .eq("id", currentPlayer.id);
    } catch (e) {
        console.error("Ошибка сохранения умений:", e);
    }
}

// Загрузка умений из БД
function loadSkillsFromCloud(skillsData) {
    try {
        if (skillsData && skillsData !== '{}') {
            const data = JSON.parse(skillsData);
            skills.powerStrike.level = data.powerStrike || 0;
            skills.endurance.level = data.endurance || 0;
            skills.berserk.level = data.berserk || 0;
        }
        renderSkills();
    } catch (e) {
        console.error("Ошибка загрузки умений:", e);
    }
}

function renderSkills() {
    const container = document.getElementById("skillsList");
    if (!container) return;
    
    container.innerHTML = `
        <div class="skill-item">
            <div class="skill-name">${skills.powerStrike.name} (${skills.powerStrike.level}/${skills.powerStrike.maxLevel})</div>
            <div class="skill-desc">${skills.powerStrike.desc}</div>
            <div class="skill-progress"><div class="skill-progress-fill" style="width: ${(skills.powerStrike.level/skills.powerStrike.maxLevel)*100}%"></div></div>
            <button class="small-btn upgrade-skill" data-skill="powerStrike" ${skills.powerStrike.level >= skills.powerStrike.maxLevel || currentPlayer.skillPoints <= 0 || !isLoggedIn ? 'disabled' : ''}>Улучшить (1 очко)</button>
        </div>
        <div class="skill-item">
            <div class="skill-name">${skills.endurance.name} (${skills.endurance.level}/${skills.endurance.maxLevel})</div>
            <div class="skill-desc">${skills.endurance.desc}</div>
            <div class="skill-progress"><div class="skill-progress-fill" style="width: ${(skills.endurance.level/skills.endurance.maxLevel)*100}%"></div></div>
            <button class="small-btn upgrade-skill" data-skill="endurance" ${skills.endurance.level >= skills.endurance.maxLevel || currentPlayer.skillPoints <= 0 || !isLoggedIn ? 'disabled' : ''}>Улучшить (1 очко)</button>
        </div>
        <div class="skill-item">
            <div class="skill-name">${skills.berserk.name} (${skills.berserk.level}/${skills.berserk.maxLevel})</div>
            <div class="skill-desc">${skills.berserk.desc}</div>
            <div class="skill-progress"><div class="skill-progress-fill" style="width: ${(skills.berserk.level/skills.berserk.maxLevel)*100}%"></div></div>
            <button class="small-btn upgrade-skill" data-skill="berserk" ${skills.berserk.level >= skills.berserk.maxLevel || currentPlayer.skillPoints <= 0 || !isLoggedIn ? 'disabled' : ''}>Улучшить (1 очко)</button>
        </div>
        <div style="margin-top: 12px; color: #ffd966;">⭐ Очков умений: ${currentPlayer.skillPoints}</div>
    `;
    
    document.querySelectorAll('.upgrade-skill').forEach(btn => {
        btn.onclick = () => upgradeSkill(btn.getAttribute('data-skill'));
    });
}

function upgradeSkill(skillName) {
    if (!isLoggedIn) {
        addTechnicalLog("❌ Сначала войдите в аккаунт!");
        return;
    }
    if (currentPlayer.skillPoints <= 0) {
        addTechnicalLog("❌ Нет очков умений!");
        return;
    }
    if (skills[skillName].level >= skills[skillName].maxLevel) {
        addTechnicalLog(`❌ ${skills[skillName].name} уже максимального уровня!`);
        return;
    }
    skills[skillName].level++;
    currentPlayer.skillPoints--;
    
    if (skillName === 'powerStrike') currentPlayer.skill_power_strike = skills.powerStrike.level;
    if (skillName === 'endurance') currentPlayer.skill_endurance = skills.endurance.level;
    if (skillName === 'berserk') currentPlayer.skill_berserk = skills.berserk.level;
    
    addTechnicalLog(`✨ ${skills[skillName].name} улучшен до ${skills[skillName].level} уровня!`);
    renderSkills();
    updateUI();
    savePlayerToCloud();
    saveSkillsToCloud();
}

function getSkillBonuses() {
    let bonusDef = skills.endurance.level * 2;
    return { bonusDef };
}