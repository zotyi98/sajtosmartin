/**
 * Felemelkedés egyensúly — ~5–8 órás teljes játékidő célhoz.
 */

export const KULLO_DIVISOR = 12_000_000_000;
export const KULLO_POWER = 0.32;

export const SPOKE_RATE = 0.0025;
export const SPOKE_RATE_MAGNET = 0.0035;
export const SPOKE_BONUS_CAP = 0.38;

export const CHAIN_BONUS_PER_LEVEL = 0.22;
export const DARK_MATTER_PER_LEVEL = 0.018;
export const DARK_MATTER_MAX_LEVEL = 15;
export const SUPPLY_PER_BUILDING = 0.008;
export const SUPPLY_CAP = 0.1;
export const CLICK_FROM_BPS_RATE = 0.0012;

export function calculateKulloTotal(lifetimeBikes) {
    if (!lifetimeBikes || lifetimeBikes < KULLO_DIVISOR) return 0;
    return Math.floor(Math.pow(lifetimeBikes / KULLO_DIVISOR, KULLO_POWER));
}

export function getSpokeBonus(goldenSpokes, hasMagnetSkill) {
    const rate = hasMagnetSkill ? SPOKE_RATE_MAGNET : SPOKE_RATE;
    return Math.min(goldenSpokes * rate, SPOKE_BONUS_CAP);
}

export function getPrestigeMultiplier(gameState, upgrades) {
    const skills = gameState.prestigeSkills || [];
    const goldenSpokes = gameState.goldenSpokes || 0;
    const upgradeList = upgrades || gameState.upgrades || [];

    const spokeBonus = getSpokeBonus(goldenSpokes, skills.includes(304));
    const tree301 = Math.min(skills.filter((id) => id === 301).length, 3);
    const tree302 = Math.min(skills.filter((id) => id === 302).length, 3);
    const treeBonus = tree301 * CHAIN_BONUS_PER_LEVEL + tree302 * CHAIN_BONUS_PER_LEVEL;
    const darkCount = Math.min(
        skills.filter((id) => id === 404).length,
        DARK_MATTER_MAX_LEVEL
    );
    const infiniteBonus = darkCount * DARK_MATTER_PER_LEVEL;
    const distinctBuildings = upgradeList.filter((u) => u.owned > 0 && u.type !== 'special').length;
    const supplyBonus = skills.includes(210)
        ? Math.min(distinctBuildings * SUPPLY_PER_BUILDING, SUPPLY_CAP)
        : 0;

    return 1 + spokeBonus + treeBonus + supplyBonus + infiniteBonus;
}

export function formatSpokeBonusPercent(goldenSpokes, hasMagnetSkill) {
    return (getSpokeBonus(goldenSpokes, hasMagnetSkill) * 100).toFixed(1);
}
