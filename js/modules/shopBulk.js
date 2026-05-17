import { BUILDING_PRICE_GROWTH } from '../data.js';
import { getChallengeBuildingCostMult } from './challenges.js';

export const BUY_AMOUNTS = [1, 10, 100];

export function getBuyAmount() {
    const n = window.shopBuyAmount || 1;
    return BUY_AMOUNTS.includes(n) ? n : 1;
}

export function cycleBuyAmount() {
    const idx = BUY_AMOUNTS.indexOf(getBuyAmount());
    window.shopBuyAmount = BUY_AMOUNTS[(idx + 1) % BUY_AMOUNTS.length];
    return window.shopBuyAmount;
}

export function getBulkUnitCost(upg, hasEszterDiscount, hasKupon) {
    let cost = upg.cost;
    if (upg.id === 7 && hasEszterDiscount) cost *= 0.8;
    else if (upg.id !== 7 && hasKupon) cost *= 0.9;
    cost *= getChallengeBuildingCostMult();
    return Math.floor(cost);
}

/** Összköltség és megvásárolható darabszám (geometrikus sor, max `amount`). */
export function calcBulkPurchase(upg, amount, bikesAvailable, hasEszterDiscount, hasKupon) {
    const growth = upg.type === 'special' ? 1 : BUILDING_PRICE_GROWTH;
    let total = 0;
    let count = 0;
    let simCost = upg.cost;
    if (upg.id === 7 && hasEszterDiscount) simCost *= 0.8;
    else if (upg.id !== 7 && hasKupon) simCost *= 0.9;
    simCost *= getChallengeBuildingCostMult();

    for (let i = 0; i < amount; i++) {
        const pay = Math.floor(simCost);
        if (total + pay > bikesAvailable) break;
        total += pay;
        count++;
        if (upg.type === 'special') break;
        simCost *= growth;
    }
    return { totalCost: Math.floor(total), count };
}
