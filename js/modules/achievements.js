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

function countMilestoneUpgrades() {
    return GameState.realUpgrades.filter((ru) => (ru.id || 0) >= 201).length;
}

function formatNum(n) {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + ' T';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + ' Mrd';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + ' M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + ' e';
    return Math.floor(n).toLocaleString('hu-HU');
}

function progressFromValues(current, target) {
    const pct = target > 0 ? Math.min(100, Math.floor((current / target) * 100)) : 0;
    return {
        progressText: `${formatNum(current)} / ${formatNum(target)}`,
        progressPercent: pct
    };
}

export function describeAchievementReward(reward) {
    if (!reward?.type) return '—';
    switch (reward.type) {
        case 'bikes': return `+${(reward.amount || 0).toLocaleString('hu-HU')} 🚲`;
        case 'goldenSpokes': return `+${reward.amount || 1} ✨ Küllő`;
        case 'buff': return `${reward.mult || 2}x buff (${Math.round((reward.durationMs || 60000) / 1000)} mp)`;
        case 'clickBonus': return `+${reward.amount || 1} állandó kattintás`;
        case 'inventory': return 'Felszerelés';
        case 'cosmetic': return 'Kozmetika';
        case 'instantProduction': return `${reward.seconds || 60} mp azonnali termelés`;
        default: return reward.type;
    }
}

export function getAchievementStatus(ach) {
    const done = getCompletedSet().has(ach.id) || ach.done;
    if (done) {
        return { done: true, progressText: 'Teljesítve ✓', progressPercent: 100 };
    }
    const s = ensureGameStats();
    let current = 0;
    let target = ach.check.value || 1;

    switch (ach.check.type) {
        case 'lifetimeBikes': current = GameState.lifetimeBikes; break;
        case 'bikes': current = GameState.bikes; break;
        case 'bps': current = GameState.bps; break;
        case 'maxBps': current = s.maxBps; break;
        case 'prestigeCount': current = GameState.prestigeCount || 0; break;
        case 'goldenSpokes': current = GameState.goldenSpokes || 0; break;
        case 'totalClicks': current = s.totalClicks; break;
        case 'buildingOwned':
            current = getUpgradeOwned(ach.check.buildingId);
            break;
        case 'buildingTypes':
            current = countDistinctBuildingTypes();
            break;
        case 'totalBuildings':
            current = countBuildingsOwned();
            break;
        case 'extraUpgrades':
            current = GameState.realUpgrades.length;
            break;
        case 'prestigeSkills':
            current = GameState.prestigeSkills.length;
            break;
        case 'inventory':
            current = GameState.inventory.includes(ach.check.itemId) ? 1 : 0;
            target = 1;
            break;
        case 'cosmetic':
            current = GameState.cosmetics.includes(ach.check.id) ? 1 : 0;
            target = 1;
            break;
        case 'eventTotal':
            current = s.events[ach.check.event] || 0;
            break;
        case 'eventsTotal':
            current = Object.values(s.events).reduce((a, b) => a + b, 0);
            break;
        case 'aimlabWins': current = s.aimlabWins; break;
        case 'wheelJackpots': current = s.wheelJackpots; break;
        case 'playMinutes':
            current = Math.floor((s.playTimeMs || 0) / 60000);
            break;
        case 'spectate': current = s.spectateCount; break;
        case 'ascensionCount': current = GameState.ascensionCount || 0; break;
        case 'challengesCompleted': current = (GameState.completedChallenges || []).length; break;
        case 'achievementsCompleted': current = getCompletedSet().size; break;
        case 'milestoneUpgrades': current = countMilestoneUpgrades(); break;
        case 'martinRest': current = GameState.martinRestPurchased ? 1 : 0; target = 1; break;
        default:
            return { done: false, progressText: '—', progressPercent: 0 };
    }

    const { progressText, progressPercent } = progressFromValues(current, target);
    return { done: false, progressText, progressPercent };
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
            const playedMin = (ensureGameStats().playTimeMs || 0) / 60000;
            return playedMin >= ach.check.value;
        }
        case 'spectate':
            return s.spectateCount >= ach.check.value;
        case 'ascensionCount':
            return (GameState.ascensionCount || 0) >= ach.check.value;
        case 'challengesCompleted':
            return (GameState.completedChallenges || []).length >= ach.check.value;
        case 'achievementsCompleted':
            return getCompletedSet().size >= ach.check.value;
        case 'milestoneUpgrades':
            return countMilestoneUpgrades() >= ach.check.value;
        case 'martinRest':
            return !!GameState.martinRestPurchased;
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
        if (window.recalculateStats) window.recalculateStats();
        if (window.updateUI) window.updateUI();
        if (window.refreshPlayerPanel) window.refreshPlayerPanel();
        saveUserProgress();
    }
}

export function initAchievementChecker() {
    setInterval(() => {
        if (!GameState.currentUser || document.getElementById('game-container').style.display === 'none') return;
        tryUnlockAchievements();
    }, 1000);
}
