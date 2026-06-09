// ======================== АВТОРИЗАЦИЯ ========================
async function loginPlayer(username, password) {
    if (!supabaseClient) {
        addTechnicalLog("❌ Supabase не подключён");
        return false;
    }
    
    if (!password || password.length < 4) {
        addTechnicalLog("❌ Пароль должен быть минимум 4 символа");
        return false;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from("players")
            .select("*")
            .eq("username", username)
            .maybeSingle();
        
        if (error) {
            addTechnicalLog(`❌ Ошибка поиска: ${error.message}`);
            return false;
        }
        
        if (data) {
            if (data.password_hash !== btoa(password)) {
                addTechnicalLog("❌ Неверный пароль!");
                return false;
            }
            
            window.currentPlayer.id = data.id;
            window.currentPlayer.username = data.username;
            window.currentPlayer.level = data.level;
            window.currentPlayer.exp = data.exp;
            window.currentPlayer.hp = data.hp;
            window.currentPlayer.maxHp = data.max_hp;
            window.currentPlayer.str = data.str;
            window.currentPlayer.def = data.def;
            window.currentPlayer.gold = data.gold;
            window.currentPlayer.wood = data.wood;
            window.currentPlayer.ore = data.ore;
            window.currentPlayer.skillPoints = data.skill_points;
            window.currentPlayer.skill_power_strike = data.skill_power_strike || 0;
            window.currentPlayer.skill_endurance = data.skill_endurance || 0;
            window.currentPlayer.skill_berserk = data.skill_berserk || 0;
            window.currentPlayer.character_class = data.character_class || 'Мечник';
            window.currentPlayer.upgradePoints = data.upgrade_points || 2;
            
            window.playerExtraStr = data.extra_str || 0;
            window.playerExtraDef = data.extra_def || 0;
            window.playerExtraHp = data.extra_hp || 0;
            
            if (data.player_x !== undefined && data.player_x !== null) {
                window.playerPos = { x: data.player_x, y: data.player_y };
            } else {
                window.playerPos = { x: 10, y: 10 };
            }
            
            // Загружаем инвентарь
            if (typeof loadInventoryFromCloud === 'function') {
                loadInventoryFromCloud(data.inventory_data, data.equipment_data);
            }
            
            // Загружаем квесты
            if (typeof loadQuestsFromCloud === 'function') {
                loadQuestsFromCloud(data.quest_data);
            }
            
            // Загружаем умения
            if (typeof loadSkillsFromCloud === 'function') {
                loadSkillsFromCloud(data.skills_data);
            }
            
            addTechnicalLog(`☁️ Добро пожаловать, ${username}! (уровень ${window.currentPlayer.level})`);
            window.isLoggedIn = true;
            if (typeof startChatUpdates === 'function') startChatUpdates();
            saveSession(username, password);
            if (typeof updateUI === 'function') updateUI();
            if (typeof renderInventory === 'function') renderInventory();
            if (typeof renderSkills === 'function') renderSkills();
            if (typeof drawMap === 'function') drawMap();
            
            // Закрываем модальное окно входа
            const loginModal = document.getElementById('loginModal');
            const modalOverlay = document.getElementById('modalOverlay');
            if (loginModal) loginModal.style.display = 'none';
            if (modalOverlay) modalOverlay.style.display = 'none';
            
            return true;
        } else {
            addTechnicalLog("❌ Игрок не найден. Нажмите РЕГИСТРАЦИЯ");
            return false;
        }
    } catch (err) {
        addTechnicalLog(`❌ Ошибка: ${err.message}`);
        return false;
    }
}

async function registerPlayer(username, password) {
    if (!supabaseClient) {
        addTechnicalLog("❌ Supabase не подключён");
        return false;
    }
    
    if (username.length < 3 || username.length > 16) {
        addTechnicalLog("❌ Логин должен быть от 3 до 16 символов");
        return false;
    }
    
    if (password.length < 4) {
        addTechnicalLog("❌ Пароль должен быть минимум 4 символа");
        return false;
    }
    
    try {
        const { data: existing } = await supabaseClient
            .from("players")
            .select("username")
            .eq("username", username)
            .maybeSingle();
        
        if (existing) {
            addTechnicalLog("❌ Игрок с таким логином уже существует!");
            return false;
        }
        
        const { data: newData, error: createError } = await supabaseClient
            .from("players")
            .insert({
                username: username,
                password_hash: btoa(password),
                level: 1, exp: 0, hp: 70, max_hp: 70,
                str: 12, def: 5, gold: 150, wood: 0, ore: 0,
                skill_points: 2,
                upgrade_points: 2,
                character_class: 'Мечник',
                extra_str: 0, extra_def: 0, extra_hp: 0,
                player_x: 10, player_y: 10,
                inventory_data: '[]',
                equipment_data: '{"weapon":null,"armor":null,"ring":null}',
                quest_data: '{"goblins":0,"ore":0,"wood":0}',
                skills_data: '{"powerStrike":0,"endurance":0,"berserk":0}'
            })
            .select()
            .single();
        
        if (createError) {
            addTechnicalLog(`❌ Ошибка создания: ${createError.message}`);
            return false;
        }
        
        if (newData) {
            addTechnicalLog(`✨ Персонаж "${username}" создан!`);
            return await loginPlayer(username, password);
        }
    } catch (err) {
        addTechnicalLog(`❌ Ошибка: ${err.message}`);
        return false;
    }
}

function logoutPlayer() {
    clearSession();
    window.currentPlayer = {
        id: null, username: null, level: 1, exp: 0, hp: 70, maxHp: 70,
        str: 12, def: 5, gold: 150, wood: 0, ore: 0, skillPoints: 2,
        upgradePoints: 2,
        skill_power_strike: 0, skill_endurance: 0, skill_berserk: 0,
        character_class: 'Мечник'
    };
    window.playerExtraStr = 0;
    window.playerExtraDef = 0;
    window.playerExtraHp = 0;
    window.isLoggedIn = false;
    
    const loginForm = document.getElementById("loginForm");
    const playerInfo = document.getElementById("playerInfo");
    const loginUsername = document.getElementById("loginUsername");
    const loginPassword = document.getElementById("loginPassword");
    
    if (loginForm) loginForm.style.display = "flex";
    if (playerInfo) playerInfo.style.display = "none";
    if (loginUsername) loginUsername.value = "";
    if (loginPassword) loginPassword.value = "";
    
    addTechnicalLog("👋 Вы вышли из аккаунта");
    if (typeof updateUI === 'function') updateUI();
}

function updateLoginUI() {
    const loginForm = document.getElementById("loginForm");
    const playerInfo = document.getElementById("playerInfo");
    const currentPlayerName = document.getElementById("currentPlayerName");
    
    if (!loginForm || !playerInfo) return;
    
    if (window.isLoggedIn && window.currentPlayer.username) {
        loginForm.style.display = "none";
        playerInfo.style.display = "block";
        if (currentPlayerName) currentPlayerName.innerHTML = `⚔️ ${window.currentPlayer.username}`;
    } else {
        loginForm.style.display = "flex";
        playerInfo.style.display = "none";
    }
}

function saveSession(username, password) {
    localStorage.setItem('rpg_username', username);
    localStorage.setItem('rpg_password', password);
}

function loadSession() {
    const savedUsername = localStorage.getItem('rpg_username');
    const savedPassword = localStorage.getItem('rpg_password');
    if (savedUsername && savedPassword) {
        const usernameInput = document.getElementById("loginUsername");
        const passwordInput = document.getElementById("loginPassword");
        if (usernameInput) usernameInput.value = savedUsername;
        if (passwordInput) passwordInput.value = savedPassword;
        setTimeout(() => {
            loginPlayer(savedUsername, savedPassword);
        }, 500);
    }
}

function clearSession() {
    localStorage.removeItem('rpg_username');
    localStorage.removeItem('rpg_password');
}