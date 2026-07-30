// Centralized, crash-safe access to the recent-search history in localStorage.
// Parsing is wrapped in try/catch so a corrupt or partially-written value can
// never throw into the search UI (see audit item M6).

const STORAGE_KEY = 'search_history';
const MAX_ENTRIES = 5;

export const readSearchHistory = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const pushSearchHistory = (place) => {
    if (!place || typeof place.lat !== 'number' || typeof place.lng !== 'number') return;
    try {
        const entry = {
            label: place.label,
            lat: place.lat,
            lng: place.lng,
            fullLabel: place.fullLabel
        };
        const previous = readSearchHistory().filter(h => h.label !== entry.label);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...previous].slice(0, MAX_ENTRIES)));
    } catch {
        /* storage unavailable or full — ignore */
    }
};
