import { GameState, showToast } from '../state.js';
import { rpgItems } from '../data.js';

window.createFloatingNumber = function(x, y, amount) {
    const el = document.createElement('div');
    el.className = 'floating-number';
    el.innerText = `+${Math.floor(amount)}`;
    el.style.left = (x - 40) + 'px';
    el.style.top = (y - 30) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
};

window.createParticle = function(x, y) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.innerText = Math.random() > 0.1 ? '🚲' : '🧀';
    p.style.left = (x - 15) + 'px';
    p.style.top = (y - 15) + 'px';
    p.style.setProperty('--x', (Math.random() - 0.5) * 400 + "px");
    p.style.setProperty('--y', (Math.random() - 0.8) * 400 + "px");
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
};

window.spawnConfetti = function() {
    for (let i = 0; i < 60; i++) {
        setTimeout(() => {
            const p = document.createElement('div');
            p.className = 'confetti-particle';
            p.innerText = ['✨', '🎉', '🎊', '💰', '🚲'][Math.floor(Math.random() * 5)];
            p.style.left = (Math.random() * window.innerWidth) + 'px';
            p.style.top = '-50px';
            p.style.setProperty('--x', (Math.random() - 0.5) * 500 + 'px');
            p.style.setProperty('--y', (window.innerHeight + 100) + 'px');
            p.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 3500);
        }, i * 30);
    }
};

window.cheeseCursorStyle = 'url("data:image/svg+xml;charset=UTF-8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'><path d=\'M2 30 L30 24 L28 8 L6 2 Z\' fill=\'%23ffc107\' stroke=\'%23ff9800\' stroke-width=\'2\'/><circle cx=\'10\' cy=\'16\' r=\'3\' fill=\'%23ffeb3b\'/><circle cx=\'20\' cy=\'10\' r=\'2\' fill=\'%23ffeb3b\'/></svg>") 16 16, auto';

window.applyCosmetics = function() {
    const cursorValue = GameState.cosmetics && GameState.cosmetics.includes('cheese_cursor') ? window.cheeseCursorStyle : 'auto';
    document.body.style.cursor = cursorValue;
    const martinContainer = document.getElementById('martin-container');
    if (martinContainer) {
        martinContainer.style.cursor = cursorValue === 'auto' ? 'pointer' : cursorValue;
    }
};

window.updateInventoryUI = function() {
    const invTag = document.getElementById('inventory-list');
    if (GameState.inventory.length === 0) invTag.innerHTML = "Üres";
    else invTag.innerHTML = GameState.inventory.map(id => rpgItems[id].icon).join(' ');
    document.getElementById('acc-helmet').style.display = GameState.inventory.includes('helmet') ? 'block' : 'none';
    document.getElementById('acc-chain').style.display = GameState.inventory.includes('chain') ? 'block' : 'none';
};

window.dropRPGItem = function() {
    const items = Object.keys(rpgItems);
    const unowned = items.filter(id => !GameState.inventory.includes(id));
    if (unowned.length > 0 && Math.random() < 0.1) {
        const droppedId = unowned[Math.floor(Math.random() * unowned.length)];
        GameState.inventory.push(droppedId);
        showToast(`🎒 ÚJ FELSZERELÉS TALÁLVA!\n${rpgItems[droppedId].icon} ${rpgItems[droppedId].name}`);
        window.updateInventoryUI();
        window.recalculateStats();
    }
};
