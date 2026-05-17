import { openAimlab, startAimlab } from './modules/aimlab.js';
import { initWheel, spinWheel } from './modules/wheel.js';
import { openTrio } from './modules/trio.js';

import './modules/globals.js';
import { getOfflineSecondsMultiplier } from './longGameBalance.js';
import './modules/kullok.js';
import './modules/visuals.js';
import './modules/buildingTiers.js';
import './modules/apocalypse.js';
import './modules/stats.js';
import './modules/ui.js';
import './modules/shop.js';
import './modules/seasons.js';
import './modules/activityFeed.js';
import './modules/duel.js';
import './modules/leaderboard.js';
import './modules/progress.js';
import './modules/ticker.js';
import './modules/gameLoop.js';
import './modules/achievements.js';
import { initAuthUI } from './modules/auth.js';

import './modules/admin.js?v=3';
import './modules/events.js?v=3';
import './modules/prestige.js?v=3';
import './modules/spectate.js?v=3';
import './modules/milk.js';
import './modules/ascension.js';
import './modules/challenges.js';
import './modules/bikeGarden.js';
import './modules/gameCompletion.js';
import { initChallengeChecker } from './modules/challenges.js';
import { initGardenTicker } from './modules/bikeGarden.js';
import { cycleBuyAmount } from './modules/shopBulk.js';
import { initNewsTicker } from './modules/ticker.js';
import { initAchievementChecker } from './modules/achievements.js';
import { initPlayerPanel, initMobileNav } from './modules/playerPanel.js';

window.getOfflineSecondsMultiplier = getOfflineSecondsMultiplier;

window.cycleShopBuyAmount = function () {
    cycleBuyAmount();
    if (window.updateUI) window.updateUI();
};

window.openAimlab = openAimlab;
window.startAimlab = startAimlab;
window.spinWheel = spinWheel;
window.openTrio = openTrio;

initChallengeChecker();
initGardenTicker();
initNewsTicker();
initAchievementChecker();
initPlayerPanel();
initMobileNav();
initAuthUI();
initWheel();
