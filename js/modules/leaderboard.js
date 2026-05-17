import { GameState, db, showToast } from '../state.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { sanitizeUsername } from '../authSession.js';

window.initLeaderboard = function() {
    onValue(ref(db, 'leaderboard'), (snapshot) => {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = "";
        const players = [];

        snapshot.forEach(child => {
            const d = child.val();
            if (!d) return;
            players.push({
                key: child.key,
                name: d.displayName || child.key,
                bikes: d.bikes || 0,
                bps: d.bps || 0,
                prestigeCount: d.prestigeCount || 0,
                goldenSpokes: d.goldenSpokes || 0
            });
        });

        players.sort((a, b) => (b.prestigeCount - a.prestigeCount) || (b.bps - a.bps));

        const myKey = sanitizeUsername(GameState.currentUser);

        players.slice(0, 15).forEach((p, index) => {
            const li = document.createElement('div');
            const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `<span style="font-size: 15px; color: #795548;">${index + 1}.</span>`;
            const bpsIcon = p.bps > 1000000 ? "💎" : p.bps > 10000 ? "🔥" : "⚡";
            const isMe = p.key === myKey;

            li.className = `leader-item ${isMe ? 'current-user' : ''}`;
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            li.style.padding = "10px";

            const duelBtn = isMe ? '' : `<button type="button" class="duel-challenge-mini" title="Párbaj">⚔️</button>`;

            li.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:2px; flex:1; min-width:0;">
                    <div style="font-size:16px; color:#333;"><span style="display:inline-block; width:25px;">${rankIcon}</span> <b>${p.name}</b></div>
                    <div style="font-size:11px; color:#555; padding-left:25px; line-height:1.3;">
                        🔄 <b>${p.prestigeCount}x</b> Újrakezdve<br>
                        ✨ <span style="color:#b8860b;"><b>${p.goldenSpokes.toLocaleString()}</b> Küllő</span>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    ${duelBtn}
                    <div style="background:rgba(255,255,255,0.7); padding:6px 8px; border-radius:8px; font-family:'Bangers', cursive; font-size:16px; color:#d32f2f; min-width:80px; text-align:right;">
                        ${bpsIcon} ${Math.floor(p.bps).toLocaleString()}
                    </div>
                </div>
            `;

            const duelEl = li.querySelector('.duel-challenge-mini');
            if (duelEl) {
                duelEl.onclick = (e) => {
                    e.stopPropagation();
                    if (window.openDuelChallenge) window.openDuelChallenge(p.key, p.name);
                };
            }

            li.onclick = () => {
                if (!isMe) {
                    if (window.visualSpectate) window.visualSpectate(p.key, p.name);
                } else {
                    showToast("Ez te vagy! 😂");
                }
            };
            list.appendChild(li);
        });
    });
};
