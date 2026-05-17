import { GameState, showToast, db } from '../state.js';
import { ref, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let recentClicks = [];
let lastEconomyCheck = { bikes: 0, time: Date.now() };
let economyPauseUntil = 0;

function logCheater(reason, details) {
    if (!GameState.currentUser) return;

    push(ref(db, 'reports/cheatLogs'), {
        user: GameState.currentUser,
        reason,
        details,
        timestamp: Date.now(),
        bikesAtTime: GameState.bikes
    });
    console.warn(`[ANTI-CHEAT] ${reason} - ${details}`);
}

export function pauseEconomyCheck(ms = 8000) {
    economyPauseUntil = Date.now() + ms;
    lastEconomyCheck.bikes = GameState.bikes;
    lastEconomyCheck.time = Date.now();
}

export function checkClickCheat() {
    const now = Date.now();
    recentClicks = recentClicks.filter(time => now - time < 1000);

    if (recentClicks.length >= 15) {
        document.getElementById('game-world').classList.add('world-shake');
        setTimeout(() => { document.getElementById('game-world').classList.remove('world-shake'); }, 200);
        showToast("🤖 Autoclicker gyanú!\nTúl gyorsan kattintasz, a rendszer blokkolta a termelést!");

        if (recentClicks.length === 15) {
            logCheater("Autoclicker", `${recentClicks.length} kattintás 1 másodperc alatt.`);
        }
        return true;
    }

    recentClicks.push(now);
    return false;
}

export function checkTimeCheat(lastSavedTime) {
    const secondsOffline = (Date.now() - lastSavedTime) / 1000;

    if (secondsOffline < 0) {
        showToast("⏳ Hékás! Visszamentél az időben? A gép órája trükkös!");
        logCheater("Időutazás", `Negatív offline idő: ${secondsOffline} mp`);
        return 0;
    }
    if (secondsOffline > 86400) {
        showToast("⏳ Maximum 24 órányi offline termelést kaphatsz meg egyszerre!");
        logCheater("Időutazás", `Túl sok offline idő: ${secondsOffline} mp (Visszavágva 24 órára)`);
        return 86400;
    }

    return secondsOffline;
}

export function checkEconomyCheat() {
    if (Date.now() < economyPauseUntil) {
        lastEconomyCheck.bikes = GameState.bikes;
        lastEconomyCheck.time = Date.now();
        return false;
    }

    if (lastEconomyCheck.bikes === 0 || GameState.bikes === 0) {
        lastEconomyCheck.bikes = GameState.bikes;
        lastEconomyCheck.time = Date.now();
        return false;
    }

    const timeDiff = (Date.now() - lastEconomyCheck.time) / 1000;
    if (timeDiff < 1) return false;

    const bikeDiff = GameState.bikes - lastEconomyCheck.bikes;
    const maxAllowedBikes = (lastEconomyCheck.bikes * 150) + (GameState.bps * 100000) + 1000000;

    if (bikeDiff > 0 && GameState.bikes > maxAllowedBikes && timeDiff <= 6) {
        showToast("🛑 ILLEGÁLIS MENNYISÉGŰ BICIKLI ÉSZLELVE!\nA gép blokkolta a tranzakciót és visszaállította a számládat!");

        logCheater("Cheat Engine / Memória Hack", `Irreális ugrás: ${lastEconomyCheck.bikes} -> ${GameState.bikes} (${timeDiff} mp alatt)`);

        GameState.bikes = lastEconomyCheck.bikes;
        return true;
    }

    lastEconomyCheck.bikes = GameState.bikes;
    lastEconomyCheck.time = Date.now();
    return false;
}
