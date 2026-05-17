import { GameState, saveUserProgress } from '../state.js';
import { defaultUpgrades } from '../data.js';
import { getBuildingTierUpgradesList } from '../data.js';
import { TIER_GLOBAL_COST_MULT } from '../longGameBalance.js';

function ensurePurchasedTiers() {
    if (!Array.isArray(GameState.purchasedBuildingTiers)) {
        GameState.purchasedBuildingTiers = [];
    }
}

export function getBuildingTierBonus(buildingId) {
    ensurePurchasedTiers();
    const upgrades = getBuildingTierUpgradesList();
    let bonus = 0;
    GameState.purchasedBuildingTiers.forEach((tid) => {
        const t = upgrades.find((u) => u.id === tid);
        if (t && t.buildingId === buildingId) bonus += t.effect;
    });
    return bonus;
}

export function getTierUpgradeCost(tierUpg) {
    const def = defaultUpgrades.find((d) => d.id === tierUpg.buildingId);
    if (!def) return Infinity;
    const hasKupon = GameState.prestigeSkills.includes(207);
    let cost = Math.floor(def.cost * tierUpg.costMult * TIER_GLOBAL_COST_MULT);
    if (hasKupon) cost = Math.floor(cost * 0.92);
    return Math.max(10, cost);
}

export function isTierUnlocked(tierUpg) {
    const upg = GameState.upgrades.find((u) => u.id === tierUpg.buildingId);
    return upg && upg.owned >= tierUpg.threshold;
}

export function isTierPurchased(tierUpg) {
    ensurePurchasedTiers();
    return GameState.purchasedBuildingTiers.includes(tierUpg.id);
}

window.buyBuildingTier = function(tierId) {
    const tierUpg = getBuildingTierUpgradesList().find((t) => t.id === tierId);
    if (!tierUpg || isTierPurchased(tierUpg) || !isTierUnlocked(tierUpg)) return;
    const cost = getTierUpgradeCost(tierUpg);
    if (GameState.bikes < cost) return;
    GameState.bikes -= cost;
    GameState.purchasedBuildingTiers.push(tierId);
    window.recalculateStats();
    window.updateUI();
    saveUserProgress();
};

export function updateBuildingTiersUI() {
    const container = document.getElementById('building-tier-list');
    if (!container) return;
    ensurePurchasedTiers();

    const tiers = getBuildingTierUpgradesList();
    const visible = tiers.filter((t) => isTierUnlocked(t) || isTierPurchased(t));
    if (visible.length === 0) {
        container.innerHTML = '<p class="tier-hint">Vásárolj épületeket — 1, 10, 50… db-nél új szintek. Late game: tier nélkül az épületek gyengén termelnek!</p>';
        return;
    }

    let html = '';
    const byBuilding = {};
    visible.forEach((t) => {
        if (!byBuilding[t.buildingId]) byBuilding[t.buildingId] = [];
        byBuilding[t.buildingId].push(t);
    });

    Object.keys(byBuilding).forEach((bid) => {
        const group = byBuilding[bid];
        const first = group[0];
        html += `<div class="tier-building-group">`;
        html += `<div class="tier-building-head">${first.icon} ${first.buildingName}</div>`;
        html += `<div class="tier-building-items">`;
        group.forEach((t) => {
            const owned = isTierPurchased(t);
            const cost = getTierUpgradeCost(t);
            const canBuy = !owned && GameState.bikes >= cost;
            const pct = Math.round(t.effect * 100);
            if (owned) {
                html += `<div class="tier-upgrade-item owned"><span>${t.tierName}</span><span>+${pct}% ✓</span></div>`;
            } else {
                html += `<div class="tier-upgrade-item ${canBuy ? 'affordable' : 'disabled'}" onclick="window.buyBuildingTier('${t.id}')">`;
                html += `<span>${t.tierName} (${t.threshold} db)</span>`;
                html += `<span>+${pct}% · ${cost.toLocaleString()} 🚲</span></div>`;
            }
        });
        html += `</div></div>`;
    });

    container.innerHTML = html;
}

export function initBuildingTiersUI() {
    updateBuildingTiersUI();
}
