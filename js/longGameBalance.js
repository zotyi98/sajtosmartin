/**
 * Hosszú játékidő (~5–8+ óra): lassabb prestige, drágább late game,
 * épület tier kötelező hatás late-en, prestige kapuk.
 */

import { GameState } from './state.js';

/** Épület vásárlás: min. prestige count (0 = nincs kapu) */
export const BUILDING_PRESTIGE_GATE = {
    7: 1,   // Eszter
    21: 1,  // Űrállomás
    22: 2,  // Időgép
    23: 3,  // Multiverzum
    24: 4,
    25: 5,
    26: 6,
    27: 7,
    28: 8
};

/** Late épület: tier nélküli hatékonyság (0–1). tier szintek száma növeli. */
const LATE_TIER_STEP = 0.14;

export function getBuildingPrestigeRequired(buildingId) {
    return BUILDING_PRESTIGE_GATE[buildingId] ?? 0;
}

export function canPurchaseBuilding(buildingId) {
    const req = getBuildingPrestigeRequired(buildingId);
    return (GameState.prestigeCount || 0) >= req;
}

export function getPurchasedTierCountForBuilding(buildingId) {
    const tiers = GameState.purchasedBuildingTiers || [];
    return tiers.filter((tid) => String(tid).startsWith(`bt_${buildingId}_`)).length;
}

/** Late épületek tier nélkül gyengék — tier vásárlásnak legyen értelme */
export function getLateBuildingEfficiency(buildingId) {
    if (buildingId < 17) return 1;
    const tiers = getPurchasedTierCountForBuilding(buildingId);
    if (buildingId < 20) {
        return Math.min(1, 0.3 + tiers * LATE_TIER_STEP);
    }
    if (buildingId < 23) {
        return Math.min(1, 0.18 + tiers * (LATE_TIER_STEP + 0.02));
    }
    return Math.min(1, 0.08 + tiers * (LATE_TIER_STEP + 0.04));
}

export function getBuildingUnlockHint(buildingId) {
    const req = getBuildingPrestigeRequired(buildingId);
    if (req <= 0) return '';
    if ((GameState.prestigeCount || 0) >= req) return '';
    return `🔒 ${req}. újraszületés kell`;
}

/** Offline: max 2h teljes, 2–8h 25%, 8h+ semmi */
export function getOfflineSecondsMultiplier(secondsAway) {
    const FULL = 2 * 3600;
    const PARTIAL = 8 * 3600;
    if (secondsAway <= FULL) return 1;
    if (secondsAway <= PARTIAL) {
        const extra = secondsAway - FULL;
        const partialPart = extra * 0.25;
        return (FULL + partialPart) / secondsAway;
    }
    return (FULL + (PARTIAL - FULL) * 0.25) / secondsAway;
}

/** Extra fejlesztés ár szorzó */
export const EXTRA_UPGRADE_COST_MULT = 2.2;

/** Épület tier költség szorzó (data.js-ben is emelve) */
export const TIER_GLOBAL_COST_MULT = 1.35;
