export function initMartinEasterEgg() {
    // Kép elem dinamikus létrehozása
    const bgImg = document.createElement('img');
    bgImg.src = 'martin2.jpg'; // Itt hivatkozunk a képedre
    bgImg.id = 'martin-secret-bg';
    
    // CSS formázás: Középre igazítás és láthatatlanság
    bgImg.style.position = 'absolute';
    bgImg.style.top = '50%';
    bgImg.style.left = '50%';
    bgImg.style.transform = 'translate(-50%, -50%)';
    bgImg.style.zIndex = '1'; // A háttér felett, de a kattintható dolgok alatt
    bgImg.style.opacity = '0'; // Alapból teljesen átlátszó (láthatatlan)
    bgImg.style.transition = 'opacity 3s ease-in-out'; // 3 másodperc alatt tűnik fel/el
    bgImg.style.pointerEvents = 'none'; // Ne blokkolja a kattintásokat!
    
    // Méretezés (Ezt nyugodtan átírhatod, ha túl nagy vagy túl kicsi)
    bgImg.style.maxWidth = '400px'; 
    bgImg.style.maxHeight = '400px';
    bgImg.style.objectFit = 'contain';
    bgImg.style.filter = 'drop-shadow(0px 0px 30px rgba(0,0,0,0.8))'; // Kis sötét árnyék köré
    
    // Hozzáadjuk a játéktérhez
    const gameWorld = document.getElementById('game-world');
    if (gameWorld) {
        gameWorld.appendChild(bgImg);
    }

    // A megjelenés logikája
    function triggerAppearance() {
        // Lassan megjelenik (0.4-es átlátszósággal, hogy "kísértetiesen" a háttérbe olvadjon)
        bgImg.style.opacity = '0.4'; 
        
        // 3 és 6 másodperc közötti ideig marad a képernyőn
        const visibleTime = Math.random() * 3000 + 3000;
        setTimeout(() => {
            // Lassan eltűnik
            bgImg.style.opacity = '0';
            
            // Bekövetjük a következő megjelenést
            scheduleNext();
        }, visibleTime);
    }

    function scheduleNext() {
        // Véletlenszerűen 30 és 90 másodperc közötti várakozás
        const nextTime = Math.random() * 60000 + 30000;
        setTimeout(triggerAppearance, nextTime);
    }

    // Indítjuk a folyamatot
    scheduleNext();
}