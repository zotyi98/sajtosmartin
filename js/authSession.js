export function sanitizeUsername(username) {
    return username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 12);
}

export function isValidUsername(username) {
    const safe = sanitizeUsername(username);
    return safe.length >= 2 && safe.length <= 12;
}

export function getLocalGameKey(username) {
    return `martinGame_user_${sanitizeUsername(username)}`;
}

export function getSessionStorageKey(username) {
    return `gameSession_${sanitizeUsername(username)}`;
}

export function storeSessionToken(username, token) {
    sessionStorage.setItem(getSessionStorageKey(username), token);
}

export function loadSessionToken(username) {
    return sessionStorage.getItem(getSessionStorageKey(username)) || "";
}

export function generateSalt() {
    return crypto.randomUUID();
}

export async function hashPassword(password, salt) {
    const data = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

const REMEMBER_USER_KEY = 'rememberUsername';
const REMEMBER_PASS_KEY = 'rememberPassword_b64';

export function saveRememberedLogin(displayName, password, remember) {
    if (remember) {
        localStorage.setItem(REMEMBER_USER_KEY, displayName);
        try {
            localStorage.setItem(REMEMBER_PASS_KEY, btoa(unescape(encodeURIComponent(password))));
        } catch {
            localStorage.removeItem(REMEMBER_PASS_KEY);
        }
    } else {
        clearRememberedLogin();
    }
}

export function loadRememberedLogin() {
    const user = localStorage.getItem(REMEMBER_USER_KEY);
    let password = '';
    const passB64 = localStorage.getItem(REMEMBER_PASS_KEY)
        || localStorage.getItem('rememberPassword_password');
    if (passB64) {
        try {
            password = decodeURIComponent(escape(atob(passB64)));
        } catch {
            password = '';
        }
    }
    return { user: user || '', password, hasSaved: !!(user && password) };
}

export function clearRememberedLogin() {
    localStorage.removeItem(REMEMBER_USER_KEY);
    localStorage.removeItem(REMEMBER_PASS_KEY);
    localStorage.removeItem('rememberPassword_username');
    localStorage.removeItem('rememberPassword_password');
}

export function dedupeRealUpgrades(list) {
    const seen = new Set();
    const out = [];
    (Array.isArray(list) ? list : Object.values(list || {})).forEach((ru) => {
        const id = typeof ru === "object" ? ru.id : ru;
        if (id === undefined || seen.has(id)) return;
        seen.add(id);
        out.push(typeof ru === "object" ? { id: ru.id } : { id });
    });
    return out;
}
