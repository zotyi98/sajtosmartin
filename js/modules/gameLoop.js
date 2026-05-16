import { GameState, saveUserProgress } from '../state.js';
import { checkEconomyCheat } from './anticheat.js';

export function startGameLoops() {
    setInterval(() => {
        window.recalcMultiplier();
        if (!window.isKitchenMeetingActive) {
            let gained = ((GameState.bps * window.multiplier) / 10);
            GameState.bikes += gained;
            GameState.lifetimeBikes += gained;
            window.updateUI();
        }
    }, 100);

    setInterval(() => {
        if (!checkEconomyCheat()) saveUserProgress();
    }, 5000);

    setInterval(() => {
        let showTime = GameState.prestigeSkills.includes(204) ? 20000 : 15000;
        const bike = Math.random() < 0.3 ? document.getElementById('rusty-bike') : document.getElementById('golden-bike');
        bike.style.top = Math.random() * 50 + 25 + "%";
        bike.style.display = 'block';
        bike.style.animation = 'none';
        bike.offsetHeight;
        bike.style.animation = `goldenFloat ${showTime / 1000}s linear forwards`;
        setTimeout(() => { bike.style.display = 'none'; }, showTime);
    }, Math.random() * 300000 + (GameState.prestigeSkills.includes(202) ? 210000 : 300000));

    setInterval(() => {
        const hp = document.getElementById('harry-potter-event');
        hp.style.display = 'block';
        hp.style.animation = 'none';
        hp.offsetHeight;
        hp.style.animation = 'hpErraticFly 10s linear forwards';
        setTimeout(() => { hp.style.display = 'none'; }, 10000);
    }, Math.random() * 300000 + 400000);

    setInterval(() => {
        const orb = document.getElementById('aimlab-event-obj');
        orb.style.top = Math.random() * 50 + 25 + "%";
        orb.style.display = 'block';
        orb.style.animation = 'none';
        orb.offsetHeight;
        orb.style.animation = `goldenFloat 15s linear forwards`;
        setTimeout(() => { orb.style.display = 'none'; }, 15000);
    }, Math.random() * 240000 + 240000);

    setInterval(() => { window.spawnPukeEvent(); }, Math.random() * 300000 + 300000);
    setInterval(() => {
        if (!window.isKitchenMeetingActive) window.triggerKitchenMeeting();
    }, Math.random() * 600000 + 600000);

    function cloudLoop() {
        let baseTime = Math.random() * 300000 + 180000;
        if (GameState.prestigeSkills.includes(201)) baseTime *= 0.7;
        setTimeout(() => { window.spawnMagicCloud(); cloudLoop(); }, baseTime);
    }
    cloudLoop();
}
