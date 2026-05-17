import { GameState } from '../state.js';
import { achievements } from '../data.js';
import { ensureGameStats } from './gameStats.js';
import { getAchievementStatus, describeAchievementReward } from './achievements.js';

const ACH_CATEGORIES = [
    { label: 'Termelés', match: (id) => id.startsWith('prod_') },
    { label: 'Kattintás', match: (id) => id.startsWith('click_') },
    { label: 'Épületek', match: (id) => id.startsWith('build_') },
    { label: 'Prestige', match: (id) => id.startsWith('meta_') },
    { label: 'Események', match: (id) => id.startsWith('event_') },
    { label: 'Minijátékok', match: (id) => id.startsWith('game_') },
    { label: 'Közösség', match: (id) => id.startsWith('social_') }
];

let achievementFilter = 'all';

function formatNum(n) {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + ' T';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + ' Mrd';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + ' M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + ' e';
    return Math.floor(n).toLocaleString('hu-HU');
}

function formatPlayTime(ms) {
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h > 0) return `${h} óra ${m} perc`;
    return `${m} perc`;
}

function buildStatsRows() {
    const s = ensureGameStats();
    const eventsSum = Object.values(s.events).reduce((a, b) => a + b, 0);
    const buildings = GameState.upgrades.reduce((sum, u) => sum + (u.owned || 0), 0);
    const completed = (GameState.completedAchievements || []).length;

    return [
        { label: 'Jelenlegi bicikli', value: `${formatNum(GameState.bikes)} 🚲` },
        { label: 'Össztermelés (lifetime)', value: `${formatNum(GameState.lifetimeBikes)} 🚲` },
        { label: 'BPS (alap)', value: formatNum(GameState.bps) },
        { label: 'BPS (buffokkal)', value: formatNum(GameState.bps * (window.multiplier || 1)) },
        { label: 'Rekord BPS', value: formatNum(s.maxBps || 0) },
        { label: 'Kattintás erő', value: formatNum(GameState.clickPower) },
        { label: 'Összes kattintás', value: formatNum(s.totalClicks) },
        { label: 'Épületek összesen', value: String(buildings) },
        { label: 'Extra fejlesztések', value: String(GameState.realUpgrades.length) },
        { label: 'Prestige / Küllő', value: `${GameState.prestigeCount || 0} / ${GameState.goldenSpokes || 0}` },
        { label: 'Prestige skillek', value: String(GameState.prestigeSkills.length) },
        { label: 'Játékidő', value: formatPlayTime(s.playTimeMs || 0) },
        { label: 'Események összesen', value: formatNum(eventsSum) },
        { label: 'Aranybicikli', value: formatNum(s.events.golden || 0) },
        { label: 'Felhő', value: formatNum(s.events.cloud || 0) },
        { label: 'Hányás takarítás', value: formatNum(s.events.puke || 0) },
        { label: 'Aim Lab győzelem', value: formatNum(s.aimlabWins) },
        { label: 'Kerék telitalálat', value: formatNum(s.wheelJackpots) },
        { label: 'Spectate', value: formatNum(s.spectateCount) },
        { label: 'Achievementek', value: `${completed} / ${achievements.length}` }
    ];
}

function renderStatsPanel() {
    const grid = document.getElementById('stats-grid');
    if (!grid) return;
    grid.innerHTML = buildStatsRows().map((row) => `
        <div class="stat-row">
            <span class="stat-label">${row.label}</span>
            <span class="stat-value">${row.value}</span>
        </div>
    `).join('');
}

function renderAchievementsPanel() {
    const container = document.getElementById('achievements-gallery');
    if (!container) return;

    const completed = new Set(GameState.completedAchievements || []);
    const filtered = achievements.filter((ach) => {
        const done = completed.has(ach.id) || ach.done;
        if (achievementFilter === 'done') return done;
        if (achievementFilter === 'open') return !done;
        return true;
    });

    const doneCount = achievements.filter((a) => completed.has(a.id) || a.done).length;
    const summary = document.getElementById('ach-summary');
    if (summary) summary.textContent = `${doneCount} / ${achievements.length} teljesítve`;

    let html = '';
    ACH_CATEGORIES.forEach((cat) => {
        const items = filtered.filter((a) => cat.match(a.id));
        if (items.length === 0) return;
        html += `<section class="ach-category"><h3>${cat.label}</h3><div class="ach-category-grid">`;
        items.forEach((ach) => {
            const status = getAchievementStatus(ach);
            const reward = describeAchievementReward(ach.reward);
            const stateClass = status.done ? 'done' : (status.progressPercent > 0 ? 'progress' : 'locked');
            html += `
                <article class="ach-card ${stateClass}">
                    <div class="ach-card-head">
                        <span class="ach-icon">${ach.icon || '🏅'}</span>
                        <div class="ach-card-titles">
                            <h4>${ach.name}</h4>
                            <p>${ach.desc}</p>
                        </div>
                    </div>
                    <div class="ach-progress-wrap">
                        <div class="ach-progress-bar"><div class="ach-progress-fill" style="width:${status.progressPercent}%"></div></div>
                        <span class="ach-progress-text">${status.progressText}</span>
                    </div>
                    <div class="ach-reward">🎁 ${reward}</div>
                </article>
            `;
        });
        html += '</div></section>';
    });

    container.innerHTML = html;
}

function switchPlayerTab(tab) {
    document.querySelectorAll('.player-tab').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.getElementById('player-tab-stats')?.classList.toggle('active', tab === 'stats');
    document.getElementById('player-tab-achievements')?.classList.toggle('active', tab === 'achievements');
    if (tab === 'stats') renderStatsPanel();
    else renderAchievementsPanel();
}

window.refreshPlayerPanel = function refreshPlayerPanel() {
    if (document.getElementById('player-panel-modal')?.style.display !== 'flex') return;
    const active = document.querySelector('.player-tab.active')?.dataset.tab || 'stats';
    if (active === 'stats') renderStatsPanel();
    else renderAchievementsPanel();
};

window.openPlayerPanel = function(tab = 'stats') {
    const modal = document.getElementById('player-panel-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    switchPlayerTab(tab);
};

window.closePlayerPanel = function() {
    const modal = document.getElementById('player-panel-modal');
    if (modal) modal.style.display = 'none';
    const container = document.getElementById('game-container');
    const nav = document.getElementById('mobile-nav');
    if (container?.dataset.mobilePanel === 'profile' && nav) {
        container.dataset.mobilePanel = 'game';
        nav.querySelectorAll('button').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.panel === 'game');
        });
    }
};

export function initPlayerPanel() {
    document.querySelectorAll('.player-tab').forEach((btn) => {
        btn.addEventListener('click', () => switchPlayerTab(btn.dataset.tab));
    });

    document.querySelectorAll('.ach-filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            achievementFilter = btn.dataset.filter;
            document.querySelectorAll('.ach-filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
            renderAchievementsPanel();
        });
    });
}

export function initMobileNav() {
    const nav = document.getElementById('mobile-nav');
    const container = document.getElementById('game-container');
    if (!nav || !container) return;

    const setPanel = (panel) => {
        container.dataset.mobilePanel = panel;
        nav.querySelectorAll('button').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.panel === panel);
        });
        if (panel === 'profile') window.openPlayerPanel('stats');
        else window.closePlayerPanel();
    };

    nav.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => setPanel(btn.dataset.panel));
    });

    const mq = window.matchMedia('(max-width: 900px)');
    const syncNav = () => {
        if (mq.matches) {
            nav.style.display = 'flex';
            if (!container.dataset.mobilePanel) setPanel('game');
        } else {
            nav.style.display = 'none';
            delete container.dataset.mobilePanel;
            window.closePlayerPanel();
        }
    };
    mq.addEventListener('change', syncNav);
    syncNav();
}
