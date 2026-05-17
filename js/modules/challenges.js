import { GameState, saveUserProgress, showToast } from '../state.js';
import { defaultUpgrades, BUILDING_PRICE_GROWTH } from '../data.js';
import { hasHeavenlyChallengeBoost } from '../heavenlyData.js';

export const CHALLENGES = [
    {
        id: 'pure_pedal',
        name: 'Tiszta pedál',
        desc: 'Nincs arany/rozsdás bicikli. Jutalom: +3% állandó BPS.',
        bpsBonus: 0.03,
        blockGolden: true
    },
    {
        id: 'click_only',
        name: 'Egykezes birodalom',
        desc: 'Épület BPS csak 8%-a számít. Jutalom: +4% kattintás.',
        clickBonus: 0.04,
        bpsFromBuildings: 0.08
    },
    {
        id: 'spartan',
        name: 'Spartan bolt',
        desc: 'Épületek 2× drágábbak. Jutalom: +4% BPS.',
        bpsBonus: 0.04,
        buildingCostMult: 2
    },
    {
        id: 'speed_prestige',
        name: 'Gyors újjászülető',
        desc: 'Prestige 45 percen belül a kihívás indulása után. Jutalom: +1 platina.',
        platinaBonus: 1,
        timeLimitMs: 45 * 60 * 1000
    }
];

export function getChallengeBonuses() {
    const done = GameState.completedChallenges || [];
    let bps = 1;
    let click = 1;
    CHALLENGES.forEach((c) => {
        if (!done.includes(c.id)) return;
        let mult = 1;
        if (hasHeavenlyChallengeBoost(GameState)) mult = 1.25;
        if (c.bpsBonus) bps += c.bpsBonus * mult;
        if (c.clickBonus) click += c.clickBonus * mult;
    });
    return { bps, click };
}

export function getActiveChallenge() {
    const id = GameState.activeChallenge;
    if (!id) return null;
    return CHALLENGES.find((c) => c.id === id) || null;
}

export function isGoldenBlocked() {
    const c = getActiveChallenge();
    return c?.blockGolden === true;
}

export function getChallengeBuildingCostMult() {
    const c = getActiveChallenge();
    return c?.buildingCostMult || 1;
}

export function getChallengeBpsFromBuildingsMult() {
    const c = getActiveChallenge();
    return c?.bpsFromBuildings ?? 1;
}

window.openChallengesModal = function () {
    const modal = document.getElementById('challenges-modal');
    if (!modal) return;
    const list = document.getElementById('challenges-list');
    if (!list) return;
    list.innerHTML = '';
    const done = GameState.completedChallenges || [];
    CHALLENGES.forEach((c) => {
        const completed = done.includes(c.id);
        const active = GameState.activeChallenge === c.id;
        const row = document.createElement('div');
        row.className = 'challenge-row ' + (completed ? 'done' : (active ? 'active' : ''));
        let btn = completed
            ? '<span class="challenge-done">✓ Teljesítve</span>'
            : active
                ? '<button type="button" class="challenge-abandon">Feladás</button>'
                : `<button type="button" class="challenge-start">Indítás</button>`;
        row.innerHTML = `<b>${c.name}</b><br><span>${c.desc}</span><br>${btn}`;
        if (!completed && !active) {
            row.querySelector('.challenge-start')?.addEventListener('click', () => startChallenge(c.id));
        }
        if (active) {
            row.querySelector('.challenge-abandon')?.addEventListener('click', () => abandonChallenge());
        }
        list.appendChild(row);
    });
    modal.style.display = 'flex';
};

function startChallenge(id) {
    if (GameState.activeChallenge) {
        showToast('Előbb add fel az aktív kihívást!');
        return;
    }
    GameState.activeChallenge = id;
    GameState.challengeStartedAt = Date.now();
    if (id === 'speed_prestige') GameState.challengePrestigeBaseline = GameState.prestigeCount || 0;
    saveUserProgress();
    showToast('Kihívás elindítva!');
    window.openChallengesModal();
    window.updateUI();
}

function abandonChallenge() {
    GameState.activeChallenge = null;
    GameState.challengeStartedAt = 0;
    saveUserProgress();
    showToast('Kihívás feladva.');
    window.openChallengesModal();
}

export function checkChallengeCompletion(trigger) {
    const id = GameState.activeChallenge;
    if (!id) return;
    const c = CHALLENGES.find((x) => x.id === id);
    if (!c) return;
    const done = GameState.completedChallenges || [];
    if (done.includes(id)) return;

    if (id === 'click_only' && trigger === 'building_bps_ok') {
        /* teljesül, ha játékos eléri a 1M lifetime-et kihívás alatt */
        if ((GameState.lifetimeBikes || 0) < 1e6) return;
    }
    if (id === 'spartan' && trigger === 'building_bought') {
        const total = GameState.upgrades.reduce((s, u) => s + (u.owned || 0), 0);
        if (total < 30) return;
    }
    if (id === 'speed_prestige' && trigger === 'prestige') {
        const elapsed = Date.now() - (GameState.challengeStartedAt || 0);
        if (elapsed > (c.timeLimitMs || 0)) return;
        if ((GameState.prestigeCount || 0) <= (GameState.challengePrestigeBaseline || 0)) return;
    }

    if (trigger === 'golden_caught' && c.blockGolden) {
        failChallenge('Megszegted: elkapott arany/rozsdás bicikli!');
        return;
    }
    if (trigger === 'prestige' && id !== 'speed_prestige') return;
    if (trigger === 'prestige' && id === 'speed_prestige') {
        completeChallenge(c);
        return;
    }
    if (trigger === 'golden_caught') return;

    if (id === 'pure_pedal' && trigger === 'milestone') {
        if ((GameState.stats?.events?.golden || 0) > 0) return;
        if ((GameState.lifetimeBikes || 0) < 5e7) return;
        completeChallenge(c);
    }
    if (id === 'click_only' && trigger === 'milestone' && (GameState.lifetimeBikes || 0) >= 1e8) {
        completeChallenge(c);
    }
    if (id === 'spartan' && trigger === 'milestone') {
        const total = GameState.upgrades.reduce((s, u) => s + (u.owned || 0), 0);
        if (total >= 40 && (GameState.lifetimeBikes || 0) >= 2e8) completeChallenge(c);
    }
}

function failChallenge(msg) {
    GameState.activeChallenge = null;
    GameState.challengeStartedAt = 0;
    saveUserProgress();
    showToast(msg);
}

function completeChallenge(c) {
    if (!GameState.completedChallenges) GameState.completedChallenges = [];
    if (!GameState.completedChallenges.includes(c.id)) {
        GameState.completedChallenges.push(c.id);
    }
    if (c.platinaBonus) GameState.platinaSpokes = (GameState.platinaSpokes || 0) + c.platinaBonus;
    GameState.activeChallenge = null;
    GameState.challengeStartedAt = 0;
    saveUserProgress();
    showToast(`🏆 Kihívás teljesítve: ${c.name}!`);
    window.recalculateStats();
    window.updateUI();
}

export function initChallengeChecker() {
    setInterval(() => {
        if (!GameState.activeChallenge) return;
        checkChallengeCompletion('milestone');
    }, 15000);
}
