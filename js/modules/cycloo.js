import { GameState, showToast } from '../state.js';
import { isCyclooPlayer } from '../cyclooUtil.js';

export function initCyclooPublicEasterEgg() {
    const ver = document.getElementById('version-number');
    if (!ver || ver.dataset.cyclooInit === '1') return;
    ver.dataset.cyclooInit = '1';
    ver.style.pointerEvents = 'auto';
    ver.style.cursor = 'pointer';
    ver.title = 'Psst…';
    let clicks = 0;
    ver.addEventListener('click', () => {
        clicks++;
        const msgs = [
            '💙 Cycloo ezért kerrizlek majd valorantban!',
            'Cycloo = tesztelő hős. Minden bug számít.',
            '🛠️ Ha Cycloo vagy: baszódj meg te béna szar',
            'Martin térdre borul előtted Cycloo'
        ];
        showToast(msgs[(clicks - 1) % msgs.length]);
    });
}

/** Belépéskor, ha Cycloo a név — kedves köszönet + kis ajándék. */
export function greetCyclooTester(displayName) {
    if (!isCyclooPlayer(displayName)) return;
    if (window._cyclooGreetedThisSession) return;
    window._cyclooGreetedThisSession = true;

    setTimeout(() => {
        showToast('🛠️ Szevasz te balfaszgyerek gl in tesco dog');
    }, 900);
    setTimeout(() => {
        showToast('Még 1 ilyen ákombákom és a faszomat a szádba vágom');
    }, 3600);

    const gift = Math.max(100_000, Math.floor((GameState.bikes || 0) * 0.1));
    GameState.bikes += gift;
    GameState.lifetimeBikes += gift;

    window.activeBuffs = window.activeBuffs || [];
    window.activeBuffs.push({
        mult: 1.5,
        target: 'both',
        endTime: Date.now() + 20 * 60 * 1000,
        text: '🛠️ Cycloo teszt bónusz: 1.5× (20 perc)',
        color: '#7e57c2'
    });
    if (window.recalcMultiplier) window.recalcMultiplier();
    if (window.recalculateStats) window.recalculateStats();

    const display = document.getElementById('current-user-display');
    if (display) display.textContent = 'Cycloo 🛠️';

    setTimeout(() => {
        showToast(`🎁 Köszönő ajándék: +${gift.toLocaleString('hu-HU')} 🚲 · 20 perc 1.5× buff`);
    }, 5600);
}
