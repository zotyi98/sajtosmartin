/**
 * Cookie Clicker–stílusú milestone és globális fejlesztések (balanszált).
 * (Saját meta — nincs körkörös import a data.js-sel.)
 */
const BUILDING_META = [
    { id: 0, name: 'Nyúlcipő', cost: 30, type: 'click' },
    { id: 1, name: 'Energiaital', cost: 80, type: 'bps' },
    { id: 14, name: 'Roller', cost: 400, type: 'bps' },
    { id: 2, name: 'Segédmunkás', cost: 1800, type: 'bps' },
    { id: 9, name: 'Munkásszálló', cost: 8000, type: 'bps' },
    { id: 3, name: 'Gépkifújós', cost: 40000, type: 'bps' },
    { id: 10, name: 'Nagy ház', cost: 200000, type: 'bps' },
    { id: 17, name: 'Irodaház', cost: 2500000, type: 'bps' },
    { id: 4, name: 'Gépújraindító', cost: 15000000, type: 'bps' },
    { id: 5, name: 'Segédpropeller', cost: 80000000, type: 'bps' },
    { id: 11, name: 'Garrison', cost: 400000000, type: 'bps' },
    { id: 18, name: 'Kaszinó', cost: 2500000000, type: 'bps' },
    { id: 6, name: 'Sajtgyár', cost: 12000000000, type: 'bps' },
    { id: 8, name: 'Autóbiznisz', cost: 60000000000, type: 'bps' },
    { id: 12, name: 'Roxfort', cost: 350000000000, type: 'bps' },
    { id: 20, name: 'Nano-Gyár', cost: 1800000000000, type: 'bps' },
    { id: 13, name: 'Mordor', cost: 45000000000000, type: 'bps' },
    { id: 21, name: 'Űrállomás', cost: 280000000000000, type: 'bps' },
    { id: 22, name: 'Időgép', cost: 1500000000000000, type: 'bps' },
    { id: 23, name: 'Multiverzum', cost: 80000000000000000, type: 'bps' },
    { id: 24, name: 'Kvantum Depó', cost: 4e17, type: 'bps' },
    { id: 25, name: 'Holdbázis', cost: 2e19, type: 'bps' },
    { id: 26, name: 'Dimenziókapu', cost: 1e21, type: 'bps' },
    { id: 27, name: 'Örök Bicikli', cost: 5e22, type: 'bps' },
    { id: 28, name: 'Martin Szíve', cost: 2e24, type: 'bps' }
];

const MILESTONE_COUNTS = [20, 40, 60, 80, 100, 150, 200, 300, 500];
const MILESTONE_MULT_STEP = 0.04;

function buildingBaseCost(buildingId) {
    const b = BUILDING_META.find((d) => d.id === buildingId);
    return b ? b.cost : 1000;
}

/** Épületenként 9 milestone upgrade (id 201–399 tartomány) */
export function getMilestoneUpgrades() {
    const list = [];
    const bpsBuildings = BUILDING_META.filter((b) => b.type === 'bps' || b.type === 'click');

    bpsBuildings.forEach((b) => {
        MILESTONE_COUNTS.forEach((count, idx) => {
            const mult = 1 + (1 + idx) * MILESTONE_MULT_STEP;
            const id = 201 + b.id * 9 + idx;
            if (id > 599) return;
            const costScale = Math.pow(2.8, idx) * (1 + b.cost / 50000);
            list.push({
                id,
                name: `${b.name} — ${count} klón`,
                desc: `${b.name} ×${mult.toFixed(2)} hatékonyság`,
                cost: Math.floor(buildingBaseCost(b.id) * costScale * 12),
                reqBuilding: b.id,
                reqCount: count,
                targetId: b.id,
                mult
            });
        });
    });
    return list;
}

/** Globális milestone-ok (lifetime / összépület) */
export function getGlobalUpgrades() {
    return [
        { id: 601, name: 'Logisztikai hálózat', desc: 'Minden BPS épület +3%', cost: 5e8, reqBuilding: 2, reqCount: 25, targetId: -1, mult: 1.03, global: true },
        { id: 602, name: 'Központi raktár II', desc: 'Minden BPS épület +4%', cost: 2e10, reqBuilding: 10, reqCount: 40, targetId: -1, mult: 1.04, global: true },
        { id: 603, name: 'Birodalmi adózás', desc: 'Minden BPS épület +5%', cost: 8e11, reqBuilding: 11, reqCount: 30, targetId: -1, mult: 1.05, global: true },
        { id: 604, name: 'Nano optimalizálás', desc: 'Minden BPS épület +6%', cost: 5e13, reqBuilding: 20, reqCount: 50, targetId: -1, mult: 1.06, global: true },
        { id: 605, name: 'Multiverzum szinkron', desc: 'Minden BPS épület +8%', cost: 2e16, reqBuilding: 23, reqCount: 20, targetId: -1, mult: 1.08, global: true },
        { id: 606, name: 'Űrbázis koordináció', desc: 'Minden BPS épület +5%', cost: 1e15, reqBuilding: 21, reqCount: 40, targetId: -1, mult: 1.05, global: true },
        { id: 607, name: 'Idővonal egyesítés', desc: 'Minden BPS épület +7%', cost: 8e15, reqBuilding: 22, reqCount: 35, targetId: -1, mult: 1.07, global: true }
    ];
}

export function getAllCatalogUpgrades() {
    return [...getMilestoneUpgrades(), ...getGlobalUpgrades()];
}
