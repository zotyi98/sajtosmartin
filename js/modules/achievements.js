import { GameState, saveUserProgress, showToast } from '../state.js';
import { achievements } from '../data.js';
import { ensureGameStats } from './gameStats.js';
import { applyAchievementReward, formatRewardToast } from './achievementRewards.js';

const LEGACY_LIFETIME_IDS = ['prod_first', 'prod_century', 'prod_maniac', 'prod_dealer', 'prod_tycoon'];

function getCompletedSet() {
    if (!Array.isArray(GameState.completedAchievements)) {
        GameState.completedAchievements = [];
    }
    return new Set(GameState.completedAchievements);
}

function markCompleted(id) {
    const set = getCompletedSet();
    set.add(id);
    GameState.completedAchievements = [...set];
    const ach = achievements.find(a => a.id === id);
    if (ach) ach.done = true;
}

function migrateLegacyAchievements(parsed) {
    if (!Array.isArray(parsed.achievements)) return;
    if (parsed.achievements.length > 0 && typeof parsed.achievements[0] === 'boolean') {
        parsed.achievements.forEach((done, i) => {
            if (done && LEGACY_LIFETIME_IDS[i]) markCompleted(LEGACY_LIFETIME_IDS[i]);
        });
    }
}

export function initAchievementsFromSave(parsed) {
    achievements.forEach(a => { a.done = false; });
    const set = getCompletedSet();
    if (parsed?.completedAchievements) {
        parsed.completedAchievements.forEach(id => {
            set.add(id);
            const ach = achievements.find(a => a.id === id);
            if (ach) ach.done = true;
        });
        GameState.completedAchievements = [...set];
    }
    migrateLegacyAchievements(parsed || {});
    achievements.forEach(a => {
        if (getCompletedSet().has(a.id)) a.done = true;
    });
}

function countBuildingsOwned() {
    return GameState.upgrades.reduce((sum, u) => sum + (u.owned || 0), 0);
}

function countDistinctBuildingTypes() {
    return GameState.upgrades.filter(u => u.owned > 0 && u.type !== 'special').length;
}

function getUpgradeOwned(id) {
    return GameState.upgrades.find(u => u.id === id)?.owned || 0;
}

function checkAchievement(ach) {
    const s = ensureGameStats();
    switch (ach.check.type) {
        case 'lifetimeBikes':
            return GameState.lifetimeBikes >= ach.check.value;
        case 'bikes':
            return GameState.bikes >= ach.check.value;
        case 'bps':
            return GameState.bps >= ach.check.value;
        case 'maxBps':
            return s.maxBps >= ach.check.value;
        case 'prestigeCount':
            return (GameState.prestigeCount || 0) >= ach.check.value;
        case 'goldenSpokes':
            return (GameState.goldenSpokes || 0) >= ach.check.value;
        case 'totalClicks':
            return s.totalClicks >= ach.check.value;
        case 'buildingOwned':
            return getUpgradeOwned(ach.check.buildingId) >= ach.check.value;
        case 'buildingTypes':
            return countDistinctBuildingTypes() >= ach.check.value;
        case 'totalBuildings':
            return countBuildingsOwned() >= ach.check.value;
        case 'extraUpgrades':
            return GameState.realUpgrades.length >= ach.check.value;
        case 'prestigeSkills':
            return GameState.prestigeSkills.length >= ach.check.value;
        case 'inventory':
            return GameState.inventory.includes(ach.check.itemId);
        case 'cosmetic':
            return GameState.cosmetics.includes(ach.check.id);
        case 'eventTotal': {
            const key = ach.check.event;
            return (s.events[key] || 0) >= ach.check.value;
        }
        case 'eventsTotal': {
            const sum = Object.values(s.events).reduce((a, b) => a + b, 0);
            return sum >= ach.check.value;
        }
        case 'aimlabWins':
            return s.aimlabWins >= ach.check.value;
        case 'wheelJackpots':
            return s.wheelJackpots >= ach.check.value;
        case 'playMinutes': {
            if (!GameState.firstJoined) return false;
            return (Date.now() - GameState.firstJoined) / 60000 >= ach.check.value;
        }
        case 'spectate':
            return s.spectateCount >= ach.check.value;
        default:
            return false;
    }
}

function tryUnlockAchievements() {
    const completed = getCompletedSet();
    let changed = false;

    achievements.forEach(ach => {
        if (completed.has(ach.id) || ach.done) return;
        if (!checkAchievement(ach)) return;

        markCompleted(ach.id);
        changed = true;
        const rewardText = applyAchievementReward(ach.reward, ach.name);
        showToast(formatRewardToast(ach, rewardText));
        if (window.spawnConfetti && ach.reward?.type !== 'buff') window.spawnConfetti();
    });

    if (changed) {
        if (window.updateUI) window.updateUI();
        saveUserProgress();
    }
}

export function initAchievementChecker() {
    setInterval(() => {
        if (!GameState.currentUser || document.getElementById('game-container').style.display === 'none') return;
        tryUnlockAchievements();
    }, 1000);
}
