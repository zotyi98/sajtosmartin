import { GameState, showToast, saveUserProgress } from '../state.js';
import { defaultUpgrades, extraUpgradesData, BUILDING_PRICE_GROWTH } from '../data.js';
import { checkClickCheat } from './anticheat.js';
import { trackClick } from './gameStats.js';
import { getOrderedShopUpgrades } from './shopVisibility.js';

const CHEESE_CURSOR_COST = 50000;

function ensureCosmeticsArray() {
    if (!Array.isArray(GameState.cosmetics)) {
        GameState.cosmetics = GameState.cosmetics ? Object.values(GameState.cosmetics) : [];
    }
}

export function initCosmeticsUI() {
    const container = document.getElementById('cosmetics-section');
    if (!container || container.dataset.ready === '1') return;

    container.innerHTML = `
        <div id="cosmetic-cheese" class="cosmetic-card extra-upgrade-item disabled">
            <div class="cosmetic-card-icon">🧀</div>
            <b class="cosmetic-card-title">Sajtos kurzor</b>
            <span class="cosmetic-card-desc">Változtasd sajttá az egeredet! Egyedi kurzor élmény.</span>
            <span class="cosmetic-card-price">50 000 🚲</span>
            <button type="button" id="btn-buy-cheese-cursor" class="cosmetic-buy-btn disabled">Megvásárlás 🧀</button>
        </div>
    `;

    document.getElementById('btn-buy-cheese-cursor').addEventListener('click', (e) => {
        e.stopPropagation();
        window.buyCosmetic('cheese_cursor');
    });

    container.dataset.ready = '1';
}

export function updateCosmeticsUI() {
    ensureCosmeticsArray();
    const card = document.getElementById('cosmetic-cheese');
    const btn = document.getElementById('btn-buy-cheese-cursor');
    if (!card || !btn) return;

    const hasCheese = GameState.cosmetics.includes('cheese_cursor');
    const canAfford = GameState.bikes >= CHEESE_CURSOR_COST;

    card.className = 'cosmetic-card extra-upgrade-item ' + (hasCheese ? 'owned' : (canAfford ? 'affordable' : 'disabled'));
    btn.className = 'cosmetic-buy-btn ' + (hasCheese ? 'owned' : (canAfford ? 'affordable' : 'disabled'));
    btn.disabled = hasCheese || !canAfford;
    btn.textContent = hasCheese ? '✓ Már megvan' : '🧀 Megvásárlás';
}

export function initShopUI() {
    const list = document.getElementById('upgrade-list');
    list.innerHTML = "";
    GameState.upgrades = JSON.parse(JSON.stringify(defaultUpgrades));
    getOrderedShopUpgrades().forEach(upg => {
        const div = document.createElement('div');
        div.id = `upg-item-${upg.id}`;
        div.className = 'upgrade-item disabled';
        div.onclick = () => window.buyUpgrade(upg.id);
        div.innerHTML = `<div class="upgrade-icon">${upg.icon}</div><div class="upgrade-info"><span class="upgrade-name">${upg.name}</span><span class="upgrade-desc" id="upg-desc-${upg.id}"></span><span class="upgrade-cost" id="upg-cost-${upg.id}"></span></div><div class="upgrade-owned" id="upg-owned-${upg.id}">0</div>`;
        list.appendChild(div);
    });
    initCosmeticsUI();
}

window.clickMartin = function(e) {
    if (window.isKitchenMeetingActive) { showToast("☕ Martin a konyhában van!"); return; }
    if (checkClickCheat()) return;
    trackClick();
    let gained = (GameState.clickPower * window.clickMultiplier);
    GameState.bikes += gained;
    GameState.lifetimeBikes += gained;
    window.createFloatingNumber(e.clientX, e.clientY, gained);
    window.createParticle(e.clientX, e.clientY);
    window.updateUI();
};

window.buyUpgrade = function(id) {
    const upg = GameState.upgrades.find(u => u.id === id);
    if (!upg) return;
    const hasEszterDiscount = GameState.prestigeSkills.includes(203);
    const hasKupon = GameState.prestigeSkills.includes(207);
    let actualCost = upg.cost;
    if (id === 7 && hasEszterDiscount) actualCost *= 0.8;
    else if (id !== 7 && hasKupon) actualCost *= 0.9;
    if (GameState.bikes < actualCost) return;
    GameState.bikes -= actualCost;
    upg.owned++;
    if (upg.type !== "special") upg.cost = Math.floor(upg.cost * BUILDING_PRICE_GROWTH);
    window.recalculateStats();
    window.updateUI();
    saveUserProgress();
};

window.buyExtraUpgrade = function(id) {
    const ext = extraUpgradesData.find(e => e.id === id);
    if (GameState.bikes >= ext.cost) {
        GameState.bikes -= ext.cost;
        GameState.realUpgrades.push({ id: id });
        showToast(`✨ Új Fejlesztés: ${ext.name}!`);
        window.recalculateStats();
        window.updateUI();
        saveUserProgress();
    }
};

window.buyCosmetic = function(id) {
    if (id !== 'cheese_cursor') return;
    ensureCosmeticsArray();
    const cost = CHEESE_CURSOR_COST;
    if (GameState.cosmetics.includes(id)) { showToast('Már megvan ez a kozmetika.'); return; }
    if (GameState.bikes < cost) { showToast('Nincs elég biciklid ehhez a kozmetikához.'); return; }
    GameState.bikes -= cost;
    GameState.cosmetics.push(id);
    window.applyCosmetics();
    showToast('🧀 Sajtos kurzor megvásárolva!');
    window.updateUI();
    saveUserProgress();
};

window.showCosmeticsSection = function() {
    initCosmeticsUI();
    updateCosmeticsUI();
    document.getElementById('cosmetics-title').style.display = 'block';
    document.getElementById('cosmetics-section').style.display = 'flex';
    document.getElementById('shop-main-content').style.display = 'none';
};

window.showShopTabs = function() {
    document.getElementById('cosmetics-title').style.display = 'none';
    document.getElementById('cosmetics-section').style.display = 'none';
    document.getElementById('shop-main-content').style.display = 'block';
};
