import { GameState, db } from '../state.js';
import { ref, onValue, push } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { sanitizeUsername } from '../authSession.js';

const PUSH_COOLDOWN_MS = 40 * 1000;
const MAX_SHOWN = 7;

const TROLL_TEMPLATES = {
    prestige: [
        '{name} újraszületett. A bringák sírnak.',
        '{name} prestige-elt. Martin büszke (vagy nem).',
        '{name} megint nulláról — klasszikus.',
        '{name} eladta a lelkét {detail} küllőért.'
    ],
    apocalypse: [
        '{name} elindította a Defekt Apokalipszist. Fuss.',
        '{name} felébresztette a 🛞 szellemeket. Nem vicc.',
        '{name} apokalipszis módba kapcsolt. Ijedts meg.'
    ],
    kitchen: [
        '{name} konyhai megbeszélésbe ment. Termelés: rip.',
        '{name} ☕-t iszik. Te dolgozz tovább.',
        '{name} leállította a gyárat (konyha).'
    ],
    golden: [
        '{name} elkapott egy aranybicót. Gyanús.',
        '{name} aranyat látott. Valószínűleg csal.',
        '{name} szerencsés. Ideiglenesen.'
    ],
    rusty: [
        '{name} rozsdás bicót fogott. Bátor.',
        '{name} rozsdát kattintott. Miért?',
        '{name} tönkretette a napját egy rozsdással.'
    ],
    spectate: [
        '{name} kémlelte valakit. 👁️',
        '{name} lopott egy pillantást a profilodra.',
        '{name} nézelődött. Nem titok.'
    ],
    troll: [
        '{name} valami furcsát csinált a szerveren.',
        '{name} gyanús aktivitást generált.',
        'A szerver susogni kezdett… ({name})'
    ]
};

function pickTemplate(type, name, detail) {
    const list = TROLL_TEMPLATES[type] || TROLL_TEMPLATES.troll;
    const seed = (name.length + (detail?.length || 0) + Date.now()) % list.length;
    return list[seed]
        .replace(/\{name\}/g, name)
        .replace(/\{detail\}/g, detail || '?');
}

function canPushNow() {
    const key = sanitizeUsername(GameState.currentUser);
    if (!key) return false;
    const last = parseInt(localStorage.getItem(`activityPush_${key}`) || '0', 10);
    return Date.now() - last >= PUSH_COOLDOWN_MS;
}

function markPushed() {
    const key = sanitizeUsername(GameState.currentUser);
    if (key) localStorage.setItem(`activityPush_${key}`, String(Date.now()));
}

/** Közösségi feed sor — ritka eseményekre, trollos szöveggel */
export function pushActivityFeed(type, detail = '', force = false) {
    const name = GameState.currentUser;
    const userKey = sanitizeUsername(name);
    if (!name || !userKey) return;
    if (!force && !canPushNow()) return;

    const msg = pickTemplate(type, name, detail);
    push(ref(db, 'activity'), {
        displayName: name,
        userKey,
        type,
        msg,
        at: Date.now()
    }).catch((e) => console.warn('Activity feed:', e));

    markPushed();
}

export function renderActivityFeed(items) {
    const el = document.getElementById('activity-feed');
    if (!el) return;

    if (!items?.length) {
        el.innerHTML = '<p class="activity-feed-empty">🗞️ Még csend van a szerveren… (vagy mindenki dolgozik)</p>';
        return;
    }

    el.innerHTML = items.slice(0, MAX_SHOWN).map((a) => {
        const when = new Date(a.at).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
        const icon = { prestige: '✨', apocalypse: '🔥', kitchen: '☕', golden: '🌟', rusty: '🔥', spectate: '👁️', troll: '🤡' }[a.type] || '📢';
        return `<div class="activity-feed-row">${icon} <span class="activity-feed-time">${when}</span> ${a.msg || a.displayName}</div>`;
    }).join('');
}

export function initActivityFeed() {
    const el = document.getElementById('activity-feed');
    if (!el) return;

    onValue(ref(db, 'activity'), (snap) => {
        const list = [];
        snap.forEach((child) => {
            const v = child.val();
            if (v?.at) list.push(v);
        });
        list.sort((a, b) => b.at - a.at);
        renderActivityFeed(list);
    });
}
