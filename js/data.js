export const defaultUpgrades = [
    { id: 0, icon: "👟", name: "Nyúlcipő", desc: "+1 pont katt.", cost: 50, power: 1, type: "click", owned: 0 },
    { id: 1, icon: "🥤", name: "Energiaital", desc: "+1 pont / mp", cost: 150, power: 1, type: "bps", owned: 0 },
    { id: 2, icon: "🚴", name: "Segédmunkás", desc: "+8 pont / mp", cost: 1100, power: 8, type: "bps", owned: 0 },
    { id: 9, icon: "🛏️", name: "Munkásszálló", desc: "+25 pont / mp", cost: 4500, power: 25, type: "bps", owned: 0 },
    { id: 3, icon: "🛠️", name: "Gépkifújós komp.", desc: "+60 pont / mp", cost: 12000, power: 60, type: "bps", owned: 0 },
    { id: 10, icon: "🏡", name: "Nagy ház", desc: "+150 pont / mp", cost: 45000, power: 150, type: "bps", owned: 0 },
    { id: 4, icon: "🖥️", name: "Gépújraindító", desc: "+350 pont / mp", cost: 130000, power: 350, type: "bps", owned: 0 },
    { id: 5, icon: "🌀", name: "Segédpropeller", desc: "+1,400 pont / mp", cost: 1400000, power: 1400, type: "bps", owned: 0 },
    { id: 11, icon: "🍻", name: "Garrison tavern", desc: "+4,000 pont / mp", cost: 5000000, power: 4000, type: "bps", owned: 0 },
    { id: 6, icon: "🧀", name: "Sajtgyár", desc: "+9,500 pont / mp", cost: 20000000, power: 9500, type: "bps", owned: 0 },
    { id: 8, icon: "🚗", name: "Autóbiznisz", desc: "+65,000 pont / mp", cost: 500000000, power: 65000, type: "bps", owned: 0 },
    { id: 12, icon: "🏰", name: "Roxfort", desc: "+300,000 pont / mp", cost: 3000000000, power: 300000, type: "bps", owned: 0 },
    { id: 7, icon: "❤️", name: "Eszter támogatása", desc: "DUPLA BPS és Kattintás!", cost: 10000000000, power: 0, type: "special", owned: 0 },
    { id: 13, icon: "👁️", name: "Mordor", desc: "+2,000,000 pont / mp", cost: 50000000000, power: 2000000, type: "bps", owned: 0 }
];

export const extraUpgradesData = [
    { id: 101, name: "Könnyített Cípőfűző", desc: "Nyúlcipők x2 Erő", cost: 5000, reqBuilding: 0, reqCount: 10, targetId: 0, mult: 2 },
    { id: 102, name: "Koffein Túladagolás", desc: "Energiaitalok x3 BPS", cost: 7500, reqBuilding: 1, reqCount: 10, targetId: 1, mult: 3 },
    { id: 103, name: "Olajozott Láncok", desc: "Segédmunkások x2 BPS", cost: 55000, reqBuilding: 2, reqCount: 10, targetId: 2, mult: 2 },
    { id: 106, name: "Emeletes ágyak", desc: "Munkásszállók x2 BPS", cost: 200000, reqBuilding: 9, reqCount: 10, targetId: 9, mult: 2 },
    { id: 107, name: "Napelemek", desc: "Nagy ház x2 BPS", cost: 1000000, reqBuilding: 10, reqCount: 10, targetId: 10, mult: 2 },
    { id: 108, name: "Shelby Különítmény", desc: "Garrison tavern x2 BPS", cost: 25000000, reqBuilding: 11, reqCount: 5, targetId: 11, mult: 2 },
    { id: 104, name: "Sajtos Munkások", desc: "Szinergia: Sajtgyár ad +100 BPS a Munkásnak", cost: 50000000, reqBuilding: 6, reqCount: 1, type: "synergy" },
    { id: 105, name: "Használtautó Keresk.", desc: "Autóbizniszek x2 BPS", cost: 1500000000, reqBuilding: 8, reqCount: 5, targetId: 8, mult: 2 },
    { id: 109, name: "Pálcás Futárok", desc: "Roxfort x2 BPS", cost: 15000000000, reqBuilding: 12, reqCount: 3, targetId: 12, mult: 2 },
    { id: 110, name: "Szauron Szeme", desc: "Mordor x2 BPS", cost: 250000000000, reqBuilding: 13, reqCount: 1, targetId: 13, mult: 2 },
    
    { id: 111, name: "Gyémánt Cipőfűző", desc: "Nyúlcipők x3 Erő", cost: 50000, reqBuilding: 0, reqCount: 30, targetId: 0, mult: 3 },
    { id: 112, name: "Koffein Sokk", desc: "Energiaitalok x3 BPS", cost: 150000, reqBuilding: 1, reqCount: 30, targetId: 1, mult: 3 },
    { id: 113, name: "Robot Munkások", desc: "Segédmunkások x2 BPS", cost: 500000, reqBuilding: 2, reqCount: 30, targetId: 2, mult: 2 },
    { id: 115, name: "Luxuslakosztályok", desc: "Nagy ház x3 BPS", cost: 20000000, reqBuilding: 10, reqCount: 25, targetId: 10, mult: 3 },
    { id: 114, name: "Trappista Hegység", desc: "Sajtgyár x2 BPS", cost: 500000000, reqBuilding: 6, reqCount: 15, targetId: 6, mult: 2 }
];

export const prestigeSkillsData = [
    { id: 301, name: "Isteni Láncolaj", desc: "Minden BPS és Kattintás 2x! (Végtelenszer vehető)", baseCost: 2, repeatable: true, req: null, x: 50, y: 10 },
    { id: 202, name: "Szerencsés Kéz", desc: "Az Arany/Rozsdás biciklik 2x sűrűbben jönnek.", baseCost: 3, repeatable: false, req: 301, x: 65, y: 25 },
    { id: 201, name: "Felhővadász", desc: "A varázsfelhők 2x gyakrabban jelennek meg.", baseCost: 2, repeatable: false, req: 202, x: 80, y: 40 },
    { id: 204, name: "Varázsüveg", desc: "A bónusz biciklik 5 másodperccel tovább maradnak kint.", baseCost: 5, repeatable: false, req: 201, x: 90, y: 60 },
    { id: 205, name: "Villámkezű", desc: "A kattintásod megkapja a teljes (BPS) 1%-át!", baseCost: 15, repeatable: false, req: 202, x: 65, y: 50 },
    { id: 206, name: "Mesterlövész", desc: "Az Aim Lab győzelem 5x helyett 10x-es nyereményt ad!", baseCost: 25, repeatable: false, req: 205, x: 70, y: 75 },
    { id: 203, name: "Eszter Titka", desc: "Eszter támogatása 20%-kal olcsóbb lesz.", baseCost: 5, repeatable: false, req: 301, x: 35, y: 25 },
    { id: 207, name: "Kuponkód", desc: "Minden alap épület 10%-kal olcsóbb!", baseCost: 10, repeatable: false, req: 203, x: 20, y: 40 },
    { id: 209, name: "Tőzsdecápa", desc: "A Szerencsekerék telitalálat 80x helyett 100x-os nyereményt ad.", baseCost: 20, repeatable: false, req: 207, x: 10, y: 60 },
    { id: 208, name: "Éjszakai Bagoly", desc: "Az Éjszakai Műszak felhői 20x helyett 30x szorzót adnak.", baseCost: 15, repeatable: false, req: 203, x: 35, y: 50 },
    { id: 210, name: "Globális Ellátólánc", desc: "Minden BIRTROKOLT épülettípusod után +5% globális BPS!", baseCost: 30, repeatable: false, req: 208, x: 30, y: 75 },
    { id: 302, name: "Gyémánt Láncolaj", desc: "Újabb 2x BPS és Katt. szorzó! (Végtelenszer vehető)", baseCost: 10, repeatable: true, req: 301, x: 50, y: 35 },
    { id: 303, name: "Mágikus Hányózsák", desc: "A hányás takarítása dupla annyi biciklit fizet.", baseCost: 8, repeatable: false, req: 302, x: 50, y: 60 },
    { id: 304, name: "Peaky Blinders", desc: "A multiplayer tolvajok maximum 10%-ot tudnak ellopni tőled.", baseCost: 15, repeatable: false, req: 303, x: 50, y: 85 }
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