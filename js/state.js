import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDKEMDbNKzJJTBYjhRCAKi9ct8861uvlao",
    authDomain: "martinbikycle.firebaseapp.com",
    databaseURL: "https://martinbikycle-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "martinbikycle"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// A játék teljes aktuális állapota (State)
export const GameState = {
    currentUser: "",
    password: "",
    bikes: 0,
    lifetimeBikes: 0,
    goldenSpokes: 0,
    prestigeCount: 0,
    clickPower: 1,
    bps: 0,
    upgrades: [],
    realUpgrades: [],
    prestigeSkills: [],
    inventory: [],
    achievements: [], // Itt tároljuk már a felhőben!
    lastSaved: 0      // A Ghost-Save védelemhez
};

export function showToast(text) {
    const container = document.getElementById('achievement-container'); 
    const toast = document.createElement('div');
    toast.className = 'achievement-toast'; 
    toast.innerText = text; 
    container.appendChild(toast); 
    setTimeout(() => toast.remove(), 5000); 
}

export function saveUserProgress() {
    if (!GameState.currentUser) return;
    GameState.lastSaved = Date.now(); // Mentéskor lebélyegezzük az időt

    const payload = JSON.parse(JSON.stringify(GameState));
    delete payload.password;
    delete payload.currentUser;

    try {
        localStorage.setItem(`martinGame_user_${GameState.currentUser}`, JSON.stringify(payload));
    } catch (e) {
        console.warn('Nem sikerült helyben menteni az állapotot.', e);
    }

    set(ref(db, 'users/' + GameState.currentUser), payload);
    if (GameState.password) {
        set(ref(db, 'users/' + GameState.currentUser + '/password'), GameState.password);
    }
}

// Globális UI frissítő hívás
export let updateUI = () => {}; 
export function setUpdateUI(fn) { updateUI = fn; }