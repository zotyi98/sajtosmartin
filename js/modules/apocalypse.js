import { GameState, saveUserProgress } from '../state.js';
import { pushActivityFeed } from './activityFeed.js';
const MAX_WRINKLERS = 6;
const DRAIN_PER_WRINKLER = 0.04;
const MAX_TOTAL_DRAIN = 0.24;
const WRINKLER_SPAWN_MS = 38000;
const WRINKLER_POP_BONUS = 0.08;

function ensureApocalypseState() {
    if (!GameState.apocalypse || typeof GameState.apocalypse !== 'object') {
        GameState.apocalypse = {
            awakened: false,
            active: false,
            wrinklers: [],
            totalSucked: 0,
            startedAt: 0
        };
    }
    if (!Array.isArray(GameState.apocalypse.wrinklers)) {
        GameState.apocalypse.wrinklers = [];
    }
}

export function isApocalypseUnlocked() {
    const typesOwned = GameState.upgrades.filter((u) => u.owned > 0 && u.id !== 7).length;
    const totalBuildings = GameState.upgrades.reduce((s, u) => s + (u.owned || 0), 0);
    const lifetime = GameState.lifetimeBikes || 0;
    return typesOwned >= 5 && totalBuildings >= 35 && lifetime >= 400000;
}

export function isApocalypseActive() {
    ensureApocalypseState();
    return !!GameState.apocalypse.active;
}

window.isApocalypseActive = false;

export function getApocalypseBpsMult() {
    if (!isApocalypseActive()) return 1;
    ensureApocalypseState();
    const n = GameState.apocalypse.wrinklers.length;
    const drain = Math.min(MAX_TOTAL_DRAIN, n * DRAIN_PER_WRINKLER);
    return 1 - drain;
}

function getWrinklerLayer() {
    return document.getElementById('wrinkler-layer');
}

function spawnWrinklerDOM(w) {
    const layer = getWrinklerLayer();
    if (!layer) return;
    const el = document.createElement('div');
    el.className = 'wrinkler';
    el.dataset.id = w.id;
    el.style.left = `${w.x}%`;
    el.style.top = `${w.y}%`;
    el.innerHTML = '🛞';
    el.title = 'Kattints: visszaszívott bringák + bónusz';
    el.onclick = () => popWrinkler(w.id);
    layer.appendChild(el);
}

function removeWrinklerDOM(id) {
    const layer = getWrinklerLayer();
    if (!layer) return;
    const el = layer.querySelector(`[data-id="${id}"]`);
    if (el) el.remove();
}

function clearWrinklerDOM() {
    const layer = getWrinklerLayer();
    if (layer) layer.innerHTML = '';
}

function spawnWrinkler() {
    ensureApocalypseState();
    if (!GameState.apocalypse.active) return;
    if (GameState.apocalypse.wrinklers.length >= MAX_WRINKLERS) return;
    const id = `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const w = {
        id,
        x: 5 + Math.random() * 85,
        y: 8 + Math.random() * 75,
        sucked: 0
    };
    GameState.apocalypse.wrinklers.push(w);
    spawnWrinklerDOM(w);
}

export function popWrinkler(id) {
    ensureApocalypseState();
    if (!GameState.apocalypse.active) return;
    const idx = GameState.apocalypse.wrinklers.findIndex((w) => w.id === id);
    if (idx < 0) return;
    const w = GameState.apocalypse.wrinklers[idx];
    const returnAmt = Math.floor(w.sucked * (1 + WRINKLER_POP_BONUS));
    GameState.bikes += returnAmt;
    GameState.lifetimeBikes = (GameState.lifetimeBikes || 0) + returnAmt;
    GameState.apocalypse.wrinklers.splice(idx, 1);
    removeWrinklerDOM(id);
    if (window.showToast) window.showToast(`Defekt szellem: +${returnAmt.toLocaleString()} 🚲`, 'success');
    if (!GameState.gameStats) GameState.gameStats = {};
    GameState.gameStats.wrinklersPopped = (GameState.gameStats.wrinklersPopped || 0) + 1;
    saveUserProgress();
    window.updateUI();
}

function tickWrinklerDrain(bpsBeforeDrain) {
    ensureApocalypseState();
    if (!GameState.apocalypse.active || !bpsBeforeDrain) return;
    const perTick = bpsBeforeDrain / 10;
    const n = GameState.apocalypse.wrinklers.length;
    if (n === 0) return;
    const totalDrain = Math.min(MAX_TOTAL_DRAIN, n * DRAIN_PER_WRINKLER);
    const drained = perTick * totalDrain;
    const each = drained / n;
    GameState.apocalypse.wrinklers.forEach((w) => {
        w.sucked += each;
    });
    GameState.apocalypse.totalSucked = (GameState.apocalypse.totalSucked || 0) + drained;
}

let lastSpawn = 0;

export function tickApocalypse(bpsBeforeDrain) {
    ensureApocalypseState();
    window.isApocalypseActive = isApocalypseActive();
    if (!GameState.apocalypse.active) return;

    tickWrinklerDrain(bpsBeforeDrain);

    const now = Date.now();
    if (now - lastSpawn > WRINKLER_SPAWN_MS) {
        lastSpawn = now;
        if (GameState.apocalypse.wrinklers.length < MAX_WRINKLERS) {
            spawnWrinkler();
        }
    }
}

window.awakenApocalypse = function() {
    ensureApocalypseState();
    if (!isApocalypseUnlocked() || GameState.apocalypse.awakened) return;
    GameState.apocalypse.awakened = true;
    if (window.showToast) window.showToast('Felébresztve: a Defekt Apokalipszis készen áll.', 'info');
    updateApocalypseUI();
    saveUserProgress();
};

window.startApocalypse = function() {
    ensureApocalypseState();
    if (!GameState.apocalypse.awakened || GameState.apocalypse.active) return;
    if (window.isKitchenMeetingActive) {
        if (window.showToast) window.showToast('Konyhai megbeszélés alatt nem indul az apokalipszis.', 'warn');
        return;
    }
    GameState.apocalypse.active = true;
    GameState.apocalypse.startedAt = Date.now();
    GameState.apocalypse.wrinklers = [];
    GameState.apocalypse.totalSucked = 0;
    lastSpawn = 0;
    clearWrinklerDOM();
    document.body.classList.add('apocalypse-active');
    spawnWrinkler();
    spawnWrinkler();
    if (window.showToast) window.showToast('Defekt Apokalipszis! Kattints a 🛞 szellemekre!', 'warn');
    pushActivityFeed('apocalypse', '', true);
    updateApocalypseUI();
    saveUserProgress();
};

window.endApocalypsePeace = function() {
    ensureApocalypseState();
    if (!GameState.apocalypse.active) return;
    const cost = Math.floor(GameState.bikes * 0.12);
    if (GameState.bikes < cost) {
        if (window.showToast) window.showToast(`Béke pecséthez kell ${cost.toLocaleString()} 🚲 (12%).`, 'warn');
        return;
    }
    let refund = 0;
    GameState.apocalypse.wrinklers.forEach((w) => {
        refund += Math.floor(w.sucked * 0.55);
    });
    GameState.bikes -= cost;
    GameState.bikes += refund;
    GameState.apocalypse.active = false;
    GameState.apocalypse.wrinklers = [];
    clearWrinklerDOM();
    document.body.classList.remove('apocalypse-active');
    window.isApocalypseActive = false;
    if (window.showToast) window.showToast(`Béke pecsét: −${cost.toLocaleString()}, vissza ${refund.toLocaleString()} 🚲`, 'success');
    updateApocalypseUI();
    saveUserProgress();
};

export function updateApocalypseUI() {
    ensureApocalypseState();
    const panel = document.getElementById('apocalypse-panel');
    if (!panel) return;

    const unlocked = isApocalypseUnlocked();
    const ap = GameState.apocalypse;

    panel.classList.remove('hidden');

    if (!unlocked) {
        panel.innerHTML = '<p class="apocalypse-hint">🔒 Defekt Apokalipszis: 5 épület típus, 35+ db, 400k összes bringa.</p>';
        return;
    }

    if (!ap.awakened) {
        panel.innerHTML = `<button type="button" class="apocalypse-btn awaken" onclick="window.awakenApocalypse()">🌑 Felébresztés</button>`;
        return;
    }

    if (!ap.active) {
        panel.innerHTML = `
            <p class="apocalypse-desc">Defekt szellemek szívnak BPS-t — kattintással visszakapod +8% bónusszal.</p>
            <button type="button" class="apocalypse-btn start" onclick="window.startApocalypse()">🔥 Indítsd a Defekt Apokalipszist</button>
        `;
        return;
    }

    const n = ap.wrinklers.length;
    const drainPct = Math.round(Math.min(MAX_TOTAL_DRAIN, n * DRAIN_PER_WRINKLER) * 100);
    panel.innerHTML = `
        <p class="apocalypse-desc apocalypse-live">Aktív · ${n} szellem · −${drainPct}% BPS</p>
        <button type="button" class="apocalypse-btn end" onclick="window.endApocalypsePeace()">☮️ Béke pecsét (12% bank)</button>
    `;
}

export function initApocalypse() {
    ensureApocalypseState();
    window.isApocalypseActive = isApocalypseActive();
    if (GameState.apocalypse.active) {
        document.body.classList.add('apocalypse-active');
        clearWrinklerDOM();
        GameState.apocalypse.wrinklers.forEach(spawnWrinklerDOM);
        lastSpawn = Date.now();
    }
    updateApocalypseUI();
}

/** Rusty események gyakoribbak apokalipszis alatt */
export function getApocalypseEventBias() {
    return isApocalypseActive() ? 0.72 : 0;
}
