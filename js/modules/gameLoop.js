import { GameState, saveUserProgress } from '../state.js';
import { checkEconomyCheat } from './anticheat.js';
import { ensureGameStats } from './gameStats.js';

function scheduleEvent(callback, minMs, maxMs) {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    setTimeout(() => {
        if (!GameState.currentUser || document.getElementById('game-container').style.display === 'none') {
            scheduleEvent(callback, minMs, maxMs);
            return;
        }
        callback();
        scheduleEvent(callback, minMs, maxMs);
    }, delay);
}

function spawnGoldenOrRusty() {
    const showTime = GameState.prestigeSkills.includes(204) ? 20000 : 15000;
    const bike = Math.random() < 0.3 ? document.getElementById('rusty-bike') : document.getElementById('golden-bike');
    bike.style.top = Math.random() * 50 + 25 + '%';
    bike.style.display = 'block';
    bike.style.animation = 'none';
    bike.offsetHeight;
    bike.style.animation = `goldenFloat ${showTime / 1000}s linear forwards`;
    setTimeout(() => { bike.style.display = 'none'; }, showTime);
}

function spawnHarryEvent() {
    const hp = document.getElementById('harry-potter-event');
    hp.style.display = 'block';
    hp.style.animation = 'none';
    hp.offsetHeight;
    hp.style.animation = 'hpErraticFly 10s linear forwards';
    setTimeout(() => { hp.style.display = 'none'; }, 10000);
}

function spawnAimlabOrb() {
    const orb = document.getElementById('aimlab-event-obj');
    orb.style.top = Math.random() * 50 + 25 + '%';
    orb.style.display = 'block';
    orb.style.animation = 'none';
    orb.offsetHeight;
    orb.style.animation = 'goldenFloat 15s linear forwards';
    setTimeout(() => { orb.style.display = 'none'; }, 15000);
}

export function startGameLoops() {
    setInterval(() => {
        window.recalcMultiplier();
        if (!window.isKitchenMeetingActive) {
            const gained = (GameState.bps * window.multiplier) / 10;
            GameState.bikes += gained;
            GameState.lifetimeBikes += gained;
            window.updateUI();
        }
        if (GameState.currentUser && document.getElementById('game-container').style.display !== 'none') {
            ensureGameStats().playTimeMs = (ensureGameStats().playTimeMs || 0) + 100;
        }
    }, 100);

    setInterval(() => {
        if (!checkEconomyCheat()) saveUserProgress();
    }, 5000);

    const goldenMin = GameState.prestigeSkills.includes(202) ? 210000 : 300000;
    scheduleEvent(spawnGoldenOrRusty, goldenMin, goldenMin + 300000);
    scheduleEvent(spawnHarryEvent, 400000, 700000);
    scheduleEvent(spawnAimlabOrb, 240000, 480000);
    scheduleEvent(() => window.spawnPukeEvent(), 300000, 600000);
    scheduleEvent(() => {
        if (!window.isKitchenMeetingActive) window.triggerKitchenMeeting();
    }, 600000, 1200000);

    function cloudLoop() {
        let baseTime = Math.random() * 300000 + 180000;
        if (GameState.prestigeSkills.includes(201)) baseTime *= 0.7;
        setTimeout(() => {
            if (GameState.currentUser && document.getElementById('game-container').style.display !== 'none') {
                window.spawnMagicCloud();
            }
            cloudLoop();
        }, baseTime);
    }
    cloudLoop();
}
