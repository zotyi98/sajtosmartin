import { newsItems } from '../data.js';

export function initNewsTicker() {
    const tickerEl = document.getElementById('news-ticker-text');
    if (!tickerEl) return;
    tickerEl.innerText = newsItems[Math.floor(Math.random() * newsItems.length)];
    tickerEl.addEventListener('animationiteration', () => {
        tickerEl.innerText = newsItems[Math.floor(Math.random() * newsItems.length)];
    });
}
