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
    bikes: 0,
    lifetimeBikes: 0,
    goldenSpokes: 0,
    prestigeCount: 0,
    clickPower: 1,
    bps: 0,
    upgrades: [],
    realUpgrades: [],
    prestigeSkills: [],
    inventory: []
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
    localStorage.setItem(`martinGame_user_${GameState.currentUser}`, JSON.stringify(GameState));
    set(ref(db, 'users/' + GameState.currentUser), GameState);
}

// Globális UI frissítő hívás
export let updateUI = () => {}; 
export function setUpdateUI(fn) { updateUI = fn; }