import { GameState, db, showToast, saveUserProgress, setUpdateUI } from './state.js';
import { defaultUpgrades, extraUpgradesData, prestigeSkillsData, rpgItems, achievements, newsItems } from './data.js';
import { openAimlab, startAimlab } from './modules/aimlab.js';
import { initWheel, spinWheel } from './modules/wheel.js';
import { checkClickCheat, checkTimeCheat, checkEconomyCheat } from './modules/anticheat.js';
import { initMartinEasterEgg } from './modules/martinbg.js';
import { ref, onValue, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

import './modules/admin.js';
import './modules/events.js';
import './modules/prestige.js';

// --- GLOBÁLIS VÁLTOZÓK ---
window.appInitTime = Date.now();
window.activeBuffs = [];
window.multiplier = 1;
window.clickMultiplier = 1;
window.seasonBpsMult = 1;
window.seasonClickMult = 1;
window.isNightMode = false;
window.isKitchenMeetingActive = false;
window.isPukeEventActive = false;
let lastBuildingSum = -1;

// --- KÜLLŐ MATEK (MILLIÓS CÉLOKRA SKÁLÁZVA) ---
window.calculateKullok = function() {
    // 1 Küllő = 1 Millió, 2 Küllő = 4 Millió, 3 Küllő = 9 Millió...
    return Math.floor(Math.pow(GameState.lifetimeBikes / 1000000, 0.5));
};

// --- GOMBOK ÖSSZEKÖTÉSE A HTML-EL ---
window.openAimlab = openAimlab;
window.startAimlab = startAimlab;
window.spinWheel = spinWheel;
window.toggleMute = function() {};

// --- HÍRSZALAG (TICKER) ---
const tickerEl = document.getElementById('news-ticker-text');
if (tickerEl) {
    tickerEl.innerText = newsItems[Math.floor(Math.random() * newsItems.length)];
    tickerEl.addEventListener('animationiteration', () => { tickerEl.innerText = newsItems[Math.floor(Math.random() * newsItems.length)]; });
}

// --- VIZUÁLIS FÜGGVÉNYEK ---
window.createFloatingNumber = function(x, y, amount) {
    const el = document.createElement('div'); el.className = 'floating-number'; el.innerText = `+${Math.floor(amount)}`;
    el.style.left = (x - 40) + 'px'; el.style.top = (y - 30) + 'px'; document.body.appendChild(el); setTimeout(() => el.remove(), 1000);
};

window.createParticle = function(x, y) {
    const p = document.createElement('div'); p.className = 'particle'; p.innerText = Math.random() > 0.1 ? '🚲' : '🧀';
    p.style.left = (x - 15) + 'px'; p.style.top = (y - 15) + 'px';
    p.style.setProperty('--x', (Math.random() - 0.5) * 400 + "px"); p.style.setProperty('--y', (Math.random() - 0.8) * 400 + "px");
    document.body.appendChild(p); setTimeout(() => p.remove(), 800);
};

window.spawnConfetti = function() {
    for(let i=0; i<60; i++) {
        setTimeout(() => {
            const p = document.createElement('div'); p.className = 'confetti-particle'; p.innerText = ['✨','🎉','🎊','💰','🚲'][Math.floor(Math.random()*5)];
            p.style.left = (Math.random() * window.innerWidth) + 'px'; p.style.top = '-50px';
            p.style.setProperty('--x', (Math.random() - 0.5) * 500 + 'px'); p.style.setProperty('--y', (window.innerHeight + 100) + 'px');
            p.style.animationDuration = (Math.random() * 2 + 1.5) + 's'; document.body.appendChild(p); setTimeout(() => p.remove(), 3500);
        }, i * 30);
    }
};

window.updateInventoryUI = function() {
    const invTag = document.getElementById('inventory-list');
    if(GameState.inventory.length === 0) invTag.innerHTML = "Üres"; else invTag.innerHTML = GameState.inventory.map(id => rpgItems[id].icon).join(' ');
    document.getElementById('acc-helmet').style.display = GameState.inventory.includes('helmet') ? 'block' : 'none';
    document.getElementById('acc-chain').style.display = GameState.inventory.includes('chain') ? 'block' : 'none';
};

window.dropRPGItem = function() {
    const items = Object.keys(rpgItems); const unowned = items.filter(id => !GameState.inventory.includes(id));
    if(unowned.length > 0 && Math.random() < 0.1) { 
        const droppedId = unowned[Math.floor(Math.random() * unowned.length)]; GameState.inventory.push(droppedId); 
        showToast(`🎒 ÚJ FELSZERELÉS TALÁLVA!\n${rpgItems[droppedId].icon} ${rpgItems[droppedId].name}`);
        window.updateInventoryUI(); window.recalculateStats();
    }
};

window.recalculateStats = function() {
    let b = 0; let c = 1;
    if(GameState.inventory.includes('chain')) c += 50; if(GameState.inventory.includes('helmet')) c += 100;
    
    let sajtCount = GameState.upgrades.find(u => u.id === 6)?.owned || 0;
    let hasSajtSynergy = GameState.realUpgrades.some(ru => ru.id === 104);

    GameState.upgrades.forEach(u => {
        let basePower = defaultUpgrades.find(def => def.id === u.id).power; let upgMult = 1;
        GameState.realUpgrades.forEach(ru => { 
            let ext = extraUpgradesData.find(e => e.id === ru.id); 
            if(ext && ext.targetId === u.id) upgMult += (ext.mult - 1); 
        }); 
        if(u.id === 2 && hasSajtSynergy) { basePower += (100 * sajtCount); }
        let p = (basePower * upgMult) * u.owned;
        if(u.type === "bps") b += p; if(u.type === "click") c += p;
    });

    let doubleCount301 = GameState.prestigeSkills.filter(id => id === 301).length;
    let doubleCount302 = GameState.prestigeSkills.filter(id => id === 302).length;
    let darkMatterCount = GameState.prestigeSkills.filter(id => id === 404).length;
    let distinctBuildings = GameState.upgrades.filter(u => u.owned > 0 && u.type !== 'special').length;

    let spokeBonus = GameState.prestigeSkills.includes(304) ? (GameState.goldenSpokes * 0.02) : (GameState.goldenSpokes * 0.01);
    let treeBonus = (doubleCount301 * 1.0) + (doubleCount302 * 1.0); 
    let supplyBonus = GameState.prestigeSkills.includes(210) ? (distinctBuildings * 0.05) : 0;
    let infiniteBonus = darkMatterCount * 0.10;
    
    let prestigeMult = 1 + spokeBonus + treeBonus + supplyBonus + infiniteBonus;
    let eszterMult = GameState.upgrades.find(u => u.id === 7)?.owned > 0 ? 2 : 1;
    
    GameState.bps = b * prestigeMult * eszterMult * window.seasonBpsMult;
    let clickBase = c * prestigeMult * eszterMult * window.seasonClickMult;
    if (GameState.prestigeSkills.includes(205)) { clickBase += (GameState.bps * 0.01); }
    GameState.clickPower = clickBase;
};

window.recalcMultiplier = function() {
    let eb = 1; let ec = 1; let bz = false; let cz = false; let texts = []; let color = "white"; let now = Date.now();
    window.activeBuffs = window.activeBuffs.filter(b => b.endTime > now);

    window.activeBuffs.forEach(b => {
        if (b.target === 'both') { if (b.mult === 0) { bz = true; cz = true; } else { eb += (b.mult - 1); ec += (b.mult - 1); } }
        else if (b.target === 'click') { if (b.mult === 0) cz = true; else ec += (b.mult - 1); }
        else { if (b.mult === 0) bz = true; else eb += (b.mult - 1); }
        texts.push(b.text); color = b.color;
    });

    window.multiplier = bz ? 0 : Math.max(1, eb);
    window.clickMultiplier = cz ? 0 : Math.max(1, ec);

    const infoDiv = document.getElementById('multiplier-info');
    if (window.activeBuffs.length > 0) {
        infoDiv.innerHTML = texts.join('<br>'); infoDiv.style.color = color; infoDiv.style.display = 'block';
        if (window.multiplier > 1 || window.clickMultiplier > 1) document.getElementById('game-world').classList.add('world-golden');
    } else { infoDiv.style.display = 'none'; document.getElementById('game-world').classList.remove('world-golden'); }
};

window.updateBuildingsVisuals = function() {
    const container = document.getElementById('buildings-layer'); container.innerHTML = '';
    GameState.upgrades.forEach(upg => {
        if(upg.type === "special") return;
        let count = Math.min(upg.owned, 15);
        for(let i=0; i<count; i++) { let el = document.createElement('div'); el.className = 'building-sprite'; el.innerText = upg.icon; el.style.animationDelay = (Math.random() * 0.5) + 's'; container.appendChild(el); }
    });
};

window.updateUI = function() {
    document.getElementById('bike-count').innerText = Math.floor(GameState.bikes).toLocaleString();
    document.getElementById('bps-count').innerText = "Biciklik másodpercenként: " + Math.floor(GameState.bps * window.multiplier).toLocaleString();
    const presCountUI = document.getElementById('prestige-count');
    if(GameState.goldenSpokes > 0 || GameState.prestigeSkills.length > 0) { presCountUI.style.display = 'block'; presCountUI.innerText = `✨ Arany Küllők: ${GameState.goldenSpokes} (+${GameState.goldenSpokes}%)`; }

    let hasEszterDiscount = GameState.prestigeSkills.includes(203); let hasKupon = GameState.prestigeSkills.includes(207); let currentBuildingSum = 0;

    GameState.upgrades.forEach(upg => {
        currentBuildingSum += upg.owned; const item = document.getElementById(`upg-item-${upg.id}`);
        if (item) {
            let actualCost = upg.cost; if(upg.id === 7 && hasEszterDiscount) actualCost *= 0.8; else if (upg.id !== 7 && hasKupon) actualCost *= 0.9; 
            item.className = 'upgrade-item ' + (GameState.bikes >= actualCost ? 'affordable' : 'disabled');
            document.getElementById(`upg-desc-${upg.id}`).innerText = upg.type !== "special" ? `+${Math.ceil(upg.power).toLocaleString()} pont ${upg.type === 'click' ? 'katt.' : '/ mp'}` : upg.desc;
            document.getElementById(`upg-cost-${upg.id}`).innerText = Math.floor(actualCost).toLocaleString() + " 🚲";
            document.getElementById(`upg-owned-${upg.id}`).innerText = upg.owned;
            if (upg.id === 7 && upg.owned > 0) { document.getElementById('motivation-banner').style.display = 'block'; item.style.display = 'none'; }
        }
    });

    if (currentBuildingSum !== lastBuildingSum) { window.updateBuildingsVisuals(); lastBuildingSum = currentBuildingSum; }

    const extraList = document.getElementById('extra-upgrades-list');
    extraUpgradesData.forEach(ext => {
        let isOwned = GameState.realUpgrades.some(ru => ru.id === ext.id); let reqCount = GameState.upgrades.find(u => u.id === ext.reqBuilding)?.owned || 0;
        let el = document.getElementById(`extra-upg-${ext.id}`);
        if (!isOwned && (reqCount >= ext.reqCount)) {
            if (!el) {
                el = document.createElement('div'); el.id = `extra-upg-${ext.id}`; el.onclick = () => window.buyExtraUpgrade(ext.id);
                el.innerHTML = `<b>${ext.name}</b><br><span style="color:#78909c;">${ext.desc}</span><br><b style="color:#d32f2f; font-family:'Bangers'; font-size:16px;">${ext.cost.toLocaleString()} 🚲</b>`;
                extraList.appendChild(el);
            }
            el.className = 'extra-upgrade-item ' + (GameState.bikes >= ext.cost ? 'affordable' : 'disabled');
        } else if (el) el.remove();
    });

    const prestigePoints = window.calculateKullok();
    if (prestigePoints > 0) { document.getElementById('btn-prestige').style.display = 'block'; document.getElementById('btn-prestige').innerText = `✨ ÚJRASZÜLETÉS (+${prestigePoints} Küllő)`; }
    if (!window.aimlabActive) { const costEl = document.getElementById('aimlab-cost'); if (costEl) costEl.innerText = Math.floor(GameState.bikes * 0.9).toLocaleString(); }
};
setUpdateUI(window.updateUI); 

// --- JÁTÉK LOGIKA ÉS VÁSÁRLÁS ---
window.clickMartin = function(e) {
    if (window.isKitchenMeetingActive) { showToast("☕ Martin a konyhában van!"); return; }
    if (checkClickCheat()) return;
    let gained = (GameState.clickPower * window.clickMultiplier); 
    GameState.bikes += gained; GameState.lifetimeBikes += gained; 
    window.createFloatingNumber(e.clientX, e.clientY, gained); window.createParticle(e.clientX, e.clientY); window.updateUI();
};

window.buyUpgrade = function(id) {
    const upg = GameState.upgrades.find(u => u.id === id); let actualCost = upg.cost;
    if(id === 7 && GameState.prestigeSkills.includes(203)) actualCost *= 0.8; else if(id !== 7 && GameState.prestigeSkills.includes(207)) actualCost *= 0.9;
    if (GameState.bikes >= actualCost) {
        GameState.bikes -= actualCost; upg.owned++;
        
        // --- HARDCORE INFLÁCIÓ: 22%-OS ÁREMELKEDÉS! ---
        if (upg.type !== "special") upg.cost = Math.floor(upg.cost * 1.22); 
        
        window.recalculateStats(); window.updateUI(); saveUserProgress();
    }
};

window.buyExtraUpgrade = function(id) {
    const ext = extraUpgradesData.find(e => e.id === id);
    if (GameState.bikes >= ext.cost) {
        GameState.bikes -= ext.cost; GameState.realUpgrades.push({ id: id });
        showToast(`✨ Új Fejlesztés: ${ext.name}!`); window.recalculateStats(); window.updateUI(); saveUserProgress();
    }
};

// --- BETÖLTÉS ÉS BEJELENTKEZÉS ---
function checkSeasons() {
    const d = new Date(); const day = d.getDay(); const hour = d.getHours(); let sTxt = "";
    window.seasonBpsMult = 1; window.seasonClickMult = 1; window.isNightMode = false; document.body.classList.remove('night-mode');
    if(day === 0) { window.seasonBpsMult = 1.1; sTxt += "☀️ Vasárnapi Pihenő (+10% BPS) "; }
    if(day === 5) { window.seasonClickMult = 1.2; sTxt += "🔥 Pénteki Őrület (+20% Kattintás) "; }
    if(hour >= 20 || hour < 6) { window.isNightMode = true; document.body.classList.add('night-mode'); sTxt += "🌙 Éjszakai Műszak (Gyakoribb felhők) "; }
    if(sTxt !== "") { const banner = document.getElementById('season-banner'); banner.innerText = sTxt; banner.style.display = 'block'; }
}

function initShopUI() {
    const list = document.getElementById('upgrade-list'); list.innerHTML = "";
    GameState.upgrades = JSON.parse(JSON.stringify(defaultUpgrades));
    GameState.upgrades.forEach(upg => {
        const div = document.createElement('div'); div.id = `upg-item-${upg.id}`; div.className = 'upgrade-item disabled'; div.onclick = () => window.buyUpgrade(upg.id);
        div.innerHTML = `<div class="upgrade-icon">${upg.icon}</div><div class="upgrade-info"><span class="upgrade-name">${upg.name}</span><span class="upgrade-desc" id="upg-desc-${upg.id}"></span><span class="upgrade-cost" id="upg-cost-${upg.id}"></span></div><div class="upgrade-owned" id="upg-owned-${upg.id}">0</div>`;
        list.appendChild(div);
    });
}

async function loadUserProgressFromDB() {
    GameState.upgrades = JSON.parse(JSON.stringify(defaultUpgrades));
    let resetTime = 0, firebaseData = null, localData = null;
    try { const resetSnap = await get(child(ref(db), 'admin/reset')); if (resetSnap.exists()) resetTime = resetSnap.val(); } catch(e) {}
    try { const snap = await get(child(ref(db), `users/${GameState.currentUser}`)); if (snap.exists()) firebaseData = snap.val(); } catch (e) {}
    try { const localRaw = localStorage.getItem(`martinGame_user_${GameState.currentUser}`); if (localRaw) localData = JSON.parse(localRaw); } catch (e) {}

    let parsed = (firebaseData && localData) ? ((firebaseData.lastSaved > localData.lastSaved) ? firebaseData : localData) : (firebaseData || localData);
    if (resetTime > 0 && ((firebaseData === null && localData !== null) || (parsed && (!parsed.lastSaved || parsed.lastSaved < resetTime)))) parsed = null;

    if (parsed) {
        Object.assign(GameState, {
            password: parsed.password || GameState.password, lastSaved: parsed.lastSaved || 0,
            bikes: parsed.bikes || 0, lifetimeBikes: parsed.lifetimeBikes || parsed.bikes || 0,
            goldenSpokes: parsed.goldenSpokes || 0, prestigeCount: parsed.prestigeCount || 0,
            realUpgrades: Array.isArray(parsed.realUpgrades) ? parsed.realUpgrades : Object.values(parsed.realUpgrades || {}),
            prestigeSkills: Array.isArray(parsed.prestigeSkills) ? parsed.prestigeSkills : Object.values(parsed.prestigeSkills || {}),
            inventory: Array.isArray(parsed.inventory) ? parsed.inventory : Object.values(parsed.inventory || {}),
            achievements: Array.isArray(parsed.achievements) ? parsed.achievements : []
        });

        if (GameState.achievements.length > 0) achievements.forEach((ach, i) => ach.done = GameState.achievements[i] || false); else achievements.forEach(a => a.done = false);

        let loadedUpgrades = Array.isArray(parsed.upgrades) ? parsed.upgrades : Object.values(parsed.upgrades || {});
        if (loadedUpgrades.length > 0) {
            GameState.upgrades.forEach(u => {
                const savedU = loadedUpgrades.find(s => s.id === u.id);
                if (savedU) { 
                    u.owned = savedU.owned || 0; const def = defaultUpgrades.find(d => d.id === u.id);
                    // MENTÉSNÉL IS AZ ÚJ 22%-OS INFLÁCIÓT SZÁMOLJUK
                    u.cost = (def && def.type !== "special") ? Math.floor(def.cost * Math.pow(1.22, u.owned)) : (savedU.cost || u.cost);
                }
            });
        }
        if (parsed.lastSaved) {
            let secondsOffline = checkTimeCheat(parsed.lastSaved); 
            if (secondsOffline > 60) { 
                window.recalculateStats(); let offlineGains = GameState.bps * secondsOffline;
                if (offlineGains > 0) { GameState.bikes += offlineGains; GameState.lifetimeBikes += offlineGains; showToast(`😴 Távolléted alatt termeltél:\n+${Math.floor(offlineGains).toLocaleString()} 🚲`); }
            }
        }
    } else {
        Object.assign(GameState, { bikes: 0, lifetimeBikes: 0, goldenSpokes: 0, prestigeCount: 0, bps: 0, clickPower: 1, realUpgrades: [], prestigeSkills: [], inventory: [], achievements: [] });
        achievements.forEach(a => a.done = false); localStorage.removeItem(`martinGame_user_${GameState.currentUser}`);
    }
    window.updateInventoryUI(); window.recalculateStats(); window.updateUI();
}

window.login = async function() {
    const usr = document.getElementById('username-input').value.trim(); const pwd = document.getElementById('password-input').value.trim(); 
    if (usr.length < 2 || pwd.length < 3) { showToast("Rövid név vagy jelszó!"); return; }
    
    const btn = document.getElementById('btn-login'); btn.innerText = "Ellenőrzés..."; btn.disabled = true;
    try {
        const snap = await get(child(ref(db), `users/${usr}/password`));
        if (snap.exists() && snap.val() !== pwd) { alert("❌ HIBÁS JELSZÓ!"); btn.innerText = "BELÉPÉS"; btn.disabled = false; return; }
    } catch (e) { console.error(e); }

    GameState.currentUser = usr; GameState.password = pwd; btn.innerText = "Betöltés...";
    
    onValue(ref(db, 'admin/reset'), (snap) => { if (snap.val() && snap.val() > window.appInitTime) { alert("Szerver törölve!"); location.reload(); } });
    onValue(ref(db, 'admin/updateSignal'), (snap) => {
        if (snap.val() && snap.val() > window.appInitTime) {
            const banner = document.createElement('div'); banner.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:#d32f2f; color:white; text-align:center; padding:15px; font-family:"Bangers"; font-size:24px; z-index:99999;';
            banner.innerHTML = `⚠️ ÚJ FRISSÍTÉS! FRISSÍTS (F5)! <button onclick="location.reload()" style="padding:5px 15px; margin-left:10px;">FRISSÍTÉS MOST</button>`;
            document.body.appendChild(banner);
        }
    });

    checkSeasons(); initShopUI(); await loadUserProgressFromDB();
    document.getElementById('current-user-display').innerText = GameState.currentUser;
    document.getElementById('login-screen').style.display = 'none'; document.getElementById('game-container').style.display = 'flex';

    window.initLeaderboard(); initMartinEasterEgg();
    
    setInterval(() => {
        window.recalcMultiplier();
        if (!window.isKitchenMeetingActive) { let gained = ((GameState.bps * window.multiplier) / 10); GameState.bikes += gained; GameState.lifetimeBikes += gained; window.updateUI(); }
    }, 100);

    setInterval(() => { if (!checkEconomyCheat()) saveUserProgress(); }, 5000);

    setInterval(() => {
        if (GameState.prestigeSkills.includes(405) && !window.isKitchenMeetingActive && document.getElementById('game-container').style.display !== 'none') {
            let gained = (GameState.clickPower * window.clickMultiplier); GameState.bikes += gained; GameState.lifetimeBikes += gained; window.updateUI();
            const m = document.getElementById('martin-character'); if(m) { m.style.transform = 'scale(0.95)'; setTimeout(() => m.style.transform = 'scale(1)', 100); }
        }
    }, 500);

    setInterval(() => {
        let showTime = GameState.prestigeSkills.includes(204) ? 20000 : 15000;
        const bike = Math.random() < 0.3 ? document.getElementById('rusty-bike') : document.getElementById('golden-bike');
        bike.style.top = Math.random() * 50 + 25 + "%"; bike.style.display = 'block'; bike.style.animation = 'none'; bike.offsetHeight; 
        bike.style.animation = `goldenFloat ${showTime / 1000}s linear forwards`; setTimeout(() => { bike.style.display = 'none'; }, showTime); 
    }, Math.random() * 300000 + (GameState.prestigeSkills.includes(202) ? 150000 : 300000));

    setInterval(() => {
        const hp = document.getElementById('harry-potter-event'); hp.style.display = 'block'; hp.style.animation = 'none'; hp.offsetHeight; 
        hp.style.animation = 'hpErraticFly 10s linear forwards'; setTimeout(() => { hp.style.display = 'none'; }, 10000); 
    }, Math.random() * 300000 + 400000);

    setInterval(() => {
        const orb = document.getElementById('aimlab-event-obj'); orb.style.top = Math.random() * 50 + 25 + "%"; orb.style.display = 'block';
        orb.style.animation = 'none'; orb.offsetHeight; orb.style.animation = `goldenFloat 15s linear forwards`; setTimeout(() => { orb.style.display = 'none'; }, 15000); 
    }, Math.random() * 240000 + 240000);

    setInterval(() => { window.spawnPukeEvent(); }, Math.random() * 300000 + 300000);
    setInterval(() => { if (!window.isKitchenMeetingActive) window.triggerKitchenMeeting(); }, Math.random() * 600000 + 600000);
    function cloudLoop() { let baseTime = Math.random() * 300000 + 180000; if(GameState.prestigeSkills.includes(201)) baseTime *= 0.5; setTimeout(() => { window.spawnMagicCloud(); cloudLoop(); }, baseTime); }
    cloudLoop();
};

document.getElementById('username-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') window.login(); });
document.getElementById('password-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') window.login(); });

setInterval(() => {
    if (!GameState.currentUser || document.getElementById('game-container').style.display === 'none') return;
    let changed = false;
    achievements.forEach(ach => {
        if (GameState.lifetimeBikes >= ach.threshold && !ach.done) {
            ach.done = true; changed = true; GameState.bikes += ach.reward; GameState.lifetimeBikes += ach.reward;
            showToast(`🏆 SIKER ELÉRVE: ${ach.name}!\n🎁 Jutalom: +${ach.reward.toLocaleString()} 🚲`);
        }
    });
    if(changed) { GameState.achievements = achievements.map(a => a.done); saveUserProgress(); }
}, 1000);

initWheel();