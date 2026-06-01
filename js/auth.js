async function loginPlayer(username, password) {
    if (!supabaseClient) { addTechnicalLog("❌ Supabase не подключён"); return false; }
    if (!password || password.length < 4) { addTechnicalLog("❌ Пароль минимум 4 символа"); return false; }
    try {
        const { data, error } = await supabaseClient.from("players").select("*").eq("username", username).maybeSingle();
        if (error) { addTechnicalLog(`❌ Ошибка: ${error.message}`); return false; }
        if (!data) { addTechnicalLog("❌ Игрок не найден. Регистрация"); return false; }
        if (data.password_hash !== btoa(password)) { addTechnicalLog("❌ Неверный пароль"); return false; }
        currentPlayer.id = data.id; currentPlayer.username = data.username; currentPlayer.level = data.level; currentPlayer.exp = data.exp;
        currentPlayer.hp = data.hp; currentPlayer.maxHp = data.max_hp; currentPlayer.str = data.str; currentPlayer.def = data.def;
        currentPlayer.gold = data.gold; currentPlayer.wood = data.wood; currentPlayer.ore = data.ore; currentPlayer.skillPoints = data.skill_points;
        currentPlayer.skill_power_strike = data.skill_power_strike || 0; currentPlayer.skill_endurance = data.skill_endurance || 0;
        currentPlayer.skill_berserk = data.skill_berserk || 0; currentPlayer.character_class = data.character_class || 'Мечник';
        currentPlayer.upgradePoints = data.upgrade_points || 2;
        playerExtraStr = data.extra_str || 0; playerExtraDef = data.extra_def || 0; playerExtraHp = data.extra_hp || 0;
        if (data.player_x !== undefined) { playerPos = { x: data.player_x, y: data.player_y }; } else { playerPos = { x: 10, y: 10 }; }
        loadInventoryFromCloud(data.inventory_data, data.equipment_data);
        loadQuestsFromCloud(data.quest_data);
        loadSkillsFromCloud(data.skills_data);
        isLoggedIn = true;
        if (typeof startChatUpdates === 'function') startChatUpdates();
        saveSession(username, password);
        updateUI(); renderInventory(); renderSkills(); drawMap();
        addTechnicalLog(`☁️ Добро пожаловать, ${username}! (ур.${currentPlayer.level})`);
        return true;
    } catch(err) { addTechnicalLog(`❌ ${err.message}`); return false; }
}
async function registerPlayer(username, password) {
    if (!supabaseClient) { addTechnicalLog("❌ Supabase не подключён"); return false; }
    if (username.length < 3 || username.length > 16) { addTechnicalLog("❌ Логин 3-16 символов"); return false; }
    if (password.length < 4) { addTechnicalLog("❌ Пароль минимум 4 символа"); return false; }
    try {
        const { data: existing } = await supabaseClient.from("players").select("username").eq("username", username).maybeSingle();
        if (existing) { addTechnicalLog("❌ Игрок уже существует"); return false; }
        const { error } = await supabaseClient.from("players").insert({
            username, password_hash: btoa(password), level:1, exp:0, hp:70, max_hp:70, str:12, def:5, gold:150, wood:0, ore:0,
            skill_points:2, upgrade_points:2, character_class:'Мечник', extra_str:0, extra_def:0, extra_hp:0, player_x:10, player_y:10,
            inventory_data:'[]', equipment_data:'{"weapon":null,"armor":null,"ring":null}', quest_data:'{"goblins":0,"ore":0,"wood":0}', skills_data:'{}'
        });
        if (error) { addTechnicalLog(`❌ ${error.message}`); return false; }
        addTechnicalLog(`✨ Персонаж "${username}" создан! Войдите.`);
        return true;
    } catch(err) { addTechnicalLog(`❌ ${err.message}`); return false; }
}
function logoutPlayer() { clearSession(); isLoggedIn = false; currentPlayer = { id:null, username:null, level:1, exp:0, hp:70, maxHp:70, str:12, def:5, gold:150, wood:0, ore:0, skillPoints:2, upgradePoints:2, skill_power_strike:0, skill_endurance:0, skill_berserk:0, character_class:'Мечник' }; playerExtraStr=playerExtraDef=playerExtraHp=0; document.getElementById("loginForm").style.display = "flex"; document.getElementById("playerInfo").style.display = "none"; addTechnicalLog("👋 Вы вышли"); updateUI(); if(typeof cleanupChat === 'function') cleanupChat(); }
function updateLoginUI() { if (isLoggedIn && currentPlayer.username) { document.getElementById("loginForm").style.display = "none"; document.getElementById("playerInfo").style.display = "block"; document.getElementById("currentPlayerName").innerHTML = `⚔️ ${currentPlayer.username}`; } else { document.getElementById("loginForm").style.display = "flex"; document.getElementById("playerInfo").style.display = "none"; } }
function saveSession(u,p) { localStorage.setItem('rpg_username', u); localStorage.setItem('rpg_password', p); }
function loadSession() { let u = localStorage.getItem('rpg_username'), p = localStorage.getItem('rpg_password'); if (u && p) { document.getElementById("loginUsername").value = u; document.getElementById("loginPassword").value = p; setTimeout(() => loginPlayer(u,p), 500); } }
function clearSession() { localStorage.removeItem('rpg_username'); localStorage.removeItem('rpg_password'); }