import { openAimlab, startAimlab } from './modules/aimlab.js';
import { initWheel, spinWheel } from './modules/wheel.js';

import './modules/globals.js';
import './modules/kullok.js';
import './modules/visuals.js';
import './modules/stats.js';
import './modules/ui.js';
import './modules/shop.js';
import './modules/seasons.js';
import './modules/leaderboard.js';
import './modules/progress.js';
import './modules/ticker.js';
import './modules/gameLoop.js';
import './modules/achievements.js';
import { initAuthUI } from './modules/auth.js';

import './modules/admin.js?v=2';
import './modules/events.js?v=2';
import './modules/prestige.js?v=2';
import './modules/spectate.js?v=2';

import { initNewsTicker } from './modules/ticker.js';
import { initAchievementChecker } from './modules/achievements.js';

window.openAimlab = openAimlab;
window.startAimlab = startAimlab;
window.spinWheel = spinWheel;

initNewsTicker();
initAchievementChecker();
initAuthUI();
initWheel();
