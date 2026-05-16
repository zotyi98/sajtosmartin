import { GameState } from '../state.js';
import { prestigeSkillsData } from '../data.js';

window.calculateKullok = function() {
    if (GameState.claimedSpokes === undefined) {
        let spent = 0;
        let counts = {};
        GameState.prestigeSkills.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
        for (let id in counts) {
            let sk = prestigeSkillsData.find(s => s.id == id);
            if (sk) {
                if (sk.repeatable) {
                    for (let i = 0; i < counts[id]; i++) spent += sk.baseCost * Math.pow(2, i);
                } else {
                    spent += sk.baseCost;
                }
            }
        }
        GameState.claimedSpokes = GameState.goldenSpokes + spent;
        let requiredBikes = Math.pow(GameState.claimedSpokes, 2) * 1000000;
        if (GameState.lifetimeBikes < requiredBikes) {
            GameState.lifetimeBikes = requiredBikes;
        }
    }

    let expectedTotal = Math.floor(Math.pow(GameState.lifetimeBikes / 100000000, 0.5));
    let gain = expectedTotal - GameState.claimedSpokes;
    return gain > 0 ? gain : 0;
};
