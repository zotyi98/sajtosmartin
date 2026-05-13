import { db, GameState } from '../state.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { defaultUpgrades } from '../data.js';

let spectateUnsubscribe = null;

window.visualSpectate = function(targetName) {
    if (spectateUnsubscribe) spectateUnsubscribe(); // Előző megfigyelés leállítása

    const modal = document.getElementById('spectate-modal');
    const content = document.getElementById('spectate-content');
    modal.style.display = 'flex';
    document.getElementById('spectate-name').innerText = `👁️ ÉLŐ KLÓN: ${targetName}`;

    // Alaphelyzetbe állítjuk a tartalmat egy mini-játékmezővel
    content.innerHTML = `
        <div id="spec-mini-world" style="position:relative; width:100%; height:250px; background:linear-gradient(#81d4fa, #e1f5fe); border-radius:10px; overflow:hidden; border:3px solid #333;">
            <div id="spec-buildings" style="position:absolute; bottom:40px; left:0; width:100%; display:flex; flex-wrap:wrap; justify-content:center; opacity:0.6;"></div>
            <div id="spec-martin" style="position:absolute; bottom:20px; left:50%; transform:translateX(-50%); text-align:center;">
                <img src="martin.jpg" style="width:80px; border-radius:50%; border:2px solid white;">
                <div id="spec-acc-helmet" style="position:absolute; top:-15px; left:10px; font-size:30px; display:none;">🧀</div>
                <div id="spec-acc-chain" style="position:absolute; bottom:0; right:0; font-size:25px; display:none;">⛓️</div>
            </div>
            <div style="position:absolute; top:10px; left:10px; background:rgba(0,0,0,0.6); color:white; padding:5px 10px; border-radius:5px; font-family:'Bangers';">
                <div id="spec-bikes">0 🚲</div>
                <div id="spec-bps" style="font-size:12px; color:#ffc107;">BPS: 0</div>
            </div>
            <div class="road" style="height:20px;"><div class="road-line"></div></div>
        </div>
        <div id="spec-stats" style="margin-top:10px; font-size:12px; font-family:monospace; color:#444; height:100px; overflow-y:auto; border-top:1px solid #ccc; padding-top:5px;"></div>
    `;

    // Élő kapcsolat a haverod adataihoz
    const targetRef = ref(db, `users/${targetName}`);
    spectateUnsubscribe = onValue(targetRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // 1. Számok frissítése
        document.getElementById('spec-bikes').innerText = Math.floor(data.bikes).toLocaleString() + " 🚲";
        document.getElementById('spec-bps').innerText = "BPS: " + Math.floor(data.bps || 0).toLocaleString();

        // 2. Felszerelés frissítése
        const inv = data.inventory || [];
        document.getElementById('spec-acc-helmet').style.display = inv.includes('helmet') ? 'block' : 'none';
        document.getElementById('spec-acc-chain').style.display = inv.includes('chain') ? 'block' : 'none';

        // 3. Épületek vizuális klónozása
        const bContainer = document.getElementById('spec-buildings');
        bContainer.innerHTML = '';
        if (data.upgrades) {
            data.upgrades.forEach(u => {
                if (u.owned > 0) {
                    let span = document.createElement('span');
                    span.innerText = u.icon;
                    span.title = `${u.name}: ${u.owned}`;
                    span.style.fontSize = "20px";
                    bContainer.appendChild(span);
                }
            });
        }

        // 4. Szöveges részletek
        document.getElementById('spec-stats').innerHTML = `
            <b>Küllők:</b> ${data.goldenSpokes || 0}<br>
            <b>Újraszületések:</b> ${data.prestigeCount || 0}<br>
            <b>Aktív szorzók:</b> ${data.realUpgrades ? data.realUpgrades.length : 0} db<br>
            <b>Utolsó mentés:</b> ${new Date(data.lastSaved).toLocaleTimeString()}
        `;

        // Martin "ugrál", ha termel (effekt)
        const m = document.querySelector('#spec-martin img');
        m.style.transform = "scale(1.1)";
        setTimeout(() => m.style.transform = "scale(1)", 100);
    });
};

// Bezáráskor leiratkozunk az adatokról, hogy ne egye a netet
window.closeSpectate = function() {
    if (spectateUnsubscribe) spectateUnsubscribe();
    document.getElementById('spectate-modal').style.display = 'none';
};