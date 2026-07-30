import { useState, useEffect, useRef } from 'react';
import { searchMapboxPlaces, parseCoordinateInput } from '../utils/geoUtils';
import { readSearchHistory, pushSearchHistory } from '../utils/searchHistory';
import useUIStore from '../stores/useUIStore';

// Matches a "lat, lng" / "lat lng" decimal coordinate pair so we can skip the
// address autocomplete for coordinate input.
const COORD_RE = /^-?\d+(\.\d+)?(\s*,\s*|\s+)-?\d+(\.\d+)?$/;

/**
 * Shared address-search behaviour for the desktop and mobile search bars:
 * debounced Mapbox autocomplete, coordinate parsing, recent-history handling
 * and committing a selected place. UI is left entirely to the components.
 *
 * @param {Object}   opts
 * @param {Function} opts.onLocationSelect - called with {lat, lng} on selection.
 * @param {string}   [opts.initialValue]   - value to reflect into the input.
 * @param {Object}   [opts.setInputRef]    - ref whose .current is set to an
 *                                           imperative `(text) => void` setter.
 * @param {Function} [opts.formatLabel]    - how a selected place fills the input.
 * @param {Function} [opts.onEmptyResult]  - called when a live search finds nothing.
 */
export default function useAddressSearch({
    onLocationSelect,
    initialValue,
    setInputRef,
    formatLabel = (s) => s.fullLabel || s.label,
    onEmptyResult,
} = {}) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1); // highlighted suggestion (combobox)
    const debounceRef = useRef(null);
    const addToast = useUIStore(state => state.addToast);
    const notifyEmpty = onEmptyResult || (() => addToast('No se encontraron coincidencias para tu búsqueda.', 'info'));

    const safeSearch = async (q) => (typeof searchMapboxPlaces === 'function' ? await searchMapboxPlaces(q) : []);
    const safeParse = (q) => (typeof parseCoordinateInput === 'function' ? parseCoordinateInput(q) : null);

    // Reflect the parent-provided value into the input.
    useEffect(() => {
        const t = setTimeout(() => setQuery(initialValue || ''), 0);
        return () => clearTimeout(t);
    }, [initialValue]);

    // Expose an imperative setter so the app can push text into the input.
    useEffect(() => {
        if (!setInputRef) return;
        setInputRef.current = (text) => {
            setQuery(text || '');
            setSuggestions([]);
        };
        return () => { setInputRef.current = null; };
    }, [setInputRef]);

    // Reset the keyboard highlight whenever the suggestion list changes.
    useEffect(() => { setActiveIndex(-1); }, [suggestions]);

    // Show recent searches when the (empty) input is focused.
    const showHistory = () => {
        if (query.trim()) return;
        const history = readSearchHistory();
        if (history.length) setSuggestions(history.map(x => ({ ...x, _isHistory: true })));
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        const trimmed = value.trim();
        if (trimmed.length < 3 || COORD_RE.test(trimmed)) {
            setSuggestions([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            // Address autocomplete needs the network; skip it when offline.
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                setSuggestions([]);
                return;
            }
            setIsSearching(true);
            const res = await safeSearch(value);
            setSuggestions(res);
            setIsSearching(false);
        }, 300);
    };

    // Commit a geocoded place: persist to history, reflect in the input and
    // select it on the map.
    const selectSuggestion = (s) => {
        if (!s._isHistory) pushSearchHistory(s);
        setQuery(formatLabel(s));
        setSuggestions([]);
        onLocationSelect({ lat: s.lat, lng: s.lng });
    };

    const handleSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        const value = query.trim();
        if (!value) return;

        // 1. Direct coordinate input.
        const coord = safeParse(value);
        if (coord) {
            onLocationSelect(coord);
            setSuggestions([]);
            return;
        }

        // 2. Take the top existing suggestion if any.
        if (suggestions.length > 0) {
            selectSuggestion(suggestions[0]);
            return;
        }

        // 3. A fresh address lookup needs the network — distinguish "offline"
        //    from a genuine "no results" so the message isn't misleading.
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            addToast('Sin conexión a internet. Solo puedes buscar por coordenadas mientras estás sin conexión.', 'error');
            return;
        }

        setIsSearching(true);
        const res = await safeSearch(value);
        setIsSearching(false);

        if (res.length > 0) selectSuggestion(res[0]);
        else notifyEmpty();
    };

    const clear = () => {
        setQuery('');
        setSuggestions([]);
    };

    // Combobox keyboard interaction for the input.
    const handleKeyDown = (e) => {
        if (!suggestions.length) {
            if (e.key === 'Enter') handleSubmit(e);
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(i => (i + 1) % suggestions.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(i => (i <= 0 ? suggestions.length - 1 : i - 1));
                break;
            case 'Enter':
                if (activeIndex >= 0 && suggestions[activeIndex]) {
                    e.preventDefault();
                    selectSuggestion(suggestions[activeIndex]);
                } else {
                    handleSubmit(e);
                }
                break;
            case 'Escape':
                setSuggestions([]);
                setActiveIndex(-1);
                break;
            default:
                break;
        }
    };

    return {
        query,
        setQuery,
        suggestions,
        setSuggestions,
        isSearching,
        activeIndex,
        handleChange,
        handleSubmit,
        handleKeyDown,
        selectSuggestion,
        showHistory,
        clear,
    };
}
