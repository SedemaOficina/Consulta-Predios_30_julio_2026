import Icons from '../ui/Icons';
import useAddressSearch from '../../hooks/useAddressSearch';

const MobileSearchBar = ({ onLocationSelect, onReset, setInputRef, initialValue }) => {
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
    } = useAddressSearch({
        onLocationSelect,
        initialValue,
        setInputRef,
        formatLabel: (s) => s.label,
    });

    const handleClear = () => {
        clear();
        onReset();
    };

    return (
        <div className="w-full flex flex-col gap-2 pointer-events-none">
            <div className="pointer-events-auto">
                <form
                    onSubmit={handleSubmit}
                    className="relative w-full bg-white rounded-full shadow-md flex items-center border border-gray-200 focus-within:ring-2 focus-within:ring-guinda focus-within:border-transparent transition-all duration-200 ease-out"
                >
                    <input
                        type="text"
                        aria-label="Buscar dirección"
                        role="combobox"
                        aria-expanded={suggestions.length > 0}
                        aria-controls="search-mobile-listbox"
                        aria-autocomplete="list"
                        aria-activedescendant={activeIndex >= 0 ? `search-mobile-opt-${activeIndex}` : undefined}
                        className="flex-1 bg-transparent outline-none text-[13px] text-gray-800 placeholder-gray-400 h-11 pl-4 pr-20 rounded-full"
                        placeholder="Buscar dirección..."
                        value={query}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onFocus={showHistory}
                    />

                    {/* Buttons Container */}
                    <div className="absolute right-1 flex items-center gap-1">
                        {query && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-2 text-gray-600 hover:text-gray-800 rounded-full active:bg-gray-100"
                                title="Limpiar"
                                aria-label="Limpiar búsqueda"
                            >
                                <Icons.X className="h-4 w-4" />
                            </button>
                        )}

                        <div className="h-5 w-px bg-gray-200"></div>

                        <button
                            type="submit"
                            aria-label="Buscar"
                            className="p-2 text-guinda active:text-guinda-dark rounded-full active:bg-red-50"
                        >
                            <Icons.Search aria-hidden="true" className="h-5 w-5" />
                        </button>
                    </div>

                </form>

                {(suggestions.length > 0 || isSearching) && (
                    <div
                        id="search-mobile-listbox"
                        role="listbox"
                        aria-label="Sugerencias de búsqueda"
                        className="mt-1 bg-white border border-gray-200 rounded-lg shadow-md max-h-64 overflow-y-auto"
                    >
                        {isSearching && (
                            <div className="px-3 py-1.5 text-[11px] text-gray-500">Buscando en Mapbox…</div>
                        )}
                        {suggestions[0]?._isHistory && (
                            <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-gray-100 flex items-center gap-2">
                                <Icons.Clock className="h-3 w-3" /> Búsquedas recientes
                            </div>
                        )}
                        {suggestions.map((s, i) => (
                            <button
                                key={s.id || i}
                                type="button"
                                role="option"
                                id={`search-mobile-opt-${i}`}
                                aria-selected={i === activeIndex}
                                onClick={() => selectSuggestion(s)}
                                className={`w-full text-left px-3 py-2 border-t border-gray-50 flex flex-col ${i === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                            >
                                <span className="text-[12px] font-bold text-gray-800 leading-tight">
                                    {s.label}
                                </span>
                                {s.fullLabel && (
                                    <span className="text-[10px] text-gray-500 leading-tight">
                                        {s.fullLabel.startsWith(s.label)
                                            ? s.fullLabel.substring(s.label.length).replace(/^,\s*/, '')
                                            : s.fullLabel}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileSearchBar;
