// ======================== ГИЛЬДИЯ ========================
let guild = null;

function createGuild() {
    const nameInput = document.getElementById("guildNameInput");
    const name = nameInput.value.trim();
    if (name) {
        guild = { name: name, members: [currentPlayer.username] };
        document.getElementById("guildStatus").innerHTML = `🏰 ${name} (основатель)`;
        addTechnicalLog(`🏰 Вы создали гильдию "${name}"!`);
        nameInput.value = "";
        savePlayerToCloud();
    } else {
        addTechnicalLog("❌ Введите название гильдии");
    }
}