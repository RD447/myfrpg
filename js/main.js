if (typeof supabase !== "undefined") supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.campActive = false;
let autoContent = document.getElementById("autoContent");
function updateActionButtons() {
    let tile = getCurrentTile(), fight = document.getElementById("fightBtn"), gather = document.getElementById("gatherBtn"), camp = document.getElementById("campBtn");
    fight.style.display = "none"; gather.style.display = "none";
    if (tile.type === "combat") {
        fight.style.display = "block"; fight.innerHTML = `⚔️ Бой (${tile.enemy})`;
        if (tile.resource) { gather.style.display = "block"; gather.innerHTML = tile.resource === "wood" ? "🌲 Сбор" : "⛏️ Сбор"; }
    } else if (tile.type === "safe") { fight.style.display = "block"; fight.innerHTML = "💊 Отдых (5✨)"; }
    document.getElementById("stopAutoBtn").style.display = autoActive ? "block" : "none";
    let heal = document.getElementById("campHealBtn"), cook = document.getElementById("campCookBtn");
    if (window.campActive) {
        if (!heal) { let h = document.createElement("button"); h.id = "campHealBtn"; h.className = "btn btn-success"; h.innerHTML = "💊 Лечение (5✨)"; h.onclick = campHeal; document.getElementById("actionBar").appendChild(h); }
        if (!cook) { let c = document.createElement("button"); c.id = "campCookBtn"; c.className = "btn btn-camp"; c.innerHTML = "🍲 Готовка (2🌲)"; c.onclick = campCook; document.getElementById("actionBar").appendChild(c); }
    } else { if(heal) heal.remove(); if(cook) cook.remove(); }
}
function updateAutoPanel(t,text,p) { document.getElementById("autoTitle").innerHTML = t; document.getElementById("autoText").innerHTML = text; if(p!==undefined) document.getElementById("autoProgress").style.width = (p*100)+"%"; if(!autoContent.classList.contains("visible")) autoContent.classList.add("visible"); }
document.getElementById("fightBtn").onclick = () => { let t=getCurrentTile(); if(t.type==="safe") restHeal(); else startAutoCombat(); };
document.getElementById("gatherBtn").onclick = startAutoGather;
document.getElementById("campBtn").onclick = toggleCamp;
document.getElementById("stopAutoBtn").onclick = stopAuto;
document.getElementById("stopMoveBtn").onclick = stopMoving;
document.getElementById("sellAllCommonBtn").onclick = sellAllCommon;
document.getElementById("chatSendBtn").onclick = sendChatMessage;
document.getElementById("createGuildBtn").onclick = createGuild;
document.getElementById("loginBtn").onclick = async () => { await loginPlayer(document.getElementById("loginUsername").value.trim(), document.getElementById("loginPassword").value); loadOnlinePlayers(); loadOtherPlayers(); drawMap(); };
document.getElementById("registerBtn").onclick = async () => { await registerPlayer(document.getElementById("loginUsername").value.trim(), document.getElementById("loginPassword").value); };
document.getElementById("logoutBtn").onclick = logoutPlayer;
document.querySelectorAll('.upgrade-stat').forEach(b => b.onclick = () => upgradeStat(b.dataset.stat));
document.getElementById("chatInput").addEventListener("keypress", e => { if(e.key === "Enter") sendChatMessage(); });
document.getElementById("soundBtn").onclick = () => { soundEnabled = !soundEnabled; document.getElementById("soundBtn").innerHTML = soundEnabled ? "🔊" : "🔇"; };
let invH = document.getElementById("inventoryHeader"), invC = document.getElementById("inventoryContent"), invColl = false;
if(invH) invH.onclick = () => { invColl = !invColl; invC.classList.toggle("collapsed"); invH.querySelector("span").innerHTML = invColl ? "▶" : "▼"; };
let statH = document.getElementById("statsHeader"), statC = document.getElementById("statsContent"), statColl = false;
if(statH) statH.onclick = () => { statColl = !statColl; statC.classList.toggle("collapsed"); statH.querySelector("span").innerHTML = statColl ? "▶" : "▼"; };
document.querySelectorAll(".tab-btn").forEach(btn => { btn.onclick = () => { document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active")); document.querySelectorAll(".tab-content").forEach(tc=>tc.classList.remove("active")); btn.classList.add("active"); document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active"); if(btn.dataset.tab==="online") loadOnlinePlayers(); if(btn.dataset.tab==="chat" && isLoggedIn) loadChatMessages(); }; });
if(document.querySelector(".tab-btn")) document.querySelector(".tab-btn").click();
document.getElementById("autoHeader").onclick = () => autoContent.classList.toggle("visible");
generateMap(); setTimeout(() => { updateTileDisplaySize(); drawMap(); }, 100);
updateActionButtons(); updateUI(); renderInventory(); renderSkills();
addTechnicalLog("🗺️ Карта 20x20. Клик для перемещения");
addTechnicalLog("💬 Чат работает после входа");
setInterval(() => { if(currentPlayer.id && isLoggedIn) savePlayerToCloud(); }, 30000);
setInterval(() => { if(isLoggedIn) loadOtherPlayers(); }, 10000);
setInterval(loadOnlinePlayers, 30000);
loadSession();
document.body.addEventListener('click', () => { if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); });
window.unequipItem = unequipItem;