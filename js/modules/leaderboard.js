import { GameState, db, showToast } from '../state.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

window.initLeaderboard = function() {
    onValue(ref(db, 'users'), (snapshot) => {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = "";
        let players = [];

        snapshot.forEach(child => {
            let d = child.val();
            players.push({
                name: child.key,
                bikes: d.bikes || 0,
                bps: d.bps || 0,
                prestigeCount: d.prestigeCount || 0,
                goldenSpokes: d.goldenSpokes || 0
            });
        });

        players.sort((a, b) => (b.prestigeCount - a.prestigeCount) || (b.bps - a.bps));

        players.slice(0, 15).forEach((p, index) => {
            let li = document.createElement('div');
            let rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `<span style="font-size: 15px; color: #795548;">${index + 1}.</span>`;
            let bpsIcon = p.bps > 1000000 ? "💎" : p.bps > 10000 ? "🔥" : "⚡";

            li.className = `leader-item ${p.name === GameState.currentUser ? 'current-user' : ''}`;
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            li.style.padding = "10px";

            li.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <div style="font-size:16px; color:#333;"><span style="display:inline-block; width:25px;">${rankIcon}</span> <b>${p.name}</b></div>
                    <div style="font-size:11px; color:#555; padding-left:25px; line-height:1.3;">
                        🔄 <b>${p.prestigeCount}x</b> Újrakezdve<br>
                        ✨ <span style="color:#b8860b;"><b>${p.goldenSpokes.toLocaleString()}</b> Küllő</span>
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.7); padding:6px 8px; border-radius:8px; font-family:'Bangers', cursive; font-size:16px; color:#d32f2f; min-width:80px; text-align:right;">
                    ${bpsIcon} ${Math.floor(p.bps).toLocaleString()}
                </div>
            `;

            li.onclick = () => {
                if (p.name !== GameState.currentUser) {
                    if (window.visualSpectate) window.visualSpectate(p.name);
                } else {
                    showToast("Ez te vagy! 😂");
                }
            };
            list.appendChild(li);
        });
    });
};
