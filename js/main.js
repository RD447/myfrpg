// ======================== ИНИЦИАЛИЗАЦИЯ ========================
if (typeof supabase !== "undefined") {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("☁️ Supabase подключён");
}

// Глобальные переменные
window.campActive = false;
let autoContent = document.getElementById("autoContent");

// Функция загрузки онлайн игроков
async function loadOnlinePlayers() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from("players")
            .select("username")
            .limit(30);
        if (error) throw error;
        const onlineDiv = document.getElementById("onlineList");
        if (onlineDiv) {
            if (data && data.length > 0) {
                onlineDiv.innerHTML = data.map(p => `<span>${escapeHtml(p.username)}</span>`).join("");
            } else {
                onlineDiv.innerHTML = "<span>Нет игроков</span>";
            }
        }
    } catch (e) {
        console.error("Ошибка загрузки онлайн:", e);
        const onlineDiv = document.getElementById("onlineList");
        if (onlineDiv) onlineDiv.innerHTML = "<span>Ошибка загрузки</span>";
    }
}

// Перетаскивание авто-панели
const autoPanel = document.getElementById("autoPanel");
const autoHeader = document.getElementById("autoHeader");
let isDraggingAuto = false, dragStartX = 0, dragStartY = 0;

if (autoHeader) {
    autoHeader.addEventListener("mousedown", (e) => {
        isDraggingAuto = true;
        dragStartX = e.clientX - autoPanel.offsetLeft;
        dragStartY = e.clientY - autoPanel.offsetTop;
        autoPanel.style.cursor = "grabbing";
        e.preventDefault();
    });
}
document.addEventListener("mousemove", (e) => {
    if (!isDraggingAuto) return;
    autoPanel.style.left = (e.clientX - dragStartX) + "px";
    autoPanel.style.top = (e.clientY - dragStartY) + "px";
    autoPanel.style.bottom = "auto";
    autoPanel.style.right = "auto";
});
document.addEventListener("mouseup", () => {
    isDraggingAuto = false;
    autoPanel.style.cursor = "grab";
});

// Перетаскивание модального окна
const modalHeader = document.querySelector("#classModal h3");
let isDraggingModal = false, modalStartX = 0, modalStartY = 0;

if (modalHeader) {
    modalHeader.style.cursor = "grab";
    modalHeader.addEventListener("mousedown", (e) => {
        const modal = document.getElementById("classModal");
        if (modal.style.display !== "block") return;
        isDraggingModal = true;
        modalStartX = e.clientX - modal.offsetLeft;
        modalStartY = e.clientY - modal.offsetTop;
        modalHeader.style.cursor = "grabbing";
        e.preventDefault();
    });
}
document.addEventListener("mousemove", (e) => {
    if (!isDraggingModal) return;
    const modal = document.getElementById("classModal");
    modal.style.left = (e.clientX - modalStartX) + "px";
    modal.style.top = (e.clientY - modalStartY) + "px";
    modal.style.transform = "none";
});
document.addEventListener("mouseup", () => {
    isDraggingModal = false;
    if (modalHeader) modalHeader.style.cursor = "grab";
});

// === ФУНКЦИИ UI ===
function updateActionButtons() {
    const tile = getCurrentTile();
    const fightBtn = document.getElementById("fightBtn");
    const gatherBtn = document.getElementById("gatherBtn");
    const campBtn = document.getElementById("campBtn");
    
    if (fightBtn) fightBtn.style.display = "none";
    if (gatherBtn) gatherBtn.style.display = "none";
    if (campBtn) campBtn.style.display = "block";
    
    const oldClassBtn = document.getElementById("changeClassBtn");
    if (oldClassBtn) oldClassBtn.remove();
    
    if (tile && tile.type === "combat") {
        if (fightBtn) {
            fightBtn.style.display = "block";
            fightBtn.innerHTML = `⚔️ АВТОБОЙ (${tile.enemy === 'goblin' ? 'Гоблин' : tile.enemy === 'troll' ? 'Тролль' : 'Разбойник'})`;
        }
        if (tile.resource && gatherBtn) {
            gatherBtn.style.display = "block";
            gatherBtn.innerHTML = tile.resource === "wood" ? "🌲 АВТОСБОР ДРЕВЕСИНЫ" : "⛏️ АВТОСБОР РУДЫ";
        }
        if (campBtn) {
            if (window.campActive) campBtn.classList.add("active");
            else campBtn.classList.remove("active");
        }
        
    } else if (tile && tile.type === "safe") {
        if (fightBtn) {
            fightBtn.style.display = "block";
            fightBtn.innerHTML = "💊 ОТДОХНУТЬ (+10 HP за 5 монет)";
        }
        if (campBtn) campBtn.style.display = "block";
        
        const newClassBtn = document.createElement("button");
        newClassBtn.id = "changeClassBtn";
        newClassBtn.className = "btn btn-camp";
        newClassBtn.innerHTML = "🔄 СМЕНИТЬ КЛАСС (100✨)";
        newClassBtn.onclick = () => showClassSelector();
        const actionBar = document.getElementById("actionBar");
        if (actionBar) actionBar.appendChild(newClassBtn);
        
        if (campBtn) {
            if (window.campActive) campBtn.classList.add("active");
            else campBtn.classList.remove("active");
        }
        
    } else {
        if (campBtn) {
            if (window.campActive) campBtn.classList.add("active");
            else campBtn.classList.remove("active");
        }
    }
    
    const stopBtn = document.getElementById("stopAutoBtn");
    if (stopBtn) stopBtn.style.display = autoActive ? "block" : "none";
    
    let existingHealBtn = document.getElementById("campHealBtn");
    let existingCookBtn = document.getElementById("campCookBtn");
    
    if (window.campActive) {
        if (!existingHealBtn) {
            const healCampBtn = document.createElement("button");
            healCampBtn.id = "campHealBtn";
            healCampBtn.className = "btn btn-success";
            healCampBtn.innerHTML = "💊 ЛЕЧЕНИЕ (5✨)";
            healCampBtn.onclick = () => campHeal();
            const actionBar = document.getElementById("actionBar");
            if (actionBar) actionBar.appendChild(healCampBtn);
        }
        if (!existingCookBtn) {
            const cookCampBtn = document.createElement("button");
            cookCampBtn.id = "campCookBtn";
            cookCampBtn.className = "btn btn-camp";
            cookCampBtn.innerHTML = "🍲 ГОТОВКА (2🌲)";
            cookCampBtn.onclick = () => campCook();
            const actionBar = document.getElementById("actionBar");
            if (actionBar) actionBar.appendChild(cookCampBtn);
        }
    } else {
        if (existingHealBtn) existingHealBtn.remove();
        if (existingCookBtn) existingCookBtn.remove();
    }
}

function updateAutoPanel(title, text, progress) {
    const autoTitle = document.getElementById("autoTitle");
    const autoText = document.getElementById("autoText");
    const autoProgress = document.getElementById("autoProgress");
    if (autoTitle) autoTitle.innerHTML = title;
    if (autoText) autoText.innerHTML = text;
    if (progress !== undefined && autoProgress) autoProgress.style.width = (progress * 100) + "%";
    if (autoContent && !autoContent.classList.contains("visible")) autoContent.classList.add("visible");
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

// === ПРИВЯЗКА КНОПОК (с проверкой существования элементов) ===
const fightBtn = document.getElementById("fightBtn");
if (fightBtn) {
    fightBtn.onclick = () => {
        const tile = getCurrentTile();
        if (tile && tile.type === "safe") restHeal();
        else startAutoCombat();
    };
}

const gatherBtn = document.getElementById("gatherBtn");
if (gatherBtn) gatherBtn.onclick = () => startAutoGather();

const campBtn = document.getElementById("campBtn");
if (campBtn) campBtn.onclick = () => toggleCamp();

const stopAutoBtn = document.getElementById("stopAutoBtn");
if (stopAutoBtn) stopAutoBtn.onclick = () => stopAuto();

const stopMoveBtn = document.getElementById("stopMoveBtn");
if (stopMoveBtn) stopMoveBtn.onclick = () => stopMoving();

const sellAllCommonBtn = document.getElementById("sellAllCommonBtn");
if (sellAllCommonBtn) sellAllCommonBtn.onclick = () => sellAllCommon();

const createGuildBtn = document.getElementById("createGuildBtn");
if (createGuildBtn) createGuildBtn.onclick = () => createGuild();

const chatSendBtn = document.getElementById("chatSendBtn");
if (chatSendBtn) chatSendBtn.onclick = () => sendChatMessage();

const chatInput = document.getElementById("chatInput");
if (chatInput) {
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendChatMessage();
    });
}

const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
    loginBtn.onclick = async () => {
        const username = document.getElementById("loginUsername")?.value.trim();
        const password = document.getElementById("loginPassword")?.value;
        if (!username || !password) {
            addTechnicalLog("❌ Введите логин и пароль");
            return;
        }
        await loginPlayer(username, password);
        if (typeof loadChatMessages === 'function') loadChatMessages();
        if (typeof loadOnlinePlayers === 'function') loadOnlinePlayers();
        if (typeof loadOtherPlayers === 'function') loadOtherPlayers();
        if (typeof drawMap === 'function') drawMap();
    };
}

const registerBtn = document.getElementById("registerBtn");
if (registerBtn) {
    registerBtn.onclick = async () => {
        const username = document.getElementById("loginUsername")?.value.trim();
        const password = document.getElementById("loginPassword")?.value;
        if (!username || !password) {
            addTechnicalLog("❌ Введите логин и пароль");
            return;
        }
        await registerPlayer(username, password);
        if (typeof loadChatMessages === 'function') loadChatMessages();
        if (typeof loadOnlinePlayers === 'function') loadOnlinePlayers();
        if (typeof loadOtherPlayers === 'function') loadOtherPlayers();
        if (typeof drawMap === 'function') drawMap();
    };
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) logoutBtn.onclick = () => {
    logoutPlayer();
    if (typeof loadChatMessages === 'function') loadChatMessages();
};

const soundBtn = document.getElementById("soundBtn");
if (soundBtn) {
    soundBtn.onclick = () => {
        soundEnabled = !soundEnabled;
        soundBtn.innerHTML = soundEnabled ? "🔊" : "🔇";
        if (typeof playSound === 'function') playSound("levelup");
    };
}

// Прокачка статов
document.querySelectorAll('.upgrade-stat').forEach(btn => {
    btn.onclick = () => upgradeStat(btn.getAttribute('data-stat'));
});

// Сворачивание инвентаря
const inventoryHeader = document.getElementById("inventoryHeader");
const inventoryContent = document.getElementById("inventoryContent");
let inventoryCollapsed = false;
if (inventoryHeader) {
    inventoryHeader.onclick = () => {
        inventoryCollapsed = !inventoryCollapsed;
        if (inventoryContent) inventoryContent.classList.toggle("collapsed");
        const span = inventoryHeader.querySelector("span");
        if (span) span.innerHTML = inventoryCollapsed ? "▶" : "▼";
    };
}

// Сворачивание статов
const statsHeader = document.getElementById("statsHeader");
const statsContent = document.getElementById("statsContent");
let statsCollapsed = false;
if (statsHeader) {
    statsHeader.onclick = () => {
        statsCollapsed = !statsCollapsed;
        if (statsContent) statsContent.classList.toggle("collapsed");
        const span = statsHeader.querySelector("span");
        if (span) span.innerHTML = statsCollapsed ? "▶" : "▼";
    };
}

// Вкладки
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));
        btn.classList.add("active");
        const tabId = btn.getAttribute("data-tab");
        const tabContent = document.getElementById(`tab-${tabId}`);
        if (tabContent) tabContent.classList.add("active");
        
        if (tabId === "online" && typeof loadOnlinePlayers === 'function') loadOnlinePlayers();
        if (tabId === "chat" && isLoggedIn && typeof loadChatMessages === 'function') loadChatMessages();
    };
});

if (document.querySelector(".tab-btn")) document.querySelector(".tab-btn").click();

// Авто-панель
if (autoContent) {
    const autoHeaderEl = document.getElementById("autoHeader");
    if (autoHeaderEl) {
        autoHeaderEl.onclick = () => {
            autoContent.classList.toggle("visible");
        };
    }
}

// === ЗАПУСК ===
if (typeof generateMap === 'function') generateMap();
if (typeof loadAllTiles === 'function') loadAllTiles();
setTimeout(() => {
    if (typeof updateTileDisplaySize === 'function') updateTileDisplaySize();
    if (typeof drawMap === 'function') drawMap();
}, 100);
if (typeof updateActionButtons === 'function') updateActionButtons();
if (typeof updateUI === 'function') updateUI();
if (typeof renderInventory === 'function') renderInventory();
if (typeof renderSkills === 'function') renderSkills();
addTechnicalLog("🗺️ КАРТА 20×20! Кликайте по клеткам для перемещения");
addTechnicalLog("🌀 Улучшайте умения и статы");
addTechnicalLog("💬 Чат работает — войдите в аккаунт и общайтесь!");
addTechnicalLog("👥 Вкладка ОНЛАЙН показывает активных игроков");

// Автосохранение
setInterval(() => {
    if (currentPlayer.id && isLoggedIn && typeof savePlayerToCloud === 'function') savePlayerToCloud();
}, 30000);
setInterval(() => {
    if (isLoggedIn && typeof loadOtherPlayers === 'function') loadOtherPlayers();
}, 10000);
if (typeof loadOnlinePlayers === 'function') setInterval(loadOnlinePlayers, 30000);

// Восстановление сессии
if (typeof loadSession === 'function') loadSession();

// Принудительная проверка сессии при загрузке
setTimeout(() => {
    if (!isLoggedIn) {
        const savedUser = localStorage.getItem('rpg_username');
        const savedPass = localStorage.getItem('rpg_password');
        if (savedUser && savedPass && typeof loginPlayer === 'function') {
            console.log("Восстановление сессии:", savedUser);
            loginPlayer(savedUser, savedPass);
        }
    }
}, 1000);

// Активация звука при клике
document.body.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
});

// Глобальные функции
window.unequipItem = typeof unequipItem === 'function' ? unequipItem : function() {};
window.showClassSelector = typeof showClassSelector === 'function' ? showClassSelector : function() {};
window.closeModal = typeof closeModal === 'function' ? closeModal : function() {};