import { GameState, db, showToast } from '../state.js';
import { ref, onValue, get, child, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import {
    sanitizeUsername,
    isValidUsername,
    hashPassword,
    generateSalt,
    storeSessionToken,
    loadSessionToken,
    saveRememberedLogin,
    loadRememberedLogin as getRememberedLogin,
    clearRememberedLogin
} from '../authSession.js';
import { initMartinEasterEgg } from './martinbg.js';
import { checkSeasons } from './seasons.js';
import { initShopUI } from './shop.js';
import { loadUserProgressFromDB } from './progress.js';
import { startGameLoops } from './gameLoop.js';
import { initBuildingTiersUI } from './buildingTiers.js';
import { initApocalypse } from './apocalypse.js';
import { initActivityFeed } from './activityFeed.js';
import { initDuels } from './duel.js';

async function establishSession(username) {
    const token = crypto.randomUUID();
    GameState.sessionToken = token;
    storeSessionToken(username, token);
    await set(ref(db, `sessions/${username}`), token);
}

async function verifyLegacyPassword(username, password) {
    try {
        const legacySnap = await get(child(ref(db), `users/${username}/password`));
        if (legacySnap.exists() && legacySnap.val() === password) return true;
    } catch (e) {
        console.warn('Legacy password olvasás:', e.code || e.message);
    }

    try {
        const flatSnap = await get(child(ref(db), `users/${username}`));
        if (flatSnap.exists()) {
            const val = flatSnap.val();
            if (val && typeof val === 'object' && val.password === password && !val.game) {
                return true;
            }
        }
    } catch (e) {
        console.warn('Legacy mentés olvasás:', e.code || e.message);
    }
    return false;
}

async function createAccount(username, password) {
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    await set(ref(db, `accounts/${username}`), {
        passwordHash,
        salt,
        createdAt: Date.now()
    });
}

async function verifyLogin(username, password) {
    const accSnap = await get(child(ref(db), `accounts/${username}`));
    if (accSnap.exists()) {
        const { passwordHash, salt } = accSnap.val();
        const attempt = await hashPassword(password, salt);
        return attempt === passwordHash;
    }
    if (await verifyLegacyPassword(username, password)) {
        await createAccount(username, password);
        return true;
    }
    return null;
}

async function startGameSession(displayName) {
    GameState.currentUser = displayName;
    const username = sanitizeUsername(displayName);

    try {
        await establishSession(username);
    } catch (e) {
        console.warn('Session mentés:', e);
        GameState.sessionToken = loadSessionToken(username) || '';
    }

    onValue(ref(db, 'admin/reset'), (snap) => {
        if (snap.val() && snap.val() > window.appInitTime) {
            alert("Szerver reset — frissítés...");
            location.reload();
        }
    });

    onValue(ref(db, 'admin/updateSignal'), (snap) => {
        if (snap.val() && snap.val() > window.appInitTime) {
            if (document.getElementById('fancy-update-banner')) return;

            const banner = document.createElement('div');
            banner.id = 'fancy-update-banner';
            banner.style.cssText = `
                position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white;
                padding: 20px 30px; border-radius: 15px; z-index: 99999;
                box-shadow: 0 10px 30px rgba(0,0,0,0.6); border: 3px solid #ff5252;
                display: flex; align-items: center; gap: 20px; font-family: 'Fredoka', sans-serif;
                animation: slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            `;
            banner.innerHTML = `
                <div style="font-size: 40px; animation: pulseIcon 1s infinite alternate;">⚠️</div>
                <div>
                    <strong style="font-family:'Bangers'; font-size:24px; letter-spacing:1px;">KÖTELEZŐ FRISSÍTÉS!</strong><br>
                    <span style="font-size: 16px;">Új verzió érhető el a szerveren. A folytatáshoz frissíts!</span>
                </div>
                <button onclick="location.reload()" style="background: white; color: #d32f2f; border: none; padding: 10px 20px; font-family: 'Bangers'; font-size: 18px; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 0 #9e9e9e; transition: 0.1s;">🔄 FRISSÍTÉS MOST</button>
            `;

            const style = document.createElement('style');
            style.innerHTML = `
                @keyframes slideDown { from { top: -100px; opacity: 0; } to { top: 20px; opacity: 1; } }
                @keyframes pulseIcon { from { transform: scale(1); } to { transform: scale(1.2); } }
                #fancy-update-banner button:active { transform: translateY(4px); box-shadow: 0 0 0 #9e9e9e; }
            `;
            document.head.appendChild(style);
            document.body.appendChild(banner);
        }
    });

    checkSeasons();
    initShopUI();
    await loadUserProgressFromDB();
    initBuildingTiersUI();
    initApocalypse();
    initActivityFeed();
    initDuels();
    document.getElementById('current-user-display').innerText = GameState.currentUser;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';

    window.initLeaderboard();
    initMartinEasterEgg();
    startGameLoops();
}

window.login = async function() {
    const rawName = document.getElementById('username-input').value.trim();
    const pwd = document.getElementById('password-input').value.trim();
    const btn = document.getElementById('btn-login');

    if (!isValidUsername(rawName)) {
        showToast("A név 2–12 karakter legyen (betű, szám, _).");
        return;
    }
    if (pwd.length < 3) {
        showToast("A jelszó legalább 3 karakter legyen.");
        return;
    }

    const username = sanitizeUsername(rawName);
    const displayName = rawName.trim().slice(0, 12);

    if (!window.crypto?.subtle) {
        showToast("A jelszó-titkosítás nem fut file:// módban.\nNyisd meg Live Serverrel vagy Firebase Hostingról (https://)!");
        return;
    }

    btn.innerText = "Ellenőrzés...";
    btn.disabled = true;

    try {
        let accExists = false;
        try {
            accExists = (await get(child(ref(db), `accounts/${username}`))).exists();
        } catch (e) {
            console.error('accounts olvasás:', e);
            showToast(`Firebase hiba (accounts): ${e.code || e.message}\nEllenőrizd a Rules-t (Publish)!`);
            return;
        }

        const result = await verifyLogin(username, pwd);

        if (result === null) {
            if (!accExists) {
                await createAccount(username, pwd);
                showToast("Új fiók létrehozva! Üdv a birodalomban!");
            } else {
                alert("❌ Hibás jelszó!");
                return;
            }
        } else if (result === false) {
            alert("❌ Hibás jelszó!");
            return;
        }

        const rememberLogin = document.getElementById('remember-login-check')?.checked;
        saveRememberedLogin(displayName, pwd, rememberLogin);

        btn.innerText = "Betöltés...";
        await startGameSession(displayName);
    } catch (e) {
        console.error(e);
        const code = e.code || '';
        if (code.includes('permission_denied') || code.includes('PERMISSION_DENIED')) {
            showToast("PERMISSION_DENIED — másold be újra a database.rules.json-t és Publish!");
        } else {
            showToast(`Bejelentkezési hiba: ${code || e.message}`);
        }
    } finally {
        btn.innerText = "BELÉPÉS";
        btn.disabled = false;
    }
};

window.loadRememberedLogin = function() {
    const { user, password, hasSaved } = getRememberedLogin();
    if (user) document.getElementById('username-input').value = user;
    if (password) document.getElementById('password-input').value = password;
    const chk = document.getElementById('remember-login-check');
    if (chk && hasSaved) chk.checked = true;
};

window.forgetPassword = function() {
    if (confirm("Törlöd a mentett felhasználónevet és jelszót ezen a gépen?")) {
        clearRememberedLogin();
        document.getElementById('username-input').value = '';
        document.getElementById('password-input').value = '';
        const chk = document.getElementById('remember-login-check');
        if (chk) chk.checked = false;
        showToast("✅ Mentett bejelentkezés törölve.");
    }
};

export function initAuthUI() {
    document.getElementById('username-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.login();
    });
    document.getElementById('password-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.login();
    });
    window.addEventListener('load', () => window.loadRememberedLogin());
}
