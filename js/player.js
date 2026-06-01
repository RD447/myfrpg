function updateUI() {
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
    if (heroStr) heroStr.innerHTML = `${stats.str} <span style="color:#4caf50;">(+${playerExtraStr * 2 + (equipment.weapon?.atk || 0)})</span>`;
    if (heroDef) heroDef.innerHTML = `${stats.def} <span style="color:#4caf50;">(+${playerExtraDef * 2 + (equipment.armor?.def || 0) + (equipment.ring?.def || 0)})</span>`;
    if (heroWood) heroWood.innerText = currentPlayer.wood;
    if (heroOre) heroOre.innerText = currentPlayer.ore;
    if (heroSkillPoints) heroSkillPoints.innerText = currentPlayer.skillPoints;
    if (heroUpgradePoints) heroUpgradePoints.innerText = currentPlayer.upgradePoints;
    
    if (typeof quests !== 'undefined') {
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