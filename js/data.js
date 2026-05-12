export const defaultUpgrades = [
    { id: 0, icon: "👟", name: "Nyúlcipő", desc: "+1 pont katt.", cost: 50, power: 1, type: "click", owned: 0 },
    { id: 1, icon: "🥤", name: "Energiaital", desc: "+1 pont / mp", cost: 150, power: 1, type: "bps", owned: 0 },
    { id: 14, icon: "🛴", name: "Roller Kölcsönző", desc: "+4 pont / mp", cost: 500, power: 4, type: "bps", owned: 0 }, // ÚJ (Early)
    { id: 2, icon: "🚴", name: "Segédmunkás", desc: "+8 pont / mp", cost: 1100, power: 8, type: "bps", owned: 0 },
    { id: 9, icon: "🛏️", name: "Munkásszálló", desc: "+25 pont / mp", cost: 4500, power: 25, type: "bps", owned: 0 },
    { id: 3, icon: "🛠️", name: "Gépkifújós komp.", desc: "+60 pont / mp", cost: 12000, power: 60, type: "bps", owned: 0 },
    { id: 10, icon: "🏡", name: "Nagy ház", desc: "+150 pont / mp", cost: 45000, power: 150, type: "bps", owned: 0 },
    { id: 17, icon: "🏢", name: "Irodaház", desc: "+500 pont / mp", cost: 250000, power: 500, type: "bps", owned: 0 }, // ÚJ (Mid)
    { id: 4, icon: "🖥️", name: "Gépújraindító", desc: "+1,200 pont / mp", cost: 800000, power: 1200, type: "bps", owned: 0 },
    { id: 5, icon: "🌀", name: "Segédpropeller", desc: "+4,500 pont / mp", cost: 5000000, power: 4500, type: "bps", owned: 0 },
    { id: 11, icon: "🍻", name: "Garrison tavern", desc: "+12,000 pont / mp", cost: 25000000, power: 12000, type: "bps", owned: 0 },
    { id: 18, icon: "🎰", name: "Kaszinó", desc: "+45,000 pont / mp", cost: 120000000, power: 45000, type: "bps", owned: 0 }, // ÚJ (Mid-Late)
    { id: 6, icon: "🧀", name: "Sajtgyár", desc: "+110,000 pont / mp", cost: 450000000, power: 110000, type: "bps", owned: 0 },
    { id: 8, icon: "🚗", name: "Autóbiznisz", desc: "+350,000 pont / mp", cost: 2000000000, power: 350000, type: "bps", owned: 0 },
    { id: 12, icon: "🏰", name: "Roxfort", desc: "+1,200,000 pont / mp", cost: 10000000000, power: 1200000, type: "bps", owned: 0 },
    { id: 20, icon: "🏭", name: "Nano-Gyár", desc: "+5,000,000 pont / mp", cost: 75000000000, power: 5000000, type: "bps", owned: 0 }, // ÚJ (Late)
    { id: 7, icon: "❤️", name: "Eszter támogatása", desc: "DUPLA BPS és Kattintás!", cost: 250000000000, power: 0, type: "special", owned: 0 },
    { id: 13, icon: "👁️", name: "Mordor", desc: "+15,000,000 pont / mp", cost: 800000000000, power: 15000000, type: "bps", owned: 0 },
    { id: 21, icon: "🚀", name: "Űrállomás", desc: "+60,000,000 pont / mp", cost: 5000000000000, power: 60000000, type: "bps", owned: 0 }, // ÚJ (Late)
    { id: 22, icon: "⏱️", name: "Időgép", desc: "+250,000,000 pont / mp", cost: 25000000000000, power: 250000000, type: "bps", owned: 0 }, // ÚJ (Late)
    { id: 23, icon: "🌌", name: "Multiverzum Kapu", desc: "+1,500,000,000 pont / mp", cost: 150000000000000, power: 1500000000, type: "bps", owned: 0 } // ÚJ (Late)
];

export const extraUpgradesData = [
    { id: 101, name: "Könnyített Cípőfűző", desc: "Nyúlcipők x2 Erő", cost: 5000, reqBuilding: 0, reqCount: 10, targetId: 0, mult: 2 },
    { id: 118, name: "Tapadós Kesztyű", desc: "Roller Kölcsönző x2 BPS", cost: 15000, reqBuilding: 14, reqCount: 10, targetId: 14, mult: 2 }, // ÚJ Extra
    { id: 102, name: "Koffein Túladagolás", desc: "Energiaitalok x3 BPS", cost: 7500, reqBuilding: 1, reqCount: 10, targetId: 1, mult: 3 },
    { id: 119, name: "Részvényopció", desc: "Irodaház x2 BPS", cost: 2500000, reqBuilding: 17, reqCount: 10, targetId: 17, mult: 2 }, // ÚJ Extra
    { id: 120, name: "High Roller", desc: "Kaszinó x2 BPS", cost: 500000000, reqBuilding: 18, reqCount: 10, targetId: 18, mult: 2 }, // ÚJ Extra
    { id: 121, name: "Plazma Hegesztő", desc: "Nano-Gyár x2 BPS", cost: 150000000000, reqBuilding: 20, reqCount: 10, targetId: 20, mult: 2 }, // ÚJ Extra
    { id: 122, name: "Műholdas Adatátvitel", desc: "Űrállomás x2 BPS", cost: 10000000000000, reqBuilding: 21, reqCount: 5, targetId: 21, mult: 2 }, // ÚJ Extra
    { id: 123, name: "Paradoxon Pajzs", desc: "Időgép x2 BPS", cost: 80000000000000, reqBuilding: 22, reqCount: 5, targetId: 22, mult: 2 } // ÚJ Extra
];

export const prestigeSkillsData = [
    { id: 301, name: "Isteni Láncolaj", desc: "Minden BPS és Kattintás 2x! (Max 3x vehető)", baseCost: 2, repeatable: true, maxLevel: 3, req: null, x: 50, y: 10 },
    { id: 202, name: "Szerencsés Kéz", desc: "Az Arany/Rozsdás biciklik 2x sűrűbben jönnek.", baseCost: 3, repeatable: false, req: 301, x: 65, y: 25 },
    { id: 206, name: "Mesterlövész", desc: "Az Aim Lab győzelem 5x helyett 10x-es nyereményt ad!", baseCost: 25, repeatable: false, req: 205, x: 70, y: 75 },
    { id: 304, name: "Küllő-Mágnes", desc: "A megmaradt Küllőid 1% helyett 2% bónuszt adnak!", baseCost: 15, repeatable: false, req: 301, x: 50, y: 85 }, // ÚJ Skill
    { id: 401, name: "Aranyásó", desc: "Az Aranybicikli 7x helyett 15x szorzót ad!", baseCost: 15, repeatable: false, req: 202, x: 90, y: 80 }, // ÚJ Skill
    { id: 402, name: "Reflex Ital", desc: "Az Aim Lab célpontok lassabban (0.85mp) tűnnek el.", baseCost: 20, repeatable: false, req: 206, x: 85, y: 75 }, // ÚJ Skill
    { id: 404, name: "Sötét Anyag Küllő", desc: "+10% Globális BPS minden szinten. (VÉGTELENSZER)", baseCost: 30, repeatable: true, maxLevel: 9999, req: 304, x: 50, y: 100 } // ÚJ Skill
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