import { GameState, saveUserProgress, showToast } from '../state.js';
import { defaultUpgrades, prestigeSkillsData } from '../data.js';

window.openPrestigeShop = function() {
    document.getElementById('modal-kullok').innerText = GameState.goldenSpokes;
    const container = document.getElementById('skill-tree-container');
    
    let svgHTML = '<svg width="100%" height="100%" style="position:absolute; top:0; left:0; z-index:1; pointer-events:none;">';
    let nodesHTML = '';

    prestigeSkillsData.forEach(sk => {
        let ownedCount = GameState.prestigeSkills.filter(sid => sid === sk.id).length;
        let isMaxed = sk.repeatable ? (sk.maxLevel && ownedCount >= sk.maxLevel) : ownedCount > 0;
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
        if (isMaxed) statusClass = "owned";
        else if (ownedCount > 0 && sk.repeatable) statusClass = aff ? "owned affordable" : "owned"; 

        let btnTxt = isMaxed ? "MAX" : `${cost} Küllő`;
        let levelTxt = sk.repeatable ? `<div style="color:#00e5ff; font-weight:bold; margin-top:2px;">Szint: ${ownedCount}${sk.maxLevel ? '/' + sk.maxLevel : ''}</div>` : "";

        nodesHTML += `
            <div class="tree-node ${statusClass}" style="left:${sk.x}%; top:${sk.y}%;" onclick="window.buySkill(${sk.id})">
                <strong style="font-family:'Bangers'; font-size:18px; letter-spacing:1px; color:#fff;">${sk.name}</strong>
                ${levelTxt}
                <div style="font-size:11px; margin:5px 0; color:#ddd; line-height:1.2;">${sk.desc}</div>
                <button class="btn-primary" style="font-size:14px; padding:6px; margin-top:5px; box-shadow:0 2px 0 #1b5e20;" ${(aff && reqMet && !isMaxed) ? '' : 'disabled'}>${btnTxt}</button>
            </div>
        `;
    });
    
    svgHTML += '</svg>';
    container.innerHTML = '<div style="position:relative; width:1200px; height:1000px; margin:auto;">' + svgHTML + nodesHTML + '</div>';
    
    document.getElementById('prestige-modal').style.display = 'flex';
    setTimeout(() => { container.scrollTop = 0; container.scrollLeft = (1200 - container.clientWidth) / 2; }, 10);
};

window.buySkill = function(id) {
    let sk = prestigeSkillsData.find(s => s.id === id);
    let ownedCount = GameState.prestigeSkills.filter(sid => sid === id).length;
    let isMaxed = sk.repeatable ? (sk.maxLevel && ownedCount >= sk.maxLevel) : ownedCount > 0;
    let cost = sk.repeatable ? sk.baseCost * Math.pow(2, ownedCount) : sk.baseCost;
    
    if (sk.req && !GameState.prestigeSkills.includes(sk.req)) { showToast("Előbb vedd meg az előfeltételt!"); return; }
    if (isMaxed) { showToast("Elérted a maximum szintet!"); return; }

    if(GameState.goldenSpokes >= cost) {
        GameState.goldenSpokes -= cost; 
        GameState.prestigeSkills.push(id);
        saveUserProgress(); window.openPrestigeShop(); window.updateUI();
    }
};

window.prestige = function() {
    const gain = window.calculateKullok(); 
    
    if (gain > 0 && confirm(`Biztosan újraszületel?\nElveszítesz minden biciklit és épületet, de kapsz ${gain} Arany Küllőt!`)) {
        GameState.goldenSpokes += gain; 
        
        // ÚJ LOGIKA: Feljegyezzük, hogy kivette a Küllőket!
        GameState.claimedSpokes = (GameState.claimedSpokes || 0) + gain; 
        GameState.prestigeCount = (GameState.prestigeCount || 0) + 1; 
        
        GameState.bikes = 0; 
        // JAVÍTÁS: A lifetimeBikes-t SOHA TÖBBÉ NEM NULLÁZZUK! Ez méri a valaha volt összes teljesítményt.
        
        GameState.upgrades.forEach(u => { 
            u.owned = 0; 
            u.cost = defaultUpgrades.find(d => d.id === u.id).cost; 
        });
        GameState.realUpgrades = []; 
        saveUserProgress(); 
        location.reload();
    }
};