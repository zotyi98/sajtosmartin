import { GameState, showToast, saveUserProgress } from '../state.js';
import { rpgItems } from '../data.js';
import { ensureGameStats } from './gameStats.js';

export function applyAchievementReward(reward, achName) {
    if (!reward || !reward.type) return '';

    switch (reward.type) {
        case 'bikes': {
            const amt = reward.amount || 0;
            GameState.bikes += amt;
            GameState.lifetimeBikes += amt;
            return `+${amt.toLocaleString()} 🚲`;
        }
        case 'goldenSpokes': {
            const amt = reward.amount || 1;
            GameState.goldenSpokes += amt;
            return `+${amt} ✨ Arany Küllő`;
        }
        case 'buff': {
            window.activeBuffs = window.activeBuffs || [];
            window.activeBuffs.push({
                mult: reward.mult || 2,
                target: reward.target || 'both',
                endTime: Date.now() + (reward.durationMs || 60000),
                text: reward.text || `🏆 ${achName}`,
                color: reward.color || 'var(--gold)'
            });
            if (window.recalcMultiplier) window.recalcMultiplier();
            return reward.text || `${reward.mult}x szorzó`;
        }
        case 'clickBonus': {
            const bonus = reward.amount || 1;
            ensureGameStats().permanentClickBonus += bonus;
            if (window.recalculateStats) window.recalculateStats();
            return `+${bonus} állandó kattintó erő`;
        }
        case 'inventory': {
            const itemId = reward.itemId;
            if (itemId && !GameState.inventory.includes(itemId)) {
                GameState.inventory.push(itemId);
                const item = rpgItems[itemId];
                if (window.updateInventoryUI) window.updateInventoryUI();
                if (window.recalculateStats) window.recalculateStats();
                return item ? `${item.icon} ${item.name}` : 'Felszerelés';
            }
            GameState.bikes += 5000;
            GameState.lifetimeBikes += 5000;
            return 'Már megvolt a tárgy — +5 000 🚲';
        }
        case 'cosmetic': {
            const id = reward.id || 'cheese_cursor';
            if (!GameState.cosmetics.includes(id)) {
                GameState.cosmetics.push(id);
                if (window.applyCosmetics) window.applyCosmetics();
                return '🧀 Sajtos kurzor feloldva';
            }
            GameState.bikes += 25000;
            GameState.lifetimeBikes += 25000;
            return 'Már megvolt — +25 000 🚲';
        }
        case 'instantProduction': {
            const seconds = reward.seconds || 60;
            const gain = Math.max(100, Math.floor(GameState.bps * seconds));
            GameState.bikes += gain;
            GameState.lifetimeBikes += gain;
            return `${seconds} mp termelés (${gain.toLocaleString()} 🚲)`;
        }
        default:
            return '';
    }
}

export function formatRewardToast(ach, rewardText) {
    return `🏆 SIKER: ${ach.icon || '🏅'} ${ach.name}\n${ach.desc ? ach.desc + '\n' : ''}🎁 ${rewardText}`;
}
