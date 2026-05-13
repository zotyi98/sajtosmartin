import { GameState, db, showToast, saveUserProgress } from '../state.js';
import { defaultUpgrades, extraUpgradesData, prestigeSkillsData, rpgItems } from '../data.js';
import { ref, onValue, get, child, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- RANGLISTA ÉS ADMIN SPECTATE ---
function getRankEmoji(bps) {
    if(bps > 100000000) return "👑"; if(bps > 1000000) return "💎"; if(bps > 10000) return "🔥"; if(bps > 100) return "⭐"; return "🚲";
}

window.spectateUser = async function(targetUser) {
    if (GameState.currentUser !== "zotyi") { showToast("❌ Nincs jogosultságod mások megfigyelésére!"); return; }
    
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, `users/${targetUser}`));
        if (snapshot.exists()) {
            const data = snapshot.val();
            document.getElementById('spectate-name').innerText = `👁️ ${targetUser} adatai`;
            
            let lastOnline = data.lastSaved ? new Date(data.lastSaved).toLocaleString('hu-HU') : 'Ismeretlen';
            let inventoryHtml = data.inventory && data.inventory.length > 0 ? data.inventory.map(id => rpgItems[id]?.icon || '').join(' ') : 'Üres';
            
            let buildingsHtml = "";
            if (data.upgrades) {
                let upgArray = Array.isArray(data.upgrades) ? data.upgrades : Object.values(data.upgrades);
                upgArray.forEach(u => { if (u.owned > 0) { let def = defaultUpgrades.find(d => d.id === u.id); if (def) buildingsHtml += `<div style="display:inline-block; width: 48%; margin-bottom: 2px;">${def.icon} ${def.name}: <b>${u.owned} db</b></div>`; } });
            }
            if (buildingsHtml === "") buildingsHtml = "Nincs még épülete.";

            let extrasHtml = "";
            if (data.realUpgrades) {
                let extraArray = Array.isArray(data.realUpgrades) ? data.realUpgrades : Object.values(data.realUpgrades);
                extraArray.forEach(ru => { let searchId = typeof ru === 'object' ? ru.id : ru; let def = extraUpgradesData.find(e => e.id === searchId); if (def) extrasHtml += `<span style="color:#1565c0;">${def.name}</span>, `; });
            }
            extrasHtml = extrasHtml !== "" ? extrasHtml.slice(0, -2) : "Nincs extra fejlesztés.";

            let skillsHtml = "";
            if (data.prestigeSkills) {
                let skillsArray = Array.isArray(data.prestigeSkills) ? data.prestigeSkills : Object.values(data.prestigeSkills);
                let skillCounts = {};
                skillsArray.forEach(sid => { skillCounts[sid] = (skillCounts[sid] || 0) + 1; });
                for (let sid in skillCounts) { let def = prestigeSkillsData.find(s => s.id == sid); if (def) skillsHtml += `<span style="color:#d32f2f;">${def.name}</span> <b>(Lvl ${skillCounts[sid]})</b>, `; }
            }
            skillsHtml = skillsHtml !== "" ? skillsHtml.slice(0, -2) : "Nincs feloldott skill.";

            document.getElementById('spectate-content').innerHTML = `
                <div style="font-size: 15px;">
                    <b>🚲 Bicikli:</b> ${Math.floor(data.bikes || 0).toLocaleString()}<br>
                    <b>⚡ BPS:</b> ${Math.floor(data.bps || 0).toLocaleString()} / mp<br>
                    <b>🎒 Cuccok:</b> ${inventoryHtml}<br>
                </div>
                <hr style="margin: 8px 0; border: 1px solid #ccc;">
                <div style="max-height: 80px; overflow-y: auto; background:#fff; padding:5px; font-size:13px; border: 1px solid #ddd;"><b style="color:#2e7d32;">🏢 ÉPÜLETEK:</b><br>${buildingsHtml}</div>
                <div style="margin-top:5px; max-height: 60px; overflow-y: auto; background:#fff; padding:5px; font-size:13px; border: 1px solid #ddd;"><b style="color:#1565c0;">🛠️ EXTRÁK:</b><br>${extrasHtml}</div>
                <div style="margin-top:5px; max-height: 60px; overflow-y: auto; background:#fff; padding:5px; font-size:13px; border: 1px solid #ddd;"><b style="color:#d32f2f;">🌌 SKILLEK:</b><br>${skillsHtml}</div>
                <hr style="margin: 8px 0; border: 1px solid #ccc;">
                <b style="font-size: 14px;">🕒 Utolsó mentés:</b> <span style="font-size: 14px; color:#555;">${lastOnline}</span>
            `;
            document.getElementById('spectate-modal').style.display = 'flex';
        } else showToast("❌ Nem található adat!");
    } catch (e) { console.error(e); }
};

window.addEventListener('keydown', (e) => {
    if(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        if (GameState.currentUser !== "zotyi") { showToast("❌ Nincs jogosultságod az Admin Panelhez!"); return; }
        const panel = document.getElementById('admin-panel'); panel.style.display = (panel.style.display === 'none') ? 'block' : 'none';
    }
});

window.adminAddBikes = function() { const val = parseInt(document.getElementById('admin-bike-amount').value); if(!isNaN(val)) { GameState.bikes += val; GameState.lifetimeBikes += val; window.updateUI(); saveUserProgress(); } };
window.resetLeaderboard = async function() {
    if (confirm("BIZTOSAN törlöd a teljes rangsort MINDENKINÉL?")) {
        GameState.bikes = 0; GameState.lifetimeBikes = 0; GameState.goldenSpokes = 0; GameState.prestigeCount = 0; GameState.bps = 0;
        await set(ref(db, 'users/'), null); await set(ref(db, 'admin/reset'), Date.now()); 
        localStorage.removeItem(`martinGame_user_${GameState.currentUser}`); location.reload();
    }
};
window.triggerUpdateNotification = function() { if(confirm("Értesítést küldesz mindenkinek a frissítésről?")) { set(ref(db, 'admin/updateSignal'), Date.now()); alert("Jelzés kiküldve!"); } };
window.forceGoldenBike = function() { const b = document.getElementById('golden-bike'); b.style.top = Math.random()*50+25+"%"; b.style.display='block'; b.style.animation='none'; b.offsetHeight; b.style.animation='goldenFloat 10s linear forwards'; setTimeout(()=>b.style.display='none', 10000); };
window.forceRustyBike = function() { const b = document.getElementById('rusty-bike'); b.style.top = Math.random()*50+25+"%"; b.style.display='block'; b.style.animation='none'; b.offsetHeight; b.style.animation='goldenFloat 10s linear forwards'; setTimeout(()=>b.style.display='none', 10000); };
window.forceCloud = function() { window.spawnMagicCloud(); };
window.forcePuke = function() { window.spawnPukeEvent(); };
window.forceAimlabEvent = function() { const o = document.getElementById('aimlab-event-obj'); o.style.top = Math.random()*50+25+"%"; o.style.display='block'; o.style.animation='none'; o.offsetHeight; o.style.animation='goldenFloat 10s linear forwards'; setTimeout(()=>o.style.display='none', 10000); };
window.forceMartinReminder = function() { const rem = document.getElementById('martin-reminder'); if (!rem) return; rem.style.display = 'flex'; rem.style.opacity = '0'; rem.style.transition = 'opacity 0.3s ease'; rem.offsetHeight; rem.style.opacity = '1'; setTimeout(() => { rem.style.opacity = '0'; setTimeout(() => { rem.style.display = 'none'; }, 300); }, 15000); };
window.forceHarry = function() { const hp = document.getElementById('harry-potter-event'); hp.style.display='block'; hp.style.animation='none'; hp.offsetHeight; hp.style.animation='hpErraticFly 10s linear forwards'; setTimeout(()=>hp.style.display='none', 10000); };