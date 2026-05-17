import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getLocalGameKey, sanitizeUsername } from "./authSession.js";

const firebaseConfig = {
    apiKey: "AIzaSyDKEMDbNKzJJTBYjhRCAKi9ct8861uvlao",
    authDomain: "martinbikycle.firebaseapp.com",
    databaseURL: "https://martinbikycle-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "martinbikycle"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export const GameState = {
    currentUser: "",
    sessionToken: "",
    bikes: 0,
    lifetimeBikes: 0,
    goldenSpokes: 0,
    prestigeCount: 0,
    clickPower: 1,
    bps: 0,
    upgrades: [],
    realUpgrades: [],
    prestigeSkills: [],
    inventory: [],
    completedAchievements: [],
    stats: null,
    cosmetics: [],
    lastSaved: 0,
    platinaSpokes: 0,
    ascensionCount: 0,
    heavenlyUpgrades: {},
    completedChallenges: [],
    activeChallenge: null,
    challengeStartedAt: 0,
    bikeGarden: null,
    martinRestPurchased: false
};

let saveChain = Promise.resolve();

function stripUndefined(value) {
    if (value === undefined) return undefined;
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) {
        return value.map(stripUndefined).filter((v) => v !== undefined);
    }
    const out = {};
    for (const [key, val] of Object.entries(value)) {
        if (val === undefined) continue;
        const cleaned = stripUndefined(val);
        if (cleaned !== undefined) out[key] = cleaned;
    }
    return out;
}

function buildSavePayload() {
    if (!GameState.firstJoined) GameState.firstJoined = Date.now();

    const payload = stripUndefined({
        displayName: GameState.currentUser,
        lastSaved: GameState.lastSaved,
        bikes: GameState.bikes,
        lifetimeBikes: GameState.lifetimeBikes,
        goldenSpokes: GameState.goldenSpokes,
        prestigeCount: GameState.prestigeCount,
        clickPower: GameState.clickPower,
        bps: GameState.bps,
        upgrades: GameState.upgrades,
        realUpgrades: GameState.realUpgrades,
        prestigeSkills: GameState.prestigeSkills,
        inventory: GameState.inventory,
        completedAchievements: GameState.completedAchievements,
        stats: GameState.stats,
        cosmetics: GameState.cosmetics,
        claimedSpokes: GameState.claimedSpokes,
        firstJoined: GameState.firstJoined,
        purchasedBuildingTiers: GameState.purchasedBuildingTiers || [],
        apocalypse: GameState.apocalypse || null,
        platinaSpokes: GameState.platinaSpokes || 0,
        ascensionCount: GameState.ascensionCount || 0,
        heavenlyUpgrades: GameState.heavenlyUpgrades || {},
        completedChallenges: GameState.completedChallenges || [],
        activeChallenge: GameState.activeChallenge || null,
        challengeStartedAt: GameState.challengeStartedAt || 0,
        bikeGarden: GameState.bikeGarden || null,
        martinRestPurchased: !!GameState.martinRestPurchased
    });

    if (GameState.sessionToken) {
        payload._session = GameState.sessionToken;
    }
    return payload;
}

async function saveUserProgressImpl() {
    const name = GameState.currentUser;
    if (!name) return;

    GameState.lastSaved = Date.now();
    const payload = buildSavePayload();
    const safeName = sanitizeUsername(name);

    localStorage.setItem(getLocalGameKey(safeName), JSON.stringify(payload));

    await Promise.all([
        set(ref(db, `users/${safeName}/game`), payload),
        set(ref(db, `leaderboard/${safeName}`), {
            displayName: name,
            bikes: GameState.bikes ?? 0,
            bps: GameState.bps ?? 0,
            prestigeCount: GameState.prestigeCount || 0,
            goldenSpokes: GameState.goldenSpokes || 0,
            lastSaved: GameState.lastSaved,
            _session: GameState.sessionToken || null
        })
    ]);
}

export function saveUserProgress() {
    saveChain = saveChain
        .then(() => saveUserProgressImpl())
        .catch((e) => {
            console.error("Mentési hiba:", e);
            showToast(`Mentési hiba: ${e.code || e.message || "ismeretlen"}`);
        });
    return saveChain;
}

export async function isCurrentUserAdmin() {
    const name = sanitizeUsername(GameState.currentUser || "");
    if (!name) return false;
    try {
        const snap = await get(child(ref(db), `config/admins/${name}`));
        return snap.val() === true;
    } catch {
        return false;
    }
}

export function showToast(text) {
    const container = document.getElementById("achievement-container");
    const toast = document.createElement("div");
    toast.className = "achievement-toast";
    toast.innerText = text;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

export let updateUI = () => {};
export function setUpdateUI(fn) {
    updateUI = fn;
}
