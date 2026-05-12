import { GameState, showToast, db } from '../state.js';
import { ref, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let recentClicks = [];
let lastEconomyCheck = { bikes: 0, time: Date.now() };

// --- TITKOS LOGOLÓ FUNKCIÓ ---
function logCheater(reason, details) {
    if (!GameState.currentUser) return;
    
    // Feltölti az adatbázis 'admin/cheatLogs' mappájába a csaló adatait
    const logRef = ref(db, 'admin/cheatLogs');
    push(logRef, {
        user: GameState.currentUser,
        reason: reason,
        details: details,
        timestamp: Date.now(),
        bikesAtTime: GameState.bikes
    });
    console.warn(`[ANTI-CHEAT] ${reason} - ${details}`);
}

// 1. Autoclicker szűrés
export function checkClickCheat() {
    const now = Date.now();
    recentClicks = recentClicks.filter(time => now - time < 1000); 
    
    if (recentClicks.length >= 15) {
        document.getElementById('game-world').classList.add('world-shake');
        setTimeout(() => { document.getElementById('game-world').classList.remove('world-shake'); }, 200);
        showToast("🤖 Autoclicker gyanú!\nTúl gyorsan kattintasz, a rendszer blokkolta a termelést!");
        
        // Csak akkor logoljuk be, ha pont elérte a határt (ne spamelje tele a logot)
        if (recentClicks.length === 15) {
            logCheater("Autoclicker", `${recentClicks.length} kattintás 1 másodperc alatt.`);
        }
        return true; 
    }
    
    recentClicks.push(now);
    return false; 
}

// 2. Időutazás (óra átállítás) szűrés
export function checkTimeCheat(lastSavedTime) {
    let secondsOffline = (Date.now() - lastSavedTime) / 1000;
    
    if (secondsOffline < 0) {
        showToast("⏳ Hékás! Visszamentél az időben? A gép órája trükkös!");
        logCheater("Időutazás", `Negatív offline idő: ${secondsOffline} mp`);
        return 0; 
    } else if (secondsOffline > 86400) { 
        showToast("⏳ Maximum 24 órányi offline termelést kaphatsz meg egyszerre!");
        logCheater("Időutazás", `Túl sok offline idő: ${secondsOffline} mp (Visszavágva 24 órára)`);
        return 86400; 
    }
    
    return secondsOffline; 
}

// 3. ÚJ: Gazdaság Szkennelés (Memória Hack / Cheat Engine ellen)
export function checkEconomyCheat() {
    // Első betöltéskor csak megjegyezzük az értékeket
    if (lastEconomyCheck.bikes === 0 || GameState.bikes === 0) {
        lastEconomyCheck.bikes = GameState.bikes;
        lastEconomyCheck.time = Date.now();
        return false;
    }

    let timeDiff = (Date.now() - lastEconomyCheck.time) / 1000;
    if (timeDiff < 1) return false;

    let bikeDiff = GameState.bikes - lastEconomyCheck.bikes;
    
    // Mivel a Szerencsekerék max 100x-ozhatja a pénzt, az AimLab pedig 10x-ezheti,
    // beállítunk egy biztonságos, de szigorú plafont: 150x szorzó + egy kis BPS alapú puffer.
    let maxAllowedBikes = (lastEconomyCheck.bikes * 150) + (GameState.bps * 100000) + 1000000;

    // Ha a növekedés pozitív, DE brutálisan átlépi a fizikai plafont:
    if (bikeDiff > 0 && GameState.bikes > maxAllowedBikes && timeDiff <= 6) {
        showToast("🛑 ILLEGÁLIS MENNYISÉGŰ BICIKLI ÉSZLELVE!\nA gép blokkolta a tranzakciót és visszaállította a számládat!");
        
        logCheater("Cheat Engine / Memória Hack", `Irreális ugrás: ${lastEconomyCheck.bikes} -> ${GameState.bikes} (${timeDiff} mp alatt)`);
        
        // Visszaállítjuk a játékost a legutóbbi, tiszta állapotába (Büntetés)
        GameState.bikes = lastEconomyCheck.bikes;
        return true; // Volt csalás
    }

    // Ha minden tiszta, elmentjük a mostani állapotot a következő ellenőrzéshez
    lastEconomyCheck.bikes = GameState.bikes;
    lastEconomyCheck.time = Date.now();
    return false;
}