// ======================== SUPABASE ========================
const SUPABASE_URL = "https://wxrrxnlyyugmduvnciem.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4cnJ4bmx5eXVnbWR1dm5jaWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzIzNjgsImV4cCI6MjA5NTgwODM2OH0.6YfLDjAJ2sKu_C6q_UiXBI_GWJRvtE-m21GzB86zisU";

let supabaseClient = null;

// ======================== ЗВУК ========================
let soundEnabled = true;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
    if (!soundEnabled) return;
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        if (type === 'combat') {
            osc.frequency.value = 220;
            gain.gain.value = 0.1;
            osc.type = 'sawtooth';
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.15);
        } else if (type === 'gather') {
            osc.frequency.value = 660;
            gain.gain.value = 0.08;
            osc.type = 'triangle';
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
        } else if (type === 'levelup') {
            osc.frequency.value = 880;
            gain.gain.value = 0.1;
            osc.type = 'triangle';
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
        } else return;
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } catch(e) {}
}