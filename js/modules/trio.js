import { GameState, db, showToast, saveUserProgress, updateUI } from '../state.js';
import {
    ref, push, set, update, remove, onValue, get, runTransaction
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { sanitizeUsername } from '../authSession.js';

/** Trio — csak multiplayer (3–6 játékos), Firebase szoba */

const DEAL = {
    3: { hand: 9, middle: 9 },
    4: { hand: 7, middle: 8 },
    5: { hand: 6, middle: 6 },
    6: { hand: 5, middle: 6 }
};

const ENTRY_PCT = 0.02;
const MAX_ENTRY = 800_000;
const MIN_ENTRY = 15_000;
const WIN_POT_PCT = 0.92;
const LOBBY_MAX_AGE_MS = 30 * 60 * 1000;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

let roomId = null;
let roomUnsub = null;
let lobbyUnsub = null;
let handUnsub = null;
let localRoom = null;
let myHand = [];
let openRooms = [];
let payoutClaimed = false;

function myKey() {
    return sanitizeUsername(GameState.currentUser);
}

function myName() {
    return GameState.currentUser || myKey();
}

function calcEntry() {
    const raw = Math.floor(GameState.bikes * ENTRY_PCT);
    return Math.max(MIN_ENTRY, Math.min(MAX_ENTRY, raw || MIN_ENTRY));
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function createDeck() {
    const deck = [];
    let id = 0;
    for (let v = 1; v <= 12; v++) {
        for (let n = 0; n < 3; n++) deck.push({ id: id++, value: v });
    }
    return shuffle(deck);
}

function sortHand(hand) {
    hand.sort((a, b) => a.value - b.value || a.id - b.id);
}

function insertIntoHand(hand, card) {
    hand.push(card);
    sortHand(hand);
}

function randomCode() {
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
}

function triosConnected(values) {
    if (values.length < 2) return false;
    for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
            const a = values[i];
            const b = values[j];
            if (a + b === 7 || Math.abs(a - b) === 7) return true;
        }
    }
    return false;
}

function checkWinPlayer(wonTrios, mode) {
    const trioValues = (wonTrios || []).map((t) => t[0]?.value ?? t[0]);
    if (wonTrios?.some((t) => t.length === 3 && (t[0]?.value ?? t[0]) === 7)) {
        return { reason: 'Hármas 7' };
    }
    if (mode === 'simple') {
        if ((wonTrios || []).length >= 3) return { reason: '3 trio' };
    } else if (trioValues.length >= 2 && triosConnected(trioValues)) {
        return { reason: '2 összekapcsolt trio' };
    }
    return null;
}

function seatIndex(room, key) {
    return (room.public?.playerOrder || []).indexOf(key);
}

function isMyTurn(room) {
    return room?.public?.status === 'playing' && room.public.turnKey === myKey();
}

function amHost(room) {
    return room?.public?.hostKey === myKey();
}

function playerCount(room) {
    return Object.keys(room?.players || {}).length;
}

function nextTurnKey(room) {
    const order = room.public.playerOrder || [];
    const idx = order.indexOf(room.public.turnKey);
    return order[(idx + 1) % order.length];
}

function handCount(room, key) {
    return (room.hands?.[key] || []).length;
}

function payEntry(entry) {
    if (GameState.bikes < entry) return false;
    GameState.bikes -= entry;
    saveUserProgress();
    updateUI();
    return true;
}

function refundEntry(entry) {
    GameState.bikes += entry;
    saveUserProgress();
    updateUI();
    showToast(`Belépő visszatérítve: +${entry.toLocaleString()} 🚲`, 'success');
}

function tryClaimPayout(room) {
    if (!room || payoutClaimed) return;
    const pub = room.public;
    if (pub.status !== 'finished' || pub.winnerKey !== myKey()) return;
    if (room.players?.[myKey()]?.payoutClaimed) {
        payoutClaimed = true;
        return;
    }
    const prize = Math.floor((pub.pot || 0) * WIN_POT_PCT);
    if (prize <= 0) return;

    payoutClaimed = true;
    const pRef = ref(db, `trioRooms/${roomId}/players/${myKey()}/payoutClaimed`);
    set(pRef, true).catch(() => {});

    GameState.bikes += prize;
    GameState.lifetimeBikes = (GameState.lifetimeBikes || 0) + prize;
    saveUserProgress();
    updateUI();
    showToast(`Trio győzelem: +${prize.toLocaleString()} 🚲 (a nyereményalap ${Math.round(WIN_POT_PCT * 100)}%-a)`, 'success');
}

/** Kinézet — élő Trio lapok */
const CARD_THEME = {
    1: { bg: '#c62828', art: '🌵', link: [6, 8] },
    2: { bg: '#ef6c00', art: '🎸', link: [5, 9] },
    3: { bg: '#1565c0', art: '🎩', link: [4, 10] },
    4: { bg: '#6a1b9a', art: '🪅', link: [3, 11] },
    5: { bg: '#d81b60', art: '🌮', link: [2, 12] },
    6: { bg: '#2e7d32', art: '💀', link: [1] },
    7: { bg: 'linear-gradient(145deg, #fff9c4 0%, #ffd54f 35%, #ffb300 70%, #ff8f00 100%)', art: '✨', gold: true, link: [] },
    8: { bg: '#00838f', art: '🎺', link: [1] },
    9: { bg: '#f4511e', art: '🌶️', link: [2] },
    10: { bg: '#f9a825', art: '☀️', link: [3] },
    11: { bg: '#7cb342', art: '🍹', link: [4] },
    12: { bg: '#ad1457', art: '🎆', link: [5] }
};

function cardHtml(value, faceDown, small, mode) {
    const sz = small ? ' small' : '';
    if (faceDown) {
        return `<div class="trio-card back${sz}"><span class="trio-back-logo">TRIO</span></div>`;
    }
    const t = CARD_THEME[value] || CARD_THEME[1];
    const spicy = mode === 'spicy' && t.link?.length
        ? `<span class="trio-link trio-link-bl">${t.link[0]}</span>${t.link[1] ? `<span class="trio-link trio-link-br">${t.link[1]}</span>` : ''}`
        : '';
    const gold = t.gold ? ' gold' : '';
    return `<div class="trio-card face${sz}${gold}" style="--trio-bg:${t.bg}">
        <span class="trio-corner tl">${value}</span>
        <span class="trio-corner tr">${value}</span>
        <span class="trio-art">${t.art}</span>
        <span class="trio-center">${value}</span>
        ${spicy}
    </div>`;
}

function renderWonTrios(wonTrios, mode) {
    if (!wonTrios?.length) return '';
    return wonTrios.map((trio) => {
        const v = trio[0]?.value ?? trio[0];
        return `<div class="trio-won-stack" title="Trio ${v}">${cardHtml(v, false, true, mode)}</div>`;
    }).join('');
}

/* --- Firebase szoba logika --- */

function resolveAfterReveal(room) {
    const game = room.game;
    if (!game) return room;

    const revs = game.reveals || [];
    if (!revs.length) return room;

    const vals = revs.map((r) => r.card.value);
    for (let i = 1; i < vals.length; i++) {
        if (vals[i] !== vals[i - 1]) {
            revs.forEach((rev) => {
                if (rev.source === 'middle') {
                    const slot = game.middle[rev.slot];
                    if (slot) {
                        slot.card = rev.card;
                        slot.faceUp = false;
                    }
                } else if (rev.playerKey) {
                    room.hands = room.hands || {};
                    const hand = room.hands[rev.playerKey] || [];
                    insertIntoHand(hand, rev.card);
                    room.hands[rev.playerKey] = hand;
                }
            });
            game.reveals = [];
            room.public.turnKey = nextTurnKey(room);
            room.public.message = 'Nem egyezik — lapok vissza, következő játékos.';
            return room;
        }
    }

    if (revs.length >= 3) {
        const val = revs[0].card.value;
        const cards = revs.map((r) => r.card);
        const winnerKey = room.public.turnKey;
        const pl = room.players[winnerKey];
        pl.wonTrios = pl.wonTrios || [];
        pl.wonTrios.push(cards);

        revs.forEach((rev) => {
            if (rev.source === 'middle') game.middle[rev.slot] = null;
        });
        game.middle = (game.middle || []).filter(Boolean);
        game.reveals = [];

        if (val === 7) {
            room.public.status = 'finished';
            room.public.winnerKey = winnerKey;
            room.public.winReason = 'Hármas 7 — azonnali győzelem!';
            room.public.message = `🏆 ${pl.name} nyert!`;
            return room;
        }

        const win = checkWinPlayer(pl.wonTrios, room.public.mode);
        if (win) {
            room.public.status = 'finished';
            room.public.winnerKey = winnerKey;
            room.public.winReason = win.reason;
            room.public.message = `🏆 ${pl.name} nyert! (${win.reason})`;
            return room;
        }

        room.public.message = `${pl.name} begyűjtötte a ${val}-es triót!`;
        room.public.turnKey = nextTurnKey(room);
    }

    return room;
}

export async function applyRevealMiddle(slotIdx) {
    if (!roomId) return;
    const rRef = ref(db, `trioRooms/${roomId}`);
    const me = myKey();

    const result = await runTransaction(rRef, (room) => {
        if (!room) return room;
        if (room.public.status !== 'playing' || room.public.turnKey !== me) return room;

        const game = room.game || { middle: [], reveals: [] };
        const revs = game.reveals || [];
        if (revs.length >= 3) return room;

        const slot = game.middle?.[slotIdx];
        if (!slot || slot.faceUp) return room;

        slot.faceUp = true;
        game.reveals = revs.concat([{
            card: slot.card,
            source: 'middle',
            slot: slotIdx,
            label: 'Közép'
        }]);
        room.game = game;
        room.public.message = `Középről: ${slot.card.value}`;
        return resolveAfterReveal(room);
    });

    if (!result.committed) showToast('A lépés nem sikerült.', 'warn');
}

export async function applyRevealHand(targetKey, which) {
    if (!roomId) return;
    const rRef = ref(db, `trioRooms/${roomId}`);
    const me = myKey();

    const result = await runTransaction(rRef, (room) => {
        if (!room) return room;
        if (room.public.status !== 'playing' || room.public.turnKey !== me) return room;

        const game = room.game || { middle: [], reveals: [] };
        const revs = game.reveals || [];
        if (revs.length >= 3) return room;

        room.hands = room.hands || {};
        const hand = room.hands[targetKey];
        if (!hand?.length) return room;

        const sorted = [...hand];
        sortHand(sorted);
        const card = which === 'low' ? sorted[0] : sorted[sorted.length - 1];
        const handIdx = hand.findIndex((c) => c.id === card.id);
        hand.splice(handIdx, 1);
        room.hands[targetKey] = hand;

        const plName = room.players[targetKey]?.name || targetKey;
        const label = `${plName} ${which === 'low' ? 'legalacsonyabb' : 'legmagasabb'}`;

        game.reveals = revs.concat([{
            card,
            source: 'hand',
            playerKey: targetKey,
            slot: which,
            label
        }]);
        room.game = game;
        room.public.message = `${label}: ${card.value}`;
        return resolveAfterReveal(room);
    });

    if (!result.committed) showToast('A lépés nem sikerült.', 'warn');
}

export async function startRoomGame() {
    if (!roomId || !localRoom) return;
    const rRef = ref(db, `trioRooms/${roomId}`);
    const me = myKey();

    const snap = await get(rRef);
    const room = snap.val();
    if (!room || room.public.hostKey !== me) {
        showToast('Csak a házigazda indíthatja a játékot.', 'warn');
        return;
    }
    const n = playerCount(room);
    if (n < 3) {
        showToast('Legalább 3 játékos kell!', 'warn');
        return;
    }
    if (room.public.status !== 'waiting') return;

    const deck = createDeck();
    const cfg = DEAL[n];
    const order = room.public.playerOrder || [];
    const hands = {};
    let di = 0;

    order.forEach((key) => {
        const slice = deck.slice(di, di += cfg.hand);
        sortHand(slice);
        hands[key] = slice;
    });

    const middle = deck.slice(di, di + cfg.middle).map((card, idx) => ({ card, faceUp: false, idx }));

    await update(rRef, {
        'public/status': 'playing',
        'public/turnKey': order[0],
        'public/message': `${room.players[order[0]]?.name || order[0]} köre — találj 3 egyforma számot!`,
        hands,
        game: { middle, reveals: [] }
    });
    showToast('A játék elindult!', 'success');
}

export async function createRoom(mode) {
    if (!GameState.currentUser) {
        showToast('Előbb jelentkezz be!');
        return;
    }
    const entry = calcEntry();
    if (!payEntry(entry)) {
        showToast(`Nincs elég biciklid (${entry.toLocaleString()} 🚲).`);
        return;
    }

    const code = randomCode();
    const key = myKey();
    const roomRef = push(ref(db, 'trioRooms'));
    const now = Date.now();

    try {
        await set(roomRef, {
            public: {
                code,
                status: 'waiting',
                hostKey: key,
                mode: mode || 'simple',
                entry,
                pot: entry,
                playerOrder: [key],
                createdAt: now,
                message: 'Várakozás játékosokra…'
            },
            players: {
                [key]: {
                    name: myName(),
                    wonTrios: [],
                    joinedAt: now
                }
            },
            hands: {},
            game: null
        });
        roomId = roomRef.key;
        payoutClaimed = false;
        subscribeRoom(roomId);
        showToast(`Szoba létrehozva! Kód: ${code}`, 'success');
    } catch (e) {
        refundEntry(entry);
        showToast('Szoba létrehozása sikertelen.', 'warn');
    }
}

async function findRoomByCode(code) {
    const snap = await get(ref(db, 'trioRooms'));
    if (!snap.exists()) return null;
    const upper = (code || '').trim().toUpperCase();
    let found = null;
    snap.forEach((child) => {
        const r = child.val();
        if (r?.public?.code === upper && r.public.status === 'waiting') {
            found = { id: child.key, room: r };
        }
    });
    return found;
}

export async function joinRoom(code) {
    if (!GameState.currentUser) {
        showToast('Előbb jelentkezz be!');
        return;
    }

    const found = await findRoomByCode(code);
    if (!found) {
        showToast('Nem található nyitott szoba ezzel a kóddal.', 'warn');
        return;
    }

    const { id, room } = found;
    const entry = room.public.entry || calcEntry();
    const key = myKey();

    if ((room.public.playerOrder || []).includes(key)) {
        roomId = id;
        payoutClaimed = false;
        subscribeRoom(id);
        return;
    }

    if (playerCount(room) >= 6) {
        showToast('A szoba tele van (max. 6 fő).', 'warn');
        return;
    }

    if (!payEntry(entry)) {
        showToast(`Nincs elég biciklid (${entry.toLocaleString()} 🚲).`);
        return;
    }

    const rRef = ref(db, `trioRooms/${id}`);
    try {
        await runTransaction(rRef, (r) => {
            if (!r || r.public.status !== 'waiting') return r;
            if ((r.public.playerOrder || []).includes(key)) return r;
            if (Object.keys(r.players || {}).length >= 6) return r;

            r.public.playerOrder = [...(r.public.playerOrder || []), key];
            r.public.pot = (r.public.pot || 0) + entry;
            r.players = r.players || {};
            r.players[key] = {
                name: myName(),
                wonTrios: [],
                joinedAt: Date.now()
            };
            r.public.message = `${playerCount(r)} játékos a szobában.`;
            return r;
        });
        roomId = id;
        payoutClaimed = false;
        subscribeRoom(id);
        showToast('Csatlakoztál a szobához!', 'success');
    } catch (e) {
        refundEntry(entry);
        showToast('Csatlakozás sikertelen.', 'warn');
    }
}

export async function leaveRoom() {
    if (!roomId) return;
    const id = roomId;
    const key = myKey();
    const rRef = ref(db, `trioRooms/${id}`);

    const snap = await get(rRef);
    const room = snap.val();
    if (!room) {
        unsubscribeRoom();
        roomId = null;
        renderTrioMenu();
        return;
    }

    const entry = room.public?.entry || 0;
    const wasWaiting = room.public?.status === 'waiting';
    const order = room.public?.playerOrder || [];
    try {
        if (wasWaiting) {
            await runTransaction(rRef, (r) => {
                if (!r?.players?.[key]) return r;
                delete r.players[key];
                r.public.playerOrder = (r.public.playerOrder || []).filter((k) => k !== key);
                r.public.pot = Math.max(0, (r.public.pot || 0) - entry);
                if (r.public.hostKey === key && r.public.playerOrder.length) {
                    r.public.hostKey = r.public.playerOrder[0];
                }
                return r;
            });
            refundEntry(entry);
            const left = (await get(rRef)).val();
            if (!left?.public?.playerOrder?.length) {
                await remove(rRef).catch(() => {});
            }
        } else if (room.public?.status === 'playing') {
            showToast('Futó játékban nem léphetsz ki — játszd le a kört.', 'warn');
            return;
        }

        unsubscribeRoom();
        roomId = null;
        localRoom = null;
        myHand = [];
        renderTrioMenu();
    } catch (e) {
        showToast('Kilépés sikertelen.', 'warn');
    }
}

function subscribeRoom(id) {
    unsubscribeRoom();
    const rRef = ref(db, `trioRooms/${id}`);

    roomUnsub = onValue(rRef, (snap) => {
        const room = snap.val();
        if (!room) {
            showToast('A szoba bezárult.', 'warn');
            unsubscribeRoom();
            roomId = null;
            renderTrioMenu();
            return;
        }
        localRoom = room;
        renderRoom(room);

        if (room.public?.status === 'finished') {
            tryClaimPayout(room);
        }
    });

    handUnsub = onValue(ref(db, `trioRooms/${id}/hands/${myKey()}`), (snap) => {
        myHand = snap.val() || [];
        if (localRoom?.public?.status === 'playing') {
            renderRoom(localRoom);
        }
    });
}

function unsubscribeRoom() {
    if (typeof roomUnsub === 'function') roomUnsub();
    if (typeof handUnsub === 'function') handUnsub();
    roomUnsub = null;
    handUnsub = null;
}

function subscribeLobby() {
    if (typeof lobbyUnsub === 'function') lobbyUnsub();
    lobbyUnsub = onValue(ref(db, 'trioRooms'), (snap) => {
        const list = [];
        const cutoff = Date.now() - LOBBY_MAX_AGE_MS;
        snap.forEach((child) => {
            const r = child.val();
            const pub = r?.public;
            if (!pub || pub.status !== 'waiting') return;
            if (pub.createdAt && pub.createdAt < cutoff) return;
            if (playerCount(r) >= 6) return;
            list.push({
                id: child.key,
                code: pub.code,
                host: r.players?.[pub.hostKey]?.name || pub.hostKey,
                count: playerCount(r),
                mode: pub.mode,
                entry: pub.entry,
                pot: pub.pot
            });
        });
        list.sort((a, b) => b.pot - a.pot);
        openRooms = list;
        if (!roomId) renderTrioMenu();
    });
}

/* --- UI --- */

function renderTrioMenu() {
    const root = document.getElementById('trio-app');
    if (!root || roomId) return;

    const entry = calcEntry();

    let listHtml = '<p class="trio-empty">Nincs nyitott szoba</p>';
    if (openRooms.length) {
        listHtml = openRooms.map((r) => {
            const full = r.count >= 6;
            const modeLabel = r.mode === 'spicy' ? '🌶️ Spicy' : '✨ Egyszerű';
            return `<div class="trio-room-row">
                <div>
                    <b>${r.code}</b> · ${r.count}/6 fő · ${modeLabel}
                    <span class="trio-room-host">Házigazda: ${r.host}</span>
                </div>
                <button type="button" class="btn-primary trio-room-join" data-code="${r.code}" ${full ? 'disabled' : ''}>Belépés</button>
            </div>`;
        }).join('');
    }

    root.innerHTML = `
        <div class="trio-menu-hero">
            <span class="trio-menu-logo">TRIO</span>
            <span class="trio-menu-sub">Csak multiplayer · 3–6 fő</span>
        </div>
        <p class="trio-intro">Szoba létrehozása vagy csatlakozás kóddal. Nincs bot — csak valódi játékosok!</p>
        <div class="trio-setup-row">
            <label>Új szoba módja
                <select id="trio-create-mode">
                    <option value="simple">Egyszerű (3 trio)</option>
                    <option value="spicy">Spicy (2 összekapcsolt trio)</option>
                </select>
            </label>
        </div>
        <p class="trio-stake">Belépő: <b>${entry.toLocaleString()} 🚲</b> · Győztes ~<b>${Math.floor(entry * 3 * WIN_POT_PCT).toLocaleString()}</b>–<b>${Math.floor(entry * 6 * WIN_POT_PCT).toLocaleString()} 🚲</b> (${Math.round(WIN_POT_PCT * 100)}% a nyereményalapból)</p>
        <button type="button" class="btn-primary trio-start-btn" id="trio-create-btn">➕ Szoba létrehozása</button>

        <div class="trio-lobby-panel">
            <h3 class="trio-lobby-title">Csatlakozás kóddal</h3>
            <input type="text" id="trio-join-code" class="trio-join-input" placeholder="6 karakteres kód" maxlength="6" autocomplete="off">
            <button type="button" class="btn-primary trio-join-btn" id="trio-join-btn">🔗 Csatlakozás</button>
        </div>

        <div class="trio-lobby-panel">
            <h3 class="trio-lobby-title">Nyitott szobák</h3>
            <div class="trio-room-list">${listHtml}</div>
        </div>

        <p class="trio-rules-hint">Körönként lapokat fedezel fel: középről, vagy valaki legalacsonyabb/legmagasabb lapja. Ha 2 különböző szám jön ki, vége a körnek. 3 egyforma = trio begyűjtése. Hármas 7 = azonnali győzelem.</p>
    `;

    document.getElementById('trio-create-btn')?.addEventListener('click', () => {
        const mode = document.getElementById('trio-create-mode')?.value || 'simple';
        createRoom(mode);
    });

    document.getElementById('trio-join-btn')?.addEventListener('click', () => {
        const code = document.getElementById('trio-join-code')?.value?.trim();
        if (!code) {
            showToast('Add meg a szoba kódját!');
            return;
        }
        joinRoom(code);
    });

    root.querySelectorAll('.trio-room-join').forEach((btn) => {
        btn.addEventListener('click', () => joinRoom(btn.dataset.code));
    });
}

function renderLobby(room) {
    const root = document.getElementById('trio-app');
    if (!root) return;

    const pub = room.public;
    const entry = pub.entry || 0;
    const pot = pub.pot || 0;
    const n = playerCount(room);
    const host = amHost(room);
    const modeLabel = pub.mode === 'spicy' ? '🌶️ Spicy' : '✨ Egyszerű';

    let playersHtml = '';
    (pub.playerOrder || []).forEach((key) => {
        const p = room.players[key];
        const isMe = key === myKey();
        const isHostRow = key === pub.hostKey;
        playersHtml += `<li class="${isMe ? 'me' : ''} ${isHostRow ? 'host' : ''}">
            ${p?.name || key}${isHostRow ? ' 👑' : ''}${isMe ? ' (te)' : ''}
        </li>`;
    });

    root.innerHTML = `
        <div class="trio-lobby-live">
            <h3 class="trio-lobby-title">Szoba: <b>${pub.code}</b></h3>
            <p class="trio-stake">${modeLabel} · Belépő: <b>${entry.toLocaleString()} 🚲</b> · Nyereményalap: <b>${pot.toLocaleString()} 🚲</b></p>
            <p class="trio-intro">${pub.message || 'Várakozás…'}</p>
            <ul class="trio-player-list">${playersHtml}</ul>
            <p class="trio-rules-hint">${n}/6 játékos · minimum <b>3 fő</b> kell az indításhoz</p>
            ${host
        ? `<button type="button" class="btn-primary trio-start-btn" id="trio-host-start" ${n < 3 ? 'disabled' : ''}>🃏 Játék indítása (${n} fő)</button>
               <p class="trio-wait-host">${n < 3 ? 'Várakozás legalább 3 játékosra…' : 'Te indíthatod, ha mindenki kész.'}</p>`
        : `<p class="trio-wait-host">Várakozás a házigazdára (${room.players[pub.hostKey]?.name || '?'})…</p>`}
            <button type="button" class="trio-btn-secondary trio-leave-ingame" id="trio-leave-btn">↩️ Kilépés (belépő vissza)</button>
        </div>
    `;

    document.getElementById('trio-host-start')?.addEventListener('click', () => startRoomGame());
    document.getElementById('trio-leave-btn')?.addEventListener('click', () => leaveRoom());
}

function renderGame(room) {
    const root = document.getElementById('trio-app');
    if (!root) return;

    const pub = room.public;
    const mode = pub.mode;
    const game = room.game || { middle: [], reveals: [] };
    const meKey = myKey();
    const order = pub.playerOrder || [];
    const canAct = isMyTurn(room) && (game.reveals?.length || 0) < 3;
    const curName = room.players[pub.turnKey]?.name || pub.turnKey;

    let html = `<div class="trio-felt-board">`;
    html += `<p class="trio-status">${pub.message || ''}</p>`;
    html += `<p class="trio-turn">Sor: <b>${curName}</b> · ${mode === 'spicy' ? '🌶️ Spicy' : '✨ Egyszerű'} · Alap: <b>${(pub.pot || 0).toLocaleString()} 🚲</b></p>`;

    html += `<div class="trio-seats">`;
    order.forEach((key) => {
        if (key === meKey) return;
        const p = room.players[key];
        const active = pub.turnKey === key;
        html += `<div class="trio-seat ${active ? 'active' : ''}">
            <span class="trio-seat-name">${p?.name || key}</span>
            <span class="trio-seat-meta">🃏 ${handCount(room, key)}</span>
            <div class="trio-seat-trios">${renderWonTrios(p?.wonTrios, mode)}</div>
        </div>`;
    });
    html += `</div>`;

    html += `<div class="trio-table-zone"><p class="trio-zone-label">Felfedve most</p><div class="trio-reveals">`;
    if (game.reveals?.length) {
        game.reveals.forEach((r) => { html += cardHtml(r.card.value, false, false, mode); });
    } else {
        html += `<span class="trio-empty">—</span>`;
    }
    html += `</div></div>`;

    const midCount = (game.middle || []).filter(Boolean).length;
    html += `<div class="trio-middle-zone"><p class="trio-zone-label">Közép · ${midCount} lap</p><div class="trio-middle">`;
    (game.middle || []).forEach((slot, idx) => {
        if (!slot) return;
        const up = slot.faceUp || game.reveals?.some((r) => r.source === 'middle' && r.slot === idx);
        html += `<button type="button" class="trio-slot" data-mid="${idx}" ${!canAct || up ? 'disabled' : ''}>${cardHtml(slot.card.value, !up, true, mode)}</button>`;
    });
    html += `</div></div>`;

    const mePl = room.players[meKey];
    html += `<div class="trio-my-zone">
        <div class="trio-my-head">
            <p class="trio-zone-label">A kezed</p>
            <div class="trio-my-trios">${renderWonTrios(mePl?.wonTrios, mode) || '<span class="trio-empty">—</span>'}</div>
        </div>
        <div class="trio-hand">`;
    myHand.forEach((c) => { html += cardHtml(c.value, false, false, mode); });
    html += `</div></div>`;

    if (canAct) {
        html += `<div class="trio-actions"><p class="trio-zone-label">Mit fedezel fel?</p><div class="trio-action-btns">`;
        html += `<button type="button" class="trio-act" data-key="${meKey}" data-which="low">↙ Saját legalacsonyabb</button>`;
        html += `<button type="button" class="trio-act" data-key="${meKey}" data-which="high">↗ Saját legmagasabb</button>`;
        order.forEach((key) => {
            if (key === meKey) return;
            const p = room.players[key];
            if (!handCount(room, key)) return;
            html += `<button type="button" class="trio-act" data-key="${key}" data-which="low">${p?.name || key}: legalacsonyabb</button>`;
            html += `<button type="button" class="trio-act" data-key="${key}" data-which="high">${p?.name || key}: legmagasabb</button>`;
        });
        html += `</div></div>`;
    } else if (pub.status === 'playing') {
        html += `<p class="trio-wait-reveal">Várakozás: <b>${curName}</b> lépése…</p>`;
    }

    html += `<button type="button" class="trio-btn-secondary trio-leave-ingame" id="trio-leave-ingame">↩️ Szoba elhagyása</button>`;
    html += `</div>`;

    root.innerHTML = html;

    root.querySelectorAll('.trio-slot:not([disabled])').forEach((btn) => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.mid, 10);
            applyRevealMiddle(idx);
        });
    });

    root.querySelectorAll('.trio-act').forEach((btn) => {
        btn.addEventListener('click', () => {
            applyRevealHand(btn.dataset.key, btn.dataset.which);
        });
    });

    document.getElementById('trio-leave-ingame')?.addEventListener('click', () => leaveRoom());
}

function renderEnd(room) {
    const root = document.getElementById('trio-app');
    if (!root) return;

    const pub = room.public;
    const winner = room.players[pub.winnerKey];
    const won = pub.winnerKey === myKey();
    const prize = Math.floor((pub.pot || 0) * WIN_POT_PCT);
    const claimed = room.players?.[myKey()]?.payoutClaimed || payoutClaimed;

    root.innerHTML = `
        <div class="trio-end">
            <h3>🏆 ${winner?.name || '?'} nyert!</h3>
            <p>${pub.winReason || pub.message || ''}</p>
            <p>Nyereményalap: <b>${(pub.pot || 0).toLocaleString()} 🚲</b> · Győztes díja: <b>${prize.toLocaleString()} 🚲</b></p>
            ${won
        ? (claimed
            ? '<p>Nyeremény felvéve ✓</p>'
            : `<p>Várakozás a nyeremény jóváírására…</p>`)
        : '<p>Legközelebb! 💪</p>'}
            <button type="button" class="btn-primary" id="trio-back-menu">Vissza a menübe</button>
            <button type="button" class="trio-btn-secondary" id="trio-close-end">Bezárás</button>
        </div>
    `;

    document.getElementById('trio-back-menu')?.addEventListener('click', async () => {
        if (amHost(room)) {
            await remove(ref(db, `trioRooms/${roomId}`)).catch(() => {});
        }
        unsubscribeRoom();
        roomId = null;
        localRoom = null;
        myHand = [];
        payoutClaimed = false;
        renderTrioMenu();
    });

    document.getElementById('trio-close-end')?.addEventListener('click', () => closeTrio());
}

function renderRoom(room) {
    const status = room.public?.status;
    if (status === 'waiting') renderLobby(room);
    else if (status === 'playing') renderGame(room);
    else if (status === 'finished') renderEnd(room);
}

export function openTrio() {
    if (!GameState.currentUser) {
        showToast('Előbb jelentkezz be a Trióhoz!');
        return;
    }
    const modal = document.getElementById('trio-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    payoutClaimed = false;
    subscribeLobby();
    if (roomId && localRoom) {
        renderRoom(localRoom);
    } else {
        roomId = null;
        renderTrioMenu();
    }
}

export function closeTrio() {
    if (typeof lobbyUnsub === 'function') lobbyUnsub();
    if (typeof roomUnsub === 'function') roomUnsub();
    if (typeof handUnsub === 'function') handUnsub();
    lobbyUnsub = null;
    roomUnsub = null;
    handUnsub = null;
    roomId = null;
    localRoom = null;
    myHand = [];
    openRooms = [];
    const modal = document.getElementById('trio-modal');
    if (modal) modal.style.display = 'none';
}

window.closeTrio = closeTrio;
