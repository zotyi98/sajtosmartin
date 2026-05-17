import { GameState, db, showToast, saveUserProgress } from '../state.js';
import { ref, push, set, update, onValue, get, runTransaction } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { sanitizeUsername } from '../authSession.js';
import { pushActivityFeed } from './activityFeed.js';

const PENDING_MS = 10 * 60 * 1000;
const ROUND_MS = 90 * 1000;
const STAKE_PCT = 0.04;
const MAX_STAKE = 2_000_000;
const MIN_STAKE = 5000;

const CHOICES = {
    ko: { id: 'ko', label: '✊ Kő', beats: 'ollo' },
    papir: { id: 'papir', label: '✋ Papír', beats: 'ko' },
    ollo: { id: 'ollo', label: '✌️ Olló', beats: 'papir' }
};

/** Régi párbaj választások (Sprint/Defekt/Védelem) → kő-papír-olló */
const LEGACY_CHOICE_MAP = {
    sprint: 'ko',
    defekt: 'ollo',
    defense: 'papir'
};

function normalizeChoice(choice) {
    return LEGACY_CHOICE_MAP[choice] || choice;
}

let duelUnsub = null;
let activeDuelUnsub = null;

function myKey() {
    return sanitizeUsername(GameState.currentUser);
}

function calcStake(myBikes, theirBikes) {
    const raw = Math.floor(Math.min(myBikes, theirBikes || 0) * STAKE_PCT);
    return Math.max(MIN_STAKE, Math.min(MAX_STAKE, raw || MIN_STAKE));
}

async function fetchOpponentBikes(key) {
    try {
        const snap = await get(ref(db, `users/${key}/game`));
        return snap.val()?.bikes || 0;
    } catch {
        return 0;
    }
}

function roundWinner(c1, c2) {
    c1 = normalizeChoice(c1);
    c2 = normalizeChoice(c2);
    if (!c1 || !c2 || !CHOICES[c1] || !CHOICES[c2]) return null;
    if (c1 === c2) return 'tie';
    if (CHOICES[c1].beats === c2) return 'challenger';
    return 'target';
}

function getDuelRole(duel) {
    const k = myKey();
    if (duel.challengerKey === k) return 'challenger';
    if (duel.targetKey === k) return 'target';
    return null;
}

function renderDuelModal(duel) {
    const body = document.getElementById('duel-modal-body');
    if (!body || !duel) return;

    const role = getDuelRole(duel);
    const amChallenger = role === 'challenger';
    const oppName = amChallenger ? duel.targetName : duel.challengerName;
    const myWins = amChallenger ? duel.challengerWins : duel.targetWins;
    const theirWins = amChallenger ? duel.targetWins : duel.challengerWins;
    const r = duel.currentRound || 1;
    const round = duel.rounds?.[r] || duel.rounds?.[String(r)] || {};

    let html = `<p class="duel-meta">vs <b>${oppName}</b> · tét: <b>${(duel.stake || 0).toLocaleString()} 🚲</b> (nyeremény: ${((duel.stake || 0) * 2).toLocaleString()})</p>`;
    html += `<p class="duel-score">Állás: <b>${myWins || 0}</b> – <b>${theirWins || 0}</b> <span class="duel-hint">(2 győzelem kell)</span></p>`;
    html += `<p class="duel-rules">✊ Kő · ✋ Papír · ✌️ Olló</p>`;

    if (duel.status === 'pending') {
        if (role === 'target') {
            html += `<p class="duel-challenge">⚔️ <b>${duel.challengerName}</b> kihívott párbajra!</p>`;
            html += `<div class="duel-btn-row"><button type="button" class="duel-btn accept" data-duel="${duel.id}" data-act="accept">✅ Elfogadom</button>`;
            html += `<button type="button" class="duel-btn decline" data-duel="${duel.id}" data-act="decline">❌ Elutasítom</button></div>`;
        } else if (role === 'challenger') {
            html += `<p>Várakozás: <b>${duel.targetName}</b> válaszára…</p>`;
            html += `<button type="button" class="duel-btn decline" data-duel="${duel.id}" data-act="cancel">↩️ Visszavonás (tét vissza)</button>`;
        }
    } else if (duel.status === 'active') {
        const myChoice = amChallenger ? round.challengerChoice : round.targetChoice;
        const theirChoice = amChallenger ? round.targetChoice : round.challengerChoice;

        if (round.resolved) {
            const w = round.winner;
            let msg = 'Döntetlen — újra!';
            if (w === 'challenger') msg = amChallenger ? 'Te nyerted a kört! 🎉' : 'Ellenfél nyerte a kört.';
            if (w === 'target') msg = amChallenger ? 'Ellenfél nyerte a kört.' : 'Te nyerted a kört! 🎉';
            html += `<p class="duel-round-result">${msg}</p>`;
            const c1 = CHOICES[normalizeChoice(round.challengerChoice)]?.label || '?';
            const c2 = CHOICES[normalizeChoice(round.targetChoice)]?.label || '?';
            html += `<p class="duel-picks">${c1} vs ${c2}</p>`;
        } else if (myChoice) {
            html += `<p>Választottál: <b>${CHOICES[normalizeChoice(myChoice)]?.label || '?'}</b> — várakozás ellenfélre…</p>`;
        } else {
            html += `<p class="duel-prompt"><b>${r}. kör</b> — válassz!</p><div class="duel-choice-row">`;
            Object.values(CHOICES).forEach((c) => {
                html += `<button type="button" class="duel-choice-btn" data-duel="${duel.id}" data-round="${r}" data-choice="${c.id}">${c.label}</button>`;
            });
            html += `</div>`;
        }
    } else if (duel.status === 'finished') {
        const won = duel.winnerKey === myKey();
        html += `<p class="duel-final ${won ? 'win' : 'lose'}">${won ? '🏆 GYŐZTÉL!' : '😵 Vesztettél'}</p>`;
        if (won && !duel.payoutClaimed) {
            html += `<button type="button" class="duel-btn claim" data-duel="${duel.id}" data-act="claim">💰 Nyeremény (+${(duel.payout || duel.stake * 2 || 0).toLocaleString()} 🚲)</button>`;
        } else if (won) {
            html += `<p>Nyeremény felvéve ✓</p>`;
        }
    } else if (duel.status === 'declined') {
        html += `<p>Elutasítva.</p>`;
    } else if (duel.status === 'cancelled') {
        html += `<p>A párbaj lejárt vagy visszavonásra került.</p>`;
    }

    body.innerHTML = html;

    body.querySelectorAll('[data-act]').forEach((btn) => {
        btn.onclick = () => {
            const id = btn.dataset.duel;
            const act = btn.dataset.act;
            if (act === 'accept') window.acceptDuel(id);
            else if (act === 'decline') window.declineDuel(id);
            else if (act === 'cancel') window.cancelDuel(id);
            else if (act === 'claim') window.claimDuelPayout(id);
        };
    });
    body.querySelectorAll('.duel-choice-btn').forEach((btn) => {
        btn.onclick = () => window.submitDuelChoice(btn.dataset.duel, btn.dataset.round, btn.dataset.choice);
    });
}

function openDuelModal(duelId) {
    const modal = document.getElementById('duel-modal');
    if (modal) modal.style.display = 'flex';
    if (activeDuelUnsub) activeDuelUnsub();
    activeDuelUnsub = onValue(ref(db, `duels/${duelId}`), (snap) => {
        const duel = snap.val();
        if (!duel) return;
        duel.id = duelId;
        renderDuelModal(duel);
        tryResolveRound(duelId, duel);
    });
}

window.closeDuelModal = function() {
    if (activeDuelUnsub) {
        activeDuelUnsub();
        activeDuelUnsub = null;
    }
    const modal = document.getElementById('duel-modal');
    if (modal) modal.style.display = 'none';
};

window.openDuelChallenge = async function(targetKey, targetName) {
    const key = myKey();
    if (!key || key === targetKey) {
        showToast('Magadat nem hívhatod ki.');
        return;
    }
    const theirBikes = await fetchOpponentBikes(targetKey);
    const stake = calcStake(GameState.bikes, theirBikes);
    if (GameState.bikes < stake) {
        showToast(`Nincs elég biciklid a téthez (${stake.toLocaleString()} 🚲).`);
        return;
    }

    const duelRef = push(ref(db, 'duels'));
    const now = Date.now();
    const duel = {
        challengerKey: key,
        challengerName: GameState.currentUser,
        targetKey,
        targetName: targetName || targetKey,
        stake,
        status: 'pending',
        createdAt: now,
        expiresAt: now + PENDING_MS,
        challengerPaid: true,
        targetPaid: false,
        challengerWins: 0,
        targetWins: 0,
        currentRound: 1,
        rounds: { 1: { challengerChoice: null, targetChoice: null, resolved: false, winner: null } },
        winnerKey: null,
        payout: 0,
        payoutClaimed: false
    };

    GameState.bikes -= stake;
    await set(duelRef, duel);
    saveUserProgress();
    showToast(`⚔️ Kihívás elküldve! Tét: ${stake.toLocaleString()} 🚲`, 'info');
    pushActivityFeed('troll', targetName, true);
    openDuelModal(duelRef.key);
};

window.acceptDuel = async function(duelId) {
    const snap = await get(ref(db, `duels/${duelId}`));
    const duel = snap.val();
    if (!duel || duel.status !== 'pending' || duel.targetKey !== myKey()) return;

    if (GameState.bikes < duel.stake) {
        showToast('Nincs elég biciklid az elfogadáshoz.');
        return;
    }

    GameState.bikes -= duel.stake;
    await update(ref(db, `duels/${duelId}`), {
        status: 'active',
        targetPaid: true,
        lastActionAt: Date.now(),
        roundExpiresAt: Date.now() + ROUND_MS
    });
    saveUserProgress();
    showToast('⚔️ Párbaj elkezdődött! Válassz a körben.', 'success');
};

window.declineDuel = async function(duelId) {
    const snap = await get(ref(db, `duels/${duelId}`));
    const duel = snap.val();
    if (!duel || duel.status !== 'pending' || duel.targetKey !== myKey()) return;

    await update(ref(db, `duels/${duelId}`), { status: 'declined', payoutClaimed: true });
    showToast('Párbaj elutasítva.');
};

window.cancelDuel = async function(duelId) {
    const snap = await get(ref(db, `duels/${duelId}`));
    const duel = snap.val();
    if (!duel || duel.status !== 'pending' || duel.challengerKey !== myKey()) return;

    await update(ref(db, `duels/${duelId}`), { status: 'cancelled', payoutClaimed: true, challengerRefunded: true });
    if (duel.challengerPaid) {
        GameState.bikes += duel.stake;
        saveUserProgress();
    }
    showToast('Kihívás visszavonva — tét visszajött.');
};

window.submitDuelChoice = async function(duelId, roundNum, choice) {
    if (!CHOICES[choice]) return;
    const snap = await get(ref(db, `duels/${duelId}`));
    const duel = snap.val();
    if (!duel || duel.status !== 'active') return;

    const role = getDuelRole(duel);
    if (!role) return;
    const r = String(roundNum);
    const round = duel.rounds?.[r];
    if (!round || round.resolved) return;

    const field = role === 'challenger' ? 'challengerChoice' : 'targetChoice';
    if (round[field]) return;

    await update(ref(db, `duels/${duelId}/rounds/${r}`), {
        [field]: choice,
        lastPickAt: Date.now()
    });
};

async function tryResolveRound(duelId, duel) {
    if (!duel || duel.status !== 'active') return;
    const r = String(duel.currentRound || 1);
    const round = duel.rounds?.[r];
    if (!round || round.resolved || !round.challengerChoice || !round.targetChoice) return;

    await runTransaction(ref(db, `duels/${duelId}`), (d) => {
        if (!d || d.status !== 'active') return d;
        const rn = String(d.currentRound || 1);
        const rd = d.rounds?.[rn];
        if (!rd || rd.resolved || !rd.challengerChoice || !rd.targetChoice) return d;

        const w = roundWinner(rd.challengerChoice, rd.targetChoice);
        rd.resolved = true;
        rd.winner = w;

        if (w === 'challenger') d.challengerWins = (d.challengerWins || 0) + 1;
        else if (w === 'target') d.targetWins = (d.targetWins || 0) + 1;

        if (d.challengerWins >= 2 || d.targetWins >= 2) {
            d.status = 'finished';
            d.winnerKey = d.challengerWins >= 2 ? d.challengerKey : d.targetKey;
            d.payout = (d.stake || 0) * 2;
            d.payoutClaimed = false;
            d.rounds[rn] = rd;
        } else if (w === 'tie') {
            rd.resolved = false;
            rd.challengerChoice = null;
            rd.targetChoice = null;
            rd.winner = null;
            d.rounds[rn] = rd;
        } else {
            const next = parseInt(rn, 10) + 1;
            d.currentRound = next;
            d.rounds[next] = { challengerChoice: null, targetChoice: null, resolved: false, winner: null };
            d.roundExpiresAt = Date.now() + ROUND_MS;
            d.rounds[rn] = rd;
        }
        d.lastActionAt = Date.now();
        return d;
    });
}

window.claimDuelPayout = async function(duelId) {
    const result = await runTransaction(ref(db, `duels/${duelId}`), (d) => {
        if (!d || d.status !== 'finished' || d.winnerKey !== myKey() || d.payoutClaimed) return d;
        d.payoutClaimed = true;
        return d;
    });

    const duel = result.snapshot.val();
    if (!duel || !duel.payoutClaimed) return;

    const payout = duel.payout || (duel.stake || 0) * 2;
    GameState.bikes += payout;
    GameState.lifetimeBikes = (GameState.lifetimeBikes || 0) + payout;
    saveUserProgress();
    showToast(`🏆 Párbaj nyeremény: +${payout.toLocaleString()} 🚲`, 'success');
    pushActivityFeed('troll', `+${payout.toLocaleString()}`, true);
    window.updateUI?.();
};

function scanDuelsForMe(duels) {
    const k = myKey();
    if (!k || !duels) return;

    Object.entries(duels).forEach(([id, duel]) => {
        if (!duel) return;
        const involved = duel.challengerKey === k || duel.targetKey === k;
        if (!involved) return;

        if (duel.status === 'pending' && duel.targetKey === k) {
            const last = parseInt(sessionStorage.getItem(`duelNotify_${id}`) || '0', 10);
            if (!last) {
                sessionStorage.setItem(`duelNotify_${id}`, '1');
                showToast(`⚔️ ${duel.challengerName} párbajt hívott!`, 'warn');
            }
        }
        if (duel.status === 'finished' && duel.winnerKey === k && !duel.payoutClaimed) {
            window.claimDuelPayout(id);
        }
        if (duel.status === 'pending' && duel.challengerKey === k && Date.now() > (duel.expiresAt || 0)) {
            refundExpiredChallenger(id, duel);
        }
        if ((duel.status === 'declined' || duel.status === 'cancelled') && duel.challengerKey === k && duel.challengerPaid && !duel.challengerRefunded) {
            refundChallengerStake(id, duel);
        }
    });
}

async function refundChallengerStake(duelId, duel) {
    const result = await runTransaction(ref(db, `duels/${duelId}`), (d) => {
        if (!d || d.challengerRefunded) return d;
        d.challengerRefunded = true;
        return d;
    });
    if (result.committed) {
        GameState.bikes += duel.stake || 0;
        saveUserProgress();
    }
}

async function refundExpiredChallenger(duelId, duel) {
    if (duel.challengerKey !== myKey()) return;
    const result = await runTransaction(ref(db, `duels/${duelId}`), (d) => {
        if (!d || d.status !== 'pending') return d;
        d.status = 'cancelled';
        d.payoutClaimed = true;
        d.challengerRefunded = true;
        return d;
    });
    if (result.committed && duel.challengerPaid) {
        GameState.bikes += duel.stake || 0;
        saveUserProgress();
        showToast('A kihívás lejárt — tét visszajött.');
    }
}

function updateDuelInboxBadge(duels) {
    const k = myKey();
    let n = 0;
    Object.values(duels || {}).forEach((d) => {
        if (d?.status === 'pending' && d.targetKey === k) n++;
        if (d?.status === 'active' && (d.challengerKey === k || d.targetKey === k)) n++;
        if (d?.status === 'finished' && d.winnerKey === k && !d.payoutClaimed) n++;
    });
    const badge = document.getElementById('duel-inbox-badge');
    if (badge) {
        badge.textContent = n > 0 ? String(n) : '';
        badge.style.display = n > 0 ? 'inline-flex' : 'none';
    }
}

export function initDuels() {
    if (duelUnsub) duelUnsub();
    duelUnsub = onValue(ref(db, 'duels'), (snap) => {
        const val = snap.val() || {};
        scanDuelsForMe(val);
        updateDuelInboxBadge(val);
    });
}

window.openDuelInbox = function() {
    const k = myKey();
    if (!k) return;
    get(ref(db, 'duels')).then((snap) => {
        const list = [];
        snap.forEach((child) => {
            const d = child.val();
            if (d && (d.challengerKey === k || d.targetKey === k)) {
                list.push({ id: child.key, ...d });
            }
        });
        list.sort((a, b) => (b.lastActionAt || b.createdAt || 0) - (a.lastActionAt || a.createdAt || 0));
        if (list.length === 0) {
            showToast('Nincs aktív párbajod.');
            return;
        }
        const active = list.find((d) => d.status === 'pending' && d.targetKey === k)
            || list.find((d) => d.status === 'active')
            || list.find((d) => d.status === 'finished' && d.winnerKey === k && !d.payoutClaimed)
            || list[0];
        openDuelModal(active.id);
    });
};
