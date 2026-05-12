import { GameState, showToast, saveUserProgress, updateUI } from '../state.js';

window.aimlabActive = false; 
let aimlabHits = 0; 
let aimlabClicks = 0; 
let aimlabTimeLeft = 10;
let aimlabTimer; 
let aimlabTargetTimer; 
let aimlabCurrentTarget = null;
let aimlabOriginalBikes = 0;

export function openAimlab() { 
    let cost = Math.floor(GameState.bikes * 0.9); 
    document.getElementById('aimlab-cost').innerText = cost.toLocaleString(); 
    document.getElementById('aimlab-stats').innerText = "Készen állsz?"; 
    document.getElementById('aimlab-modal').style.display = 'flex'; 
}

export function startAimlab() {
    if (GameState.bikes < 100) { alert("Nincs elég biciklid! (Min. 100 🚲)"); return; }
    
    let cost = Math.floor(GameState.bikes * 0.9); 
    aimlabOriginalBikes = GameState.bikes; 
    GameState.bikes -= cost; 
    updateUI(); 
    saveUserProgress();

    document.getElementById('btn-start-aimlab').style.display = 'none'; 
    window.aimlabActive = true; 
    aimlabHits = 0; 
    aimlabClicks = 0; 
    aimlabTimeLeft = 10; 
    
    updateAimlabStats();
    
    const area = document.getElementById('aimlab-area'); 
    area.addEventListener('mousedown', aimlabMiss);
    
    if (aimlabTargetTimer) clearTimeout(aimlabTargetTimer);
    aimlabTimer = setInterval(() => { 
        aimlabTimeLeft--; 
        updateAimlabStats(); 
        if (aimlabTimeLeft <= 0) endAimlab(); 
    }, 1000);
    spawnAimlabTarget();
}

function spawnAimlabTarget() {
    if (!window.aimlabActive) return; 
    const area = document.getElementById('aimlab-area');
    if (aimlabCurrentTarget) aimlabCurrentTarget.remove(); 
    if (aimlabTargetTimer) clearTimeout(aimlabTargetTimer);
    
    aimlabCurrentTarget = document.createElement('div'); 
    aimlabCurrentTarget.className = 'aimlab-target';
    let x = Math.random() * (area.clientWidth - 50) + 25; 
    let y = Math.random() * (area.clientHeight - 50) + 25;
    aimlabCurrentTarget.style.left = x + 'px'; 
    aimlabCurrentTarget.style.top = y + 'px';
    
    aimlabCurrentTarget.onmousedown = function(e) { 
        e.stopPropagation(); 
        if (!window.aimlabActive) return; 
        clearTimeout(aimlabTargetTimer); 
        aimlabHits++; 
        aimlabClicks++; 
        updateAimlabStats(); 
        spawnAimlabTarget(); 
    };
    area.appendChild(aimlabCurrentTarget);
    
    aimlabTargetTimer = setTimeout(() => { 
        if (!window.aimlabActive) return; 
        aimlabClicks++; 
        updateAimlabStats(); 
        spawnAimlabTarget(); 
    }, 600);
}

function aimlabMiss(e) { if (!window.aimlabActive) return; aimlabClicks++; updateAimlabStats(); }

function updateAimlabStats() { 
    let acc = aimlabClicks === 0 ? 0 : Math.floor((aimlabHits / aimlabClicks) * 100); 
    document.getElementById('aimlab-stats').innerText = `Találat: ${aimlabHits} | Pontosság: ${acc}% | Idő: ${aimlabTimeLeft}s`; 
}

function endAimlab() {
    window.aimlabActive = false; 
    clearInterval(aimlabTimer); 
    if (aimlabTargetTimer) clearTimeout(aimlabTargetTimer);
    const area = document.getElementById('aimlab-area'); 
    area.removeEventListener('mousedown', aimlabMiss);
    if (aimlabCurrentTarget) { aimlabCurrentTarget.remove(); aimlabCurrentTarget = null; }
    
    document.getElementById('btn-start-aimlab').style.display = 'block';
    let acc = aimlabClicks === 0 ? 0 : Math.floor((aimlabHits / aimlabClicks) * 100);
    
    if (aimlabHits >= 10 && acc >= 90) {
        playSound('win'); 
        let mult = GameState.prestigeSkills.includes(206) ? 10 : 5; 
        let winTotal = aimlabOriginalBikes * mult; 
        
        // JAVÍTÁS: A pontos nyeremény számolása
        let reward = winTotal - (aimlabOriginalBikes * 0.1); 
        
        GameState.bikes += reward; 
        GameState.lifetimeBikes += reward; 
        updateUI(); 
        saveUserProgress(); 
        showToast(`🎮 AIM LAB GYŐZELEM!\n${acc}% pontosság! Nyeremény: ${mult}x szorzó (Összesen: ${winTotal.toLocaleString()} 🚲)!`);
    } else { 
        playSound('bad'); 
        showToast(`❌ Aim Lab Vége.\n${acc}% pontosság (${aimlabHits} találat). Elbuktad a biciklijeid 90%-át!`); 
    }

    // JAVÍTÁS: Ablak automatikus bezárása a játék végén!
    document.getElementById('aimlab-modal').style.display = 'none';
}