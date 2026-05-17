import { GameState } from '../state.js';
import { prestigeSkillsData } from '../data.js';

export function migrateClaimedSpokesOnce() {
    if (GameState.claimedSpokes !== undefined && GameState.claimedSpokes !== null) return;

    let spent = 0;
    const counts = {};
    GameState.prestigeSkills.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
    });
    for (const id in counts) {
        const sk = prestigeSkillsData.find((s) => s.id == id);
        if (!sk) continue;
        if (sk.repeatable) {
            for (let i = 0; i < counts[id]; i++) spent += sk.baseCost * Math.pow(2, i);
        } else {
            spent += sk.baseCost;
        }
    }
    GameState.claimedSpokes = GameState.goldenSpokes + spent;
    const requiredBikes = Math.pow(GameState.claimedSpokes, 2) * 1000000;
    if (GameState.lifetimeBikes < requiredBikes) {
        GameState.lifetimeBikes = requiredBikes;
    }
}

window.calculateKullok = function() {
    const claimed = GameState.claimedSpokes ?? 0;
    const expectedTotal = Math.floor(Math.pow(GameState.lifetimeBikes / 100000000, 0.5));
    const gain = expectedTotal - claimed;
    return gain > 0 ? gain : 0;
};
