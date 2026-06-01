// ======================== БЫСТРЫЙ ЧАТ (Supabase) ========================
let lastMessageId = 0;
let chatUpdateInterval = null;
let isLoading = false;

// Отправка сообщения
async function sendChatMessage() {
    const input = document.getElementById("chatInput");
    const msg = input.value.trim();
    
    if (!msg) return;
    if (!isLoggedIn) {
        addTechnicalLog("❌ Сначала войдите в аккаунт!");
        return;
    }
    
    // Блокируем кнопку на секунду, чтобы не спамить
    const sendBtn = document.getElementById("chatSendBtn");
    sendBtn.disabled = true;
    sendBtn.textContent = "⏳";
    
    try {
        const { error } = await supabaseClient
            .from("chat_messages")
            .insert({
                username: currentPlayer.username,
                message: msg.slice(0, 200),
                created_at: new Date().toISOString()
            });
        
        if (error) {
            addTechnicalLog("❌ Ошибка отправки");
        } else {
            input.value = "";
            // Сразу добавляем своё сообщение в чат (без запроса к БД)
            addMessageToChat(currentPlayer.username, msg);
        }
    } catch (e) {
        addTechnicalLog("❌ Ошибка: " + e.message);
    }
    
    setTimeout(() => {
        sendBtn.disabled = false;
        sendBtn.textContent = "📨";
    }, 1000);
}

// Добавление одного сообщения в DOM
function addMessageToChat(username, message) {
    const chatDiv = document.getElementById("socialChat");
    if (!chatDiv) return;
    
    const div = document.createElement("div");
    div.className = "chat-message";
    div.innerHTML = `<strong>${escapeHtml(username)}:</strong> ${escapeHtml(message)}`;
    chatDiv.appendChild(div);
    chatDiv.scrollTop = chatDiv.scrollHeight;
    
    // Оставляем только последние 50 сообщений в DOM (чтобы не тормозил)
    while (chatDiv.children.length > 51) {
        chatDiv.removeChild(chatDiv.children[1]);
    }
}

// Первичная загрузка (только один раз при входе)
async function loadChatMessages() {
    if (!supabaseClient || !isLoggedIn) return;
    if (isLoading) return;
    
    isLoading = true;
    
    try {
        const { data, error } = await supabaseClient
            .from("chat_messages")
            .select("id, username, message")
            .order("created_at", { ascending: true })
            .limit(50);
        
        if (error) throw error;
        
        const chatDiv = document.getElementById("socialChat");
        if (!chatDiv) return;
        
        chatDiv.innerHTML = '<div class="chat-message"><strong>Система:</strong> Добро пожаловать в чат!</div>';
        
        if (data && data.length > 0) {
            for (const msg of data) {
                const div = document.createElement("div");
                div.className = "chat-message";
                div.innerHTML = `<strong>${escapeHtml(msg.username)}:</strong> ${escapeHtml(msg.message)}`;
                chatDiv.appendChild(div);
                if (msg.id > lastMessageId) lastMessageId = msg.id;
            }
        }
        
        chatDiv.scrollTop = chatDiv.scrollHeight;
        
    } catch (e) {
        console.error("Ошибка загрузки чата:", e);
    }
    
    isLoading = false;
}

// Проверка новых сообщений (лёгкий запрос, только по ID)
async function checkNewMessages() {
    if (!supabaseClient || !isLoggedIn) return;
    if (lastMessageId === 0) return;
    
    try {
        const { data, error } = await supabaseClient
            .from("chat_messages")
            .select("id, username, message")
            .gt("id", lastMessageId)
            .order("created_at", { ascending: true })
            .limit(20);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            for (const msg of data) {
                addMessageToChat(msg.username, msg.message);
                if (msg.id > lastMessageId) lastMessageId = msg.id;
            }
        }
    } catch (e) {
        // Тихая ошибка, не засоряем лог
        console.error(e);
    }
}

// Запуск обновления чата (каждые 2 секунды)
function startChatUpdates() {
    if (chatUpdateInterval) clearInterval(chatUpdateInterval);
    
    // Первая загрузка
    loadChatMessages();
    
    // Периодическая проверка новых сообщений
    chatUpdateInterval = setInterval(() => {
        checkNewMessages();
    }, 2000);
}

function stopChatUpdates() {
    if (chatUpdateInterval) {
        clearInterval(chatUpdateInterval);
        chatUpdateInterval = null;
    }
    lastMessageId = 0;
}

// Очистка чата при выходе
function cleanupChat() {
    stopChatUpdates();
    const chatDiv = document.getElementById("socialChat");
    if (chatDiv) {
        chatDiv.innerHTML = '<div class="chat-message"><strong>Система:</strong> Войдите в аккаунт для общения</div>';
    }
}