export function checkSeasons() {
    const d = new Date();
    const day = d.getDay();
    const hour = d.getHours();
    let sTxt = "";
    window.seasonBpsMult = 1;
    window.seasonClickMult = 1;
    window.isNightMode = false;
    document.body.classList.remove('night-mode');
    if (day === 0) { window.seasonBpsMult = 1.1; sTxt += "☀️ Vasárnapi Pihenő (+10% BPS) "; }
    if (day === 5) { window.seasonClickMult = 1.2; sTxt += "🔥 Pénteki Őrület (+20% Kattintás) "; }
    if (hour >= 20 || hour < 6) {
        window.isNightMode = true;
        document.body.classList.add('night-mode');
        sTxt += "🌙 Éjszakai Műszak (Gyakoribb felhők) ";
    }
    if (sTxt !== "") {
        const banner = document.getElementById('season-banner');
        banner.innerText = sTxt;
        banner.style.display = 'block';
    }
}
