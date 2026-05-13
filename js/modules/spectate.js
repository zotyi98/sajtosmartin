import { db, GameState } from '../state.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { defaultUpgrades, extraUpgradesData, prestigeSkillsData } from '../data.js';

let spectateUnsubscribe = null;

window.visualSpectate = function(targetName) {
    if (spectateUnsubscribe) spectateUnsubscribe();

    const modal = document.getElementById('spectate-modal');
    const content = document.getElementById('spectate-content');
    
    const modalBox = modal.querySelector('.modal-box');
    modalBox.style.width = "520px";
    modalBox.style.maxWidth = "95%";
    
    modal.style.display = 'flex';
    document.getElementById('spectate-name').innerText = `👁️ ${targetName.toUpperCase()} PROFILJA`;

    content.innerHTML = `
        <div id="spec-mini-world" style="position:relative; width:100%; height:160px; background:linear-gradient(to bottom, #4fc3f7, #b3e5fc); border-radius:12px; overflow:hidden; border:4px solid #263238; box-shadow: inset 0 5px 15px rgba(0,0,0,0.2);">
            <div id="spec-buildings" style="position:absolute; bottom:30px; left:0; width:100%; display:flex; flex-wrap:wrap-reverse; justify-content:center; opacity:0.8; height:80px; overflow:hidden;"></div>
            <div id="spec-martin" style="position:absolute; bottom:15px; left:50%; transform:translateX(-50%); z-index:10;">
                <img src="martin.jpg" style="width:70px; height:70px; object-fit:cover; border-radius:50%; border:3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4);">
                <div id="spec-acc-helmet" style="position:absolute; top:-15px; left:-5px; font-size:35px; display:none; transform: rotate(-15deg);">🧀</div>
                <div id="spec-acc-chain" style="position:absolute; bottom:-5px; right:-5px; font-size:30px; display:none;">⛓️</div>
            </div>
            <div style="position:absolute; top:10px; left:10px; background:rgba(255,255,255,0.95); padding:5px 15px; border-radius:8px; border: 2px solid #263238; font-family:'Bangers', cursive;">
                <div id="spec-bikes" style="font-size:22px; color:var(--primary);">0 🚲</div>
                <div id="spec-bps" style="font-size:15px; color:#d32f2f;">BPS: 0</div>
            </div>
            <div class="road" style="height:30px; bottom:0; position:absolute; width:100%;"><div class="road-line" style="height:4px; margin-top:13px;"></div></div>
        </div>

        <div id="spec-details" style="margin-top:15px; display:flex; flex-direction:column; gap:12px; max-height: 48vh; overflow-y: auto; padding-right: 5px;">

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div style="background:#f5f5f5; border:2px solid #bdbdbd; padding:8px; border-radius:10px; text-align:center;">
                    <div style="font-size:11px; color:#666; font-weight:bold;">ÖSSZES TERMELÉS</div>
                    <div id="spec-lifetime" style="font-family:'Bangers'; font-size:18px; color:#333;">0</div>
                </div>
                <div style="background:#fff8e1; border:2px solid #ffd54f; padding:8px; border-radius:10px; text-align:center;">
                    <div style="font-size:11px; color:#f57f17; font-weight:bold;">🔄 ÚJRAKEZDÉS / ✨ KÜLLŐ</div>
                    <div style="font-family:'Bangers'; font-size:18px; color:#ffb300;"><span id="spec-rebirths">0</span> / <span id="spec-spokes">0</span></div>
                </div>
            </div>

            <div class="spec-card" style="background:#f1f8e9; border:2px solid #a5d6a7; padding:10px; border-radius:10px;">
                <h4 style="margin:0 0 8px 0; font-family:'Bangers'; color:#2e7d32;">🏢 BIRTOKOLT ÉPÜLETEK</h4>
                <div id="spec-buildings-list" style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; font-size:13px;"></div>
            </div>

            <div class="spec-card" style="background:#e3f2fd; border:2px solid #90caf9; padding:10px; border-radius:10px;">
                <h4 style="margin:0 0 8px 0; font-family:'Bangers'; color:#1565c0;">🛠️ EXTRA FEJLESZTÉSEK</h4>
                <div id="spec-extras-list" style="display:flex; flex-wrap:wrap; gap:5px;"></div>
            </div>

            <div class="spec-card" style="background:#fce4ec; border:2px solid #f48fb1; padding:10px; border-radius:10px;">
                <h4 style="margin:0 0 8px 0; font-family:'Bangers'; color:#c2185b;">🌌 SKILL TREE</h4>
                <div id="spec-skills-list" style="display:flex; flex-wrap:wrap; gap:5px;"></div>
            </div>

            <div style="text-align:center; padding:10px; background:#333; color:#fff; border-radius:8px; font-family:'Fredoka'; font-size:13px;">
                📅 Játékot kezdte: <span id="spec-start-date" style="color:var(--accent); font-weight:bold;">Ismeretlen</span>
            </div>
        </div>
    `;

    const targetRef = ref(db, `users/${targetName}`);
    spectateUnsubscribe = onValue(targetRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // Értékek betöltése
        document.getElementById('spec-bikes').innerText = Math.floor(data.bikes || 0).toLocaleString() + " 🚲";
        document.getElementById('spec-bps').innerText = "BPS: " + Math.floor(data.bps || 0).toLocaleString();
        document.getElementById('spec-lifetime').innerText = Math.floor(data.lifetimeBikes || 0).toLocaleString();
        document.getElementById('spec-rebirths').innerText = data.prestigeCount || 0;
        document.getElementById('spec-spokes').innerText = data.goldenSpokes || 0;
        
        // Dátum formázása
        if (data.firstJoined) {
            const date = new Date(data.firstJoined);
            document.getElementById('spec-start-date').innerText = date.toLocaleDateString('hu-HU') + " " + date.toLocaleTimeString('hu-HU', {hour: '2-digit', minute:'2-digit'});
        } else {
            document.getElementById('spec-start-date').innerText = "Régi motoros (v5.5 előtt)";
        }

        // Felszerelés
        const inv = data.inventory || [];
        document.getElementById('spec-acc-helmet').style.display = inv.includes('helmet') ? 'block' : 'none';
        document.getElementById('spec-acc-chain').style.display = inv.includes('chain') ? 'block' : 'none';

        // Épületek
        const bContainer = document.getElementById('spec-buildings');
        const bList = document.getElementById('spec-buildings-list');
        bContainer.innerHTML = ''; bList.innerHTML = '';
        if (data.upgrades) {
            (Array.isArray(data.upgrades) ? data.upgrades : Object.values(data.upgrades)).forEach(u => {
                if (u.owned > 0) {
                    let def = defaultUpgrades.find(d => d.id === u.id);
                    if (def) {
                        for(let i=0; i<Math.min(u.owned, 5); i++) {
                            let s = document.createElement('span'); s.innerText = def.icon; s.style.fontSize = "24px"; bContainer.appendChild(s);
                        }
                        bList.innerHTML += `<div style="background:white; padding:4px 8px; border-radius:5px;">${def.icon} ${def.name}: <b>${u.owned}</b></div>`;
                    }
                }
            });
        }

        // Extrák & Skillek (Badge stílus)
        const renderBadges = (containerId, dataList, masterData, bgColor, borderColor, textColor) => {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            const list = Array.isArray(dataList) ? dataList : Object.values(dataList || {});
            if (list.length === 0) { container.innerHTML = '<span style="font-size:11px; color:#888;">Nincs még feloldva.</span>'; return; }
            
            const counts = {};
            list.forEach(item => { let id = typeof item === 'object' ? item.id : item; counts[id] = (counts[id] || 0) + 1; });

            for (let id in counts) {
                let def = masterData.find(m => m.id == id);
                if (def) {
                    let badge = document.createElement('span');
                    badge.style.cssText = `background:${bgColor}; color:${textColor}; border:1px solid ${borderColor}; padding:3px 7px; border-radius:5px; font-size:11px; font-weight:600;`;
                    badge.innerHTML = def.name + (counts[id] > 1 ? ` (Lvl ${counts[id]})` : '');
                    container.appendChild(badge);
                }
            }
        };

        renderBadges('spec-extras-list', data.realUpgrades, extraUpgradesData, '#e3f2fd', '#90caf9', '#0d47a1');
        renderBadges('spec-skills-list', data.prestigeSkills, prestigeSkillsData, '#fce4ec', '#f48fb1', '#c2185b');

        // Martin animáció
        const m = document.querySelector('#spec-martin img');
        if (m) { m.style.transform = "scale(1.1)"; setTimeout(() => m.style.transform = "scale(1)", 150); }
    });
};

window.closeSpectate = function() {
    if (spectateUnsubscribe) spectateUnsubscribe();
    document.getElementById('spectate-modal').style.display = 'none';
};