// ======================== ИНИЦИАЛИЗАЦИЯ ========================
if (typeof supabase !== "undefined" && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("☁️ Supabase подключён");
}

// Привязка кнопок
document.getElementById("fightBtn").onclick = () => {
    const tile = getCurrentTile();
    if (tile.type === "safe") restHeal();
    else startAutoCombat();
};
document.getElementById("gatherBtn").onclick = () => startAutoGather();
document.getElementById("campBtn").onclick = () => toggleCamp();
document.getElementById("stopAutoBtn").onclick = () => stopAuto();
document.getElementById("chatSendBtn").onclick = () => sendChatMessage();
document.getElementById("createGuildBtn").onclick = createGuild;
document.getElementById("sellAllCommonBtn").onclick = () => sellAllCommon();
document.getElementById("stopMoveBtn").onclick = () => stopMoving();
document.getElementById("chatInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChatMessage();
});

document.getElementById("loginBtn").onclick = async () => {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    
    if (!username || !password) {
        addTechnicalLog("❌ Введите логин и пароль");
        return;
    }
    await loginPlayer(username, password);
    loadChatMessages();
    loadOnlinePlayers();
    loadOtherPlayers();
    drawMap();
};

document.getElementById("registerBtn").onclick = async () => {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    
    if (!username || !password) {
        addTechnicalLog("❌ Введите логин и пароль");
        return;
    }
    await registerPlayer(username, password);
    loadChatMessages();
    loadOnlinePlayers();
    loadOtherPlayers();
    drawMap();
};

document.getElementById("logoutBtn").onclick = () => {
    logoutPlayer();
    loadChatMessages();
};

document.querySelectorAll('.upgrade-stat').forEach(btn => {
    btn.onclick = () => upgradeStat(btn.getAttribute('data-stat'));
});

window.unequipItem = unequipItem;

document.getElementById("soundBtn").onclick = () => {
    soundEnabled = !soundEnabled;
    document.getElementById("soundBtn").innerHTML = soundEnabled ? "🔊" : "🔇";
};

// Сворачивание инвентаря
const inventoryHeader = document.getElementById("inventoryHeader");
const inventoryContent = document.getElementById("inventoryContent");
let inventoryCollapsed = false;
inventoryHeader.onclick = () => {
    inventoryCollapsed = !inventoryCollapsed;
    inventoryContent.classList.toggle("collapsed");
    inventoryHeader.querySelector("span").innerHTML = inventoryCollapsed ? "▶" : "▼";
};

// Сворачивание статов
const statsHeader = document.getElementById("statsHeader");
const statsContent = document.getElementById("statsContent");
let statsCollapsed = false;
statsHeader.onclick = () => {
    statsCollapsed = !statsCollapsed;
    statsContent.classList.toggle("collapsed");
    statsHeader.querySelector("span").innerHTML = statsCollapsed ? "▶" : "▼";
};

// Вкладки
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(`tab-${btn.getAttribute("data-tab")}`).classList.add("active");
        
        if (btn.getAttribute("data-tab") === "online") loadOnlinePlayers();
        if (btn.getAttribute("data-tab") === "chat") loadChatMessages();
    };
});

if (document.querySelector(".tab-btn")) document.querySelector(".tab-btn").click();

// Запуск
generateMap();
loadAllTiles();
setTimeout(() => {
    updateTileDisplaySize();
    drawMap();
}, 100);
updateActionButtons();
updateUI();
renderInventory();
renderSkills();

addTechnicalLog("🗺️ КАРТА 20×20! Кликайте по клеткам для перемещения");
addTechnicalLog("🌀 Улучшайте умения и статы");
addTechnicalLog("💬 Чат работает — войдите в аккаунт и общайтесь!");
addTechnicalLog("👥 Вкладка ОНЛАЙН показывает активных игроков");

document.body.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
});

setInterval(() => {
    if (currentPlayer.id && isLoggedIn) savePlayerToCloud();
}, 30000);
setInterval(() => {
    loadOtherPlayers();
}, 10000);
setInterval(loadOnlinePlayers, 30000);

loadSession();