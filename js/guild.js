let guild = null;
function createGuild() {
    let name = document.getElementById("guildNameInput").value.trim();
    if (!name) { addTechnicalLog("❌ Введите название"); return; }
    guild = { name, members: [currentPlayer.username] };
    document.getElementById("guildStatus").innerHTML = `🏰 ${name} (основатель)`;
    addTechnicalLog(`🏰 Создана гильдия "${name}"!`);
    savePlayerToCloud();
}