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
