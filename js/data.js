export const defaultUpgrades = [
    { id: 0, icon: "👟", name: "Nyúlcipő", desc: "+1 pont katt.", cost: 50, power: 1, type: "click", owned: 0 },
    { id: 1, icon: "🥤", name: "Energiaital", desc: "+1 pont / mp", cost: 100, power: 1, type: "bps", owned: 0 },
    { id: 14, icon: "🛴", name: "Roller Kölcsönző", desc: "+5 pont / mp", cost: 600, power: 5, type: "bps", owned: 0 },
    { id: 2, icon: "🚴", name: "Segédmunkás", desc: "+20 pont / mp", cost: 2500, power: 20, type: "bps", owned: 0 },
    { id: 9, icon: "🛏️", name: "Munkásszálló", desc: "+80 pont / mp", cost: 12000, power: 80, type: "bps", owned: 0 },
    { id: 3, icon: "🛠️", name: "Gépkifújós komp.", desc: "+350 pont / mp", cost: 60000, power: 350, type: "bps", owned: 0 },
    { id: 10, icon: "🏡", name: "Nagy ház", desc: "+1,500 pont / mp", cost: 300000, power: 1500, type: "bps", owned: 0 },
    { id: 17, icon: "🏢", name: "Irodaház", desc: "+6,500 pont / mp", cost: 1500000, power: 6500, type: "bps", owned: 0 },
    { id: 4, icon: "🖥️", name: "Gépújraindító", desc: "+30,000 pont / mp", cost: 8000000, power: 30000, type: "bps", owned: 0 },
    { id: 5, icon: "🌀", name: "Segédpropeller", desc: "+150,000 pont / mp", cost: 45000000, power: 150000, type: "bps", owned: 0 },
    { id: 11, icon: "🍻", name: "Garrison tavern", desc: "+750,000 pont / mp", cost: 250000000, power: 750000, type: "bps", owned: 0 },
    { id: 18, icon: "🎰", name: "Kaszinó", desc: "+4,000,000 pont / mp", cost: 1500000000, power: 4000000, type: "bps", owned: 0 },
    { id: 6, icon: "🧀", name: "Sajtgyár", desc: "+25,000,000 pont / mp", cost: 10000000000, power: 25000000, type: "bps", owned: 0 },
    { id: 8, icon: "🚗", name: "Autóbiznisz", desc: "+150,000,000 pont / mp", cost: 75000000000, power: 150000000, type: "bps", owned: 0 },
    { id: 12, icon: "🏰", name: "Roxfort", desc: "+1,000,000,000 pont / mp", cost: 500000000000, power: 1000000000, type: "bps", owned: 0 },
    { id: 20, icon: "🏭", name: "Nano-Gyár", desc: "+6,500,000,000 pont / mp", cost: 3500000000000, power: 6500000000, type: "bps", owned: 0 },
    { id: 7, icon: "❤️", name: "Eszter támogatása", desc: "DUPLA BPS és Kattintás!", cost: 10000000000000, power: 0, type: "special", owned: 0 },
    { id: 13, icon: "👁️", name: "Mordor", desc: "+50,000,000,000 pont / mp", cost: 25000000000000, power: 50000000000, type: "bps", owned: 0 },
    { id: 21, icon: "🚀", name: "Űrállomás", desc: "+350,000,000,000 pont / mp", cost: 200000000000000, power: 350000000000, type: "bps", owned: 0 },
    { id: 22, icon: "⏱️", name: "Időgép", desc: "+3,000,000,000,000 pont / mp", cost: 1500000000000000, power: 3000000000000, type: "bps", owned: 0 },
    { id: 23, icon: "🌌", name: "Multiverzum Kapu", desc: "+25,000,000,000,000 pont / mp", cost: 10000000000000000, power: 25000000000000, type: "bps", owned: 0 }
];

export const extraUpgradesData = [
    { id: 101, name: "Könnyített Cípőfűző", desc: "Nyúlcipők x2 Erő", cost: 5000, reqBuilding: 0, reqCount: 10, targetId: 0, mult: 2 },
    { id: 118, name: "Tapadós Kesztyű", desc: "Roller Kölcsönző x2 BPS", cost: 15000, reqBuilding: 14, reqCount: 10, targetId: 14, mult: 2 },
    { id: 102, name: "Koffein Túladagolás", desc: "Energiaitalok x3 BPS", cost: 7500, reqBuilding: 1, reqCount: 10, targetId: 1, mult: 3 },
    { id: 103, name: "Olajozott Láncok", desc: "Segédmunkások x2 BPS", cost: 55000, reqBuilding: 2, reqCount: 10, targetId: 2, mult: 2 },
    { id: 106, name: "Emeletes ágyak", desc: "Munkásszállók x2 BPS", cost: 200000, reqBuilding: 9, reqCount: 10, targetId: 9, mult: 2 },
    { id: 107, name: "Napelemek", desc: "Nagy ház x2 BPS", cost: 1000000, reqBuilding: 10, reqCount: 10, targetId: 10, mult: 2 },
    { id: 119, name: "Részvényopció", desc: "Irodaház x2 BPS", cost: 2500000, reqBuilding: 17, reqCount: 10, targetId: 17, mult: 2 },
    { id: 108, name: "Shelby Különítmény", desc: "Garrison tavern x2 BPS", cost: 25000000, reqBuilding: 11, reqCount: 5, targetId: 11, mult: 2 },
    { id: 120, name: "High Roller", desc: "Kaszinó x2 BPS", cost: 500000000, reqBuilding: 18, reqCount: 10, targetId: 18, mult: 2 },
    { id: 104, name: "Sajtos Munkások", desc: "Szinergia: Sajtgyár +100 BPS a Munkásnak", cost: 500000000, reqBuilding: 6, reqCount: 1, type: "synergy" },
    { id: 105, name: "Használtautó Keresk.", desc: "Autóbizniszek x2 BPS", cost: 1500000000, reqBuilding: 8, reqCount: 5, targetId: 8, mult: 2 },
    { id: 109, name: "Pálcás Futárok", desc: "Roxfort x2 BPS", cost: 15000000000, reqBuilding: 12, reqCount: 3, targetId: 12, mult: 2 },
    { id: 121, name: "Plazma Hegesztő", desc: "Nano-Gyár x2 BPS", cost: 150000000000, reqBuilding: 20, reqCount: 10, targetId: 20, mult: 2 },
    { id: 110, name: "Szauron Szeme", desc: "Mordor x2 BPS", cost: 250000000000, reqBuilding: 13, reqCount: 1, targetId: 13, mult: 2 },
    { id: 122, name: "Műholdas Adatátvitel", desc: "Űrállomás x2 BPS", cost: 10000000000000, reqBuilding: 21, reqCount: 5, targetId: 21, mult: 2 },
    { id: 123, name: "Paradoxon Pajzs", desc: "Időgép x2 BPS", cost: 80000000000000, reqBuilding: 22, reqCount: 5, targetId: 22, mult: 2 }
];

export const prestigeSkillsData = [
    // Közép (Kicsit lentebb kezdem, hogy kiférjen)
    { id: 301, name: "Isteni Láncolaj", desc: "Minden BPS és Kattintás +100%! (Max 3x)", baseCost: 2, repeatable: true, maxLevel: 3, req: null, x: 50, y: 15 },
    { id: 302, name: "Gyémánt Láncolaj", desc: "Újabb +100% BPS és Katt. szorzó! (Max 3x)", baseCost: 10, repeatable: true, maxLevel: 3, req: 301, x: 50, y: 30 },
    { id: 303, name: "Mágikus Hányózsák", desc: "A hányás takarítása dupla annyi biciklit fizet.", baseCost: 8, repeatable: false, req: 302, x: 50, y: 45 },
    { id: 304, name: "Küllő-Mágnes", desc: "A megmaradt Küllőid 1% helyett 2% bónuszt adnak!", baseCost: 15, repeatable: false, req: 303, x: 50, y: 60 },
    { id: 404, name: "Sötét Anyag Küllő", desc: "+10% Globális BPS minden szinten. (VÉGTELENSZER)", baseCost: 30, repeatable: true, maxLevel: 9999, req: 304, x: 50, y: 82 },

    // Bal ág (Jobban kitolva balra)
    { id: 203, name: "Eszter Titka", desc: "Eszter támogatása 20%-kal olcsóbb lesz.", baseCost: 5, repeatable: false, req: 301, x: 25, y: 30 },
    { id: 207, name: "Kuponkód", desc: "Minden alap épület 10%-kal olcsóbb!", baseCost: 10, repeatable: false, req: 203, x: 12, y: 45 },
    { id: 209, name: "Tőzsdecápa", desc: "Szerencsekerék telitalálat 80x helyett 100x nyer.", baseCost: 20, repeatable: false, req: 207, x: 12, y: 65 },
    { id: 208, name: "Éjszakai Bagoly", desc: "Éjszakai Műszak felhői +50% extra szorzó.", baseCost: 15, repeatable: false, req: 203, x: 32, y: 45 },
    { id: 210, name: "Globális Ellátólánc", desc: "Minden BIRTOKOLT épülettípus után +5% BPS!", baseCost: 30, repeatable: false, req: 208, x: 32, y: 65 },

    // Jobb ág (Jobban kitolva jobbra)
    { id: 202, name: "Szerencsés Kéz", desc: "Az Arany/Rozsdás biciklik 2x sűrűbben jönnek.", baseCost: 3, repeatable: false, req: 301, x: 75, y: 30 },
    { id: 201, name: "Felhővadász", desc: "A varázsfelhők 2x gyakrabban jelennek meg.", baseCost: 2, repeatable: false, req: 202, x: 68, y: 45 },
    { id: 204, name: "Varázsüveg", desc: "A bónusz biciklik 5mp-el tovább maradnak kint.", baseCost: 5, repeatable: false, req: 201, x: 68, y: 65 },
    { id: 401, name: "Aranyásó", desc: "Az Aranybicikli nagyobbat dob a bevételen!", baseCost: 15, repeatable: false, req: 204, x: 66, y: 80 },
    { id: 406, name: "Rozsdás Immunitás", desc: "Nincs több defekt (0 BPS), csakis a bónusz!", baseCost: 20, repeatable: false, req: 401, x: 78, y: 80 },

    // Szélső jobb (E-Sport)
    { id: 205, name: "Villámkezű", desc: "A kattintásod megkapja a teljes (BPS) 1%-át!", baseCost: 15, repeatable: false, req: 202, x: 88, y: 45 },
    { id: 206, name: "Mesterlövész", desc: "Az Aim Lab győzelem 5x helyett 10x-es nyeremény!", baseCost: 25, repeatable: false, req: 205, x: 88, y: 65 },
    { id: 402, name: "Reflex Ital", desc: "Az Aim Lab célpontok lassabban (0.85mp) tűnnek el.", baseCost: 20, repeatable: false, req: 206, x: 88, y: 80 },
    { id: 405, name: "Koffein Remegés", desc: "Auto-Clicker! A gép másodpercenként 2-t kattint.", baseCost: 25, repeatable: false, req: 205, x: 100, y: 60 }
];

export const rpgItems = {
    'helmet': { name: 'Sajtos Sisak', icon: '🧀', desc: 'Alap kattintás +100' },
    'chain': { name: 'Titánium Lánc', icon: '⛓️', desc: 'Alap kattintás +50' }
};

export const newsItems = [
    "Martin szerint a dorogosok másnéven DROGISTÁK",
    "Elvileg Esztert azóta is bántja az a sok csúnya üzenet Martintól",
    "Daeron még mindig várja az aranybicikli felbukkanását",
    "Egy jótanács: szombat este inkább csak egy filmet tegyél be",
    "Martin büszkén jelenti: Készülnek az autók az új bizniszben!",
    "Felemelkedés! Építsd a Skill Tree-t a hatalmas szorzókért!"
];

export const achievements = [
    { threshold: 100, name: "Kezdő cigany", reward: 50, done: false },
    { threshold: 1000, name: "Bicikli Mániás cigany", reward: 500, done: false },
    { threshold: 10000, name: "Kötekedős cigány", reward: 5000, done: false },
    { threshold: 100000, name: "Drogista", reward: 50000, done: false },
    { threshold: 1000000, name: "Properrer hajlító", reward: 500000, done: false }
];