import { 
    GameState, db, showToast, saveUserProgress, setUpdateUI 
} from './state.js';
import { 
    defaultUpgrades, extraUpgradesData, prestigeSkillsData, rpgItems, achievements 
} from './data.js';
import { openAimlab, startAimlab } from './modules/aimlab.js';
import { initWheel, spinWheel } from './modules/wheel.js';
import { ref, onValue, get, child, set, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- GLOBÁLIS VÁLTOZÓK ---
const appInitTime = Date.now();
let activeBuffs = [];
let multiplier = 1;
window.clickMultiplier = 1;
let seasonBpsMult = 1;
let seasonClickMult = 1;
let isNightMode = false;
let lastBuildingSum = -1;
let isKitchenMeetingActive = false;
let kitchenMeetingInterval;
let isPukeEventActive = false;
window.mpTarget = "";

// --- GOMBOK ÖSSZEKÖTÉSE A HTML-EL ---
window.openAimlab = openAimlab;
window.startAimlab = startAimlab;
window.spinWheel = spinWheel;

window.toggleMute = function() {
    // Üres funkció, hogy ne adjon hibát a HTML gomb
};

// --- SEGÉDFUNKCIÓK (UI ÉS GRAFIKA) ---

function createFloatingNumber(x, y, amount) {
    const el = document.createElement('div');
    el.className = 'floating-number';
    el.innerText = `+${Math.floor(amount)}`;
    el.style.left = (x - 40) + 'px'; el.style.top = (y - 30) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function createParticle(x, y) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.innerText = Math.random() > 0.1 ? '🚲' : '🧀';
    p.style.left = (x - 15) + 'px'; p.style.top = (y - 15) + 'px';
    p.style.setProperty('--x', (Math.random() - 0.5) * 400 + "px");
    p.style.setProperty('--y', (Math.random() - 0.8) * 400 + "px");
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
}

function spawnConfetti() {
    for(let i=0; i<60; i++) {
        setTimeout(() => {
            const p = document.createElement('div');
            p.className = 'confetti-particle';
            p.innerText = ['✨','🎉','🎊','💰','🚲'][Math.floor(Math.random()*5)];
            p.style.left = (Math.random() * window.innerWidth) + 'px';
            p.style.top = '-50px';
            p.style.setProperty('--x', (Math.random() - 0.5) * 500 + 'px');
            p.style.setProperty('--y', (window.innerHeight + 100) + 'px');
            p.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 3500);
        }, i * 30);
    }
}

// --- FELSZERELÉS ÉS STATISZTIKA ---

function updateInventoryUI() {
    const invTag = document.getElementById('inventory-list');
    if(GameState.inventory.length === 0) invTag.innerHTML = "Üres"; 
    else invTag.innerHTML = GameState.inventory.map(id => rpgItems[id].icon).join(' ');
    document.getElementById('acc-helmet').style.display = GameState.inventory.includes('helmet') ? 'block' : 'none';
    document.getElementById('acc-chain').style.display = GameState.inventory.includes('chain') ? 'block' : 'none';
}

function dropRPGItem() {
    const items = Object.keys(rpgItems);
    const unowned = items.filter(id => !GameState.inventory.includes(id));
    if(unowned.length > 0 && Math.random() < 0.1) { 
        const droppedId = unowned[Math.floor(Math.random() * unowned.length)];
        GameState.inventory.push(droppedId); 
        showToast(`🎒 ÚJ FELSZERELÉS TALÁLVA!\n${rpgItems[droppedId].icon} ${rpgItems[droppedId].name}\n(${rpgItems[droppedId].desc})`);
        updateInventoryUI(); recalculateStats();
    }
}

function recalculateStats() {
    let b = 0; let c = 1;
    if(GameState.inventory.includes('chain')) c += 50;
    if(GameState.inventory.includes('helmet')) c += 100;
    
    let sajtCount = GameState.upgrades.find(u => u.id === 6)?.owned || 0;
    let hasSajtSynergy = GameState.realUpgrades.some(ru => ru.id === 104);

    GameState.upgrades.forEach(u => {
        let basePower = defaultUpgrades.find(def => def.id === u.id).power;
        let upgMult = 1;
        GameState.realUpgrades.forEach(ru => {
            let ext = extraUpgradesData.find(e => e.id === ru.id);
            if(ext && ext.targetId === u.id) upgMult *= ext.mult;
        });
        if(u.id === 2 && hasSajtSynergy) { basePower += (100 * sajtCount); }
        let p = (basePower * upgMult) * u.owned;
        if(u.type === "bps") b += p;
        if(u.type === "click") c += p;
    });

    let doubleCount301 = GameState.prestigeSkills.filter(id => id === 301).length;
    let doubleCount302 = GameState.prestigeSkills.filter(id => id === 302).length;
    let treeMult = Math.pow(2, doubleCount301) * Math.pow(2, doubleCount302);
    
    let distinctBuildings = GameState.upgrades.filter(u => u.owned > 0 && u.type !== 'special').length;
    let supplyMult = GameState.prestigeSkills.includes(210) ? (1 + (distinctBuildings * 0.05)) : 1;
    
    let prestigeMult = (1 + (GameState.goldenSpokes * 0.01)) * treeMult * supplyMult;
    let eszterMult = GameState.upgrades.find(u => u.id === 7)?.owned > 0 ? 2 : 1;
    
    GameState.bps = b * prestigeMult * eszterMult * seasonBpsMult;
    let clickBase = c * prestigeMult * eszterMult * seasonClickMult;
    if (GameState.prestigeSkills.includes(205)) { clickBase += (GameState.bps * 0.01); }
    GameState.clickPower = clickBase;
}

function recalcMultiplier() {
    let eb = 1; let ec = 1; let bz = false; let cz = false;
    let texts = []; let color = "white";
    let now = Date.now();
    activeBuffs = activeBuffs.filter(b => b.endTime > now);

    activeBuffs.forEach(b => {
        if (b.target === 'both') { if (b.mult === 0) { bz = true; cz = true; } else { eb *= b.mult; ec *= b.mult; } }
        else if (b.target === 'click') { if (b.mult === 0) cz = true; else ec *= b.mult; }
        else { if (b.mult === 0) bz = true; else eb *= b.mult; }
        texts.push(b.text); color = b.color;
    });

    multiplier = bz ? 0 : eb;
    window.clickMultiplier = cz ? 0 : ec;

    const infoDiv = document.getElementById('multiplier-info');
    if (activeBuffs.length > 0) {
        infoDiv.innerHTML = texts.join('<br>'); infoDiv.style.color = color; infoDiv.style.display = 'block';
        if (eb > 1 || ec > 1) document.getElementById('game-world').classList.add('world-golden');
    } else {
        infoDiv.style.display = 'none'; document.getElementById('game-world').classList.remove('world-golden');
    }
}

// --- RANGLISTA ---

function getRankEmoji(bps) {
    if(bps > 100000000) return "👑"; if(bps > 1000000) return "💎"; if(bps > 10000) return "🔥"; if(bps > 100) return "⭐"; return "🚲";
}

function initLeaderboard() {
    const leaderboardRef = ref(db, 'users/');
    onValue(leaderboardRef, (snapshot) => {
        const data = snapshot.val(); const listDiv = document.getElementById('leaderboard-list');
        if (!data) { listDiv.innerHTML = "<div style='text-align:center; padding:20px; font-weight:bold; color:#795548;'>Üres a ranglista!</div>"; return; }
        
        const usersArray = Object.keys(data).map(key => ({ 
            name: key, 
            bps: data[key].bps || 0,
            goldenSpokes: data[key].goldenSpokes || 0,
            prestigeCount: data[key].prestigeCount || 0
        })).sort((a, b) => (b.goldenSpokes - a.goldenSpokes) || (b.bps - a.bps));
        
        listDiv.innerHTML = "";
        usersArray.slice(0, 15).forEach((user, index) => {
            const div = document.createElement('div');
            let rankClass = index < 3 ? `rank-${index}` : '';
            let medalStr = index === 0 ? "🥇" : (index === 1 ? "🥈" : (index === 2 ? "🥉" : `<span style="font-family:'Bangers'; font-size:18px;">${index + 1}.</span>`));
            let rankEmoji = getRankEmoji(user.bps);
            
            div.className = `leader-item ${user.name === GameState.currentUser ? 'current-user' : ''} ${rankClass}`;
            div.onclick = function() { window.openInteractModal(user.name); };
            
            let prestigeHtml = `
                <div style="margin-top: 4px; font-size:12px; color:#555; font-family:'Fredoka', sans-serif; font-weight: 600; line-height: 1.2;">
                    🔄 <span style="color:#d32f2f;">${user.prestigeCount}x</span> Újrakezdve | ✨ <span style="color:#fbc02d;">${user.goldenSpokes}</span> Küllő
                </div>
            `;

            div.innerHTML = `
                <div style="flex:1;">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span class="rank-badge">${medalStr} ${rankEmoji}</span> 
                        <span style="font-size:17px;">${user.name}</span>
                    </div>
                    ${prestigeHtml}
                </div>
                <span style="font-family:'Bangers'; font-size:18px; color:#d32f2f; white-space: nowrap;">${Math.floor(user.bps).toLocaleString()} BPS</span>
            `;
            listDiv.appendChild(div);
        });
    });
}

// --- UI FRISSÍTÉS ÉS GRAFIKA ---

function updateBuildingsVisuals() {
    const container = document.getElementById('buildings-layer'); container.innerHTML = '';
    GameState.upgrades.forEach(upg => {
        if(upg.type === "special") return;
        let count = Math.min(upg.owned, 15);
        for(let i=0; i<count; i++) {
            let el = document.createElement('div'); el.className = 'building-sprite'; el.innerText = upg.icon; el.style.animationDelay = (Math.random() * 0.5) + 's'; 
            container.appendChild(el);
        }
    });
}

function updateUI() {
    document.getElementById('bike-count').innerText = Math.floor(GameState.bikes).toLocaleString();
    document.getElementById('bps-count').innerText = "Biciklik másodpercenként: " + Math.floor(GameState.bps * multiplier).toLocaleString();

    const presCountUI = document.getElementById('prestige-count');
    const ascInfoUI = document.getElementById('ascension-info');
    
    if(GameState.goldenSpokes > 0 || GameState.prestigeSkills.length > 0) {
        presCountUI.style.display = 'block';
        presCountUI.innerText = `✨ Arany Küllők: ${GameState.goldenSpokes} (+${GameState.goldenSpokes}%)`;
        
        let doubleCount301 = GameState.prestigeSkills.filter(id => id === 301).length;
        let doubleCount302 = GameState.prestigeSkills.filter(id => id === 302).length;
        let ascMult = Math.pow(2, doubleCount301) * Math.pow(2, doubleCount302);
        if(ascMult > 1) { ascInfoUI.style.display = 'block'; ascInfoUI.innerText = `🌌 Felemelkedés Szorzó: ${ascMult}x`; }
    }

    let hasEszterDiscount = GameState.prestigeSkills.includes(203);
    let hasKupon = GameState.prestigeSkills.includes(207);
    let currentBuildingSum = 0;

    GameState.upgrades.forEach(upg => {
        currentBuildingSum += upg.owned;
        const item = document.getElementById(`upg-item-${upg.id}`);
        if (item) {
            let actualCost = upg.cost;
            if(upg.id === 7 && hasEszterDiscount) actualCost *= 0.8;
            else if (upg.id !== 7 && hasKupon) actualCost *= 0.9; 
            
            let canAfford = GameState.bikes >= actualCost;
            item.className = 'upgrade-item ' + (canAfford ? 'affordable' : 'disabled');
            let descTxt = upg.type !== "special" ? `+${Math.ceil(upg.power).toLocaleString()} pont ${upg.type === 'click' ? 'katt.' : '/ mp'}` : upg.desc;
            document.getElementById(`upg-desc-${upg.id}`).innerText = descTxt;
            document.getElementById(`upg-cost-${upg.id}`).innerText = Math.floor(actualCost).toLocaleString() + " 🚲";
            document.getElementById(`upg-owned-${upg.id}`).innerText = upg.owned;
            
            if (upg.id === 7 && upg.owned > 0) {
                document.getElementById('motivation-banner').style.display = 'block';
                item.style.display = 'none';
            }
        }
    });

    if (currentBuildingSum !== lastBuildingSum) { updateBuildingsVisuals(); lastBuildingSum = currentBuildingSum; }

    const extraList = document.getElementById('extra-upgrades-list');
    extraUpgradesData.forEach(ext => {
        let el = document.getElementById(`extra-upg-${ext.id}`);
        let isOwned = GameState.realUpgrades.some(ru => ru.id === ext.id);
        let reqBuildingCount = GameState.upgrades.find(u => u.id === ext.reqBuilding)?.owned || 0;
        let shouldShow = !isOwned && (reqBuildingCount >= ext.reqCount);

        if (shouldShow) {
            if (!el) {
                el = document.createElement('div'); el.id = `extra-upg-${ext.id}`; el.onclick = () => window.buyExtraUpgrade(ext.id);
                el.innerHTML = `<b>${ext.name}</b><br><span style="color:#78909c;">${ext.desc}</span><br><b style="color:#d32f2f; font-family:'Bangers'; font-size:16px;">${ext.cost.toLocaleString()} 🚲</b>`;
                extraList.appendChild(el);
            }
            let canAfford = GameState.bikes >= ext.cost; el.className = 'extra-upgrade-item ' + (canAfford ? 'affordable' : 'disabled');
        } else { if (el) el.remove(); }
    });

    const prestigePoints = Math.floor(GameState.lifetimeBikes / 1000000000);
    if (prestigePoints > 0) { document.getElementById('btn-prestige').style.display = 'block'; document.getElementById('btn-prestige').innerText = `✨ ÚJRASZÜLETÉS (+${prestigePoints} Küllő)`; }
}
setUpdateUI(updateUI); 

// --- BOLT ÉS VÁSÁRLÁS ---

window.clickMartin = function(e) {
    if (isKitchenMeetingActive) { showToast("☕ Martin a konyhában van, most nem tudsz kattintani!"); return; }
    let gained = (GameState.clickPower * window.clickMultiplier); 
    GameState.bikes += gained; GameState.lifetimeBikes += gained; 
    createFloatingNumber(e.clientX, e.clientY, gained); createParticle(e.clientX, e.clientY); updateUI();
};

window.buyUpgrade = function(id) {
    const upg = GameState.upgrades.find(u => u.id === id);
    let actualCost = upg.cost;
    let hasKupon = GameState.prestigeSkills.includes(207);
    if(id === 7 && GameState.prestigeSkills.includes(203)) actualCost *= 0.8;
    else if(id !== 7 && hasKupon) actualCost *= 0.9;
    
    if (GameState.bikes >= actualCost) {
        GameState.bikes -= actualCost; upg.owned++;
        if (upg.type !== "special") upg.cost *= 1.15;
        recalculateStats(); updateUI(); saveUserProgress();
    }
};

window.buyExtraUpgrade = function(id) {
    const ext = extraUpgradesData.find(e => e.id === id);
    if (GameState.bikes >= ext.cost) {
        GameState.bikes -= ext.cost; GameState.realUpgrades.push({ id: id });
        showToast(`✨ Új Fejlesztés: ${ext.name}!`); recalculateStats(); updateUI(); saveUserProgress();
    }
};

// --- SKILL TREE (PRESZTÍZS) ---

window.openPrestigeShop = function() {
    document.getElementById('modal-kullok').innerText = GameState.goldenSpokes;
    const container = document.getElementById('skill-tree-container');
    
    let svgHTML = '<svg width="100%" height="100%" style="position:absolute; top:0; left:0; z-index:1; pointer-events:none;">';
    let nodesHTML = '';

    prestigeSkillsData.forEach(sk => {
        let ownedCount = GameState.prestigeSkills.filter(sid => sid === sk.id).length;
        let isOwned = sk.repeatable ? ownedCount > 0 : ownedCount > 0;
        let cost = sk.repeatable ? sk.baseCost * Math.pow(2, ownedCount) : sk.baseCost;
        
        let reqMet = true;
        if (sk.req) {
            reqMet = GameState.prestigeSkills.includes(sk.req);
            let reqSk = prestigeSkillsData.find(s => s.id === sk.req);
            if (reqSk) {
                let strokeColor = reqMet ? "#ffc107" : "#555";
                svgHTML += `<line class="tree-line" x1="${reqSk.x}%" y1="${reqSk.y}%" x2="${sk.x}%" y2="${sk.y}%" stroke="${strokeColor}" stroke-width="4" />`;
            }
        }
        
        let aff = GameState.goldenSpokes >= cost;
        let statusClass = "locked";
        if (reqMet) statusClass = aff ? "affordable" : "unaffordable";
        if (isOwned && !sk.repeatable) statusClass = "owned";
        if (isOwned && sk.repeatable) statusClass = aff ? "owned affordable" : "owned"; 

        let btnTxt = (isOwned && !sk.repeatable) ? "Megvan" : `${cost} Küllő`;
        let levelTxt = sk.repeatable ? `<div style="color:#00e5ff; font-weight:bold; margin-top:2px;">Szint: ${ownedCount}</div>` : "";

        nodesHTML += `
            <div class="tree-node ${statusClass}" style="left:${sk.x}%; top:${sk.y}%;" onclick="window.buySkill(${sk.id})">
                <strong style="font-family:'Bangers'; font-size:18px; letter-spacing:1px; color:#fff;">${sk.name}</strong>
                ${levelTxt}
                <div style="font-size:11px; margin:5px 0; color:#ddd; line-height:1.2;">${sk.desc}</div>
                <button class="btn-primary" style="font-size:14px; padding:6px; margin-top:5px; box-shadow:0 2px 0 #1b5e20;" ${(aff && reqMet && (!isOwned || sk.repeatable)) ? '' : 'disabled'}>${btnTxt}</button>
            </div>
        `;
    });
    
    svgHTML += '</svg>';
    container.innerHTML = '<div style="position:relative; width:1200px; height:800px; margin:auto;">' + svgHTML + nodesHTML + '</div>';
    
    document.getElementById('prestige-modal').style.display = 'flex';
    setTimeout(() => { container.scrollTop = 0; container.scrollLeft = (1200 - container.clientWidth) / 2; }, 10);
};

window.buySkill = function(id) {
    let sk = prestigeSkillsData.find(s => s.id === id);
    let ownedCount = GameState.prestigeSkills.filter(sid => sid === id).length;
    let cost = sk.repeatable ? sk.baseCost * Math.pow(2, ownedCount) : sk.baseCost;
    
    if (sk.req && !GameState.prestigeSkills.includes(sk.req)) { showToast("Előbb vedd meg az előfeltételt!"); return; }

    if(GameState.goldenSpokes >= cost && (sk.repeatable || ownedCount === 0)) {
        GameState.goldenSpokes -= cost; GameState.prestigeSkills.push(id);
        saveUserProgress(); window.openPrestigeShop(); updateUI();
    }
}

window.prestige = function() {
    const gain = Math.floor(GameState.lifetimeBikes / 1000000000); 
    if (gain > 0 && confirm(`Biztosan újraszületel?\nElveszítesz minden biciklit és épületet, de kapsz ${gain} Arany Küllőt!`)) {
        GameState.goldenSpokes += gain; GameState.prestigeCount = (GameState.prestigeCount || 0) + 1; 
        GameState.bikes = 0; GameState.lifetimeBikes = 0;
        GameState.upgrades.forEach(u => { u.owned = 0; u.cost = defaultUpgrades.find(d => d.id === u.id).cost; });
        GameState.realUpgrades = []; saveUserProgress(); location.reload();
    }
};

// --- MULTIPLAYER ESEMÉNYEK ---

window.openInteractModal = function(targetPlayer) {
    if(targetPlayer === GameState.currentUser) { showToast("Magaddal nem tudsz interakcióba lépni!"); return; }
    window.mpTarget = targetPlayer; document.getElementById('interact-target-name').innerText = targetPlayer;
    let cost = Math.max(1000, Math.floor(GameState.bps * 3600)); 
    document.getElementById('mp-thief-cost').innerText = cost.toLocaleString(); document.getElementById('mp-buff-cost').innerText = cost.toLocaleString();
    document.getElementById('interact-modal').style.display = 'flex';
};

window.sendThief = function() {
    let cost = Math.max(1000, Math.floor(GameState.bps * 3600));
    if (GameState.bikes < cost) { alert("Nincs elég biciklid ehhez!"); return; }
    GameState.bikes -= cost; updateUI(); saveUserProgress();
    push(ref(db, 'users/' + window.mpTarget + '/events'), { type: 'thief_attack', from: GameState.currentUser });
    showToast("🦹‍♂️ Tolvaj elküldve " + window.mpTarget + " játékosnak!"); document.getElementById('interact-modal').style.display = 'none';
};

window.sendBuff = function() {
    let cost = Math.max(1000, Math.floor(GameState.bps * 3600));
    if (GameState.bikes < cost) { alert("Nincs elég biciklid ehhez!"); return; }
    GameState.bikes -= cost; updateUI(); saveUserProgress();
    push(ref(db, 'users/' + window.mpTarget + '/events'), { type: 'buff', from: GameState.currentUser });
    showToast("❤️ Eszter Csókja elküldve " + window.mpTarget + " játékosnak!"); document.getElementById('interact-modal').style.display = 'none';
};

function spawnMPThief(senderName) {
    const thief = document.getElementById('mp-thief');
    thief.style.display = 'block'; thief.style.animation = 'none'; thief.offsetHeight; thief.style.animation = 'mpWalkAcross 10s linear forwards';
    let caught = false;
    
    const catchHandler = function(e) {
        caught = true; thief.style.display = 'none'; thief.removeEventListener('mousedown', catchHandler);
        showToast("👮 Elkaptad a tolvajt, akit " + senderName + " küldött rád!");
        push(ref(db, 'users/' + senderName + '/events'), { type: 'thief_failed', from: GameState.currentUser });
    };
    thief.addEventListener('mousedown', catchHandler);
    
    setTimeout(() => {
        if (!caught) {
            thief.style.display = 'none'; thief.removeEventListener('mousedown', catchHandler);
            let stealPct = GameState.prestigeSkills.includes(304) ? 0.10 : 0.20;
            let lost = Math.floor(GameState.bikes * stealPct);
            if (lost > 0) {
                GameState.bikes -= lost; updateUI(); saveUserProgress();
                document.getElementById('game-world').classList.add('world-shake');
                setTimeout(() => { document.getElementById('game-world').classList.remove('world-shake'); }, 500);
                showToast("😭 Jajj! " + senderName + " tolvaja meglopott!\nElvesztettél " + lost.toLocaleString() + " 🚲-t!");
                push(ref(db, 'users/' + senderName + '/events'), { type: 'thief_success', from: GameState.currentUser, amount: lost });
            } else { push(ref(db, 'users/' + senderName + '/events'), { type: 'thief_failed', from: GameState.currentUser }); }
        }
    }, 10000);
}

// --- EGYÉB ESEMÉNYEK ---

window.catchGoldenBike = function() {
    document.getElementById('golden-bike').style.display = 'none';
    let dur = GameState.prestigeSkills.includes(204) ? 35000 : 30000;
    activeBuffs.push({ mult: 7, target: 'both', endTime: Date.now() + dur, text: "✨ 7x SZORZÓ AKTÍV! ✨", color: "var(--gold)" });
    recalcMultiplier(); spawnConfetti(); dropRPGItem();
};

window.catchRustyBike = function() {
    document.getElementById('rusty-bike').style.display = 'none';
    let dur = GameState.prestigeSkills.includes(204) ? 20000 : 15000;
    if(Math.random() > 0.5) {
        activeBuffs.push({ mult: 10, target: 'bps', endTime: Date.now() + dur, text: "🔥 10x ROZSDÁS SZORZÓ! 🔥", color: "var(--rust)" });
    } else {
        activeBuffs.push({ mult: 0, target: 'bps', endTime: Date.now() + dur, text: "💥 DEFEKT! 0 BPS 💥", color: "red" });
        document.getElementById('game-world').classList.add('world-shake');
        setTimeout(() => { document.getElementById('game-world').classList.remove('world-shake'); }, 500);
        showToast("Beleszaladtál egy rozsdás szögbe... megállt a termelés!");
    }
    recalcMultiplier(); dropRPGItem();
};

window.catchHarry = function() {
    document.getElementById('harry-potter-event').style.display = 'none';
    activeBuffs.push({ mult: 777, target: 'click', endTime: Date.now() + 10000, text: "⚡ 777x KATTINTÁS (HARRY)! ⚡", color: "#9c27b0" });
    recalcMultiplier(); spawnConfetti(); showToast("🧙‍♂️ Elkaptad Harry Pottert! 777x Kattintás szorzó 10 mp-ig!");
};

window.spawnMagicCloud = function() {
    if (!GameState.currentUser || document.getElementById('game-container').style.display === 'none') return;
    const cloud = document.createElement('div'); cloud.className = 'magic-cloud'; cloud.innerText = '☁️';
    cloud.style.fontSize = (Math.random() * 30 + 40) + 'px'; cloud.style.top = (Math.random() * 30 + 5) + '%'; 
    const duration = Math.random() * 10 + 15; 
    cloud.style.animation = `cloudFloat ${duration}s linear forwards`; // <--- EZ HIÁNYZOTT!
    
    cloud.onclick = function(e) {
        let cloudMult = 10;
        if(isNightMode) { cloudMult = GameState.prestigeSkills.includes(208) ? 30 : 20; }
        activeBuffs.push({ mult: cloudMult, target: 'bps', endTime: Date.now() + 20000, text: `☁️ ${cloudMult}x FELHŐ SZORZÓ! ☁️`, color: "#81d4fa" });
        recalcMultiplier(); createParticle(e.clientX, e.clientY);
        showToast(`☁️ Elkaptál egy felhőt!\n🎁 ${cloudMult}x BPS szorzó 20 másodpercig!`);
        dropRPGItem(); cloud.remove();
    };
    document.getElementById('game-world').appendChild(cloud);
    setTimeout(() => { if(cloud.parentElement) cloud.remove(); }, duration * 1000);
}

window.spawnPukeEvent = function() {
    if (isPukeEventActive) return;
    isPukeEventActive = true; 
    const container = document.getElementById('puke-event-container'); const guy = document.getElementById('puke-guy'); const splat = document.getElementById('puke-splat'); const hitbox = document.getElementById('puke-hitbox');
    container.style.display = 'block'; splat.style.display = 'none'; hitbox.style.display = 'none'; guy.style.display = 'block'; guy.innerText = '🚶🏽‍♂️'; guy.style.right = '-150px';
    setTimeout(() => { guy.style.right = '40px'; }, 50);
    setTimeout(() => { guy.innerText = '🤮'; splat.style.display = 'block'; }, 1050);
    setTimeout(() => { guy.innerText = '🚶🏽‍♂️'; guy.style.right = '-150px'; hitbox.style.display = 'block'; }, 2500);
    setTimeout(() => { guy.style.display = 'none'; }, 3500);
};

window.cleanPuke = function(e) {
    if(!isPukeEventActive) return;
    let pukeBase = GameState.prestigeSkills.includes(303) ? 30 : 15; let reward = Math.max(200, Math.floor(GameState.bps * pukeBase)); 
    GameState.bikes += reward; GameState.lifetimeBikes += reward; isPukeEventActive = false; document.getElementById('puke-event-container').style.display = 'none';
    createFloatingNumber(e.clientX, e.clientY, reward); updateUI(); saveUserProgress();
    showToast("🧹 Sikeresen feltakarítottad a kanapét!\nJutalom: +" + reward.toLocaleString() + " 🚲");
};

window.triggerKitchenMeeting = function() {
    if (isKitchenMeetingActive) return;
    isKitchenMeetingActive = true; 
    const overlay = document.getElementById('kitchen-overlay'); const timerEl = document.getElementById('kitchen-timer'); overlay.style.display = 'flex';
    let timeLeft = 30; timerEl.innerText = timeLeft;
    kitchenMeetingInterval = setInterval(() => {
        timeLeft--; timerEl.innerText = timeLeft;
        if(timeLeft <= 0) { clearInterval(kitchenMeetingInterval); isKitchenMeetingActive = false; overlay.style.display = 'none'; showToast("☕ Vége a konyhagyűlésnek! A munka folytatódik."); }
    }, 1000);
};

window.catchAimlabEvent = function() { document.getElementById('aimlab-event-obj').style.display = 'none'; openAimlab(); };

// --- JÁTÉK INDÍTÁSA, MENTÉS BETÖLTÉSE ---

async function loadUserProgressFromDB() {
    GameState.upgrades = JSON.parse(JSON.stringify(defaultUpgrades));
    const dbRef = ref(db); 
    
    let firebaseData = null;
    try {
        const snapshot = await get(child(dbRef, `users/${GameState.currentUser}`));
        if (snapshot.exists()) { firebaseData = snapshot.val(); }
    } catch (e) { console.warn("Firebase betöltési hiba, offline mód aktiválva:", e); }

    let localData = null;
    try {
        const localRaw = localStorage.getItem(`martinGame_user_${GameState.currentUser}`);
        if (localRaw) localData = JSON.parse(localRaw);
    } catch (e) {}

    let parsed = null;
    if (firebaseData && localData) { parsed = (firebaseData.lastSaved > localData.lastSaved) ? firebaseData : localData; } 
    else { parsed = firebaseData || localData; }
    
    if (parsed) {
        GameState.bikes = parsed.bikes || 0; 
        GameState.lifetimeBikes = parsed.lifetimeBikes || parsed.bikes || 0; 
        GameState.goldenSpokes = parsed.goldenSpokes || 0;
        GameState.prestigeCount = parsed.prestigeCount || 0; 
        
        GameState.realUpgrades = Array.isArray(parsed.realUpgrades) ? parsed.realUpgrades : Object.values(parsed.realUpgrades || {});
        GameState.prestigeSkills = Array.isArray(parsed.prestigeSkills) ? parsed.prestigeSkills : Object.values(parsed.prestigeSkills || {});
        GameState.inventory = Array.isArray(parsed.inventory) ? parsed.inventory : Object.values(parsed.inventory || {});
        
        let loadedUpgrades = Array.isArray(parsed.upgrades) ? parsed.upgrades : Object.values(parsed.upgrades || {});
        if (loadedUpgrades.length > 0) {
            GameState.upgrades.forEach(u => {
                const savedU = loadedUpgrades.find(s => s.id === u.id);
                if (savedU) { u.owned = savedU.owned || 0; u.cost = savedU.cost || u.cost; }
            });
        }
    } else {
        GameState.bikes = 0; GameState.lifetimeBikes = 0; GameState.goldenSpokes = 0; GameState.prestigeCount = 0; GameState.bps = 0; GameState.clickPower = 1;
        GameState.realUpgrades = []; GameState.prestigeSkills = []; GameState.inventory = [];
        localStorage.removeItem(`martinGame_achs_${GameState.currentUser}`);
    }
    
    updateInventoryUI(); recalculateStats(); updateUI();
}

window.login = async function() {
    const input = document.getElementById('username-input').value.trim();
    if (input.length < 2) return;
    const btn = document.getElementById('btn-login'); btn.innerText = "Betöltés..."; btn.disabled = true;
    GameState.currentUser = input;
    
    onValue(ref(db, 'admin/reset'), (snapshot) => {
        const resetTime = snapshot.val();
        if (resetTime && resetTime > appInitTime) { alert("Rendszerüzenet: Az Admin törölte a rangsort! A játék nullázódott."); location.reload(); }
    });

    onValue(ref(db, 'admin/updateSignal'), (snapshot) => {
        const signalTime = snapshot.val();
        if (signalTime && signalTime > appInitTime) { 
            const banner = document.createElement('div');
            banner.id = 'update-banner';
            banner.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:#d32f2f; color:white; text-align:center; padding:15px; font-family:"Bangers", cursive; font-size:24px; z-index:99999; box-shadow:0 5px 15px rgba(0,0,0,0.8); letter-spacing:1px;';
            banner.innerHTML = `⚠️ ÚJ FRISSÍTÉS ELÉRHETŐ! KÉRLEK FRISSÍTSD AZ OLDALT (F5) A FOLYTATÁSHOZ! ⚠️ <button onclick="location.reload()" style="margin-left:20px; padding:8px 20px; background:#fff; color:#d32f2f; border:none; border-radius:5px; font-family:'Bangers', cursive; font-size:20px; cursor:pointer; box-shadow:0 3px 0 #b71c1c;">FRISSÍTÉS MOST</button>`;
            document.body.appendChild(banner);
        }
    });
    
    const eventsRef = ref(db, 'users/' + GameState.currentUser + '/events');
    onChildAdded(eventsRef, (snapshot) => {
        const ev = snapshot.val(); const evId = snapshot.key;
        set(ref(db, 'users/' + GameState.currentUser + '/events/' + evId), null);
        
        if (ev.type === 'thief_attack') { spawnMPThief(ev.from); } 
        else if (ev.type === 'thief_failed') { showToast("🤬 A tolvajodat elkapta " + ev.from + "! Nem szereztél semmit."); } 
        else if (ev.type === 'thief_success') {
            GameState.bikes += ev.amount; GameState.lifetimeBikes += ev.amount; updateUI(); saveUserProgress();
            showToast("🤑 A tolvajod sikeresen meglopta " + ev.from + " játékost!\nZsákmány: +" + ev.amount.toLocaleString() + " 🚲");
        } 
        else if (ev.type === 'buff') {
            activeBuffs.push({ mult: 2, target: 'bps', endTime: Date.now() + 300000, text: "❤️ 2x BPS (AJÁNDÉK " + ev.from.toUpperCase() + "-TÓL) ❤️", color: "var(--love)" });
            recalcMultiplier(); showToast("🎁 Kaptál egy bónuszt " + ev.from + " játékostól!\n2x BPS 5 percig!");
        }
    });

    // Évszak ellenőrzése
    const d = new Date(); const day = d.getDay(); const hour = d.getHours(); let sTxt = "";
    if(day === 0) { seasonBpsMult = 1.1; sTxt += "☀️ Vasárnapi Pihenő (+10% BPS) "; }
    if(day === 5) { seasonClickMult = 1.2; sTxt += "🔥 Pénteki Őrület (+20% Kattintás) "; }
    if(hour >= 20 || hour < 6) { isNightMode = true; document.body.classList.add('night-mode'); sTxt += "🌙 Éjszakai Műszak (Gyakoribb felhők) "; }
    if(sTxt !== "") { const banner = document.getElementById('season-banner'); banner.innerText = sTxt; banner.style.display = 'block'; }

    // UI Generálása
    const list = document.getElementById('upgrade-list'); list.innerHTML = "";
    GameState.upgrades = JSON.parse(JSON.stringify(defaultUpgrades));
    GameState.upgrades.forEach(upg => {
        const div = document.createElement('div'); div.id = `upg-item-${upg.id}`; div.className = 'upgrade-item disabled'; div.onclick = () => window.buyUpgrade(upg.id);
        div.innerHTML = `<div class="upgrade-icon">${upg.icon}</div><div class="upgrade-info"><span class="upgrade-name">${upg.name}</span><span class="upgrade-desc" id="upg-desc-${upg.id}"></span><span class="upgrade-cost" id="upg-cost-${upg.id}"></span></div><div class="upgrade-owned" id="upg-owned-${upg.id}">0</div>`;
        list.appendChild(div);
    });

    await loadUserProgressFromDB();
    document.getElementById('current-user-display').innerText = GameState.currentUser;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';

    initLeaderboard();
    
    // Main Loop
    setInterval(() => {
        recalcMultiplier();
        if (!isKitchenMeetingActive) {
            let gained = ((GameState.bps * multiplier) / 10);
            GameState.bikes += gained; GameState.lifetimeBikes += gained; updateUI();
        }
    }, 100);
    setInterval(saveUserProgress, 5000);

    // Esemény loopok
    setInterval(() => {
        let showTime = GameState.prestigeSkills.includes(204) ? 20000 : 15000;
        const isRusty = Math.random() < 0.3; 
        const bike = isRusty ? document.getElementById('rusty-bike') : document.getElementById('golden-bike');
        bike.style.top = Math.random() * 50 + 25 + "%"; 
        bike.style.display = 'block';
        bike.style.animation = 'none'; bike.offsetHeight; 
        bike.style.animation = `goldenFloat ${showTime / 1000}s linear forwards`;
        setTimeout(() => { bike.style.display = 'none'; }, showTime); 
    }, Math.random() * 300000 + (GameState.prestigeSkills.includes(202) ? 150000 : 300000));

    setInterval(() => {
        const hp = document.getElementById('harry-potter-event');
        hp.style.display = 'block'; hp.style.animation = 'none'; hp.offsetHeight; 
        hp.style.animation = 'hpErraticFly 10s linear forwards';
        setTimeout(() => { hp.style.display = 'none'; }, 10000); 
    }, Math.random() * 300000 + 400000);

    setInterval(() => {
        const orb = document.getElementById('aimlab-event-obj'); 
        orb.style.top = Math.random() * 50 + 25 + "%"; orb.style.display = 'block';
        orb.style.animation = 'none'; orb.offsetHeight; 
        orb.style.animation = `goldenFloat 15s linear forwards`;
        setTimeout(() => { orb.style.display = 'none'; }, 15000); 
    }, Math.random() * 240000 + 240000);

    setInterval(() => { window.spawnPukeEvent(); }, Math.random() * 300000 + 300000);
    setInterval(() => { if (!isKitchenMeetingActive) window.triggerKitchenMeeting(); }, Math.random() * 600000 + 600000);
    setInterval(() => { window.spawnMagicCloud(); }, Math.random() * 300000 + (GameState.prestigeSkills.includes(201) ? 90000 : 180000));
};

// --- ACHIEVEMENTS CHECKER ---
setInterval(() => {
    if (!GameState.currentUser || document.getElementById('game-container').style.display === 'none') return;
    let changed = false;
    achievements.forEach(ach => {
        if (GameState.lifetimeBikes >= ach.threshold && !ach.done) {
            ach.done = true; changed = true;
            GameState.bikes += ach.reward; GameState.lifetimeBikes += ach.reward;
            showToast(`🏆 SIKER ELÉRVE: ${ach.name}!\n🎁 Jutalom: +${ach.reward.toLocaleString()} 🚲`);
        }
    });
    if(changed) localStorage.setItem(`martinGame_achs_${GameState.currentUser}`, JSON.stringify(achievements.map(a => a.done)));
}, 1000);

// --- ADMIN ÉS GYORSGOMBOK ---
window.addEventListener('keydown', (e) => {
    if(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        const panel = document.getElementById('admin-panel'); 
        panel.style.display = (panel.style.display === 'none') ? 'block' : 'none';
    }
});

document.getElementById('username-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') window.login(); });

window.adminAddBikes = function() {
    const val = parseInt(document.getElementById('admin-bike-amount').value);
    if(!isNaN(val)) { GameState.bikes += val; GameState.lifetimeBikes += val; updateUI(); saveUserProgress(); }
};

window.resetLeaderboard = async function() {
    if (confirm("BIZTOSAN törlöd a teljes rangsort MINDENKINÉL? (A bent lévő játékosok mentése is nullázódik)")) {
        
        // 1. Azonnal lenullázzuk a memóriát, hogy az automata mentés ne mentsen vissza semmit!
        GameState.bikes = 0; 
        GameState.lifetimeBikes = 0;
        GameState.goldenSpokes = 0;
        GameState.prestigeCount = 0;
        GameState.bps = 0;
        
        // 2. Megvárjuk (await), amíg a Firebase TÉNYLEG mindent töröl az interneten
        await set(ref(db, 'users/'), null); 
        await set(ref(db, 'admin/reset'), Date.now()); 
        
        // 3. Töröljük a böngésző saját, helyi memóriáját
        localStorage.removeItem(`martinGame_user_${GameState.currentUser}`); 
        localStorage.removeItem(`martinGame_achs_${GameState.currentUser}`); 
        
        // 4. Most már biztonságosan frissíthetünk
        location.reload();
    }
};

window.triggerUpdateNotification = function() {
    if(confirm("Figyelem! Ez a gomb minden online játékosnál bedob egy nagy piros frissítés-kérő sávot. Biztosan megnyomod?")) {
        set(ref(db, 'admin/updateSignal'), Date.now()); alert("Jelzés kiküldve!");
    }
};

window.forceGoldenBike = function() { const b = document.getElementById('golden-bike'); b.style.top = Math.random()*50+25+"%"; b.style.display='block'; b.style.animation='none'; b.offsetHeight; b.style.animation='goldenFloat 10s linear forwards'; setTimeout(()=>b.style.display='none', 10000); };
window.forceRustyBike = function() { const b = document.getElementById('rusty-bike'); b.style.top = Math.random()*50+25+"%"; b.style.display='block'; b.style.animation='none'; b.offsetHeight; b.style.animation='goldenFloat 10s linear forwards'; setTimeout(()=>b.style.display='none', 10000); };
window.forceCloud = function() { window.spawnMagicCloud(); };
window.forcePuke = function() { window.spawnPukeEvent(); };
window.forceAimlabEvent = function() { const o = document.getElementById('aimlab-event-obj'); o.style.top = Math.random()*50+25+"%"; o.style.display='block'; o.style.animation='none'; o.offsetHeight; o.style.animation='goldenFloat 10s linear forwards'; setTimeout(()=>o.style.display='none', 10000); };
window.forceHarry = function() { const hp = document.getElementById('harry-potter-event'); hp.style.display='block'; hp.style.animation='none'; hp.offsetHeight; hp.style.animation='hpErraticFly 10s linear forwards'; setTimeout(()=>hp.style.display='none', 10000); };

// DOM Indulás
document.addEventListener("DOMContentLoaded", () => { initWheel(); });