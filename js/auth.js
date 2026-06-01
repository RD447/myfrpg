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
            
            currentPlayer.id = data.id;
            currentPlayer.username = data.username;
            currentPlayer.level = data.level;
            currentPlayer.exp = data.exp;
            currentPlayer.hp = data.hp;
            currentPlayer.maxHp = data.max_hp;
            currentPlayer.str = data.str;
            currentPlayer.def = data.def;
            currentPlayer.gold = data.gold;
            currentPlayer.wood = data.wood;
            currentPlayer.ore = data.ore;
            currentPlayer.skillPoints = data.skill_points;
            currentPlayer.skill_power_strike = data.skill_power_strike || 0;
            currentPlayer.skill_endurance = data.skill_endurance || 0;
            currentPlayer.skill_berserk = data.skill_berserk || 0;
            currentPlayer.character_class = data.character_class || 'Мечник';
            currentPlayer.upgradePoints = data.upgrade_points || 2;
            
            playerExtraStr = data.extra_str || 0;
            playerExtraDef = data.extra_def || 0;
            playerExtraHp = data.extra_hp || 0;
            
            if (data.player_x !== undefined && data.player_x !== null) {
                playerPos = { x: data.player_x, y: data.player_y };
            } else {
                playerPos = { x: 10, y: 10 };
            }
            
            // ======================== ЗАГРУЗКА ДАННЫХ ИЗ БД ========================
            // Загружаем инвентарь
            loadInventoryFromCloud(data.inventory_data, data.equipment_data);
            
            // Загружаем квесты
            loadQuestsFromCloud(data.quest_data);
            
            // Загружаем умения
            loadSkillsFromCloud(data.skills_data);
            // ================================================================
            
            addTechnicalLog(`☁️ Добро пожаловать, ${username}! (уровень ${currentPlayer.level})`);
            isLoggedIn = true;
            startChatUpdates();
            saveSession(username, password);
            updateUI();
            renderInventory();
            renderSkills();
            drawMap();
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
    currentPlayer = {
        id: null, username: null, level: 1, exp: 0, hp: 70, maxHp: 70,
        str: 12, def: 5, gold: 150, wood: 0, ore: 0, skillPoints: 2,
        upgradePoints: 2,
        skill_power_strike: 0, skill_endurance: 0, skill_berserk: 0,
        character_class: 'Мечник'
    };
    playerExtraStr = 0;
    playerExtraDef = 0;
    playerExtraHp = 0;
    isLoggedIn = false;
    
    document.getElementById("loginForm").style.display = "flex";
    document.getElementById("playerInfo").style.display = "none";
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    
    addTechnicalLog("👋 Вы вышли из аккаунта");
    updateUI();
}

function updateLoginUI() {
    if (isLoggedIn && currentPlayer.username) {
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("playerInfo").style.display = "block";
        document.getElementById("currentPlayerName").innerHTML = `⚔️ ${currentPlayer.username}`;
    } else {
        document.getElementById("loginForm").style.display = "flex";
        document.getElementById("playerInfo").style.display = "none";
    }
}

// ======================== СОХРАНЕНИЕ СЕССИИ ========================
function saveSession(username, password) {
    localStorage.setItem('rpg_username', username);
    localStorage.setItem('rpg_password', password);
}

function loadSession() {
    const savedUsername = localStorage.getItem('rpg_username');
    const savedPassword = localStorage.getItem('rpg_password');
    if (savedUsername && savedPassword) {
        document.getElementById("loginUsername").value = savedUsername;
        document.getElementById("loginPassword").value = savedPassword;
        setTimeout(() => {
            loginPlayer(savedUsername, savedPassword);
        }, 500);
    }
}

function clearSession() {
    localStorage.removeItem('rpg_username');
    localStorage.removeItem('rpg_password');
}