// ======================== КАРТА ========================
const canvas = document.getElementById('worldMap');
const ctx = canvas.getContext('2d');
const MAP_SIZE = 20;
let TILE_SIZE = 40;

let playerPos = { x: 10, y: 10 };
let isMoving = false;
let moveProgress = 0;
let moveFrom = null;
let moveTo = null;
let moveStartTime = 0;
let moveDuration = 0;
let moveInterval = null;

let mapTiles = [];
let otherPlayers = [];

// Загруженные тайлы (картинки)
let loadedTiles = {};

const TILES_DATA = {
    GRASS: { color: '#3a7e3a', icon: '🌿', name: '🌿 Трава', walkable: true, type: 'empty', typeKey: 'GRASS' },
    FOREST: { color: '#2a6a2a', icon: '🌲', name: '🌲 Лес', walkable: true, type: 'combat', resource: 'wood', enemy: 'goblin', typeKey: 'FOREST' },
    MOUNTAIN: { color: '#7a7a6a', icon: '🗻', name: '🗻 Горы', walkable: true, type: 'combat', resource: 'ore', enemy: 'troll', typeKey: 'MOUNTAIN' },
    VILLAGE: { color: '#8b6e4a', icon: '🏠', name: '🏠 Деревня', walkable: true, type: 'safe', typeKey: 'VILLAGE' },
    WATER: { color: '#2a6a8a', icon: '💧', name: '💧 Вода', walkable: false, type: 'empty', typeKey: 'WATER' },
    CAVE: { color: '#5a5a5a', icon: '⛰️', name: '⛰️ Пещера', walkable: true, type: 'combat', resource: 'ore', enemy: 'troll', typeKey: 'CAVE' },
    BANDIT: { color: '#7a4a4a', icon: '⚔️', name: '⚔️ Лагерь', walkable: true, type: 'combat', enemy: 'bandit', typeKey: 'BANDIT' },
    WASTELAND: { color: '#9a8a6a', icon: '🏜️', name: '🏜️ Пустошь', walkable: true, type: 'empty', typeKey: 'WASTELAND' }
};

const MAP_LAYOUT = [
    "WGGGFGGGGGGGFGGGGFGP", "WGGGGGGGGFGGGVGFGGGP", "WGGFGGGGGGWGGGGGFGGP",
    "WGGGGGGFGGGGFGGGGGGP", "WGGGFGGGGGGGBFGGGFGP", "WGMGGGGGFGGGGGGGFGGP",
    "WGGGGGGGGGGGFGGGCGGP", "WGGGGGFGGGGGGGGWGGGP", "WGVGGGGGGGFGGGGGGGFP",
    "WGGGFGGGGGGGGGGGGGGP", "WGGGGGGGGGGFGGGGGGGP", "WGGGFGGGGGMGGGGMGGGP",
    "WGGGGGGVGGGGGBFGGGGP", "WFGGGGGGGGGGGGGGGWGP", "WGGGGGGBFCGGGGGGGGGP",
    "WGGMGGGGGGFGGGGGGGGP", "WGGGFGGGGGGGGGGGGVGP", "WGGGGGGGGFGGGGGGGGGP",
    "WGGGGGGGGGGGGGFGGGGP", "WGGGFCGGGGGMGGGGGGMP"
];

const letterToTile = {
    'G': 'GRASS', 'F': 'FOREST', 'M': 'MOUNTAIN', 'V': 'VILLAGE',
    'W': 'WATER', 'C': 'CAVE', 'B': 'BANDIT', 'P': 'WASTELAND'
};

function generateMap() {
    for (let y = 0; y < MAP_SIZE; y++) {
        mapTiles[y] = [];
        const row = MAP_LAYOUT[y];
        for (let x = 0; x < MAP_SIZE; x++) {
            const letter = row[x] || 'G';
            const tileType = letterToTile[letter] || 'GRASS';
            mapTiles[y][x] = { ...TILES_DATA[tileType], x, y };
        }
    }
}

function updateTileDisplaySize() {
    if (canvas.width > 0) {
        TILE_SIZE = Math.floor(canvas.width / MAP_SIZE);
    } else {
        TILE_SIZE = 40;
    }
}

function drawMap() {
    if (!canvas || !ctx) return;
    updateTileDisplaySize();
    canvas.width = MAP_SIZE * TILE_SIZE;
    canvas.height = MAP_SIZE * TILE_SIZE;
    
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            if (!mapTiles[y] || !mapTiles[y][x]) continue;
            const tile = mapTiles[y][x];
            const img = loadedTiles[tile.typeKey];
            
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = tile.color;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
                ctx.font = `${TILE_SIZE * 0.5}px "Segoe UI Emoji"`;
                ctx.fillStyle = "#ffffff";
                ctx.fillText(tile.icon, x * TILE_SIZE + TILE_SIZE * 0.25, y * TILE_SIZE + TILE_SIZE * 0.7);
            }
            ctx.strokeStyle = "#2a2a2a";
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
    
    drawOtherPlayers();
    
    if (!playerPos) return;
    let drawX = playerPos.x * TILE_SIZE;
    let drawY = playerPos.y * TILE_SIZE;
    if (isMoving && moveFrom && moveTo) {
        const t = Math.min(1, moveProgress);
        drawX = (moveFrom.x * TILE_SIZE) * (1 - t) + (moveTo.x * TILE_SIZE) * t;
        drawY = (moveFrom.y * TILE_SIZE) * (1 - t) + (moveTo.y * TILE_SIZE) * t;
    }
    
    ctx.font = `${TILE_SIZE * 0.6}px "Segoe UI Emoji"`;
    ctx.fillStyle = "#ffdd88";
    ctx.shadowBlur = 6;
    ctx.fillText("⚔️", drawX + TILE_SIZE * 0.2, drawY + TILE_SIZE * 0.75);
    ctx.shadowBlur = 0;
}

function getCurrentTile() { return mapTiles[playerPos.y]?.[playerPos.x] || mapTiles[0]?.[0]; }

function startMoveTo(tx, ty) {
    if (isMoving) { addTechnicalLog("❌ Вы уже в пути!"); return; }
    if (autoActive) { addTechnicalLog("❌ Нельзя перемещаться во время автодействия!"); return; }
    if (window.campActive) { addTechnicalLog("❌ Сначала нужно снять лагерь!"); return; }
    if (!isLoggedIn) { addTechnicalLog("❌ Сначала войдите в аккаунт!"); return; }
    
    const tile = mapTiles[ty]?.[tx];
    if (!tile || !tile.walkable) { addTechnicalLog(`❌ Нельзя пройти в ${tile?.name || "эту клетку"}`); return; }
    if (tx === playerPos.x && ty === playerPos.y) { addTechnicalLog(`📍 Вы уже здесь`); return; }
    
    const distance = Math.abs(tx - playerPos.x) + Math.abs(ty - playerPos.y);
    moveDuration = distance * 3000;
    
    moveFrom = { x: playerPos.x, y: playerPos.y };
    moveTo = { x: tx, y: ty };
    isMoving = true;
    moveProgress = 0;
    moveStartTime = Date.now();
    addTechnicalLog(`🚶 Вы идёте в ${tile.name} (${distance} клеток, ${Math.floor(moveDuration/1000)} сек)`);
    
    if (moveInterval) clearInterval(moveInterval);
    moveInterval = setInterval(() => {
        if (!isMoving) {
            if (moveInterval) clearInterval(moveInterval);
            return;
        }
        const now = Date.now();
        moveProgress = Math.min(1, (now - moveStartTime) / moveDuration);
        drawMap();
        if (moveProgress >= 1) {
            if (moveInterval) clearInterval(moveInterval);
            moveInterval = null;
            isMoving = false;
            playerPos = { x: moveTo.x, y: moveTo.y };
            moveFrom = null;
            moveTo = null;
            drawMap();
            updateActionButtons();
            addTechnicalLog(`✅ Вы прибыли в ${getCurrentTile().name}`);
            if (Math.random() < 0.15 && typeof triggerRandomEvent === 'function') triggerRandomEvent();
            savePlayerPosition();
        }
    }, 50);
}

function stopMoving() {
    if (moveInterval) {
        clearInterval(moveInterval);
        moveInterval = null;
    }
    if (isMoving) {
        isMoving = false;
        moveFrom = null;
        moveTo = null;
        moveProgress = 0;
        drawMap();
        addTechnicalLog("⏹️ Перемещение остановлено!");
        updateActionButtons();
    } else {
        addTechnicalLog("❌ Вы никуда не двигаетесь!");
    }
}

function drawOtherPlayers() {
    if (!ctx || !otherPlayers.length) return;
    for (const player of otherPlayers) {
        if (player.player_x === undefined || player.player_y === undefined) continue;
        const x = player.player_x * TILE_SIZE;
        const y = player.player_y * TILE_SIZE;
        ctx.save();
        ctx.strokeStyle = "#66ff66";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.font = `${TILE_SIZE * 0.25}px monospace`;
        ctx.fillStyle = "#aaffaa";
        ctx.fillText((player.username || "?").substring(0, 6), x + 3, y + TILE_SIZE - 5);
        ctx.restore();
    }
}

async function loadOtherPlayers() {
    if (!supabaseClient || !isLoggedIn) return;
    const { data } = await supabaseClient.from("players").select("username, player_x, player_y").neq("username", currentPlayer.username).limit(20);
    otherPlayers = data || [];
    drawMap();
}

async function savePlayerPosition() {
    if (!supabaseClient || !isLoggedIn || !currentPlayer.id) return;
    await supabaseClient.from("players").update({ player_x: playerPos.x, player_y: playerPos.y }).eq("id", currentPlayer.id);
}

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const tileX = Math.floor((e.clientX - rect.left) * scaleX / TILE_SIZE);
    const tileY = Math.floor((e.clientY - rect.top) * scaleY / TILE_SIZE);
    if (tileX >= 0 && tileX < MAP_SIZE && tileY >= 0 && tileY < MAP_SIZE) startMoveTo(tileX, tileY);
});