// ======================== ИНВЕНТАРЬ ========================
// Переменные inventory и equipment объявлены в config.js

const rarityColors = { common: 'обычное', rare: 'редкое', epic: 'эпическое' };

function generateRandomItem() {
    const types = ['weapon', 'armor', 'ring'];
    const type = types[Math.floor(Math.random() * types.length)];
    const rarityRand = Math.random();
    let rarity = 'common';
    if (rarityRand > 0.85) rarity = 'epic';
    else if (rarityRand > 0.6) rarity = 'rare';
    
    let stats = {};
    if (type === 'weapon') {
        stats.atk = rarity === 'common' ? 2 + Math.floor(Math.random() * 3) : rarity === 'rare' ? 5 + Math.floor(Math.random() * 3) : 8 + Math.floor(Math.random() * 4);
        stats.def = 0;
    } else if (type === 'armor') {
        stats.atk = 0;
        stats.def = rarity === 'common' ? 1 + Math.floor(Math.random() * 2) : rarity === 'rare' ? 3 + Math.floor(Math.random() * 2) : 5 + Math.floor(Math.random() * 3);
    } else {
        stats.atk = rarity === 'common' ? 1 : rarity === 'rare' ? 2 : 3;
        stats.def = rarity === 'common' ? 1 : rarity === 'rare' ? 2 : 3;
    }
    
    return {
        id: Date.now() + Math.random(),
        name: `${rarity === 'epic' ? '💎' : rarity === 'rare' ? '✨' : '⚙️'} ${rarityColors[rarity]} ${type === 'weapon' ? 'оружие' : type === 'armor' ? 'броня' : 'кольцо'}`,
        type: type,
        rarity: rarity,
        atk: Math.floor(stats.atk),
        def: Math.floor(stats.def),
        sellPrice: rarity === 'common' ? 10 : rarity === 'rare' ? 40 : 100
    };
}

function addItemToInventory(item) { 
    window.inventory.push(item); 
    renderInventory(); 
    saveInventoryToCloud();
}

function equipItem(item) {
    if (item.type === 'weapon') window.equipment.weapon = item;
    else if (item.type === 'armor') window.equipment.armor = item;
    else if (item.type === 'ring') window.equipment.ring = item;
    renderInventory(); 
    updateUI();
    saveInventoryToCloud();
}

function unequipItem(type) {
    if (type === 'weapon') window.equipment.weapon = null;
    else if (type === 'armor') window.equipment.armor = null;
    else if (type === 'ring') window.equipment.ring = null;
    renderInventory(); 
    updateUI();
    saveInventoryToCloud();
}

function sellItem(index) {
    const item = window.inventory[index];
    if (item) {
        if (window.equipment.weapon && window.equipment.weapon.id === item.id) window.equipment.weapon = null;
        if (window.equipment.armor && window.equipment.armor.id === item.id) window.equipment.armor = null;
        if (window.equipment.ring && window.equipment.ring.id === item.id) window.equipment.ring = null;
        
        window.currentPlayer.gold += item.sellPrice;
        window.inventory.splice(index, 1);
        addTechnicalLog(`💰 Продано ${item.name} за ${item.sellPrice} монет`);
        renderInventory(); 
        updateUI();
        savePlayerToCloud();
        saveInventoryToCloud();
    }
}

function sellAllCommon() {
    const commonItems = window.inventory.filter(item => item.rarity === 'common');
    let totalGold = 0;
    for (const item of commonItems) {
        totalGold += item.sellPrice;
        if (window.equipment.weapon && window.equipment.weapon.id === item.id) window.equipment.weapon = null;
        if (window.equipment.armor && window.equipment.armor.id === item.id) window.equipment.armor = null;
        if (window.equipment.ring && window.equipment.ring.id === item.id) window.equipment.ring = null;
    }
    window.inventory = window.inventory.filter(item => item.rarity !== 'common');
    window.currentPlayer.gold += totalGold;
    addTechnicalLog(`💰 Продано всё обычное снаряжение за ${totalGold} монет`);
    renderInventory(); 
    updateUI();
    savePlayerToCloud();
    saveInventoryToCloud();
}

function renderInventory() {
    const inventoryDiv = document.getElementById("inventoryList");
    const equipmentDiv = document.getElementById("equipmentSlots");
    
    if (!inventoryDiv || !equipmentDiv) return;
    
    equipmentDiv.innerHTML = `
        <div class="equipment-slot"><span>🗡️ Оружие</span><span>${window.equipment.weapon ? window.equipment.weapon.name + ` (+${window.equipment.weapon.atk}⚔️)` : '—'}</span>${window.equipment.weapon ? `<button class="small-btn" onclick="unequipItem('weapon')">Снять</button>` : ''}</div>
        <div class="equipment-slot"><span>🛡️ Броня</span><span>${window.equipment.armor ? window.equipment.armor.name + ` (+${window.equipment.armor.def}🛡️)` : '—'}</span>${window.equipment.armor ? `<button class="small-btn" onclick="unequipItem('armor')">Снять</button>` : ''}</div>
        <div class="equipment-slot"><span>💍 Кольцо</span><span>${window.equipment.ring ? window.equipment.ring.name + ` (+${window.equipment.ring.atk}⚔️ +${window.equipment.ring.def}🛡️)` : '—'}</span>${window.equipment.ring ? `<button class="small-btn" onclick="unequipItem('ring')">Снять</button>` : ''}</div>
    `;
    
    if (window.inventory.length === 0) {
        inventoryDiv.innerHTML = '<div class="log-entry">🎒 Сумка пуста</div>';
        return;
    }
    
    inventoryDiv.innerHTML = '';
    window.inventory.forEach((item, index) => {
        const rarityClass = item.rarity === 'common' ? 'rarity-common' : (item.rarity === 'rare' ? 'rarity-rare' : 'rarity-epic');
        const div = document.createElement('div');
        div.className = `item-card ${rarityClass}`;
        div.innerHTML = `<span>${item.name} (⚔️${item.atk} 🛡️${item.def})</span><div><button class="small-btn equip-btn" data-index="${index}">🔧</button><button class="small-btn sell-btn" data-index="${index}">💰</button></div>`;
        inventoryDiv.appendChild(div);
    });
    
    document.querySelectorAll('.equip-btn').forEach(btn => {
        btn.onclick = () => equipItem(window.inventory[parseInt(btn.getAttribute('data-index'))]);
    });
    document.querySelectorAll('.sell-btn').forEach(btn => {
        btn.onclick = () => sellItem(parseInt(btn.getAttribute('data-index')));
    });
}

// Сохранение инвентаря в БД
async function saveInventoryToCloud() {
    if (!supabaseClient || !window.currentPlayer?.id || !window.isLoggedIn) return;
    
    try {
        await supabaseClient
            .from("players")
            .update({
                inventory_data: JSON.stringify(window.inventory),
                equipment_data: JSON.stringify(window.equipment),
                updated_at: new Date().toISOString()
            })
            .eq("id", window.currentPlayer.id);
    } catch (e) {
        console.error("Ошибка сохранения инвентаря:", e);
    }
}

// Загрузка инвентаря из БД
function loadInventoryFromCloud(inventoryData, equipmentData) {
    try {
        if (inventoryData && inventoryData !== '[]') {
            window.inventory = JSON.parse(inventoryData);
        } else {
            window.inventory = [];
        }
        
        if (equipmentData && equipmentData !== '{"weapon":null,"armor":null,"ring":null}') {
            window.equipment = JSON.parse(equipmentData);
        } else {
            window.equipment = { weapon: null, armor: null, ring: null };
        }
        
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof updateUI === 'function') updateUI();
    } catch (e) {
        console.error("Ошибка загрузки инвентаря:", e);
        window.inventory = [];
        window.equipment = { weapon: null, armor: null, ring: null };
    }
}