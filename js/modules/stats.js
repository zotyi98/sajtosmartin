import { GameState } from '../state.js';
import { defaultUpgrades, extraUpgradesData } from '../data.js';
import { ensureGameStats } from './gameStats.js';
import { dedupeRealUpgrades } from '../authSession.js';
import { getPrestigeMultiplier, CLICK_FROM_BPS_RATE } from '../prestigeBalance.js';
import { getBuildingTierBonus } from './buildingTiers.js';
import { getLateBuildingEfficiency } from '../longGameBalance.js';
import { getMilkMultiplier } from './milk.js';
import { getHeavenlyBpsMult, getHeavenlyClickMult, getHeavenlyTierMult } from '../heavenlyData.js';
import { getChallengeBonuses, getChallengeBpsFromBuildingsMult } from './challenges.js';
import { getApocalypseBpsMult } from './apocalypse.js';

/** Fejléc BPS — jutalmak/offline szöveg ehhez igazodik. */
export function getHudProductionBps() {
    return GameState.bps * (window.multiplier || 1) * getApocalypseBpsMult();
}

function getBuildingLocalFactors(u) {
    const def = defaultUpgrades.find((d) => d.id === u.id);
    if (!def) return null;

    const sajtCount = GameState.upgrades.find((x) => x.id === 6)?.owned || 0;
    const hasSajtSynergy = GameState.realUpgrades.some((ru) => ru.id === 104);
    let basePower = def.power;
    if (u.id === 2 && hasSajtSynergy) basePower += 20 * sajtCount;

    let globalBpsMult = 1;
    GameState.realUpgrades.forEach((ru) => {
        const ext = extraUpgradesData.find((e) => e.id === ru.id);
        if (ext && ext.global) globalBpsMult += ext.mult - 1;
    });
    let upgMult = globalBpsMult;
    GameState.realUpgrades.forEach((ru) => {
        const ext = extraUpgradesData.find((e) => e.id === ru.id);
        if (ext && ext.targetId === u.id) upgMult += ext.mult - 1;
    });

    const tierMult = (1 + getBuildingTierBonus(u.id)) * getHeavenlyTierMult(GameState);
    const lateEff = getLateBuildingEfficiency(u.id);
    const buildingBpsMult = getChallengeBpsFromBuildingsMult();
    return { basePower, upgMult, tierMult, lateEff, buildingBpsMult };
}

function getGlobalBpsMult() {
    const prestigeMult = getPrestigeMultiplier(GameState, GameState.upgrades);
    const milkMult = getMilkMultiplier(GameState);
    const heavenlyBps = getHeavenlyBpsMult(GameState);
    const challengeBonuses = getChallengeBonuses();
    const eszterMult = GameState.upgrades.find((x) => x.id === 7)?.owned > 0 ? 2 : 1;
    return (
        prestigeMult *
        milkMult *
        heavenlyBps *
        challengeBonuses.bps *
        eszterMult *
        (window.seasonBpsMult || 1)
    );
}

function getGlobalClickMult() {
    const prestigeMult = getPrestigeMultiplier(GameState, GameState.upgrades);
    const milkMult = getMilkMultiplier(GameState);
    const heavenlyClick = getHeavenlyClickMult(GameState);
    const challengeBonuses = getChallengeBonuses();
    const eszterMult = GameState.upgrades.find((x) => x.id === 7)?.owned > 0 ? 2 : 1;
    return (
        prestigeMult *
        milkMult *
        heavenlyClick *
        challengeBonuses.click *
        eszterMult *
        (window.seasonClickMult || 1)
    );
}

/** 1 db épület vásárlásának alap BPS hozzáadása (recalculateStats előtt/után ugyanaz). */
export function getMarginalBaseBpsPerUnit(buildingId) {
    const u = GameState.upgrades.find((x) => x.id === buildingId);
    if (!u || u.type !== 'bps') return 0;
    const f = getBuildingLocalFactors(u);
    if (!f) return 0;
    const local = f.basePower * f.upgMult * f.tierMult * f.lateEff * f.buildingBpsMult;
    return local * getGlobalBpsMult();
}

/** Fejlécen látható BPS növekedés 1 db épületre. */
export function getMarginalHudBpsPerUnit(buildingId) {
    return getMarginalBaseBpsPerUnit(buildingId) * (window.multiplier || 1) * getApocalypseBpsMult();
}

export function getMarginalHudBpsGain(buildingId, count = 1) {
    return getMarginalHudBpsPerUnit(buildingId) * Math.max(1, count);
}

/** 1 db kattintós épület: tényleges kattintási erő növekedés (fejléc buff nélkül). */
export function getMarginalClickPerUnit(buildingId) {
    const u = GameState.upgrades.find((x) => x.id === buildingId);
    if (!u || u.type !== 'click') return 0;
    const f = getBuildingLocalFactors(u);
    if (!f) return 0;
    const local = f.basePower * f.upgMult * f.tierMult * f.lateEff;
    return local * getGlobalClickMult();
}

export function getMarginalHudClickPerUnit(buildingId) {
    return getMarginalClickPerUnit(buildingId) * (window.clickMultiplier || 1);
}

window.recalculateStats = function() {
    GameState.realUpgrades = dedupeRealUpgrades(GameState.realUpgrades);
    let b = 0;
    let c = 1;
    if (GameState.inventory.includes('chain')) c += 50;
    if (GameState.inventory.includes('helmet')) c += 100;

    let sajtCount = GameState.upgrades.find(u => u.id === 6)?.owned || 0;
    let hasSajtSynergy = GameState.realUpgrades.some(ru => ru.id === 104);
    let globalBpsMult = 1;
    GameState.realUpgrades.forEach(ru => {
        const ext = extraUpgradesData.find(e => e.id === ru.id);
        if (ext && ext.global) globalBpsMult += (ext.mult - 1);
    });
    const tierHeavenly = getHeavenlyTierMult(GameState);
    const buildingBpsMult = getChallengeBpsFromBuildingsMult();

    GameState.upgrades.forEach(u => {
        let basePower = defaultUpgrades.find(def => def.id === u.id).power;
        let upgMult = globalBpsMult;
        GameState.realUpgrades.forEach(ru => {
            let ext = extraUpgradesData.find(e => e.id === ru.id);
            if (ext && ext.targetId === u.id) upgMult += (ext.mult - 1);
        });
        if (u.id === 2 && hasSajtSynergy) basePower += (20 * sajtCount);
        const tierMult = (1 + getBuildingTierBonus(u.id)) * tierHeavenly;
        const lateEff = getLateBuildingEfficiency(u.id);
        const effectiveOwned = u.owned * lateEff;
        let p = (basePower * upgMult * tierMult) * effectiveOwned;
        if (u.type === 'bps') {
            p *= buildingBpsMult;
            b += p;
        }
        if (u.type === 'click') c += p;
    });

    const prestigeMult = getPrestigeMultiplier(GameState, GameState.upgrades);
    const milkMult = getMilkMultiplier(GameState);
    const heavenlyBps = getHeavenlyBpsMult(GameState);
    const heavenlyClick = getHeavenlyClickMult(GameState);
    const challengeBonuses = getChallengeBonuses();
    const eszterMult = GameState.upgrades.find(u => u.id === 7)?.owned > 0 ? 2 : 1;

    GameState.bps = b * prestigeMult * milkMult * heavenlyBps * challengeBonuses.bps * eszterMult * window.seasonBpsMult;
    let clickBase = c * prestigeMult * milkMult * heavenlyClick * challengeBonuses.click * eszterMult * window.seasonClickMult;
    if (GameState.prestigeSkills.includes(205)) clickBase += (GameState.bps * CLICK_FROM_BPS_RATE);
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
