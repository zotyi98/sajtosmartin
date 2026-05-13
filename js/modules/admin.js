import { GameState, db, showToast, saveUserProgress } from '../state.js';
import { defaultUpgrades, extraUpgradesData, prestigeSkillsData, rpgItems } from '../data.js';
import { ref, onValue, get, child, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- RANGLISTA ÉS ADMIN SPECTATE ---
function getRankEmoji(bps) {
    if(bps > 100000000) return "👑"; if(bps > 1000000) return "💎"; if(bps > 10000) return "🔥"; if(bps > 100) return "⭐"; return "🚲";
}

window.initLeaderboard = function() {
    const leaderboardRef = ref(db, 'users/');
    onValue(leaderboardRef, (snapshot) => {
        const data = snapshot.val(); const listDiv = document.getElementById('leaderboard-list');
        if (!data) { listDiv.innerHTML = "<div style='text-align:center; padding:20px; font-weight:bold; color:#795548;'>Üres a ranglista!</div>"; return; }
        
        const usersArray = Object.keys(data).map(key => ({ 
            name: key, bps: data[key].bps || 0, goldenSpokes: data[key].goldenSpokes || 0, prestigeCount: data[key].prestigeCount || 0
        })).sort((a, b) => (b.goldenSpokes - a.goldenSpokes) || (b.bps - a.bps));
        
        listDiv.innerHTML = "";
        usersArray.slice(0, 15).forEach((user, index) => {
            const div = document.createElement('div');
            let rankClass = index < 3 ? `rank-${index}` : '';
            let medalStr = index === 0 ? "🥇" : (index === 1 ? "🥈" : (index === 2 ? "🥉" : `<span style="font-family:'Bangers'; font-size:18px;">${index + 1}.</span>`));
            
            div.className = `leader-item ${user.name === GameState.currentUser ? 'current-user' : ''} ${rankClass}`;
            
            if (GameState.currentUser === "zotyi") {
                div.style.cursor = 'pointer'; div.title = "Kattints a megfigyeléshez (Admin)"; div.onclick = () => window.spectateUser(user.name);
            }

            div.innerHTML = `
                <div style="flex:1;">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span class="rank-badge">${medalStr} ${getRankEmoji(user.bps)}</span> <span style="font-size:17px;">${user.name}</span>
                    </div>
                    <div style="margin-top: 4px; font-size:12px; color:#555; font-family:'Fredoka', sans-serif; font-weight: 600;">
                        🔄 <span style="color:#d32f2f;">${user.prestigeCount}x</span> Újrakezdve | ✨ <span style="color:#fbc02d;">${user.goldenSpokes}</span> Küllő
                    </div>
                </div>
                <span style="font-family:'Bangers'; font-size:18px; color:#d32f2f;">${Math.floor(user.bps).toLocaleString()} BPS</span>
            `;
            listDiv.appendChild(div);
        });
    });
};

window.spectateUser = async function(targetUser) {
    if (!isAdminUser()) { showToast('❌ Nincs jogosultságod mások megfigyelésére!'); return; }

    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, `users/${targetUser}`));
        if (!snapshot.exists()) { showToast('❌ Nem található adat!'); return; }

        const data = snapshot.val();
        const nameEl = document.getElementById('spectate-name');
        const contentEl = document.getElementById('spectate-content');
        if (!nameEl || !contentEl) return;

        nameEl.textContent = `👁️ ${targetUser} adatai`;
        contentEl.innerHTML = '';

        const addLine = (label, value) => {
            const row = document.createElement('div');
            const strong = document.createElement('b');
            strong.textContent = label;
            row.appendChild(strong);
            row.appendChild(document.createTextNode(` ${value}`));
            contentEl.appendChild(row);
        };

        const inventory = Array.isArray(data.inventory) ? data.inventory : Object.values(data.inventory || {});
        const inventoryHtml = inventory.length > 0 ? inventory.map(id => rpgItems[id]?.icon || '').join(' ') : 'Üres';

        const buildingsWrap = document.createElement('div');
        buildingsWrap.style.cssText = 'max-height: 80px; overflow-y: auto; background:#fff; padding:5px; font-size:13px; border: 1px solid #ddd;';
        const buildingsTitle = document.createElement('b');
        buildingsTitle.style.color = '#2e7d32';
        buildingsTitle.textContent = '🏢 ÉPÜLETEK:';
        buildingsWrap.appendChild(buildingsTitle);
        buildingsWrap.appendChild(document.createElement('br'));

        const upgArray = Array.isArray(data.upgrades) ? data.upgrades : Object.values(data.upgrades || {});
        let buildingsFound = false;
        upgArray.forEach(u => {
            if (u.owned > 0) {
                const def = defaultUpgrades.find(d => d.id === u.id);
                if (def) {
                    buildingsFound = true;
                    const line = document.createElement('div');
                    line.style.display = 'inline-block';
                    line.style.width = '48%';
                    line.style.marginBottom = '2px';
                    line.textContent = `${def.icon} ${def.name}: ${u.owned} db`;
                    buildingsWrap.appendChild(line);
                }
            }
        });
        if (!buildingsFound) { buildingsWrap.appendChild(document.createTextNode('Nincs még épülete.')); }

        const extrasWrap = document.createElement('div');
        extrasWrap.style.cssText = 'margin-top:5px; max-height: 60px; overflow-y: auto; background:#fff; padding:5px; font-size:13px; border: 1px solid #ddd;';
        const extrasTitle = document.createElement('b');
        extrasTitle.style.color = '#1565c0';
        extrasTitle.textContent = '🛠️ EXTRÁK:';
        extrasWrap.appendChild(extrasTitle);
        extrasWrap.appendChild(document.createElement('br'));
        const extraArray = Array.isArray(data.realUpgrades) ? data.realUpgrades : Object.values(data.realUpgrades || {});
        if (extraArray.length > 0) {
            const names = extraArray.map(ru => { const searchId = typeof ru === 'object' ? ru.id : ru; return extraUpgradesData.find(e => e.id === searchId)?.name; }).filter(Boolean);
            extrasWrap.appendChild(document.createTextNode(names.length ? names.join(', ') : 'Nincs extra fejlesztés.'));
        } else { extrasWrap.appendChild(document.createTextNode('Nincs extra fejlesztés.')); }

        const skillsWrap = document.createElement('div');
        skillsWrap.style.cssText = 'margin-top:5px; max-height: 60px; overflow-y: auto; background:#fff; padding:5px; font-size:13px; border: 1px solid #ddd;';
        const skillsTitle = document.createElement('b');
        skillsTitle.style.color = '#d32f2f';
        skillsTitle.textContent = '🌌 SKILLEK:';
        skillsWrap.appendChild(skillsTitle);
        skillsWrap.appendChild(document.createElement('br'));
        const skillsArray = Array.isArray(data.prestigeSkills) ? data.prestigeSkills : Object.values(data.prestigeSkills || {});
        if (skillsArray.length > 0) {
            const skillCounts = {};
            skillsArray.forEach(sid => { skillCounts[sid] = (skillCounts[sid] || 0) + 1; });
            const parts = [];
            for (let sid in skillCounts) { const def = prestigeSkillsData.find(s => s.id == sid); if (def) parts.push(`${def.name} (Lvl ${skillCounts[sid]})`); }
            skillsWrap.appendChild(document.createTextNode(parts.length ? parts.join(', ') : 'Nincs feloldott skill.'));
        } else { skillsWrap.appendChild(document.createTextNode('Nincs feloldott skill.')); }

        addLine('🚲 Bicikli:', `${Math.floor(data.bikes || 0).toLocaleString()}`);
        addLine('⚡ BPS:', `${Math.floor(data.bps || 0).toLocaleString()} / mp`);
        addLine('🎒 Cuccok:', inventoryHtml);
        contentEl.appendChild(document.createElement('hr')).style.cssText = 'margin: 8px 0; border: 1px solid #ccc;';
        contentEl.appendChild(buildingsWrap);
        contentEl.appendChild(extrasWrap);
        contentEl.appendChild(skillsWrap);
        contentEl.appendChild(document.createElement('hr')).style.cssText = 'margin: 8px 0; border: 1px solid #ccc;';
        addLine('🕒 Utolsó mentés:', data.lastSaved ? new Date(data.lastSaved).toLocaleString('hu-HU') : 'Ismeretlen');

        document.getElementById('spectate-modal').style.display = 'flex';
    } catch (e) { console.error(e); }
};

window.addEventListener('keydown', (e) => {
    if(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        if (!isAdminUser()) { showToast('❌ Nincs jogosultságod az Admin Panelhez!'); return; }
        const panel = document.getElementById('admin-panel'); panel.style.display = (panel.style.display === 'none') ? 'block' : 'none';
    }
});

window.adminAddBikes = function() {
    if (!isAdminUser()) return;
    const val = parseInt(document.getElementById('admin-bike-amount').value);
    if (!isNaN(val)) { GameState.bikes += val; GameState.lifetimeBikes += val; window.updateUI(); saveUserProgress(); }
};
window.resetLeaderboard = async function() {
    if (!isAdminUser()) return;
    if (confirm("BIZTOSAN törlöd a teljes rangsort MINDENKINÉL?")) {
        GameState.bikes = 0; GameState.lifetimeBikes = 0; GameState.goldenSpokes = 0; GameState.prestigeCount = 0; GameState.bps = 0;
        await set(ref(db, 'users/'), null); await set(ref(db, 'admin/reset'), Date.now()); 
        localStorage.removeItem(`martinGame_user_${GameState.currentUser}`); location.reload();
    }
};
window.triggerUpdateNotification = function() {
    if (!isAdminUser()) return;
    if(confirm('Értesítést küldesz mindenkinek a frissítésről?')) { set(ref(db, 'admin/updateSignal'), Date.now()); alert('Jelzés kiküldve!'); }
};
window.forceGoldenBike = function() { const b = document.getElementById('golden-bike'); b.style.top = Math.random()*50+25+"%"; b.style.display='block'; b.style.animation='none'; b.offsetHeight; b.style.animation='goldenFloat 10s linear forwards'; setTimeout(()=>b.style.display='none', 10000); };
window.forceRustyBike = function() { const b = document.getElementById('rusty-bike'); b.style.top = Math.random()*50+25+"%"; b.style.display='block'; b.style.animation='none'; b.offsetHeight; b.style.animation='goldenFloat 10s linear forwards'; setTimeout(()=>b.style.display='none', 10000); };
window.forceCloud = function() { window.spawnMagicCloud(); };
window.forcePuke = function() { window.spawnPukeEvent(); };
window.forceAimlabEvent = function() { const o = document.getElementById('aimlab-event-obj'); o.style.top = Math.random()*50+25+"%"; o.style.display='block'; o.style.animation='none'; o.offsetHeight; o.style.animation='goldenFloat 10s linear forwards'; setTimeout(()=>o.style.display='none', 10000); };
window.forceHarry = function() { const hp = document.getElementById('harry-potter-event'); hp.style.display='block'; hp.style.animation='none'; hp.offsetHeight; hp.style.animation='hpErraticFly 10s linear forwards'; setTimeout(()=>hp.style.display='none', 10000); };