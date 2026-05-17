/**
 * Tej rendszer — achievementek után állandó % bónusz (Cookie Clicker milk).
 */
import { achievements } from '../data.js';
import { hasHeavenlyMilkBoost } from '../heavenlyData.js';

const MILK_PER_ACHIEVEMENT = 0.004;
const MILK_CAP = 0.18;

export function getMilkPercent(gameState) {
    const completed = gameState.completedAchievements?.length || 0;
    const total = achievements.length;
    const ratio = total > 0 ? completed / total : 0;
    let pct = ratio * total * MILK_PER_ACHIEVEMENT;
    pct = Math.min(pct, MILK_CAP);
    if (hasHeavenlyMilkBoost(gameState)) pct *= 1.15;
    return pct;
}

export function getMilkMultiplier(gameState) {
    return 1 + getMilkPercent(gameState);
}

export function formatMilkPercent(gameState) {
    return (getMilkPercent(gameState) * 100).toFixed(1);
}
