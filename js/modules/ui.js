import { GameState, setUpdateUI } from '../state.js';
import { extraUpgradesData } from '../data.js';
import {
    getOrderedShopUpgrades,
    isShopUpgradeVisible,
    getUpgradeActualCost,
    shouldShowShopDetails
} from './shopVisibility.js';
import { updateCosmeticsUI } from './shop.js';
import { getPrestigeMultiplier, formatSpokeBonusPercent } from '../prestigeBalance.js';
import { EXTRA_UPGRADE_COST_MULT } from '../longGameBalance.js';
import { updateBuildingTiersUI } from './buildingTiers.js';
import { updateApocalypseUI, getApocalypseBpsMult } from './apocalypse.js';
import { getBuildingUnlockHint, canPurchaseBuilding } from '../longGameBalance.js';
import { formatMilkPercent } from './milk.js';
import { getBuyAmount, calcBulkPurchase } from './shopBulk.js';
import { getActiveChallenge } from './challenges.js';
import {
    getMarginalHudBpsPerUnit,
    getMarginalHudClickPerUnit
} from './stats.js';
import { updateAscensionButton } from './ascension.js';
import { updateMartinRestUI } from './gameCompletion.js';

let lastBuildingSum = -1;

window.updateBuildingsVisuals = function() {
    const container = document.getElementById('buildings-layer');
    container.innerHTML = '';
    GameState.upgrades.forEach(upg => {
        if (upg.type === "special") return;
        let count = Math.min(upg.owned, 15);
        for (let i = 0; i < count; i++) {
            let el = document.createElement('div');
            el.className = 'building-sprite';
            el.innerText = upg.icon;
            el.style.animationDelay = (Math.random() * 0.5) + 's';
            container.appendChild(el);
        }
    });
};

window.updateUI = function() {
    document.getElementById('bike-count').innerText = Math.floor(GameState.bikes).toLocaleString();
    const displayBps = Math.floor(GameState.bps * window.multiplier * getApocalypseBpsMult());
    const bpsLabel = window.isApocalypseActive
        ? `BPS (apokalipszis): ${displayBps.toLocaleString()}`
        : `Biciklik másodpercenként: ${displayBps.toLocaleString()}`;
    document.getElementById('bps-count').innerText = bpsLabel;
    const presCountUI = document.getElementById('prestige-count');
    const ascensionEl = document.getElementById('ascension-info');
    const milkEl = document.getElementById('milk-info');
    if (GameState.goldenSpokes > 0 || GameState.prestigeSkills.length > 0) {
        presCountUI.style.display = 'block';
        const spokePct = formatSpokeBonusPercent(GameState.goldenSpokes, GameState.prestigeSkills.includes(304));
        const milkPct = formatMilkPercent(GameState);
        presCountUI.innerText = `✨ Arany Küllők: ${GameState.goldenSpokes} (+${spokePct}% passzív)`;
        if (ascensionEl) {
            const prestigeMult = getPrestigeMultiplier(GameState, GameState.upgrades);
            ascensionEl.style.display = 'block';
            ascensionEl.innerText = `Felemelkedés: ${prestigeMult.toFixed(2)}x · Tej: +${milkPct}%`;
        }
    } else if (ascensionEl) {
        ascensionEl.style.display = 'none';
    }
    if (milkEl) {
        const milkPct = formatMilkPercent(GameState);
        milkEl.style.display = milkPct > 0 ? 'block' : 'none';
        milkEl.textContent = milkPct > 0 ? `🥛 Tej: +${milkPct}%` : '';
    }
    const buyBtn = document.getElementById('btn-buy-amount');
    if (buyBtn) buyBtn.textContent = `Vásárlás: ×${getBuyAmount()}`;
    updateAscensionButton();

    function buildingShopDesc(upg) {
        if (upg.type === 'special') return upg.desc;
        const active = getActiveChallenge();
        const challengeNote =
            active?.bpsFromBuildings && active.bpsFromBuildings < 1 && upg.type === 'bps'
                ? ` · kihívás: ${Math.round(active.bpsFromBuildings * 100)}%`
                : '';
        if (upg.type === 'click') {
            const per = Math.ceil(getMarginalHudClickPerUnit(upg.id));
            return `+${per.toLocaleString()} katt./db (tényleges)${challengeNote}`;
        }
        const per = Math.ceil(getMarginalHudBpsPerUnit(upg.id));
        if (per <= 0) {
            return `+0 / mp/db (buff vagy defekt miatt a fejléc nem nő)${challengeNote}`;
        }
        return `+${per.toLocaleString()} / mp/db (fejléc)${challengeNote}`;
    }

    let hasEszterDiscount = GameState.prestigeSkills.includes(203);
    let hasKupon = GameState.prestigeSkills.includes(207);
    let currentBuildingSum = 0;

    const orderedShop = getOrderedShopUpgrades();
    orderedShop.forEach((upg, index) => {
        currentBuildingSum += upg.owned;
        const item = document.getElementById(`upg-item-${upg.id}`);
        if (!item) return;

        const visible = isShopUpgradeVisible(index, orderedShop);
        item.style.display = visible ? 'flex' : 'none';
        if (!visible) return;

        const buyN = getBuyAmount();
        const bulk = buyN > 1 && upg.type !== 'special'
            ? calcBulkPurchase(upg, buyN, GameState.bikes, hasEszterDiscount, hasKupon)
            : null;
        const actualCost = bulk ? bulk.totalCost : getUpgradeActualCost(upg, hasEszterDiscount, hasKupon);
        const prestigeLocked = !canPurchaseBuilding(upg.id);
        const canAfford = !prestigeLocked && bulk
            ? bulk.count > 0 && GameState.bikes >= bulk.totalCost
            : GameState.bikes >= actualCost;
        const showDetails = shouldShowShopDetails(upg, actualCost, index, orderedShop);
        const ownedEl = document.getElementById(`upg-owned-${upg.id}`);
        const descEl = document.getElementById(`upg-desc-${upg.id}`);
        const costEl = document.getElementById(`upg-cost-${upg.id}`);
        const nameEl = item.querySelector('.upgrade-name');

        if (showDetails) {
            item.className = 'upgrade-item ' + (canAfford ? 'affordable' : 'disabled');
            item.style.pointerEvents = '';
            if (nameEl) nameEl.style.visibility = 'visible';
            descEl.innerText = buildingShopDesc(upg);
            if (prestigeLocked) {
                costEl.innerText = getBuildingUnlockHint(upg.id) || '🔒 Zárolt';
                item.className = 'upgrade-item locked-preview';
                item.style.pointerEvents = 'none';
            } else if (bulk && bulk.count > 0) {
                costEl.innerText = buyN > 1
                    ? `×${bulk.count}: ${bulk.totalCost.toLocaleString()} 🚲`
                    : Math.floor(actualCost).toLocaleString() + ' 🚲';
            } else {
                costEl.innerText = Math.floor(actualCost).toLocaleString() + ' 🚲';
            }
            ownedEl.innerText = upg.owned;
        } else {
            item.className = 'upgrade-item locked-preview';
            item.style.pointerEvents = 'none';
            if (nameEl) nameEl.style.visibility = 'hidden';
            descEl.innerText = '';
            costEl.innerText = '';
            ownedEl.innerText = '';
        }

        if (upg.id === 7 && upg.owned > 0) {
            document.getElementById('motivation-banner').style.display = 'block';
            item.style.display = 'none';
        }
    });

    if (currentBuildingSum !== lastBuildingSum) {
        window.updateBuildingsVisuals();
        lastBuildingSum = currentBuildingSum;
    }

    updateBuildingTiersUI();
    updateApocalypseUI();

    const extraList = document.getElementById('extra-upgrades-list');
    extraUpgradesData.forEach(ext => {
        let isOwned = GameState.realUpgrades.some(ru => ru.id === ext.id);
        let reqCount = GameState.upgrades.find(u => u.id === ext.reqBuilding)?.owned || 0;
        let el = document.getElementById(`extra-upg-${ext.id}`);
        if (!isOwned && (reqCount >= ext.reqCount)) {
            if (!el) {
                el = document.createElement('div');
                el.id = `extra-upg-${ext.id}`;
                el.onclick = () => window.buyExtraUpgrade(ext.id);
                const extCost = Math.floor(ext.cost * EXTRA_UPGRADE_COST_MULT);
                el.innerHTML = `<b>${ext.name}</b><br><span style="color:#78909c;">${ext.desc}</span><br><b style="color:#d32f2f; font-family:'Bangers'; font-size:16px;">${extCost.toLocaleString()} 🚲</b>`;
                extraList.appendChild(el);
            }
            const extCostCheck = Math.floor(ext.cost * EXTRA_UPGRADE_COST_MULT);
            el.className = 'extra-upgrade-item ' + (GameState.bikes >= extCostCheck ? 'affordable' : 'disabled');
        } else if (el) {
            el.remove();
        }
    });

    updateCosmeticsUI();
    updateMartinRestUI();

    const prestigePoints = window.calculateKullok();
    if (prestigePoints > 0) {
        document.getElementById('btn-prestige').style.display = 'block';
        document.getElementById('btn-prestige').innerText = `✨ ÚJRASZÜLETÉS (+${prestigePoints} Küllő)`;
    }
    if (!window.aimlabActive) {
        const costEl = document.getElementById('aimlab-cost');
        if (costEl) costEl.innerText = Math.floor(GameState.bikes * 0.9).toLocaleString();
    }

    if (window.refreshPlayerPanel) window.refreshPlayerPanel();
};

setUpdateUI(window.updateUI);
