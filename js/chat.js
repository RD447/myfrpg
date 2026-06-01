let lastMessageId = 0, chatUpdateInterval = null;
async function sendChatMessage() {
    let input = document.getElementById("chatInput"), msg = input.value.trim();
    if (!msg) return;
    if (!isLoggedIn) { addTechnicalLog("❌ Войдите"); return; }
    let btn = document.getElementById("chatSendBtn");
    btn.disabled = true; btn.textContent = "⏳";
    let { error } = await supabaseClient.from("chat_messages").insert({ username: currentPlayer.username, message: msg.slice(0,200), created_at: new Date().toISOString() });
    if (error) addTechnicalLog("❌ Ошибка отправки");
    else { input.value = ""; addMessageToChat(currentPlayer.username, msg); }
    setTimeout(() => { btn.disabled = false; btn.textContent = "📨"; }, 1000);
}
function addMessageToChat(u,m) { let div = document.getElementById("socialChat"); if(!div) return; let el = document.createElement("div"); el.className = "chat-message"; el.innerHTML = `<strong>${escapeHtml(u)}:</strong> ${escapeHtml(m)}`; div.appendChild(el); div.scrollTop = div.scrollHeight; while(div.children.length > 51) div.removeChild(div.children[1]); }
async function loadChatMessages() { if(!supabaseClient||!isLoggedIn) return; let { data } = await supabaseClient.from("chat_messages").select("id,username,message").order("created_at",{ascending:true}).limit(50); let div = document.getElementById("socialChat"); if(!div) return; div.innerHTML = '<div class="chat-message"><strong>Система:</strong> Чат работает</div>'; if(data) for(let m of data) { let el = document.createElement("div"); el.className = "chat-message"; el.innerHTML = `<strong>${escapeHtml(m.username)}:</strong> ${escapeHtml(m.message)}`; div.appendChild(el); if(m.id > lastMessageId) lastMessageId = m.id; } div.scrollTop = div.scrollHeight; }
async function checkNewMessages() { if(!supabaseClient||!isLoggedIn||lastMessageId===0) return; let { data } = await supabaseClient.from("chat_messages").select("id,username,message").gt("id",lastMessageId).order("created_at",{ascending:true}).limit(20); if(data) for(let m of data) { addMessageToChat(m.username, m.message); if(m.id > lastMessageId) lastMessageId = m.id; } }
function startChatUpdates() { if(chatUpdateInterval) clearInterval(chatUpdateInterval); loadChatMessages(); chatUpdateInterval = setInterval(checkNewMessages, 3000); }
function stopChatUpdates() { if(chatUpdateInterval) { clearInterval(chatUpdateInterval); chatUpdateInterval = null; } lastMessageId = 0; }
function cleanupChat() { stopChatUpdates(); let div = document.getElementById("socialChat"); if(div) div.innerHTML = '<div class="chat-message"><strong>Система:</strong> Войдите в аккаунт</div>'; }