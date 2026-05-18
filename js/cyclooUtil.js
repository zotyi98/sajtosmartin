import { sanitizeUsername } from './authSession.js';

/** Tesztelő haver — felhasználónév: Cycloo */
export function isCyclooPlayer(name) {
    const raw = (name || '').trim().toLowerCase();
    if (raw === 'cycloo') return true;
    try {
        return sanitizeUsername(name || '').toLowerCase() === 'cycloo';
    } catch {
        return false;
    }
}
