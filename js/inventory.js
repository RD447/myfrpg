let inventory = [];
let equipment = { weapon: null, armor: null, ring: null };
function generateRandomItem() {
    let types = ['weapon','armor','ring'], type = types[Math.floor(Math.random()*3)];
    let r = Math.random(), rarity = r>0.85 ? 'epic' : (r>0.6 ? 'rare' : 'common');
    let atk=0, def=0;
    if (type === 'weapon') atk = rarity==='common' ? 2+Math.floor(Math.random()*3) : rarity==='rare' ? 5+Math.floor(Math.random()*3) : 8+Math.floor(Math.random()*4);
    else if (type === 'armor') def = rarity==='common' ? 1+Math.floor(Math.random()*2) : rarity==='rare' ? 3+Math.floor(Math.random()*2) : 5+Math.floor(Math.random()*3);
    else { atk = rarity==='common' ? 1 : 2; def = rarity==='common' ? 1 : 2; }
    return { id: Date.now()+Math.random(), name: `${rarity==='epic'?'💎':rarity==='rare'?'✨':'⚙️'} ${rarity} ${type}`, type, rarity, atk: Math.floor(atk), def: Math.floor(def), sellPrice: rarity==='common'?10:rarity==='rare'?40:100 };
}
function addItemToInventory(item) { inventory.push(item); renderInventory(); saveInventoryToCloud(); }
function equipItem(item) { if (item.type === 'weapon') equipment.weapon = item; else if (item.type === 'armor') equipment.armor = item; else equipment.ring = item; renderInventory(); updateUI(); saveInventoryToCloud(); }
function unequipItem(type) { if (type === 'weapon') equipment.weapon = null; else if (type === 'armor') equipment.armor = null; else equipment.ring = null; renderInventory(); updateUI(); saveInventoryToCloud(); }
function sellItem(idx) { let item = inventory[idx]; if (item) { if (equipment.weapon?.id === item.id) equipment.weapon = null; if (equipment.armor?.id === item.id) equipment.armor = null; if (equipment.ring?.id === item.id) equipment.ring = null; currentPlayer.gold += item.sellPrice; inventory.splice(idx,1); renderInventory(); updateUI(); savePlayerToCloud(); saveInventoryToCloud(); addTechnicalLog(`💰 Продано ${item.name} за ${item.sellPrice}`); } }
function sellAllCommon() { let total = 0; inventory = inventory.filter(i => { if (i.rarity === 'common') { total += i.sellPrice; if (equipment.weapon?.id === i.id) equipment.weapon = null; if (equipment.armor?.id === i.id) equipment.armor = null; if (equipment.ring?.id === i.id) equipment.ring = null; return false; } return true; }); currentPlayer.gold += total; renderInventory(); updateUI(); savePlayerToCloud(); saveInventoryToCloud(); addTechnicalLog(`💰 Продано обычное за ${total}`); }
function renderInventory() {
    let invDiv = document.getElementById("inventoryList"), eqDiv = document.getElementById("equipmentSlots");
    if (!invDiv || !eqDiv) return;
    eqDiv.innerHTML = `<div class="equipment-slot"><span>🗡️ Оружие</span><span>${equipment.weapon ? equipment.weapon.name + ` (+${equipment.weapon.atk})` : '—'}</span>${equipment.weapon ? `<button class="small-btn" onclick="unequipItem('weapon')">Снять</button>` : ''}</div>
        <div class="equipment-slot"><span>🛡️ Броня</span><span>${equipment.armor ? equipment.armor.name + ` (+${equipment.armor.def})` : '—'}</span>${equipment.armor ? `<button class="small-btn" onclick="unequipItem('armor')">Снять</button>` : ''}</div>
        <div class="equipment-slot"><span>💍 Кольцо</span><span>${equipment.ring ? equipment.ring.name + ` (+${equipment.ring.atk}/${equipment.ring.def})` : '—'}</span>${equipment.ring ? `<button class="small-btn" onclick="unequipItem('ring')">Снять</button>` : ''}</div>`;
    if (inventory.length === 0) { invDiv.innerHTML = '<div class="log-entry">🎒 Пусто</div>'; return; }
    invDiv.innerHTML = '';
    inventory.forEach((item, idx) => {
        let div = document.createElement('div');
        div.className = `item-card ${item.rarity==='common'?'rarity-common':item.rarity==='rare'?'rarity-rare':'rarity-epic'}`;
        div.innerHTML = `<span>${item.name} (⚔️${item.atk} 🛡️${item.def})</span><div><button class="small-btn" onclick="equipItem(inventory[${idx}])">🔧</button><button class="small-btn sell-btn" onclick="sellItem(${idx})">💰</button></div>`;
        invDiv.appendChild(div);
    });
}
async function saveInventoryToCloud() { if (!supabaseClient || !currentPlayer.id || !isLoggedIn) return; await supabaseClient.from("players").update({ inventory_data: JSON.stringify(inventory), equipment_data: JSON.stringify(equipment) }).eq("id", currentPlayer.id); }
function loadInventoryFromCloud(invData, eqData) { try { if (invData && invData !== '[]') inventory = JSON.parse(invData); else inventory = []; if (eqData && eqData !== '{"weapon":null,"armor":null,"ring":null}') equipment = JSON.parse(eqData); else equipment = { weapon: null, armor: null, ring: null }; renderInventory(); updateUI(); } catch(e) { console.error(e); } }