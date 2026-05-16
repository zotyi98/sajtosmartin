import { GameState } from '../state.js';

export function createDefaultStats() {
    return {
        totalClicks: 0,
        maxBps: 0,
        events: {
            golden: 0,
            rusty: 0,
            harry: 0,
            cloud: 0,
            puke: 0,
            kitchen: 0
        },
        aimlabWins: 0,
        aimlabAttempts: 0,
        wheelSpins: 0,
        wheelJackpots: 0,
        spectateCount: 0,
        permanentClickBonus: 0
    };
}

export function ensureGameStats() {
    if (!GameState.stats || typeof GameState.stats !== 'object') {
        GameState.stats = createDefaultStats();
    }
    if (!GameState.stats.events) GameState.stats.events = createDefaultStats().events;
    return GameState.stats;
}

export function trackClick() {
    ensureGameStats().totalClicks++;
}

export function trackMaxBps(bps) {
    const s = ensureGameStats();
    if (bps > s.maxBps) s.maxBps = Math.floor(bps);
}

export function trackEvent(name) {
    const s = ensureGameStats();
    if (s.events[name] !== undefined) s.events[name]++;
}

export function trackAimlabAttempt() {
    ensureGameStats().aimlabAttempts++;
}

export function trackAimlabWin() {
    ensureGameStats().aimlabWins++;
}

export function trackWheelSpin(wonJackpot) {
    const s = ensureGameStats();
    s.wheelSpins++;
    if (wonJackpot) s.wheelJackpots++;
}

export function trackSpectate() {
    ensureGameStats().spectateCount++;
}
