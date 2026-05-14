import { GameState, showToast, saveUserProgress, updateUI } from '../state.js';

let isWheelSpinning = false;
let currentWheelRotation = 0;

export function initWheel() {
    const wheel = document.getElementById('spinning-wheel');
    if(!wheel) return;
    wheel.innerHTML = '';
    wheel.style.background = 'repeating-conic-gradient(from -1.8deg, #ff9800 0 3.6deg, #ffffff 3.6deg 7.2deg)';
    for (let i = 1; i <= 100; i++) {
        let div = document.createElement('div');
        div.className = 'wheel-number'; div.innerText = i;
        div.style.transform = `translateX(-50%) rotate(${(i-1)*3.6}deg)`;
        wheel.appendChild(div);
    }
}

export function spinWheel() {
    if (isWheelSpinning) return;
    let amt = parseInt(document.getElementById('gamble-amount').value); 
    let num = parseInt(document.getElementById('gamble-number').value);
    
    // NERF: Max tét = 5% bicikli vagy 10M (min)
    let maxBet = Math.max(10000000, Math.floor(GameState.bikes * 0.05));
    if (isNaN(amt) || amt <= 0 || amt > maxBet) { alert(`Nincs ennyi biciklid, vagy a max tét ${maxBet.toLocaleString()}!`); return; }
    if (isNaN(num) || num < 1 || num > 100) { alert("Kérlek 1 és 100 közötti számot adj meg!"); return; }

    isWheelSpinning = true; 
    document.getElementById('btn-spin').disabled = true; 
    document.getElementById('wheel-result').innerText = "?";
    
    GameState.bikes -= amt; 
    updateUI(); 
    saveUserProgress();

    const wheel = document.getElementById('spinning-wheel'); 
    const winningNumber = Math.floor(Math.random() * 100) + 1;
    const targetAngle = 360 - ((winningNumber - 1) * 3.6); 
    const extraSpins = (Math.floor(Math.random() * 4) + 5) * 360; 
    currentWheelRotation += extraSpins + targetAngle - (currentWheelRotation % 360); 
    wheel.style.transform = `rotate(${currentWheelRotation}deg)`;

    setTimeout(() => {
        document.getElementById('wheel-result').innerText = winningNumber;
        if (num === winningNumber) {
            let payout = GameState.prestigeSkills.includes(209) ? 40 : 30; 
            let winAmt = amt * payout; 
            GameState.bikes += winAmt; 
            GameState.lifetimeBikes += winAmt;
            showToast(`🎰 TELITALÁLAT! A nyerőszám ${winningNumber} volt!\nNyeremény: +${winAmt.toLocaleString()} 🚲`);
        } else { 
            showToast(`💸 Vesztettél! A nyerőszám a(z) ${winningNumber} volt.`); 
        }
        updateUI(); 
        saveUserProgress(); 
        isWheelSpinning = false; 
        document.getElementById('btn-spin').disabled = false;
    }, 3000);
}