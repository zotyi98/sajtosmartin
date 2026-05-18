import { GameState, db, showToast, saveUserProgress } from '../state.js';
import { defaultUpgrades, BUILDING_PRICE_GROWTH } from '../data.js';
import { ref, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { checkTimeCheat } from './anticheat.js';
import { createDefaultStats } from './gameStats.js';
import { initAchievementsFromSave } from './achievements.js';
import { getLocalGameKey, sanitizeUsername, dedupeRealUpgrades, loadSessionToken } from '../authSession.js';
import { migrateClaimedSpokesOnce } from './kullok.js';
import { getHeavenlyOfflineMult } from '../heavenlyData.js';
import { initMartinRestOnLoad } from './gameCompletion.js';
import { getHudProductionBps } from './stats.js';

function stripSensitiveFields(data) {
    if (!data || typeof data !== 'object') return data;
    const { password, passwordHash, salt, currentUser, authUid, _session, ...safe } = data;
    return safe;
}

async function loadLegacySave(username) {
    try {
        const gameSnap = await get(child(ref(db), `users/${username}/game`));
        if (gameSnap.exists()) return stripSensitiveFields(gameSnap.val());

        const flatSnap = await get(child(ref(db), `users/${username}`));
        if (flatSnap.exists()) {
            const val = flatSnap.val();
            if (val && typeof val === 'object' && !val.game) {
                return stripSensitiveFields(val);
            }
        }
    } catch (e) {
        console.warn('Mentés olvasása:', e);
    }
    return null;
}

export async function loadUserProgressFromDB() {
    const username = sanitizeUsername(GameState.currentUser);
    if (!username) return;

    GameState.upgrades = JSON.parse(JSON.stringify(defaultUpgrades));

    let resetTime = 0;
    let firebaseData = null;
    let localData = null;
    let migratedLegacy = false;

    const resetAckKey = `martinResetAck_${username}`;

    try {
        const resetSnap = await get(child(ref(db), 'admin/reset'));
        if (resetSnap.exists()) resetTime = resetSnap.val();
    } catch (e) {}

    const lastResetAck = parseInt(localStorage.getItem(resetAckKey) || '0', 10);
    const mustWipeFromReset = resetTime > 0 && lastResetAck < resetTime;

    try {
        const snap = await get(child(ref(db), `users/${username}/game`));
        if (snap.exists()) firebaseData = stripSensitiveFields(snap.val());
    } catch (e) {}

    if (!firebaseData && !mustWipeFromReset) {
        const legacy = await loadLegacySave(username);
        if (legacy) {
            firebaseData = legacy;
            migratedLegacy = true;
            showToast("Régi mentés betöltve az új rendszerbe.");
        }
    }

    try {
        const localRaw = localStorage.getItem(getLocalGameKey(username));
        if (localRaw) localData = stripSensitiveFields(JSON.parse(localRaw));
    } catch (e) {}

    const firebaseSaved = firebaseData?.lastSaved || 0;
    const localSaved = localData?.lastSaved || 0;
    let parsed = (firebaseData && localData)
        ? ((firebaseSaved > localSaved) ? firebaseData : localData)
        : (firebaseData || localData);

    if (mustWipeFromReset) {
        parsed = null;
        localStorage.removeItem(getLocalGameKey(username));
        localStorage.setItem(resetAckKey, String(resetTime));
        if (GameState.currentUser) {
            showToast("🔄 Szerver reset — új játék indul.");
        }
    }

    const prestigeReloadKey = `prestigeReload_${username}`;
    const justPrestiged = sessionStorage.getItem(prestigeReloadKey) === '1';
    if (justPrestiged) {
        sessionStorage.removeItem(prestigeReloadKey);
        if (parsed) {
            parsed.bikes = 0;
            parsed.realUpgrades = [];
            parsed.upgrades = JSON.parse(JSON.stringify(defaultUpgrades));
        }
    }

    if (parsed) {
        GameState.sessionToken = loadSessionToken(username) || GameState.sessionToken || '';
        Object.assign(GameState, {
            lastSaved: parsed.lastSaved || 0,
            bikes: parsed.bikes ?? 0,
            lifetimeBikes: parsed.lifetimeBikes ?? parsed.bikes ?? 0,
            goldenSpokes: parsed.goldenSpokes || 0,
            prestigeCount: parsed.prestigeCount || 0,
            firstJoined: parsed.firstJoined || Date.now(),
            claimedSpokes: parsed.claimedSpokes,
            realUpgrades: dedupeRealUpgrades(Array.isArray(parsed.realUpgrades) ? parsed.realUpgrades : Object.values(parsed.realUpgrades || {})),
            prestigeSkills: Array.isArray(parsed.prestigeSkills) ? parsed.prestigeSkills : Object.values(parsed.prestigeSkills || {}),
            inventory: Array.isArray(parsed.inventory) ? parsed.inventory : Object.values(parsed.inventory || {}),
            completedAchievements: Array.isArray(parsed.completedAchievements) ? parsed.completedAchievements : [],
            stats: parsed.stats && typeof parsed.stats === 'object'
                ? { ...createDefaultStats(), ...parsed.stats, events: { ...createDefaultStats().events, ...(parsed.stats.events || {}) } }
                : createDefaultStats(),
            purchasedBuildingTiers: Array.isArray(parsed.purchasedBuildingTiers) ? parsed.purchasedBuildingTiers : [],
            apocalypse: parsed.apocalypse && typeof parsed.apocalypse === 'object' ? parsed.apocalypse : null,
            platinaSpokes: parsed.platinaSpokes || 0,
            ascensionCount: parsed.ascensionCount || 0,
            heavenlyUpgrades: parsed.heavenlyUpgrades && typeof parsed.heavenlyUpgrades === 'object' ? parsed.heavenlyUpgrades : {},
            completedChallenges: Array.isArray(parsed.completedChallenges) ? parsed.completedChallenges : [],
            activeChallenge: parsed.activeChallenge || null,
            challengeStartedAt: parsed.challengeStartedAt || 0,
            bikeGarden: parsed.bikeGarden && typeof parsed.bikeGarden === 'object' ? parsed.bikeGarden : null,
            martinRestPurchased: !!parsed.martinRestPurchased
        });

        initAchievementsFromSave(parsed);
        migrateClaimedSpokesOnce();

        const loadedUpgrades = Array.isArray(parsed.upgrades) ? parsed.upgrades : Object.values(parsed.upgrades || {});
        if (loadedUpgrades.length > 0) {
            GameState.upgrades.forEach(u => {
                const savedU = loadedUpgrades.find(s => s.id === u.id);
                if (savedU) {
                    u.owned = savedU.owned || 0;
                    const def = defaultUpgrades.find(d => d.id === u.id);
                    u.cost = (def && def.type !== 'special')
                        ? Math.floor(def.cost * Math.pow(BUILDING_PRICE_GROWTH, u.owned))
                        : (savedU.cost || u.cost);
                }
            });
        }

        GameState.cosmetics = Array.isArray(parsed.cosmetics) ? parsed.cosmetics : Object.values(parsed.cosmetics || {});

        if (parsed.lastSaved && !justPrestiged) {
            const secondsOffline = checkTimeCheat(parsed.lastSaved);
            if (secondsOffline > 60) {
                window.recalculateStats();
                window.recalcMultiplier();
                let offlineMult = window.getOfflineSecondsMultiplier
                    ? window.getOfflineSecondsMultiplier(secondsOffline)
                    : 1;
                offlineMult *= getHeavenlyOfflineMult(GameState);
                const offlineGains = getHudProductionBps() * secondsOffline * offlineMult;
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
            firstJoined: Date.now(),
            purchasedBuildingTiers: [],
            apocalypse: null
        });
        window.activeBuffs = [];
        window.multiplier = 1;
        window.clickMultiplier = 1;
        initAchievementsFromSave({});
        localStorage.removeItem(getLocalGameKey(username));
        if (resetTime > 0) {
            localStorage.setItem(resetAckKey, String(resetTime));
        }
    }

    window.updateInventoryUI();
    window.recalculateStats();
    window.updateUI();
    window.applyCosmetics();
    if (window.refreshPlayerPanel) window.refreshPlayerPanel();
    initMartinRestOnLoad();

    if (migratedLegacy) saveUserProgress();
}
