import { GameState } from '../state.js';
import { defaultUpgrades } from '../data.js';

export const UPCOMING_PREVIEW_COUNT = 4;
/** Következő N épület: látszik az ár, még ha nem is vehető meg */
export const PRICE_PREVIEW_COUNT = 2;

export function getOrderedShopUpgrades() {
    return defaultUpgrades
        .map(def => GameState.upgrades.find(u => u.id === def.id))
        .filter(Boolean);
}

function getLastOwnedShopIndex(ordered) {
    let last = -1;
    ordered.forEach((u, i) => {
        if (u.owned > 0) last = i;
    });
    return last;
}

/** Cookie Clicker: megvett épületek + max. 4 következő a listában */
export function isShopUpgradeVisible(index, ordered) {
    const upg = ordered[index];
    if (!upg) return false;
    if (upg.id === 7 && upg.owned > 0) return false;

    if (upg.owned > 0) return true;

    const lastOwned = getLastOwnedShopIndex(ordered);
    if (lastOwned === -1) return index <= UPCOMING_PREVIEW_COUNT;
    return index <= lastOwned + UPCOMING_PREVIEW_COUNT;
}

export function getUpgradeActualCost(upg, hasEszterDiscount, hasKupon) {
    let cost = upg.cost;
    if (upg.id === 7 && hasEszterDiscount) cost *= 0.8;
    else if (upg.id !== 7 && hasKupon) cost *= 0.9;
    return cost;
}

function isInPricePreviewZone(index, ordered) {
    const upg = ordered[index];
    if (!upg || upg.owned > 0) return false;
    const lastOwned = getLastOwnedShopIndex(ordered);
    if (lastOwned === -1) return index <= PRICE_PREVIEW_COUNT;
    return index > lastOwned && index <= lastOwned + PRICE_PREVIEW_COUNT;
}

/** Megvett / megvehető, vagy a következő 2 előnézet (ár + infó) */
export function shouldShowShopDetails(upg, actualCost, index, ordered) {
    if (upg.owned > 0 || GameState.bikes >= actualCost) return true;
    return isInPricePreviewZone(index, ordered);
}
