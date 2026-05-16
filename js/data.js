/** Áremelkedés minden vásárlásnál (Cookie Clicker ~1.15) */
export const BUILDING_PRICE_GROWTH = 1.15;

export const defaultUpgrades = [
    { id: 0, icon: "👟", name: "Nyúlcipő", desc: "+1 pont katt.", cost: 30, power: 1, type: "click", owned: 0 },
    { id: 1, icon: "🥤", name: "Energiaital", desc: "+1 pont / mp", cost: 80, power: 1, type: "bps", owned: 0 },
    { id: 14, icon: "🛴", name: "Roller Kölcsönző", desc: "+5 pont / mp", cost: 400, power: 5, type: "bps", owned: 0 },
    { id: 2, icon: "🚴", name: "Segédmunkás", desc: "+18 pont / mp", cost: 1800, power: 18, type: "bps", owned: 0 },
    { id: 9, icon: "🛏️", name: "Munkásszálló", desc: "+75 pont / mp", cost: 8000, power: 75, type: "bps", owned: 0 },
    { id: 3, icon: "🛠️", name: "Gépkifújós komp.", desc: "+320 pont / mp", cost: 40000, power: 320, type: "bps", owned: 0 },
    { id: 10, icon: "🏡", name: "Nagy ház", desc: "+1,400 pont / mp", cost: 200000, power: 1400, type: "bps", owned: 0 },
    { id: 17, icon: "🏢", name: "Irodaház", desc: "+6,000 pont / mp", cost: 1000000, power: 6000, type: "bps", owned: 0 },
    { id: 4, icon: "🖥️", name: "Gépújraindító", desc: "+28,000 pont / mp", cost: 5000000, power: 28000, type: "bps", owned: 0 },
    { id: 5, icon: "🌀", name: "Segédpropeller", desc: "+130,000 pont / mp", cost: 25000000, power: 130000, type: "bps", owned: 0 },
    { id: 11, icon: "🍻", name: "Garrison tavern", desc: "+600,000 pont / mp", cost: 120000000, power: 600000, type: "bps", owned: 0 },
    { id: 18, icon: "🎰", name: "Kaszinó", desc: "+2,800,000 pont / mp", cost: 600000000, power: 2800000, type: "bps", owned: 0 },
    { id: 6, icon: "🧀", name: "Sajtgyár", desc: "+14,000,000 pont / mp", cost: 3000000000, power: 14000000, type: "bps", owned: 0 },
    { id: 8, icon: "🚗", name: "Autóbiznisz", desc: "+70,000,000 pont / mp", cost: 15000000000, power: 70000000, type: "bps", owned: 0 },
    { id: 12, icon: "🏰", name: "Roxfort", desc: "+400,000,000 pont / mp", cost: 80000000000, power: 400000000, type: "bps", owned: 0 },
    { id: 20, icon: "🏭", name: "Nano-Gyár", desc: "+2,000,000,000 pont / mp", cost: 400000000000, power: 2000000000, type: "bps", owned: 0 },
    { id: 7, icon: "❤️", name: "Eszter támogatása", desc: "DUPLA BPS és Kattintás!", cost: 3000000000000, power: 0, type: "special", owned: 0 },
    { id: 13, icon: "👁️", name: "Mordor", desc: "+8,000,000,000 pont / mp", cost: 10000000000000, power: 8000000000, type: "bps", owned: 0 },
    { id: 21, icon: "🚀", name: "Űrállomás", desc: "+40,000,000,000 pont / mp", cost: 50000000000000, power: 40000000000, type: "bps", owned: 0 },
    { id: 22, icon: "⏱️", name: "Időgép", desc: "+200,000,000,000 pont / mp", cost: 250000000000000, power: 200000000000, type: "bps", owned: 0 },
    { id: 23, icon: "🌌", name: "Multiverzum Kapu", desc: "+1,000,000,000,000 pont / mp", cost: 1200000000000000, power: 1000000000000, type: "bps", owned: 0 }
];

export const extraUpgradesData = [
    { id: 101, name: "Könnyített Cípőfűző", desc: "Nyúlcipők x1.5 Erő", cost: 1000, reqBuilding: 0, reqCount: 10, targetId: 0, mult: 1.5 },
    { id: 118, name: "Tapadós Kesztyű", desc: "Roller Kölcsönző x1.5 BPS", cost: 4000, reqBuilding: 14, reqCount: 10, targetId: 14, mult: 1.5 },
    { id: 102, name: "Koffein Túladagolás", desc: "Energiaitalok x1.5 BPS", cost: 1000, reqBuilding: 1, reqCount: 10, targetId: 1, mult: 1.5 },
    { id: 103, name: "Olajozott Láncok", desc: "Segédmunkások x1.5 BPS", cost: 22000, reqBuilding: 2, reqCount: 10, targetId: 2, mult: 1.5 },
    { id: 106, name: "Emeletes ágyak", desc: "Munkásszállók x1.5 BPS", cost: 96000, reqBuilding: 9, reqCount: 10, targetId: 9, mult: 1.5 },
    { id: 107, name: "Napelemek", desc: "Nagy ház x1.5 BPS", cost: 2000000, reqBuilding: 10, reqCount: 10, targetId: 10, mult: 1.5 },
    { id: 119, name: "Részvényopció", desc: "Irodaház x1.5 BPS", cost: 10000000, reqBuilding: 17, reqCount: 10, targetId: 17, mult: 1.5 },
    { id: 108, name: "Shelby Különítmény", desc: "Garrison tavern x1.5 BPS", cost: 800000000, reqBuilding: 11, reqCount: 5, targetId: 11, mult: 1.5 },
    { id: 120, name: "High Roller", desc: "Kaszinó x1.5 BPS", cost: 5000000000, reqBuilding: 18, reqCount: 10, targetId: 18, mult: 1.5 },
    { id: 104, name: "Sajtos Munkások", desc: "Szinergia: Sajtgyár +20 BPS a Munkásnak", cost: 600000000, reqBuilding: 6, reqCount: 1, type: "synergy" },
    { id: 105, name: "Használtautó Keresk.", desc: "Autobizniszek x1.5 BPS", cost: 120000000000, reqBuilding: 8, reqCount: 5, targetId: 8, mult: 1.5 },
    { id: 109, name: "Pálcás Futárok", desc: "Roxfort x1.5 BPS", cost: 400000000000, reqBuilding: 12, reqCount: 3, targetId: 12, mult: 1.5 },
    { id: 121, name: "Plazma Hegesztő", desc: "Nano-Gyár x1.5 BPS", cost: 3000000000000, reqBuilding: 20, reqCount: 10, targetId: 20, mult: 1.5 },
    { id: 110, name: "Szauron Szeme", desc: "Mordor x1.5 BPS", cost: 50000000000000, reqBuilding: 13, reqCount: 1, targetId: 13, mult: 1.5 },
    { id: 122, name: "Műholdas Adatátvi tel", desc: "Űrallómás x1.5 BPS", cost: 250000000000000, reqBuilding: 21, reqCount: 5, targetId: 21, mult: 1.5 },
    { id: 123, name: "Paradoxon Pájzs", desc: "Időgép x1.5 BPS", cost: 1200000000000000, reqBuilding: 22, reqCount: 5, targetId: 22, mult: 1.5 }
];

export const prestigeSkillsData = [
    { id: 301, name: "Isteni Láncolaj", desc: "Minden BPS és Kattintás +100%! (Max 3x)", baseCost: 2, repeatable: true, maxLevel: 3, req: null, x: 50, y: 15 },
    { id: 302, name: "Gyémánt Láncolaj", desc: "Újabb +100% BPS és Katt. szorzó! (Max 3x)", baseCost: 10, repeatable: true, maxLevel: 3, req: 301, x: 50, y: 30 },
    { id: 303, name: "Mágikus Hányózsák", desc: "A hányás takarítása 1.5x annyi biciklit fizet.", baseCost: 8, repeatable: false, req: 302, x: 50, y: 45 },
    { id: 304, name: "Küllő-Mágnes", desc: "A megmaradt Küllőid 1% helyett 2% bónuszt adnak!", baseCost: 15, repeatable: false, req: 303, x: 50, y: 60 },
    { id: 404, name: "Sötét Anyag Küllő", desc: "+10% Globális BPS minden szinten. (VÉGTELENSZER)", baseCost: 30, repeatable: true, maxLevel: 9999, req: 304, x: 50, y: 82 },

    { id: 203, name: "Eszter Titka", desc: "Eszter támogatása 20%-kal olcsóbb lesz.", baseCost: 5, repeatable: false, req: 301, x: 25, y: 30 },
    { id: 207, name: "Kuponkód", desc: "Minden alap épület 10%-kal olcsóbb!", baseCost: 10, repeatable: false, req: 203, x: 12, y: 45 },
    { id: 209, name: "Tőzsdecápa", desc: "Szerencsekerék nyereménye: 30x helyett 40x szorzó (+33%)", baseCost: 20, repeatable: false, req: 207, x: 12, y: 65 },
    { id: 208, name: "Éjszakai Bagoly", desc: "Éjszakai Műszak felhői +20% extra szorzó.", baseCost: 15, repeatable: false, req: 203, x: 32, y: 45 },
    { id: 210, name: "Globális Ellátólánc", desc: "Minden BIRTOKOLT épülettípus után +2% BPS!", baseCost: 30, repeatable: false, req: 208, x: 32, y: 65 },

    { id: 202, name: "Szerencsés Kéz", desc: "Az Arany/Rozsdás biciklik ~1.25x sűrűbben jönnek.", baseCost: 3, repeatable: false, req: 301, x: 75, y: 30 },
    { id: 201, name: "Felhővadász", desc: "A varázsfelhők ~1.4x gyakrabban jelennek meg.", baseCost: 2, repeatable: false, req: 202, x: 68, y: 45 },
    { id: 204, name: "Varázsüveg", desc: "A bónusz biciklik 5mp-el tovább maradnak kint.", baseCost: 5, repeatable: false, req: 201, x: 68, y: 65 },
    { id: 401, name: "Aranyásó", desc: "Az Aranybicikli nagyobbat dob a bevételen!", baseCost: 15, repeatable: false, req: 204, x: 66, y: 80 },
    { id: 406, name: "Rozsdás Immunitás", desc: "Nincs több defekt (0 BPS), csakis a bónusz!", baseCost: 20, repeatable: false, req: 401, x: 78, y: 80 },

    { id: 205, name: "Villámkezű", desc: "A kattintásod megkapja a teljes (BPS) 1%-át!", baseCost: 15, repeatable: false, req: 202, x: 88, y: 45 },
    { id: 206, name: "Mesterlövész", desc: "Az Aim Lab győzelem 3x helyett 5x-es nyeremény!", baseCost: 25, repeatable: false, req: 205, x: 88, y: 65 },
    { id: 402, name: "Reflex Ital", desc: "Az Aim Lab célpontok lassabban (0.85mp) tűnnek el.", baseCost: 20, repeatable: false, req: 206, x: 88, y: 80 }
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
    "Martin büszkén jelenti: Nyomtunk egy mid rusht",
    "Martinnal ne kekeckedjetek mert megver!",
    // --- Új mondatok (szerkeszthető) ---
    "A konyhaszünet alatt Martint valójában bevizsgálják hátulról",
    "A ranglistán kattints egy névre: élőben látod a birodalmát (Spectate).",
    "Pro tipp: az aranybicikli után néha tárgy is hullik az égből.",
    "Ha a rozsdás bicó defektet ad, takarítsd a hányást — kárpótol a rendszer.",
    "Martin néha visz haza is egy kis sajtot"
];

/**
 * Achievement: check = feltétel, reward = jutalom (nem csak bicikli!)
 * Típusok: lifetimeBikes, bikes, bps, maxBps, prestigeCount, goldenSpokes,
 * totalClicks, buildingOwned, buildingTypes, totalBuildings, extraUpgrades,
 * prestigeSkills, inventory, cosmetic, eventTotal, eventsTotal, aimlabWins,
 * wheelJackpots, playMinutes, spectate
 */
export const achievements = [
    // —— Termelés / gazdaság ——
    { id: 'prod_first', icon: '👶', name: 'Első pedál', desc: 'Életedben először 100 biciklit termeltél.', check: { type: 'lifetimeBikes', value: 100 }, reward: { type: 'bikes', amount: 80 }, done: false },
    { id: 'prod_century', icon: '🚲', name: 'Százas bringás', desc: '1 000 bicikli összesen.', check: { type: 'lifetimeBikes', value: 1000 }, reward: { type: 'buff', mult: 1.5, target: 'click', durationMs: 90000, text: '🏆 Százas: 1.5x kattintás!', color: '#ff9800' }, done: false },
    { id: 'prod_maniac', icon: '🔥', name: 'Bicikli mániás', desc: '10 000 össztermelés.', check: { type: 'lifetimeBikes', value: 10000 }, reward: { type: 'bikes', amount: 5000 }, done: false },
    { id: 'prod_dealer', icon: '💼', name: 'Központi raktár', desc: '100 000 bicikli egy életben.', check: { type: 'lifetimeBikes', value: 100000 }, reward: { type: 'instantProduction', seconds: 120 }, done: false },
    { id: 'prod_tycoon', icon: '👑', name: 'Bicikli mágnás', desc: '1 millió össztermelés.', check: { type: 'lifetimeBikes', value: 1000000 }, reward: { type: 'goldenSpokes', amount: 1 }, done: false },
    { id: 'prod_billion', icon: '🌟', name: 'Milliárdos kerekpar', desc: '1 milliárd lifetime bicikli.', check: { type: 'lifetimeBikes', value: 1e9 }, reward: { type: 'buff', mult: 2, target: 'bps', durationMs: 300000, text: '🏆 2x BPS 5 perc!', color: '#7cb342' }, done: false },
    { id: 'prod_trillion', icon: '🌌', name: 'Trilliós turbó', desc: '1 billió — a birodalom legendája.', check: { type: 'lifetimeBikes', value: 1e12 }, reward: { type: 'goldenSpokes', amount: 2 }, done: false },
    { id: 'prod_wallet', icon: '💰', name: 'Tele a pénztárca', desc: 'Egyszerre 1 millió biciklid van.', check: { type: 'bikes', value: 1000000 }, reward: { type: 'bikes', amount: 100000 }, done: false },
    { id: 'prod_bps_beast', icon: '⚡', name: 'Villám BPS', desc: 'Elértél 1 000 000 BPS-t.', check: { type: 'bps', value: 1000000 }, reward: { type: 'instantProduction', seconds: 300 }, done: false },

    // —— Kattintás ——
    { id: 'click_sore', icon: '👆', name: 'Ujjbegy-gyanta', desc: '500 kattintás Martinra.', check: { type: 'totalClicks', value: 500 }, reward: { type: 'clickBonus', amount: 3 }, done: false },
    { id: 'click_machine', icon: '🖱️', name: 'Katt-gép', desc: '5 000 kattintás.', check: { type: 'totalClicks', value: 5000 }, reward: { type: 'buff', mult: 2, target: 'both', durationMs: 45000, text: '🖱️ Katt-gép: 2x minden!', color: '#e91e63' }, done: false },
    { id: 'click_god', icon: '⚡', name: 'Martin ujjának árnyéka', desc: '25 000 kattintás.', check: { type: 'totalClicks', value: 25000 }, reward: { type: 'clickBonus', amount: 15 }, done: false },

    // —— Épületek ——
    { id: 'build_rental', icon: '🥤', name: 'Első vállalkozás', desc: 'Vettél legalább 1 Energiaital üzemet.', check: { type: 'buildingOwned', buildingId: 1, value: 1 }, reward: { type: 'bikes', amount: 200 }, done: false },
    { id: 'build_diversify', icon: '🏗️', name: 'Diverzifikátor', desc: '5 különböző épület típus a birtokodban.', check: { type: 'buildingTypes', value: 5 }, reward: { type: 'inventory', itemId: 'chain' }, done: false },
    { id: 'build_empire', icon: '🏙️', name: 'Városháza hangja', desc: '50 épület összesen (minden típus).', check: { type: 'totalBuildings', value: 50 }, reward: { type: 'bikes', amount: 250000 }, done: false },
    { id: 'build_cheese', icon: '🧀', name: 'Sajtmagnát', desc: 'Megnyitottad a Sajtgyárat (legalább 1).', check: { type: 'buildingOwned', buildingId: 6, value: 1 }, reward: { type: 'buff', mult: 1.5, target: 'bps', durationMs: 180000, text: '🧀 Sajt-láz: 1.5x BPS!', color: '#ffc107' }, done: false },
    { id: 'build_eszter', icon: '❤️', name: 'Eszter szurkol', desc: 'Megvetted az Eszter támogatást.', check: { type: 'buildingOwned', buildingId: 7, value: 1 }, reward: { type: 'buff', mult: 2, target: 'both', durationMs: 120000, text: '❤️ Eszter boost: 2x minden!', color: '#e91e63' }, done: false },
    { id: 'build_nano', icon: '🏭', name: 'Nano-nemzedék', desc: 'Nano-Gyár a tied.', check: { type: 'buildingOwned', buildingId: 20, value: 1 }, reward: { type: 'goldenSpokes', amount: 1 }, done: false },
    { id: 'build_multiverse', icon: '🌌', name: 'Kapuőr', desc: 'Multiverzum Kapu — 1 darab.', check: { type: 'buildingOwned', buildingId: 23, value: 1 }, reward: { type: 'cosmetic', id: 'cheese_cursor' }, done: false },

    // —— Prestige / fejlődés ——
    { id: 'meta_rebirth', icon: '✨', name: 'Fénylő újjászületés', desc: 'Először újraszülettél (prestige).', check: { type: 'prestigeCount', value: 1 }, reward: { type: 'buff', mult: 2, target: 'bps', durationMs: 600000, text: '✨ Újjászületés: 10 perc 2x BPS!', color: '#ffd54f' }, done: false },
    { id: 'meta_veteran', icon: '🔄', name: 'Örök újrakezdő', desc: '5 prestige.', check: { type: 'prestigeCount', value: 5 }, reward: { type: 'goldenSpokes', amount: 3 }, done: false },
    { id: 'meta_skill_tree', icon: '🌳', name: 'Skill fa mászó', desc: '3 prestige skill feloldva.', check: { type: 'prestigeSkills', value: 3 }, reward: { type: 'bikes', amount: 50000 }, done: false },
    { id: 'meta_spoke_hoarder', icon: '✴️', name: 'Küllőgyűjtő', desc: '10 Arany Küllő a tarisznyádban.', check: { type: 'goldenSpokes', value: 10 }, reward: { type: 'inventory', itemId: 'helmet' }, done: false },
    { id: 'meta_extra', icon: '🛠️', name: 'Tuning mester', desc: '5 extra fejlesztés megvéve.', check: { type: 'extraUpgrades', value: 5 }, reward: { type: 'instantProduction', seconds: 600 }, done: false },

    // —— Események ——
    { id: 'event_golden', icon: '✨', name: 'Aranyeső', desc: '10 aranybiciklit kaptál el.', check: { type: 'eventTotal', event: 'golden', value: 10 }, reward: { type: 'buff', mult: 2, target: 'both', durationMs: 60000, text: '✨ Aranyeső utóhatás: 2x!', color: '#ffc107' }, done: false },
    { id: 'event_cloud', icon: '☁️', name: 'Felhővadász', desc: '15 felhőt szívtál meg.', check: { type: 'eventTotal', event: 'cloud', value: 15 }, reward: { type: 'bikes', amount: 75000 }, done: false },
    { id: 'event_wizard', icon: '🧙', name: 'Haverom Harry', desc: 'Elkaptad Harry Pottert.', check: { type: 'eventTotal', event: 'harry', value: 1 }, reward: { type: 'buff', mult: 3, target: 'click', durationMs: 30000, text: '🧙 3x kattintás!', color: '#9c27b0' }, done: false },
    { id: 'event_janitor', icon: '🧹', name: 'Takarító műszak', desc: '8x feltakarítottad a kanapét.', check: { type: 'eventTotal', event: 'puke', value: 8 }, reward: { type: 'bikes', amount: 40000 }, done: false },
    { id: 'event_kitchen', icon: '☕', name: 'Konyha legenda', desc: '10 konyhagyűlés kibírva.', check: { type: 'eventTotal', event: 'kitchen', value: 10 }, reward: { type: 'instantProduction', seconds: 180 }, done: false },
    { id: 'event_chaos', icon: '🎪', name: 'Cirkuszigazgató', desc: '50 összes esemény interakció.', check: { type: 'eventsTotal', value: 50 }, reward: { type: 'goldenSpokes', amount: 1 }, done: false },

    // —— Szerencse / minijátékok ——
    { id: 'game_aimlab', icon: '🎯', name: 'E-sport legenda', desc: 'Nyertél egy Aim Lab kört.', check: { type: 'aimlabWins', value: 1 }, reward: { type: 'buff', mult: 2, target: 'click', durationMs: 90000, text: '🎯 Aim Lab bajnok: 2x katt!', color: '#0288d1' }, done: false },
    { id: 'game_wheel', icon: '🎰', name: 'Szerencsekerék király', desc: 'Telitalálat a keréken.', check: { type: 'wheelJackpots', value: 1 }, reward: { type: 'bikes', amount: 100000 }, done: false },
    { id: 'game_high_roller', icon: '💎', name: 'High roller', desc: '3 telitalálat a szerencsekeréken.', check: { type: 'wheelJackpots', value: 3 }, reward: { type: 'goldenSpokes', amount: 2 }, done: false },

    // —— Közösség / egyéb ——
    { id: 'social_spy', icon: '👁️', name: 'Kém a ranglistán', desc: 'Megfigyeltél valakit (Spectate).', check: { type: 'spectate', value: 1 }, reward: { type: 'bikes', amount: 15000 }, done: false },
    { id: 'social_cheese_buy', icon: '🧀', name: 'Sajtkedvelő', desc: 'Megvetted a sajtos kurzort.', check: { type: 'cosmetic', id: 'cheese_cursor' }, reward: { type: 'clickBonus', amount: 5 }, done: false },
    { id: 'social_marathon', icon: '⏳', name: 'Maraton bringás', desc: '2 óra játékidő egy fiókon.', check: { type: 'playMinutes', value: 120 }, reward: { type: 'buff', mult: 1.5, target: 'bps', durationMs: 600000, text: '⏳ Maraton: 1.5x BPS 10 perc!', color: '#5c6bc0' }, done: false },
    { id: 'social_veteran_days', icon: '📅', name: 'Régi motoros', desc: '24 óra összes játékidő.', check: { type: 'playMinutes', value: 1440 }, reward: { type: 'goldenSpokes', amount: 2 }, done: false }
];
