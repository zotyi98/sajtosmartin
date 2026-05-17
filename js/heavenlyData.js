/**
 * Mennyei (Platina Küllő) fejlesztések — 2. prestige réteg, állandó bónuszok.
 */
export const heavenlyUpgradesData = [
    { id: 'h_bps1', name: 'Égi lánc', desc: '+2% globális BPS / szint (max 5).', baseCost: 1, repeatable: true, maxLevel: 5, multPerLevel: 0.02, kind: 'bps' },
    { id: 'h_bps2', name: 'Platina kerék', desc: '+3% globális BPS / szint (max 3).', baseCost: 4, repeatable: true, maxLevel: 3, multPerLevel: 0.03, kind: 'bps', req: 'h_bps1' },
    { id: 'h_click1', name: 'Ujjbegy platinája', desc: '+3% kattintás / szint (max 4).', baseCost: 2, repeatable: true, maxLevel: 4, multPerLevel: 0.03, kind: 'click' },
    { id: 'h_offline', name: 'Álmodó bringás', desc: '+5% offline termelés / szint (max 3).', baseCost: 3, repeatable: true, maxLevel: 3, multPerLevel: 0.05, kind: 'offline' },
    { id: 'h_golden', name: 'Aranyeső mágnes', desc: 'Aranybicikli buff +8% / szint (max 3).', baseCost: 5, repeatable: true, maxLevel: 3, multPerLevel: 0.08, kind: 'golden' },
    { id: 'h_tier', name: 'Épület szint turbo', desc: 'Tier bónuszok +10% hatékonyabbak / szint (max 2).', baseCost: 8, repeatable: true, maxLevel: 2, multPerLevel: 0.1, kind: 'tier' },
    { id: 'h_milk', name: 'Tejcsarnok', desc: 'Tej bónusz +15% erősebb.', baseCost: 12, repeatable: false, kind: 'milkBoost' },
    { id: 'h_challenge', name: 'Kihívás mester', desc: 'Teljesített kihívások bónusza +25%.', baseCost: 15, repeatable: false, kind: 'challengeBoost', req: 'h_bps2' }
];

export function getHeavenlyLevel(gameState, upgradeId) {
    const owned = gameState.heavenlyUpgrades || {};
    return owned[upgradeId] || 0;
}

export function getHeavenlyBpsMult(gameState) {
    let m = 1;
    heavenlyUpgradesData.forEach((h) => {
        if (h.kind !== 'bps') return;
        const lvl = getHeavenlyLevel(gameState, h.id);
        if (lvl > 0) m += lvl * (h.multPerLevel || 0);
    });
    return m;
}

export function getHeavenlyClickMult(gameState) {
    let m = 1;
    heavenlyUpgradesData.forEach((h) => {
        if (h.kind !== 'click') return;
        const lvl = getHeavenlyLevel(gameState, h.id);
        if (lvl > 0) m += lvl * (h.multPerLevel || 0);
    });
    return m;
}

export function getHeavenlyOfflineMult(gameState) {
    let m = 1;
    heavenlyUpgradesData.forEach((h) => {
        if (h.kind !== 'offline') return;
        const lvl = getHeavenlyLevel(gameState, h.id);
        if (lvl > 0) m += lvl * (h.multPerLevel || 0);
    });
    return m;
}

export function getHeavenlyGoldenMult(gameState) {
    let m = 1;
    heavenlyUpgradesData.forEach((h) => {
        if (h.kind !== 'golden') return;
        const lvl = getHeavenlyLevel(gameState, h.id);
        if (lvl > 0) m += lvl * (h.multPerLevel || 0);
    });
    return m;
}

export function getHeavenlyTierMult(gameState) {
    let m = 1;
    heavenlyUpgradesData.forEach((h) => {
        if (h.kind !== 'tier') return;
        const lvl = getHeavenlyLevel(gameState, h.id);
        if (lvl > 0) m += lvl * (h.multPerLevel || 0);
    });
    return m;
}

export function hasHeavenlyMilkBoost(gameState) {
    return getHeavenlyLevel(gameState, 'h_milk') > 0;
}

export function hasHeavenlyChallengeBoost(gameState) {
    return getHeavenlyLevel(gameState, 'h_challenge') > 0;
}
