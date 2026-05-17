import { GameState, db, showToast, saveUserProgress, isCurrentUserAdmin } from '../state.js';
import { ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getLocalGameKey, sanitizeUsername } from '../authSession.js';

window.addEventListener('keydown', async (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        if (!(await isCurrentUserAdmin())) {
            showToast("❌ Nincs jogosultságod az Admin Panelhez!");
            return;
        }
        const panel = document.getElementById('admin-panel');
        panel.style.display = (panel.style.display === 'none') ? 'block' : 'none';
    }
});

window.adminAddBikes = function() {
    const val = parseInt(document.getElementById('admin-bike-amount').value);
    if (!isNaN(val)) {
        GameState.bikes += val;
        GameState.lifetimeBikes += val;
        window.updateUI();
        saveUserProgress();
    }
};

window.resetLeaderboard = async function() {
    if (!(await isCurrentUserAdmin())) return;
    if (!confirm("BIZTOSAN törlöd a rangsort és minden játékos mentését?\n(A fiókok/jelszavak megmaradnak — csak a játékállás törlődik.)")) return;

    const resetAt = Date.now();
    const name = sanitizeUsername(GameState.currentUser);

    try {
        await set(ref(db, 'admin/reset'), resetAt);
    } catch (e) {
        console.error(e);
        showToast(`Reset sikertelen: ${e.code || e.message}\nAz admin/reset írása nem sikerült.`);
        return;
    }

    if (name) {
        localStorage.removeItem(getLocalGameKey(name));
        localStorage.removeItem(`martinResetAck_${name}`);
    }

    const updates = {};
    try {
        const [lbSnap, usersSnap, sessSnap] = await Promise.all([
            get(ref(db, 'leaderboard')),
            get(ref(db, 'users')),
            get(ref(db, 'sessions'))
        ]);

        if (lbSnap.exists()) {
            lbSnap.forEach((child) => {
                updates[`leaderboard/${child.key}`] = null;
            });
        }

        if (usersSnap.exists()) {
            usersSnap.forEach((child) => {
                updates[`users/${child.key}/game`] = null;
            });
        }

        if (sessSnap.exists()) {
            sessSnap.forEach((child) => {
                updates[`sessions/${child.key}`] = null;
            });
        }

        if (Object.keys(updates).length > 0) {
            await update(ref(db), updates);
        }
    } catch (e) {
        console.warn('Szerver törlés részben sikertelen:', e);
        showToast("⚠️ Reset jel elküldve; a szerver törlés részben elakadt.\nBelépéskor a játék így is nullázódik.");
    }

    showToast("✅ Rangsor reset kész — újratöltés...");
    setTimeout(() => location.reload(), 800);
};

window.triggerUpdateNotification = async function() {
    if (!(await isCurrentUserAdmin())) return;
    if (confirm("Értesítést küldesz mindenkinek a frissítésről?")) {
        await set(ref(db, 'admin/updateSignal'), Date.now());
        alert("Jelzés kiküldve!");
    }
};

window.forceGoldenBike = function() { const b = document.getElementById('golden-bike'); b.style.top = Math.random()*50+25+"%"; b.style.display='block'; b.style.animation='none'; b.offsetHeight; b.style.animation='goldenFloat 10s linear forwards'; setTimeout(()=>b.style.display='none', 10000); };
window.forceRustyBike = function() { const b = document.getElementById('rusty-bike'); b.style.top = Math.random()*50+25+"%"; b.style.display='block'; b.style.animation='none'; b.offsetHeight; b.style.animation='goldenFloat 10s linear forwards'; setTimeout(()=>b.style.display='none', 10000); };
window.forceCloud = function() { window.spawnMagicCloud(); };
window.forcePuke = function() { window.spawnPukeEvent(); };
window.forceAimlabEvent = function() { const o = document.getElementById('aimlab-event-obj'); o.style.top = Math.random()*50+25+"%"; o.style.display='block'; o.style.animation='none'; o.offsetHeight; o.style.animation='goldenFloat 10s linear forwards'; setTimeout(()=>o.style.display='none', 10000); };
window.forceMartinReminder = function() { const rem = document.getElementById('martin-reminder'); if (!rem) return; rem.style.display = 'flex'; rem.style.opacity = '0'; rem.style.transition = 'opacity 0.3s ease'; rem.offsetHeight; rem.style.opacity = '1'; setTimeout(() => { rem.style.opacity = '0'; setTimeout(() => { rem.style.display = 'none'; }, 300); }, 15000); };
window.forceHarry = function() { const hp = document.getElementById('harry-potter-event'); hp.style.display='block'; hp.style.animation='none'; hp.offsetHeight; hp.style.animation='hpErraticFly 10s linear forwards'; setTimeout(()=>hp.style.display='none', 10000); };
