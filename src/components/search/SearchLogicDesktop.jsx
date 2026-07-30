import { useState, useRef } from 'react';

import Icons from '../ui/Icons';
import Tooltip from '../ui/Tooltip';
import useAddressSearch from '../../hooks/useAddressSearch';
import useUIStore from '../../stores/useUIStore';

const SearchLogicDesktop = ({ onLocationSelect, setInputRef, initialValue }) => {
    const [showInfo, setShowInfo] = useState(false);      // Help tooltip state
    const [isLocating, setIsLocating] = useState(false);  // Geolocation loading state
    const localInputRef = useRef(null);
    const addToast = useUIStore(state => state.addToast);

    const {
        query,
        suggestions,
        isSearching,
        activeIndex,
        handleChange,
        handleSubmit,
        handleKeyDown,
        selectSuggestion,
        showHistory,
        clear,
    } = useAddressSearch({ onLocationSelect, initialValue, setInputRef });

    return (
        <div className="space-y-2">
            <div className="relative">
                <div className="relative mb-3">
                    <div className="flex items-center justify-between mb-1">

                        <button
                            type="button"
                            onClick={() => setShowInfo(!showInfo)}
                            className="text-[10px] bg-white border border-gray-200 hover:bg-gray-50 text-guinda px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors shadow-sm"
                        >
                            <Icons.Info className="h-3 w-3" />
                            <span className="font-bold">Ayuda</span>
                        </button>
                    </div>

                    {showInfo && (
                        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 animate-in fade-in slide-in-from-top-1 shadow-sm">
                            <div className="font-bold mb-2 text-guinda flex items-center gap-2">
                                <Icons.Info className="h-3 w-3" />
                                ¿Cómo realizar una búsqueda?
                            </div>
                            <p className="mb-2 opacity-90">Puedes ingresar la ubicación de cualquiera de las siguientes formas:</p>
                            <ul className="space-y-2 text-[11px] opacity-90">
                                <li className="bg-white p-1.5 rounded border border-gray-200">
                                    <strong className="block text-gray-900 mb-0.5">Dirección</strong>
                                    <span className="text-gray-500">Ejemplo: Calle 5 de Mayo, Centro</span>
                                </li>
                                <li className="bg-white p-1.5 rounded border border-gray-200">
                                    <strong className="block text-gray-900 mb-0.5">Coordenadas (latitud, longitud)</strong>
                                    <span className="font-mono text-[10px] text-gray-500">Ejemplo: 19.4326, -99.1332</span>
                                </li>
                                <li className="bg-white p-1.5 rounded border border-gray-200">
                                    <strong className="block text-gray-900 mb-0.5">Coordenadas DMS</strong>
                                    <span className="font-mono text-[10px] text-gray-500">Ejemplo: 19&deg;22&apos;18.8&quot;N 99&deg;04&apos;25.8&quot;W</span>
                                </li>
                                <li className="bg-white p-1.5 rounded border border-gray-200">
                                    <strong className="block text-gray-900 mb-0.5">Colonia y alcaldía</strong>
                                    <span className="text-gray-500">Ejemplo: Polanco, Miguel Hidalgo</span>
                                </li>
                            </ul>
                        </div>
                    )}
                    <div className="relative group">
                        <div className="relative flex items-center w-full shadow-sm hover:shadow-md transition-shadow bg-white rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-guinda focus-within:border-transparent">
                            <input
                                type="text"
                                ref={localInputRef}
                                aria-label="Buscar dirección, coordenadas o alcaldía"
                                role="combobox"
                                aria-expanded={suggestions.length > 0}
                                aria-controls="search-desktop-listbox"
                                aria-autocomplete="list"
                                aria-activedescendant={activeIndex >= 0 ? `search-desktop-opt-${activeIndex}` : undefined}
                                placeholder="Buscar dirección, coordenadas, alcaldía..."
                                className="w-full h-12 pl-6 pr-24 bg-transparent border-none rounded-full text-sm text-gray-700 placeholder-gray-400 focus:ring-0 focus:outline-none"
                                value={query}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                onFocus={showHistory}
                            />

                            {/* Buttons Container (Right) */}
                            <div className="absolute right-2 flex items-center gap-1">
                                {query && (
                                    <Tooltip content="Limpiar búsqueda">
                                        <button
                                            type="button"
                                            aria-label="Limpiar búsqueda"
                                            onClick={() => {
                                                clear();
                                                localInputRef.current?.focus();
                                            }}
                                            className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                                        >
                                            <Icons.X className="h-5 w-5" />
                                        </button>
                                    </Tooltip>
                                )}

                                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                                <Tooltip content="Buscar">
                                    <button
                                        type="button"
                                        aria-label="Buscar"
                                        onClick={handleSubmit}
                                        disabled={isSearching}
                                        className="p-2 text-guinda hover:text-guinda-dark rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                        {isSearching ? (
                                            <div className="h-5 w-5 border-2 border-gray-200 border-t-guinda rounded-full animate-spin" role="status" aria-label="Buscando"></div>
                                        ) : (
                                            <Icons.Search aria-hidden="true" className="h-5 w-5" />
                                        )}
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    {/* Sugerencias y Recientes */}
                    {suggestions.length > 0 && (
                        <div
                            id="search-desktop-listbox"
                            role="listbox"
                            aria-label="Sugerencias de búsqueda"
                            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 z-suggest overflow-hidden max-h-60 overflow-y-auto"
                        >
                            {suggestions[0]._isHistory && (
                                <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-gray-100">
                                    Búsquedas recientes
                                </div>
                            )}

                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    role="option"
                                    id={`search-desktop-opt-${i}`}
                                    aria-selected={i === activeIndex}
                                    onClick={() => selectSuggestion(s)}
                                    className={`w-full text-left px-3 py-2 text-[12px] border-t border-gray-50 flex items-center gap-2 ${i === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                >
                                    {s._isHistory ? <Icons.Clock className="h-3 w-3 text-gray-600" /> : <Icons.MapPin className="h-3 w-3 text-gray-600" />}
                                    <div>
                                        <div className="font-bold text-gray-800">{s.label}</div>
                                        {s.fullLabel && (
                                            <div className="text-[10px] text-gray-500">
                                                {s.fullLabel.startsWith(s.label)
                                                    ? s.fullLabel.substring(s.label.length).replace(/^,\s*/, '')
                                                    : s.fullLabel}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* BOTÓN MI UBICACIÓN */}
                <button
                    type="button"
                    disabled={isLocating}
                    onClick={() => {
                        if (!navigator.geolocation) {
                            addToast("Tu navegador no soporta geolocalización.", 'error');
                            return;
                        }

                        setIsLocating(true);

                        navigator.geolocation.getCurrentPosition(
                            (pos) => {
                                setIsLocating(false);
                                const { latitude, longitude } = pos.coords;
                                onLocationSelect({ lat: latitude, lng: longitude });
                            },
                            (err) => {
                                setIsLocating(false);
                                console.error(err);
                                let msg = "No pudimos obtener tu ubicación.";
                                if (err.code === 1) msg = "Permiso de ubicación denegado.";
                                if (err.code === 2) msg = "Ubicación no disponible.";
                                if (err.code === 3) msg = "Tiempo de espera agotado.";
                                addToast(`${msg} Verifica tu conexión y permisos.`, 'error');
                            },
                            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                    }}
                    className="w-full mt-2 bg-white border border-gray-200 text-guinda hover:bg-gray-50 font-bold py-2 rounded-lg text-xs shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isLocating ? (
                        <div className="h-4 w-4 border-2 border-gray-200 border-t-guinda rounded-full animate-spin"></div>
                    ) : (
                        <Icons.Navigation className="h-4 w-4" />
                    )}
                    {isLocating ? "Obteniendo ubicación..." : "Usar mi ubicación actual"}
                </button>
            </div>
        </div>
    );
};

export default SearchLogicDesktop;
