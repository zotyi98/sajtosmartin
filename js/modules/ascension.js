import { GameState, saveUserProgress, showToast } from '../state.js';
import { defaultUpgrades } from '../data.js';
import { heavenlyUpgradesData, getHeavenlyLevel } from '../heavenlyData.js';
import { sanitizeUsername } from '../authSession.js';
import { pushActivityFeed } from './activityFeed.js';

const MIN_PRESTIGE = 3;
const MIN_GOLDEN_SPOKES = 15;
const MIN_LIFETIME = 5e14;

export function canAscend() {
    return (GameState.prestigeCount || 0) >= MIN_PRESTIGE
        && (GameState.goldenSpokes || 0) >= MIN_GOLDEN_SPOKES
        && (GameState.lifetimeBikes || 0) >= MIN_LIFETIME;
}

export function calculatePlatinaGain() {
    if (!canAscend()) return 0;
    const spokes = GameState.goldenSpokes || 0;
    const pres = GameState.prestigeCount || 0;
    return Math.max(1, Math.floor(Math.pow(spokes, 0.55) * Math.pow(pres, 0.35)));
}

window.openAscensionModal = function () {
    const modal = document.getElementById('ascension-modal');
    if (!modal) return;
    const gain = calculatePlatinaGain();
    const info = document.getElementById('ascension-modal-info');
    if (info) {
        info.innerHTML = canAscend()
            ? `Platina Küllő: <b>${GameState.platinaSpokes || 0}</b> · Következő emelkedés: <b>+${gain}</b><br><small>Megtartod: küllők, skillek, tej, mennyei, kihívások. Újra: épületek, biciklik, extra fejlesztések.</small>`
            : `Feltétel: ${MIN_PRESTIGE} prestige, ${MIN_GOLDEN_SPOKES} arany küllő, ${MIN_LIFETIME.toExponential(0)} lifetime bicikli.`;
    }
    renderHeavenlyShop();
    modal.style.display = 'flex';
};

function renderHeavenlyShop() {
    const list = document.getElementById('heavenly-upgrades-list');
    if (!list) return;
    list.innerHTML = '';
    heavenlyUpgradesData.forEach((h) => {
        const lvl = getHeavenlyLevel(GameState, h.id);
        const max = h.maxLevel || 1;
        const isMax = h.repeatable ? lvl >= max : lvl > 0;
        let reqOk = true;
        if (h.req) reqOk = getHeavenlyLevel(GameState, h.req) > 0;
        const cost = h.repeatable ? h.baseCost * Math.pow(2, lvl) : h.baseCost;
        const canBuy = !isMax && reqOk && (GameState.platinaSpokes || 0) >= cost;
        const row = document.createElement('div');
        row.className = 'heavenly-row ' + (isMax ? 'owned' : (canBuy ? 'affordable' : 'disabled'));
        row.innerHTML = `<b>${h.name}</b> ${h.repeatable ? `(${lvl}/${max})` : ''}<br><span>${h.desc}</span><br><button type="button" ${canBuy ? '' : 'disabled'}>${isMax ? 'MAX' : cost + ' platina'}</button>`;
        row.querySelector('button')?.addEventListener('click', () => window.buyHeavenlyUpgrade(h.id));
        list.appendChild(row);
    });
}

window.buyHeavenlyUpgrade = function (id) {
    const h = heavenlyUpgradesData.find((x) => x.id === id);
    if (!h) return;
    const lvl = getHeavenlyLevel(GameState, id);
    const max = h.maxLevel || 1;
    if (h.repeatable && lvl >= max) return;
    if (!h.repeatable && lvl > 0) return;
    if (h.req && getHeavenlyLevel(GameState, h.req) <= 0) {
        showToast('Előbb vedd meg az előfeltételt!');
        return;
    }
    const cost = h.repeatable ? h.baseCost * Math.pow(2, lvl) : h.baseCost;
    if ((GameState.platinaSpokes || 0) < cost) return;
    GameState.platinaSpokes -= cost;
    if (!GameState.heavenlyUpgrades) GameState.heavenlyUpgrades = {};
    GameState.heavenlyUpgrades[id] = lvl + 1;
    saveUserProgress();
    window.recalculateStats();
    window.updateUI();
    renderHeavenlyShop();
};

window.ascend = async function () {
    const gain = calculatePlatinaGain();
    if (gain <= 0) {
        showToast('Még nem emelkedhetsz fel!');
        return;
    }
    if (!confirm(`Mennyei emelkedés (+${gain} Platina Küllő)?\nÉpületek és biciklik nullázódnak, a küllők és skillek megmaradnak.`)) return;

    GameState.platinaSpokes = (GameState.platinaSpokes || 0) + gain;
    GameState.ascensionCount = (GameState.ascensionCount || 0) + 1;
    GameState.bikes = 0;
    GameState.bps = 0;
    GameState.clickPower = 1;
    GameState.realUpgrades = [];
    GameState.upgrades.forEach((u) => {
        u.owned = 0;
        const def = defaultUpgrades.find((d) => d.id === u.id);
        u.cost = def ? def.cost : u.cost;
    });
    window.activeBuffs = [];
    window.multiplier = 1;
    window.clickMultiplier = 1;
    sessionStorage.setItem(`prestigeReload_${sanitizeUsername(GameState.currentUser)}`, '1');
    try {
        pushActivityFeed('prestige', String(gain), true);
        await saveUserProgress();
    } catch (e) {
        showToast('Mentési hiba!');
        return;
    }
    location.reload();
};

export function updateAscensionButton() {
    const btn = document.getElementById('btn-ascension');
    if (!btn) return;
    if (canAscend()) {
        btn.style.display = 'block';
        btn.textContent = `🌠 Mennyei emelkedés (+${calculatePlatinaGain()} platina)`;
    } else {
        btn.style.display = 'none';
    }
    const platEl = document.getElementById('platina-info');
    if (platEl && (GameState.platinaSpokes || 0) > 0) {
        platEl.style.display = 'block';
        platEl.textContent = `🌠 Platina: ${GameState.platinaSpokes}`;
    } else if (platEl) {
        platEl.style.display = 'none';
    }
}
