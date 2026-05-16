import { GameState, setUpdateUI } from '../state.js';
import { extraUpgradesData } from '../data.js';
import {
    getOrderedShopUpgrades,
    isShopUpgradeVisible,
    getUpgradeActualCost,
    shouldShowShopDetails
} from './shopVisibility.js';
import { updateCosmeticsUI } from './shop.js';

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
    document.getElementById('bps-count').innerText = "Biciklik másodpercenként: " + Math.floor(GameState.bps * window.multiplier).toLocaleString();
    const presCountUI = document.getElementById('prestige-count');
    if (GameState.goldenSpokes > 0 || GameState.prestigeSkills.length > 0) {
        presCountUI.style.display = 'block';
        presCountUI.innerText = `✨ Arany Küllők: ${GameState.goldenSpokes} (+${GameState.goldenSpokes}%)`;
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

        const actualCost = getUpgradeActualCost(upg, hasEszterDiscount, hasKupon);
        const canAfford = GameState.bikes >= actualCost;
        const showDetails = shouldShowShopDetails(upg, actualCost, index, orderedShop);
        const ownedEl = document.getElementById(`upg-owned-${upg.id}`);
        const descEl = document.getElementById(`upg-desc-${upg.id}`);
        const costEl = document.getElementById(`upg-cost-${upg.id}`);
        const nameEl = item.querySelector('.upgrade-name');

        if (showDetails) {
            item.className = 'upgrade-item ' + (canAfford ? 'affordable' : 'disabled');
            item.style.pointerEvents = '';
            if (nameEl) nameEl.style.visibility = 'visible';
            descEl.innerText = upg.type !== "special"
                ? `+${Math.ceil(upg.power).toLocaleString()} pont ${upg.type === 'click' ? 'katt.' : '/ mp'}`
                : upg.desc;
            costEl.innerText = Math.floor(actualCost).toLocaleString() + " 🚲";
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
                el.innerHTML = `<b>${ext.name}</b><br><span style="color:#78909c;">${ext.desc}</span><br><b style="color:#d32f2f; font-family:'Bangers'; font-size:16px;">${ext.cost.toLocaleString()} 🚲</b>`;
                extraList.appendChild(el);
            }
            el.className = 'extra-upgrade-item ' + (GameState.bikes >= ext.cost ? 'affordable' : 'disabled');
        } else if (el) {
            el.remove();
        }
    });

    updateCosmeticsUI();

    const prestigePoints = window.calculateKullok();
    if (prestigePoints > 0) {
        document.getElementById('btn-prestige').style.display = 'block';
        document.getElementById('btn-prestige').innerText = `✨ ÚJRASZÜLETÉS (+${prestigePoints} Küllő)`;
    }
    if (!window.aimlabActive) {
        const costEl = document.getElementById('aimlab-cost');
        if (costEl) costEl.innerText = Math.floor(GameState.bikes * 0.9).toLocaleString();
    }
};

setUpdateUI(window.updateUI);
