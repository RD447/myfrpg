// ======================== ИНВЕНТАРЬ ========================
let inventory = [];
let equipment = { weapon: null, armor: null, ring: null };
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
        atk: stats.atk,
        def: stats.def,
        sellPrice: rarity === 'common' ? 10 : rarity === 'rare' ? 40 : 100
    };
}

function addItemToInventory(item) { 
    inventory.push(item); 
    renderInventory(); 
}

function equipItem(item) {
    if (item.type === 'weapon') equipment.weapon = item;
    else if (item.type === 'armor') equipment.armor = item;
    else if (item.type === 'ring') equipment.ring = item;
    renderInventory(); 
    updateUI();
}

function unequipItem(type) {
    if (type === 'weapon') equipment.weapon = null;
    else if (type === 'armor') equipment.armor = null;
    else if (type === 'ring') equipment.ring = null;
    renderInventory(); 
    updateUI();
}

function sellItem(index) {
    const item = inventory[index];
    if (item) {
        if (equipment.weapon && equipment.weapon.id === item.id) equipment.weapon = null;
        if (equipment.armor && equipment.armor.id === item.id) equipment.armor = null;
        if (equipment.ring && equipment.ring.id === item.id) equipment.ring = null;
        
        currentPlayer.gold += item.sellPrice;
        inventory.splice(index, 1);
        addTechnicalLog(`💰 Продано ${item.name} за ${item.sellPrice} монет`);
        renderInventory(); 
        updateUI();
        savePlayerToCloud();
    }
}

function sellAllCommon() {
    const commonItems = inventory.filter(item => item.rarity === 'common');
    let totalGold = 0;
    for (const item of commonItems) {
        totalGold += item.sellPrice;
        if (equipment.weapon && equipment.weapon.id === item.id) equipment.weapon = null;
        if (equipment.armor && equipment.armor.id === item.id) equipment.armor = null;
        if (equipment.ring && equipment.ring.id === item.id) equipment.ring = null;
    }
    inventory = inventory.filter(item => item.rarity !== 'common');
    currentPlayer.gold += totalGold;
    addTechnicalLog(`💰 Продано всё обычное снаряжение за ${totalGold} монет`);
    renderInventory(); 
    updateUI();
    savePlayerToCloud();
}

function renderInventory() {
    const inventoryDiv = document.getElementById("inventoryList");
    const equipmentDiv = document.getElementById("equipmentSlots");
    
    if (!inventoryDiv || !equipmentDiv) return;
    
    equipmentDiv.innerHTML = `
        <div class="equipment-slot"><span>🗡️ Оружие</span><span>${equipment.weapon ? equipment.weapon.name + ` (+${equipment.weapon.atk}⚔️)` : '—'}</span>${equipment.weapon ? `<button class="small-btn" onclick="unequipItem('weapon')">Снять</button>` : ''}</div>
        <div class="equipment-slot"><span>🛡️ Броня</span><span>${equipment.armor ? equipment.armor.name + ` (+${equipment.armor.def}🛡️)` : '—'}</span>${equipment.armor ? `<button class="small-btn" onclick="unequipItem('armor')">Снять</button>` : ''}</div>
        <div class="equipment-slot"><span>💍 Кольцо</span><span>${equipment.ring ? equipment.ring.name + ` (+${equipment.ring.atk}⚔️ +${equipment.ring.def}🛡️)` : '—'}</span>${equipment.ring ? `<button class="small-btn" onclick="unequipItem('ring')">Снять</button>` : ''}</div>
    `;
    
    if (inventory.length === 0) {
        inventoryDiv.innerHTML = '<div class="log-entry">🎒 Сумка пуста</div>';
        return;
    }
    
    inventoryDiv.innerHTML = '';
    inventory.forEach((item, index) => {
        const rarityClass = item.rarity === 'common' ? 'rarity-common' : (item.rarity === 'rare' ? 'rarity-rare' : 'rarity-epic');
        const div = document.createElement('div');
        div.className = `item-card ${rarityClass}`;
        div.innerHTML = `<span>${item.name} (⚔️${item.atk} 🛡️${item.def})</span><div><button class="small-btn equip-btn" data-index="${index}">🔧</button><button class="small-btn sell-btn" data-index="${index}">💰</button></div>`;
        inventoryDiv.appendChild(div);
    });
    
    document.querySelectorAll('.equip-btn').forEach(btn => {
        btn.onclick = () => equipItem(inventory[parseInt(btn.getAttribute('data-index'))]);
    });
    document.querySelectorAll('.sell-btn').forEach(btn => {
        btn.onclick = () => sellItem(parseInt(btn.getAttribute('data-index')));
    });
}

// Сохранение инвентаря в БД (добавим позже)
async function saveInventoryToCloud() {
    if (!supabaseClient || !currentPlayer.id || !isLoggedIn) return;
    
    await supabaseClient
        .from("players")
        .update({
            inventory_data: JSON.stringify(inventory),
            equipment_data: JSON.stringify(equipment)
        })
        .eq("id", currentPlayer.id);
}

// Загрузка инвентаря из БД (добавим позже)
function loadInventoryFromCloud(inventoryData, equipmentData) {
    if (inventoryData) inventory = JSON.parse(inventoryData);
    if (equipmentData) equipment = JSON.parse(equipmentData);
    renderInventory();
}