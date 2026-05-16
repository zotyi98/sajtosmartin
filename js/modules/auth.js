import { GameState, db, showToast } from '../state.js';
import { ref, onValue, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { initMartinEasterEgg } from './martinbg.js';
import { checkSeasons } from './seasons.js';
import { initShopUI } from './shop.js';
import { loadUserProgressFromDB } from './progress.js';
import { startGameLoops } from './gameLoop.js';

window.login = async function() {
    const usr = document.getElementById('username-input').value.trim();
    const pwd = document.getElementById('password-input').value.trim();
    if (usr.length < 2 || pwd.length < 3) { showToast("Rövid név vagy jelszó!"); return; }

    const btn = document.getElementById('btn-login');
    btn.innerText = "Ellenőrzés...";
    btn.disabled = true;
    try {
        const snap = await get(child(ref(db), `users/${usr}/password`));
        if (snap.exists() && snap.val() !== pwd) {
            alert("❌ HIBÁS JELSZÓ!");
            btn.innerText = "BELÉPÉS";
            btn.disabled = false;
            return;
        }
    } catch (e) { console.error(e); }

    if (document.getElementById('remember-password-check').checked) {
        localStorage.setItem('rememberPassword_username', usr);
        localStorage.setItem('rememberPassword_password', pwd);
    }

    GameState.currentUser = usr;
    GameState.password = pwd;
    btn.innerText = "Betöltés...";

    onValue(ref(db, 'admin/reset'), (snap) => {
        if (snap.val() && snap.val() > window.appInitTime) {
            alert("Szerver törölve!");
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
    document.getElementById('current-user-display').innerText = GameState.currentUser;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';

    window.initLeaderboard();
    initMartinEasterEgg();
    startGameLoops();
};

window.loadRememberedPassword = function() {
    const savedUsername = localStorage.getItem('rememberPassword_username');
    const savedPassword = localStorage.getItem('rememberPassword_password');
    if (savedUsername && savedPassword) {
        document.getElementById('username-input').value = savedUsername;
        document.getElementById('password-input').value = savedPassword;
        document.getElementById('remember-password-check').checked = true;
    }
};

window.forgetPassword = function() {
    if (confirm("Biztosan szeretnéd a mentett jelszót törleni?")) {
        localStorage.removeItem('rememberPassword_username');
        localStorage.removeItem('rememberPassword_password');
        document.getElementById('username-input').value = '';
        document.getElementById('password-input').value = '';
        document.getElementById('remember-password-check').checked = false;
        showToast("✅ Mentett jelszó törölve!");
    }
};

export function initAuthUI() {
    document.getElementById('username-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.login();
    });
    document.getElementById('password-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.login();
    });
    window.addEventListener('load', () => window.loadRememberedPassword());
}
