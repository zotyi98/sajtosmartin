import { GameState, db, showToast } from '../state.js';
import { defaultUpgrades, BUILDING_PRICE_GROWTH } from '../data.js';
import { ref, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { checkTimeCheat } from './anticheat.js';
import { createDefaultStats } from './gameStats.js';
import { initAchievementsFromSave } from './achievements.js';

export async function loadUserProgressFromDB() {
    GameState.upgrades = JSON.parse(JSON.stringify(defaultUpgrades));
    let resetTime = 0, firebaseData = null, localData = null;
    try {
        const resetSnap = await get(child(ref(db), 'admin/reset'));
        if (resetSnap.exists()) resetTime = resetSnap.val();
    } catch (e) {}
    try {
        const snap = await get(child(ref(db), `users/${GameState.currentUser}`));
        if (snap.exists()) firebaseData = snap.val();
    } catch (e) {}
    try {
        const localRaw = localStorage.getItem(`martinGame_user_${GameState.currentUser}`);
        if (localRaw) localData = JSON.parse(localRaw);
    } catch (e) {}

    const firebaseSaved = firebaseData && firebaseData.lastSaved ? firebaseData.lastSaved : 0;
    const localSaved = localData && localData.lastSaved ? localData.lastSaved : 0;
    let parsed = (firebaseData && localData)
        ? ((firebaseSaved > localSaved) ? firebaseData : localData)
        : (firebaseData || localData);
    if (resetTime > 0 && ((firebaseData === null && localData !== null) || (parsed && (!parsed.lastSaved || parsed.lastSaved < resetTime)))) {
        parsed = null;
    }

    if (parsed) {
        Object.assign(GameState, {
            password: parsed.password || GameState.password,
            lastSaved: parsed.lastSaved || 0,
            bikes: parsed.bikes || 0,
            lifetimeBikes: parsed.lifetimeBikes || parsed.bikes || 0,
            goldenSpokes: parsed.goldenSpokes || 0,
            prestigeCount: parsed.prestigeCount || 0,
            claimedSpokes: parsed.claimedSpokes !== undefined ? parsed.claimedSpokes : undefined,
            realUpgrades: Array.isArray(parsed.realUpgrades) ? parsed.realUpgrades : Object.values(parsed.realUpgrades || {}),
            prestigeSkills: Array.isArray(parsed.prestigeSkills) ? parsed.prestigeSkills : Object.values(parsed.prestigeSkills || {}),
            inventory: Array.isArray(parsed.inventory) ? parsed.inventory : Object.values(parsed.inventory || {}),
            completedAchievements: Array.isArray(parsed.completedAchievements) ? parsed.completedAchievements : [],
            stats: parsed.stats && typeof parsed.stats === 'object' ? { ...createDefaultStats(), ...parsed.stats, events: { ...createDefaultStats().events, ...(parsed.stats.events || {}) } } : createDefaultStats()
        });

        initAchievementsFromSave(parsed);

        let loadedUpgrades = Array.isArray(parsed.upgrades) ? parsed.upgrades : Object.values(parsed.upgrades || {});
        if (loadedUpgrades.length > 0) {
            GameState.upgrades.forEach(u => {
                const savedU = loadedUpgrades.find(s => s.id === u.id);
                if (savedU) {
                    u.owned = savedU.owned || 0;
                    const def = defaultUpgrades.find(d => d.id === u.id);
                    u.cost = (def && def.type !== "special")
                        ? Math.floor(def.cost * Math.pow(BUILDING_PRICE_GROWTH, u.owned))
                        : (savedU.cost || u.cost);
                }
            });
        }
        GameState.cosmetics = Array.isArray(parsed.cosmetics) ? parsed.cosmetics : Object.values(parsed.cosmetics || {});
        if (parsed.lastSaved) {
            let secondsOffline = checkTimeCheat(parsed.lastSaved);
            if (secondsOffline > 60) {
                window.recalculateStats();
                let offlineGains = GameState.bps * secondsOffline;
                if (offlineGains > 0) {
                    GameState.bikes += offlineGains;
                    GameState.lifetimeBikes += offlineGains;
                    showToast(`😴 Távolléted alatt termeltél:\n+${Math.floor(offlineGains).toLocaleString()} 🚲`);
                }
            }
        }
    } else {
        Object.assign(GameState, {
            bikes: 0,
            lifetimeBikes: 0,
            goldenSpokes: 0,
            prestigeCount: 0,
            bps: 0,
            clickPower: 1,
            claimedSpokes: 0,
            realUpgrades: [],
            prestigeSkills: [],
            inventory: [],
            completedAchievements: [],
            stats: createDefaultStats(),
            cosmetics: [],
            firstJoined: Date.now()
        });
        window.activeBuffs = [];
        window.multiplier = 1;
        window.clickMultiplier = 1;
        initAchievementsFromSave({});
        localStorage.removeItem(`martinGame_user_${GameState.currentUser}`);
    }
    window.updateInventoryUI();
    window.recalculateStats();
    window.updateUI();
    window.applyCosmetics();
}
