export function initMartinEasterEgg() {
    // Kép elem dinamikus létrehozása
    const bgImg = document.createElement('img');
    bgImg.src = 'martin2.jpg'; // Itt hivatkozunk a képedre
    bgImg.id = 'martin-secret-bg';
    
    // CSS formázás: Középre igazítás és láthatatlanság
    bgImg.style.position = 'absolute';
    bgImg.style.top = '38%';
    bgImg.style.left = '50%';
    bgImg.style.transform = 'translate(-50%, -10px)';
    bgImg.style.zIndex = '1'; // A háttér felett, de a karakter mögött
    bgImg.style.opacity = '0'; // Alapból teljesen átlátszó (láthatatlan)
    bgImg.style.transition = 'opacity 3s ease-in-out'; // 3 másodperc alatt tűnik fel/el
    bgImg.style.pointerEvents = 'none'; // Ne blokkolja a kattintásokat!
    
    // Méretezés - KISEBB (300px helyett 400px)
    bgImg.style.maxWidth = '300px'; 
    bgImg.style.maxHeight = '300px';
    bgImg.style.objectFit = 'contain';
    bgImg.style.filter = 'drop-shadow(0px 0px 30px rgba(0,0,0,0.8))'; // Kis sötét árnyék köré
    
    // Hozzáadjuk a játéktérhez, a karakter mögé
    const gameWorld = document.getElementById('game-world');
    const martinContainer = document.getElementById('martin-container');
    if (gameWorld) {
        if (martinContainer) gameWorld.insertBefore(bgImg, martinContainer);
        else gameWorld.appendChild(bgImg);
    }

    // Martin5 emlékeztető elem
    const reminder = document.createElement('div');
    reminder.id = 'martin-reminder';
    reminder.style.position = 'absolute';
    reminder.style.top = '16px';
    reminder.style.right = '16px';
    reminder.style.display = 'none';
    reminder.style.flexDirection = 'column';
    reminder.style.alignItems = 'center';
    reminder.style.gap = '12px';
    reminder.style.width = '260px';
    reminder.style.padding = '16px';
    reminder.style.borderRadius = '22px';
    reminder.style.background = 'rgba(255,255,255,0.96)';
    reminder.style.color = '#222';
    reminder.style.fontFamily = 'Fredoka, sans-serif';
    reminder.style.fontWeight = '700';
    reminder.style.fontSize = '18px';
    reminder.style.boxShadow = '0 14px 35px rgba(0,0,0,0.25)';
    reminder.style.zIndex = '30';
    reminder.style.pointerEvents = 'none';
    reminder.style.backdropFilter = 'blur(10px)';

    const reminderImg = document.createElement('img');
    reminderImg.src = 'martin5.jpg';
    reminderImg.alt = 'Emlékeztető';
    reminderImg.style.width = '100%';
    reminderImg.style.height = 'auto';
    reminderImg.style.objectFit = 'cover';
    reminderImg.style.borderRadius = '18px';
    reminderImg.style.boxShadow = '0 5px 22px rgba(0,0,0,0.25)';

    const reminderText = document.createElement('div');
    reminderText.innerText = 'Egy kis emlékeztető';
    reminderText.style.lineHeight = '1.25';
    reminderText.style.textAlign = 'center';
    reminderText.style.width = '100%';
    reminderText.style.fontSize = '20px';
    reminderText.style.color = '#111';

    reminder.appendChild(reminderImg);
    reminder.appendChild(reminderText);
    if (gameWorld) gameWorld.appendChild(reminder);

    function showReminder() {
        reminder.style.display = 'flex';
        reminder.style.opacity = '0';
        reminder.style.transition = 'opacity 0.5s ease';
        reminder.offsetHeight;
        reminder.style.opacity = '1';
        setTimeout(() => {
            reminder.style.opacity = '0';
            setTimeout(() => { reminder.style.display = 'none'; }, 500);
        }, 15000);
    }

    setTimeout(showReminder, 300000);
    setInterval(showReminder, 300000);

    // A megjelenés logikája
    function triggerAppearance() {
        // Kezdetben legyen rejtett és készen az animációra
        bgImg.style.opacity = '0';
        bgImg.style.animation = 'none';
        bgImg.offsetHeight;

        // Random oda-vissza mozgás a felső területen, de ne menjen felülre
        const animName = 'martinFloat_' + Date.now();
        const randomX1 = Math.random() * 220 - 110;
        const randomX2 = Math.random() * 220 - 110;
        const randomX3 = Math.random() * 220 - 110;
        const randomY1 = Math.random() * 40 + 10;
        const randomY2 = Math.random() * 40 + 10;
        const randomY3 = Math.random() * 40 + 10;

        const keyframes = `
            @keyframes ${animName} {
                0% { transform: translate(calc(-50% + ${randomX1}px), calc(-50% + ${randomY1}px)); opacity: 0; }
                25% { transform: translate(calc(-50% + ${randomX2}px), calc(-50% + ${randomY2}px)); opacity: 0.6; }
                50% { transform: translate(calc(-50% + ${randomX3}px), calc(-50% + ${randomY3}px)); opacity: 0.8; }
                75% { transform: translate(calc(-50% + ${randomX2}px), calc(-50% + ${randomY2}px)); opacity: 0.6; }
                100% { transform: translate(calc(-50% + ${randomX1}px), calc(-50% + ${randomY1}px)); opacity: 0; }
            }
        `;

        const styleEl = document.createElement('style');
        styleEl.id = animName;
        styleEl.innerHTML = keyframes;
        document.head.appendChild(styleEl);

        // 3 és 6 másodperc közötti ideig marad a képernyőn
        const visibleTime = Math.random() * 3000 + 3000;

        // Az animáció a teljes visibleTime alatt fut
        bgImg.style.animation = `${animName} ${visibleTime / 1000}s ease-in-out forwards`;
        bgImg.style.transition = 'none'; // Kikapcsoljuk a transition-t az animáció alatt
        setTimeout(() => { if (styleEl.parentElement) styleEl.remove(); }, visibleTime + 100);

        setTimeout(() => {
            // Bekövetjük a következő megjelenést
            scheduleNext();
        }, visibleTime);
    }

    window.forceMartin2 = function() {
        triggerAppearance();
    };

    function scheduleNext() {
        // Véletlenszerűen 5 és 10 perc közötti várakozás
        const nextTime = Math.random() * 300000 + 300000;
        setTimeout(triggerAppearance, nextTime);
    }

    // Indítjuk a folyamatot
    scheduleNext();
}