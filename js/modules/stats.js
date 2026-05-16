import { GameState } from '../state.js';
import { defaultUpgrades, extraUpgradesData } from '../data.js';
import { ensureGameStats } from './gameStats.js';

window.recalculateStats = function() {
    let b = 0;
    let c = 1;
    if (GameState.inventory.includes('chain')) c += 50;
    if (GameState.inventory.includes('helmet')) c += 100;

    let sajtCount = GameState.upgrades.find(u => u.id === 6)?.owned || 0;
    let hasSajtSynergy = GameState.realUpgrades.some(ru => ru.id === 104);

    GameState.upgrades.forEach(u => {
        let basePower = defaultUpgrades.find(def => def.id === u.id).power;
        let upgMult = 1;
        GameState.realUpgrades.forEach(ru => {
            let ext = extraUpgradesData.find(e => e.id === ru.id);
            if (ext && ext.targetId === u.id) upgMult += (ext.mult - 1);
        });
        if (u.id === 2 && hasSajtSynergy) basePower += (20 * sajtCount);
        let p = (basePower * upgMult) * u.owned;
        if (u.type === "bps") b += p;
        if (u.type === "click") c += p;
    });

    let doubleCount301 = GameState.prestigeSkills.filter(id => id === 301).length;
    let doubleCount302 = GameState.prestigeSkills.filter(id => id === 302).length;
    let darkMatterCount = GameState.prestigeSkills.filter(id => id === 404).length;
    let distinctBuildings = GameState.upgrades.filter(u => u.owned > 0 && u.type !== 'special').length;

    let spokeBonus = GameState.prestigeSkills.includes(304) ? (GameState.goldenSpokes * 0.02) : (GameState.goldenSpokes * 0.01);
    let treeBonus = (doubleCount301 * 1.0) + (doubleCount302 * 1.0);
    let supplyBonus = GameState.prestigeSkills.includes(210) ? (distinctBuildings * 0.02) : 0;
    let infiniteBonus = darkMatterCount * 0.10;

    let prestigeMult = 1 + spokeBonus + treeBonus + supplyBonus + infiniteBonus;
    let eszterMult = GameState.upgrades.find(u => u.id === 7)?.owned > 0 ? 2 : 1;

    GameState.bps = b * prestigeMult * eszterMult * window.seasonBpsMult;
    let clickBase = c * prestigeMult * eszterMult * window.seasonClickMult;
    if (GameState.prestigeSkills.includes(205)) clickBase += (GameState.bps * 0.01);
    clickBase += ensureGameStats().permanentClickBonus || 0;
    GameState.clickPower = Math.max(1, clickBase);
    ensureGameStats().maxBps = Math.max(ensureGameStats().maxBps || 0, Math.floor(GameState.bps));
};

window.recalcMultiplier = function() {
    let eb = 1;
    let ec = 1;
    let bz = false;
    let cz = false;
    let texts = [];
    let color = "white";
    let now = Date.now();
    window.activeBuffs = window.activeBuffs.filter(b => b.endTime > now);

    window.activeBuffs.forEach(b => {
        if (b.target === 'both') {
            if (b.mult === 0) { bz = true; cz = true; }
            else { eb += (b.mult - 1); ec += (b.mult - 1); }
        } else if (b.target === 'click') {
            if (b.mult === 0) cz = true;
            else ec += (b.mult - 1);
        } else {
            if (b.mult === 0) bz = true;
            else eb += (b.mult - 1);
        }
        texts.push(b.text);
        color = b.color;
    });

    window.multiplier = bz ? 0 : Math.max(1, eb);
    window.clickMultiplier = cz ? 0 : Math.max(1, ec);

    const infoDiv = document.getElementById('multiplier-info');
    if (window.activeBuffs.length > 0) {
        infoDiv.innerHTML = texts.join('<br>');
        infoDiv.style.color = color;
        infoDiv.style.display = 'block';
        if (window.multiplier > 1 || window.clickMultiplier > 1) {
            document.getElementById('game-world').classList.add('world-golden');
        }
    } else {
        infoDiv.style.display = 'none';
        document.getElementById('game-world').classList.remove('world-golden');
    }
};
