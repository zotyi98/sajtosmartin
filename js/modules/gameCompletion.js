import { GameState, saveUserProgress, showToast } from '../state.js';
import {
    defaultUpgrades,
    extraUpgradesData,
    prestigeSkillsData,
    achievements,
    getBuildingTierUpgradesList
} from '../data.js';
import { heavenlyUpgradesData, getHeavenlyLevel } from '../heavenlyData.js';
import { CHALLENGES } from './challenges.js';
import { DARK_MATTER_MAX_LEVEL } from '../prestigeBalance.js';

export const MARTIN_REST_COST = 1;

function ownedExtraIds() {
    return new Set(GameState.realUpgrades.map((r) => r.id));
}

function isPrestigeSkillMaxed(sk) {
    const owned = GameState.prestigeSkills.filter((id) => id === sk.id).length;
    const max = sk.id === 404 ? DARK_MATTER_MAX_LEVEL : (sk.maxLevel || 1);
    return sk.repeatable ? owned >= max : owned >= 1;
}

function isHeavenlyMaxed(h) {
    const lvl = getHeavenlyLevel(GameState, h.id);
    const max = h.maxLevel || 1;
    return h.repeatable ? lvl >= max : lvl >= 1;
}

/** Hiányzó tételek listája (üres = minden megvan). */
export function getCompletionMissing() {
    if (GameState.martinRestPurchased) return [];

    const missing = [];
    const extraOwned = ownedExtraIds();

    extraUpgradesData.forEach((ext) => {
        if (!extraOwned.has(ext.id)) missing.push(`Fejlesztés: ${ext.name}`);
    });

    getBuildingTierUpgradesList().forEach((t) => {
        const tiers = GameState.purchasedBuildingTiers || [];
        if (!tiers.includes(t.id)) missing.push(`Épület szint: ${t.buildingName} — ${t.tierName}`);
    });

    prestigeSkillsData.forEach((sk) => {
        if (!isPrestigeSkillMaxed(sk)) missing.push(`Prestige skill: ${sk.name}`);
    });

    heavenlyUpgradesData.forEach((h) => {
        if (!isHeavenlyMaxed(h)) missing.push(`Mennyei: ${h.name}`);
    });

    CHALLENGES.forEach((c) => {
        const done = GameState.completedChallenges || [];
        if (!done.includes(c.id)) missing.push(`Kihívás: ${c.name}`);
    });

    const completedAch = new Set(GameState.completedAchievements || []);
    achievements.forEach((a) => {
        if (a.id === 'meta_martin_rest') return;
        if (!completedAch.has(a.id)) missing.push(`Achievement: ${a.name}`);
    });

    if ((GameState.ascensionCount || 0) < 1) missing.push('Legalább 1 mennyei emelkedés');
    if ((GameState.prestigeCount || 0) < 8) missing.push('8. prestige (minden épület feloldva)');

    defaultUpgrades.forEach((b) => {
        if (b.type === 'special') return;
        const u = GameState.upgrades.find((x) => x.id === b.id);
        if (!u || u.owned < 1) missing.push(`Épület: legalább 1× ${b.name}`);
    });

    if (!GameState.upgrades.find((u) => u.id === 7)?.owned) {
        missing.push('Épület: Eszter támogatása');
    }

    if (!GameState.cosmetics?.includes('cheese_cursor')) {
        missing.push('Kozmetika: Sajtos kurzor');
    }

    return missing;
}

export function isGameFullyComplete() {
    return getCompletionMissing().length === 0;
}

export function getCompletionPercent() {
    const missing = getCompletionMissing().length;
    if (missing === 0) return 100;
    const approxTotal = 280;
    return Math.max(0, Math.min(99, Math.round((1 - missing / approxTotal) * 100)));
}

export function hideVictoryOverlay() {
    const el = document.getElementById('game-victory-overlay');
    if (el) el.style.display = 'none';
}

window.hideVictoryOverlay = hideVictoryOverlay;

export function showVictoryOverlay() {
    const el = document.getElementById('game-victory-overlay');
    if (el) el.style.display = 'flex';
}

window.buyMartinRest = function () {
    if (GameState.martinRestPurchased) {
        showVictoryOverlay();
        return;
    }
    if (!isGameFullyComplete()) {
        showToast('Még nem gyűjtöttél össze mindent! Nézd a súgót vagy a pihenés panelt.');
        return;
    }
    if (GameState.bikes < MARTIN_REST_COST) {
        showToast('Nincs elég biciklid (szimbolikus 1 🚲 kell).');
        return;
    }
    if (!confirm('Martin végre megpihen. Hivatalosan is kivitted a játékot. Biztosan?')) return;

    GameState.bikes -= MARTIN_REST_COST;
    GameState.martinRestPurchased = true;
    saveUserProgress();
    showVictoryOverlay();
    updateMartinRestUI();
};

export function updateMartinRestUI() {
    const section = document.getElementById('martin-rest-section');
    if (!section) return;

    if (GameState.martinRestPurchased) {
        section.innerHTML = `
            <div class="martin-rest-card owned">
                <b>😴 Martin megpihenése</b>
                <p>Hivatalosan teljesítetted a Bicikli Birodalmat.</p>
                <button type="button" class="martin-rest-btn" onclick="window.buyMartinRest()">🏆 Győzelem újra</button>
            </div>`;
        return;
    }

    const complete = isGameFullyComplete();
    const pct = getCompletionPercent();
    const missing = getCompletionMissing();
    const preview = missing.slice(0, 5).map((m) => `<li>${m}</li>`).join('');
    const more = missing.length > 5 ? `<li>… és még ${missing.length - 5} tétel</li>` : '';

    section.innerHTML = `
        <motion class="martin-rest-card ${complete ? 'affordable' : 'locked'}">
            <b>😴 Martin megpihenése</b>
            <p>Ha mindent összegyűjtöttél (épületek, fejlesztések, tier, prestige, mennyei, kihívások, achievementek), megvásárolhatod — ezzel hivatalosan is kivitted a játékot.</p>
            <p class="martin-rest-progress">Teljesítés: <b>${pct}%</b></p>
            ${complete ? '' : `<ul class="martin-rest-missing">${preview}${more}</ul>`}
            <button type="button" class="martin-rest-btn" ${complete ? '' : 'disabled'}
                onclick="window.buyMartinRest()">${complete ? 'Megveszem (1 🚲)' : '🔒 Még nem elérhető'}</button>
        </motion>`.replace(/<motion/g, '<div').replace(/<\/motion>/g, '</div>');

    if (complete) {
        section.querySelector('.martin-rest-btn')?.addEventListener('click', () => window.buyMartinRest());
    }
}

export function initMartinRestOnLoad() {
    if (GameState.martinRestPurchased) {
        setTimeout(showVictoryOverlay, 800);
    }
    updateMartinRestUI();
}
