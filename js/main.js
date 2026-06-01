// ======================== ИНИЦИАЛИЗАЦИЯ ========================
// Подключение Supabase
if (typeof supabase !== "undefined" && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("☁️ Supabase подключён");
}

// === ПЕРЕМЕННЫЕ ===
let campActive = false;
let autoActive = false;
let autoType = null;
let autoInterval = null;
let guild = null;

// === ФУНКЦИИ UI ===
function updateActionButtons() {
    const tile = getCurrentTile();
    const fightBtn = document.getElementById("fightBtn");
    const gatherBtn = document.getElementById("gatherBtn");
    const campBtn = document.getElementById("campBtn");
    const classBtn = document.getElementById("changeClassBtn");
    
    fightBtn.style.display = "none";
    gatherBtn.style.display = "none";
    campBtn.style.display = "block";
    
    if (classBtn) classBtn.remove();
    
    if (tile.type === "combat") {
        fightBtn.style.display = "block";
        fightBtn.innerHTML = `⚔️ АВТОБОЙ (${tile.enemy === 'goblin' ? 'Гоблин' : tile.enemy === 'troll' ? 'Тролль' : 'Разбойник'})`;
        if (tile.resource) {
            gatherBtn.style.display = "block";
            gatherBtn.innerHTML = tile.resource === "wood" ? "🌲 АВТОСБОР ДРЕВЕСИНЫ" : "⛏️ АВТОСБОР РУДЫ";
        }
        if (campActive) campBtn.classList.add("active");
        else campBtn.classList.remove("active");
        
    } else if (tile.type === "safe") {
        fightBtn.style.display = "block";
        fightBtn.innerHTML = "💊 ОТДОХНУТЬ (+10 HP за 5 монет)";
        campBtn.style.display = "block";
        
        const newClassBtn = document.createElement("button");
        newClassBtn.id = "changeClassBtn";
        newClassBtn.className = "btn btn-camp";
        newClassBtn.innerHTML = "🔄 СМЕНИТЬ КЛАСС (100✨)";
        newClassBtn.onclick = () => showClassSelector();
        document.getElementById("actionBar").appendChild(newClassBtn);
        
        if (campActive) campBtn.classList.add("active");
        else campBtn.classList.remove("active");
        
    } else {
        if (campActive) campBtn.classList.add("active");
        else campBtn.classList.remove("active");
    }
    
    const stopBtn = document.getElementById("stopAutoBtn");
    stopBtn.style.display = autoActive ? "block" : "none";
    
    let existingHealBtn = document.getElementById("campHealBtn");
    let existingCookBtn = document.getElementById("campCookBtn");
    
    if (campActive) {
        if (!existingHealBtn) {
            const healCampBtn = document.createElement("button");
            healCampBtn.id = "campHealBtn";
            healCampBtn.className = "btn btn-success";
            healCampBtn.innerHTML = "💊 ЛЕЧЕНИЕ В ЛАГЕРЕ (5✨)";
            healCampBtn.onclick = () => campHeal();
            document.getElementById("actionBar").appendChild(healCampBtn);
        }
        if (!existingCookBtn) {
            const cookCampBtn = document.createElement("button");
            cookCampBtn.id = "campCookBtn";
            cookCampBtn.className = "btn btn-camp";
            cookCampBtn.innerHTML = "🍲 ПРИГОТОВИТЬ ЕДУ (2🌲)";
            cookCampBtn.onclick = () => campCook();
            document.getElementById("actionBar").appendChild(cookCampBtn);
        }
    } else {
        if (existingHealBtn) existingHealBtn.remove();
        if (existingCookBtn) existingCookBtn.remove();
    }
}

function updateAutoPanel(title, text, progress) {
    document.getElementById("autoTitle").innerHTML = title;
    document.getElementById("autoText").innerHTML = text;
    if (progress !== undefined) document.getElementById("autoProgress").style.width = (progress * 100) + "%";
    if (!autoContent.classList.contains("visible")) autoContent.classList.add("visible");
}

function restHeal() {
    if (!isLoggedIn) { addTechnicalLog("❌ Сначала войдите в аккаунт!"); return; }
    const stats = recalcStats();
    if (currentPlayer.gold >= 5 && currentPlayer.hp < stats.maxHp) {
        currentPlayer.gold -= 5;
        let heal = 10 + Math.floor(Math.random() * 10);
        currentPlayer.hp = Math.min(stats.maxHp, currentPlayer.hp + heal);
        addTechnicalLog(`💊 Вы отдохнули в деревне. +${heal} HP. -5 монет`);
        updateUI();
        savePlayerToCloud();
    } else if (currentPlayer.hp >= stats.maxHp) {
        addTechnicalLog("💚 Вы уже полностью здоровы!");
    } else {
        addTechnicalLog("❌ Не хватает монет (нужно 5)");
    }
}

// === ЛАГЕРЬ ===
// Удален из данного файла



// === ЗАГРУЗКА КАРТИНОК ===
const tileFiles = {
    GRASS: 'grass.png', FOREST: 'forest.png', MOUNTAIN: 'mountain.png',
    VILLAGE: 'village.png', WATER: 'water.png', CAVE: 'cave.png',
    BANDIT: 'bandit.png', WASTELAND: 'wasteland.png'
};

let loadedTiles = {};
let imagesLoaded = 0;
const imagesToLoad = Object.keys(tileFiles).length;

function tryLoadImage(key, path) {
    const img = new Image();
    img.onload = () => {
        loadedTiles[key] = img;
        imagesLoaded++;
        if (imagesLoaded === imagesToLoad) {
            addTechnicalLog(`🎨 Загружено ${imagesLoaded} картинок для карты!`);
            drawMap();
        }
    };
    img.onerror = () => {
        imagesLoaded++;
        if (imagesLoaded === imagesToLoad) {
            addTechnicalLog(`⚠️ Картинки не найдены. Используем цветные квадраты.`);
            drawMap();
        }
    };
    img.src = path;
}

function loadAllTiles() {
    for (const [key, filename] of Object.entries(tileFiles)) {
        tryLoadImage(key, `images/${filename}`);
    }
}

// === ПРИВЯЗКА КНОПОК ===
document.getElementById("fightBtn").onclick = () => {
    const tile = getCurrentTile();
    if (tile.type === "safe") restHeal();
    else startAutoCombat();
};
document.getElementById("gatherBtn").onclick = () => startAutoGather();
document.getElementById("campBtn").onclick = () => toggleCamp();
document.getElementById("stopAutoBtn").onclick = () => stopAuto();
document.getElementById("stopMoveBtn").onclick = () => stopMoving();
document.getElementById("sellAllCommonBtn").onclick = () => sellAllCommon();
document.getElementById("createGuildBtn").onclick = () => createGuild();

// Чат
document.getElementById("chatSendBtn").onclick = () => sendChatMessage();
document.getElementById("chatInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChatMessage();
});

// Авторизация
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

// Прокачка статов
document.querySelectorAll('.upgrade-stat').forEach(btn => {
    btn.onclick = () => upgradeStat(btn.getAttribute('data-stat'));
});

// Звук
document.getElementById("soundBtn").onclick = () => {
    soundEnabled = !soundEnabled;
    document.getElementById("soundBtn").innerHTML = soundEnabled ? "🔊" : "🔇";
};

// Сворачивание инвентаря
const inventoryHeader = document.getElementById("inventoryHeader");
const inventoryContent = document.getElementById("inventoryContent");
let inventoryCollapsed = false;
if (inventoryHeader) {
    inventoryHeader.onclick = () => {
        inventoryCollapsed = !inventoryCollapsed;
        inventoryContent.classList.toggle("collapsed");
        inventoryHeader.querySelector("span").innerHTML = inventoryCollapsed ? "▶" : "▼";
    };
}

// Сворачивание статов
const statsHeader = document.getElementById("statsHeader");
const statsContent = document.getElementById("statsContent");
let statsCollapsed = false;
if (statsHeader) {
    statsHeader.onclick = () => {
        statsCollapsed = !statsCollapsed;
        statsContent.classList.toggle("collapsed");
        statsHeader.querySelector("span").innerHTML = statsCollapsed ? "▶" : "▼";
    };
}

// Вкладки
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(`tab-${btn.getAttribute("data-tab")}`).classList.add("active");
        
        if (btn.getAttribute("data-tab") === "online") loadOnlinePlayers();
        if (btn.getAttribute("data-tab") === "chat" && isLoggedIn) loadChatMessages();
    };
});

if (document.querySelector(".tab-btn")) document.querySelector(".tab-btn").click();

// Авто-панель
const autoContent = document.getElementById("autoContent");
let autoPanelCollapsed = false;
document.getElementById("autoHeader").onclick = () => {
    autoPanelCollapsed = !autoPanelCollapsed;
    autoContent.classList.toggle("visible");
};

// === ЗАПУСК ===
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

// Автосохранение
setInterval(() => {
    if (currentPlayer.id && isLoggedIn) savePlayerToCloud();
}, 30000);
setInterval(() => {
    if (isLoggedIn) loadOtherPlayers();
}, 10000);
setInterval(loadOnlinePlayers, 30000);

// Восстановление сессии
loadSession();

// Активация звука при клике
document.body.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
});

window.unequipItem = unequipItem;