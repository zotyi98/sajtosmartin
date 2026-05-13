import { GameState, showToast, saveUserProgress } from '../state.js';

window.catchGoldenBike = function() {
    if (window.isKitchenMeetingActive) return; 
    document.getElementById('golden-bike').style.display = 'none';
    let dur = GameState.prestigeSkills.includes(204) ? 35000 : 30000;
    
    // NERF: Kisebb szorzó a "milliós" gazdasághoz (3x vagy 5x)
    let multValue = GameState.prestigeSkills.includes(401) ? 5 : 3;
    window.activeBuffs.push({ mult: multValue, target: 'both', endTime: Date.now() + dur, text: `✨ ${multValue}x SZORZÓ AKTÍV! ✨`, color: "var(--gold)" });
    
    window.recalcMultiplier(); window.spawnConfetti(); window.dropRPGItem();
};

window.catchRustyBike = function() {
    if (window.isKitchenMeetingActive) return; 
    document.getElementById('rusty-bike').style.display = 'none';
    let dur = GameState.prestigeSkills.includes(204) ? 20000 : 15000;
    
    if(GameState.prestigeSkills.includes(406) || Math.random() > 0.5) {
        window.activeBuffs.push({ mult: 5, target: 'bps', endTime: Date.now() + dur, text: "🔥 5x ROZSDÁS SZORZÓ! 🔥", color: "var(--rust)" });
    } else {
        window.activeBuffs.push({ mult: 0, target: 'bps', endTime: Date.now() + dur, text: "💥 DEFEKT! 0 BPS 💥", color: "red" });
        document.getElementById('game-world').classList.add('world-shake');
        setTimeout(() => { document.getElementById('game-world').classList.remove('world-shake'); }, 500);
        showToast("Beleszaladtál egy rozsdás szögbe... megállt a termelés!");
    }
    window.recalcMultiplier(); window.dropRPGItem();
};

window.catchHarry = function() {
    if (window.isKitchenMeetingActive) return; 
    document.getElementById('harry-potter-event').style.display = 'none';
    
    // NERF: 150x helyett most 20x (Bőven elég a milliós számokhoz!)
    window.activeBuffs.push({ mult: 20, target: 'click', endTime: Date.now() + 10000, text: "⚡ 20x KATTINTÁS (HARRY)! ⚡", color: "#9c27b0" });
    window.recalcMultiplier(); window.spawnConfetti(); showToast("🧙‍♂️ Elkaptad Harry Pottert! 20x Kattintás szorzó 10 mp-ig!");
};

window.spawnMagicCloud = function() {
    if (!GameState.currentUser || document.getElementById('game-container').style.display === 'none') return;
    const cloud = document.createElement('div'); cloud.className = 'magic-cloud'; cloud.innerText = '☁️';
    cloud.style.fontSize = (Math.random() * 30 + 40) + 'px'; cloud.style.top = (Math.random() * 30 + 5) + '%'; 
    const duration = Math.random() * 10 + 15; 
    cloud.style.animation = `cloudFloat ${duration}s linear forwards`;
    
    cloud.onclick = function(e) {
        if (window.isKitchenMeetingActive) { showToast("☕ Martin a konyhában van!"); return; }
        
        // NERF: 30x helyett 5x vagy 8x a milliós tempóhoz
        let cloudMult = 5;
        if(window.isNightMode) { cloudMult = GameState.prestigeSkills.includes(208) ? 8 : 6; }
        
        window.activeBuffs.push({ mult: cloudMult, target: 'bps', endTime: Date.now() + 20000, text: `☁️ ${cloudMult}x FELHŐ SZORZÓ! ☁️`, color: "#81d4fa" });
        window.recalcMultiplier(); window.createParticle(e.clientX, e.clientY);
        showToast(`☁️ Elkaptál egy felhőt! ${cloudMult}x BPS szorzó!`);
        window.dropRPGItem(); cloud.remove();
    };
    document.getElementById('game-world').appendChild(cloud);
    setTimeout(() => { if(cloud.parentElement) cloud.remove(); }, duration * 1000);
};

window.spawnPukeEvent = function() {
    if (window.isPukeEventActive) return;
    window.isPukeEventActive = true; 
    const container = document.getElementById('puke-event-container'); const guy = document.getElementById('puke-guy'); const splat = document.getElementById('puke-splat'); const hitbox = document.getElementById('puke-hitbox');
    container.style.display = 'block'; splat.style.display = 'none'; hitbox.style.display = 'none'; guy.style.display = 'block'; guy.innerText = '🚶🏽‍♂️'; guy.style.right = '-150px';
    setTimeout(() => { guy.style.right = '40px'; }, 50);
    setTimeout(() => { guy.innerText = '🤮'; splat.style.display = 'block'; }, 1050);
    setTimeout(() => { guy.innerText = '🚶🏽‍♂️'; guy.style.right = '-150px'; hitbox.style.display = 'block'; }, 2500);
    setTimeout(() => {
        guy.style.display = 'none';
        window.isPukeEventActive = false;
        container.style.display = 'none';
        hitbox.style.display = 'none';
    }, 3500);
};

window.cleanPuke = function(e) {
    if(!window.isPukeEventActive || window.isKitchenMeetingActive) return; 
    let pukeBase = GameState.prestigeSkills.includes(303) ? 10 : 5; // Kicsit szelídítve
    let reward = Math.max(200, Math.floor(GameState.bps * pukeBase)); 
    GameState.bikes += reward; GameState.lifetimeBikes += reward; window.isPukeEventActive = false; document.getElementById('puke-event-container').style.display = 'none';
    window.createFloatingNumber(e.clientX, e.clientY, reward); window.updateUI(); saveUserProgress();
    showToast("🧹 Sikeresen feltakarítottad a kanapét! +" + reward.toLocaleString() + " 🚲");
};

function getKitchen3Overlay() {
    let container = document.getElementById('kitchen-martin3');
    if (container) return container;
    const overlay = document.getElementById('kitchen-overlay');
    if (!overlay) return null;

    container = document.createElement('div');
    container.id = 'kitchen-martin3';
    container.style.position = 'absolute';
    container.style.top = '50%';
    container.style.right = '24px';
    container.style.transform = 'translateY(-50%)';
    container.style.width = '360px';
    container.style.display = 'none';
    container.style.flexDirection = 'row';
    container.style.alignItems = 'center';
    container.style.gap = '16px';
    container.style.padding = '16px 18px';
    container.style.borderRadius = '24px';
    container.style.background = 'rgba(0,0,0,0.82)';
    container.style.border = '2px solid rgba(255,255,255,0.32)';
    container.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '70';

    const img = document.createElement('img');
    img.src = 'martin3.jpg';
    img.alt = 'Martin a konyhában';
    img.style.width = '160px';
    img.style.height = '160px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '20px';
    img.style.flexShrink = '0';

    const text = document.createElement('div');
    text.id = 'kitchen-martin3-text';
    text.innerText = 'HAHAHAHAHA MEGYEK A KONYHÁBA KÖCSÖGÖK';
    text.style.color = '#ffeb3b';
    text.style.fontSize = '22px';
    text.style.fontWeight = '900';
    text.style.lineHeight = '1.1';
    text.style.textTransform = 'uppercase';
    text.style.textShadow = '2px 2px 6px rgba(0,0,0,0.9)';
    text.style.whiteSpace = 'normal';
    text.style.width = 'calc(100% - 170px)';
    text.style.padding = '8px 10px';
    text.style.background = 'rgba(0,0,0,0.55)';
    text.style.border = '1px solid rgba(255,255,255,0.25)';
    text.style.borderRadius = '14px';
    text.style.boxShadow = '0 8px 20px rgba(0,0,0,0.5)';

    container.appendChild(img);
    container.appendChild(text);
    overlay.appendChild(container);
    return container;
}

let kitchenMeetingInterval;
window.triggerKitchenMeeting = function() {
    if (window.isKitchenMeetingActive) return;
    window.isKitchenMeetingActive = true; 
    const overlay = document.getElementById('kitchen-overlay'); const timerEl = document.getElementById('kitchen-timer'); overlay.style.display = 'flex';
    const kitchen3 = getKitchen3Overlay();
    if (kitchen3) kitchen3.style.display = 'flex';
    let timeLeft = 15; timerEl.innerText = timeLeft;
    kitchenMeetingInterval = setInterval(() => {
        timeLeft--; timerEl.innerText = timeLeft;
        if(timeLeft <= 0) {
            clearInterval(kitchenMeetingInterval);
            window.isKitchenMeetingActive = false;
            overlay.style.display = 'none';
            const kitchen3 = document.getElementById('kitchen-martin3');
            if (kitchen3) kitchen3.style.display = 'none';
            showToast("☕ Vége a konyhagyűlésnek! A munka folytatódik.");
        }
    }, 1000);
};

window.catchAimlabEvent = function() { 
    if (window.isKitchenMeetingActive) return; 
    document.getElementById('aimlab-event-obj').style.display = 'none'; 
    window.openAimlab(); 
};