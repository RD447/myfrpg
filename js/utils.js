function addTechnicalLog(msg) {
    const logDiv = document.getElementById("combatLog");
    if (!logDiv) return;
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logDiv.prepend(entry);
    if (logDiv.children.length > 30) logDiv.removeChild(logDiv.lastChild);
}
function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}