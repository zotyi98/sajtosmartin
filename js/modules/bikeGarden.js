import { GameState, saveUserProgress, showToast } from '../state.js';

const PLOT_COUNT = 4;
const GROW_MS = [120000, 300000, 600000, 1200000];
const SEED_COST = [50000, 500000, 5000000, 50000000];
const HARVEST_BPS_BUFF = [1.08, 1.12, 1.15, 1.2];
const BUFF_DURATION_MS = 180000;

function ensureGarden() {
    if (!GameState.bikeGarden || !Array.isArray(GameState.bikeGarden.plots)) {
        GameState.bikeGarden = { plots: Array(PLOT_COUNT).fill(null) };
    }
}

export function canUseGarden() {
    return (GameState.prestigeCount || 0) >= 1;
}

window.openBikeGarden = function () {
    if (!canUseGarden()) {
        showToast('Bringakert: legalább 1 prestige kell!');
        return;
    }
    ensureGarden();
    const modal = document.getElementById('garden-modal');
    if (!modal) return;
    renderGarden();
    modal.style.display = 'flex';
};

function renderGarden() {
    const grid = document.getElementById('garden-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const now = Date.now();
    ensureGarden();
    GameState.bikeGarden.plots.forEach((plot, i) => {
        const cell = document.createElement('div');
        cell.className = 'garden-plot';
        if (!plot) {
            cell.innerHTML = `<span>🌱 Üres ágyás ${i + 1}</span><button type="button">Ültetés (${SEED_COST[i].toLocaleString()} 🚲)</button>`;
            cell.querySelector('button')?.addEventListener('click', () => plantSeed(i));
        } else if (now >= plot.readyAt) {
            cell.className += ' ready';
            cell.innerHTML = `<span>🚲 Kész!</span><button type="button">Betakarítás (+${Math.round((HARVEST_BPS_BUFF[i] - 1) * 100)}% BPS 3 perc)</button>`;
            cell.querySelector('button')?.addEventListener('click', () => harvest(i));
        } else {
            const sec = Math.ceil((plot.readyAt - now) / 1000);
            cell.innerHTML = `<span>🌿 Nő… ${sec}s</span>`;
        }
        grid.appendChild(cell);
    });
}

function plantSeed(index) {
    const cost = SEED_COST[index];
    if (GameState.bikes < cost) {
        showToast('Nincs elég bicikli!');
        return;
    }
    ensureGarden();
    if (GameState.bikeGarden.plots[index]) {
        showToast('Ez az ágyás foglalt!');
        return;
    }
    GameState.bikes -= cost;
    GameState.bikeGarden.plots[index] = { plantedAt: Date.now(), readyAt: Date.now() + GROW_MS[index], tier: index };
    saveUserProgress();
    renderGarden();
    showToast('Mag elültetve!');
}

function harvest(index) {
    ensureGarden();
    const plot = GameState.bikeGarden.plots[index];
    if (!plot || Date.now() < plot.readyAt) return;
    const mult = HARVEST_BPS_BUFF[plot.tier] || 1.1;
    window.activeBuffs = window.activeBuffs || [];
    window.activeBuffs.push({
        mult,
        target: 'bps',
        endTime: Date.now() + BUFF_DURATION_MS,
        text: `🌿 Kert: ${mult}x BPS!`,
        color: '#66bb6a'
    });
    GameState.bikeGarden.plots[index] = null;
    if (window.recalcMultiplier) window.recalcMultiplier();
    saveUserProgress();
    renderGarden();
    showToast('Betakarítva!');
}

export function tickGardenUI() {
    const modal = document.getElementById('garden-modal');
    if (modal && modal.style.display === 'flex') renderGarden();
}

export function initGardenTicker() {
    setInterval(tickGardenUI, 2000);
}
