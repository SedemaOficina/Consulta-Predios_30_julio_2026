import { useState, useMemo, memo } from 'react';
import Fuse from 'fuse.js';
import Icons from '../../ui/Icons';
import Tooltip from '../../ui/Tooltip';
import GroupedActivities from './GroupedActivities';

const ActivityCatalogController = ({ analysis, COLORS }) => {
    const [activeTab, setActiveTab] = useState('prohibidas');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSectors, setSelectedSectors] = useState(new Set());

    // 1. Data Source
    const sourceList = useMemo(() =>
        activeTab === 'prohibidas' ? (analysis.prohibitedActivities || []) : (analysis.allowedActivities || [])
        , [activeTab, analysis]);

    // 2. Extract Sectors (from current list)
    const allSectors = useMemo(
        () => Array.from(new Set(sourceList.map(item => item.sector))).sort(),
        [sourceList]
    );

    // 3. Filter with Fuse.js
    const fuse = useMemo(() => {
        if (!Fuse) return null;
        return new Fuse(sourceList, {
            keys: ['sector', 'general', 'specific'],
            threshold: 0.3,
            ignoreLocation: true
        });
    }, [sourceList]);

    const filteredList = useMemo(() => {
        let results = sourceList;

        // A) Search Filter
        if (searchTerm.trim() && fuse) {
            results = fuse.search(searchTerm).map(r => r.item);
        } else if (searchTerm.trim()) {
            // Fallback simple filter if Fuse fails
            const lower = searchTerm.toLowerCase();
            results = sourceList.filter(item =>
                item.general.toLowerCase().includes(lower) ||
                item.specific.toLowerCase().includes(lower) ||
                item.sector.toLowerCase().includes(lower)
            );
        }

        // B) Sector Filter
        if (selectedSectors.size > 0) {
            results = results.filter(item => selectedSectors.has(item.sector));
        }

        return results;
    }, [sourceList, searchTerm, selectedSectors, fuse]);

    // Handlers
    const toggleSector = (sec) => {
        const next = new Set(selectedSectors);
        if (next.has(sec)) next.delete(sec);
        else next.add(sec);
        setSelectedSectors(next);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedSectors(new Set());
    };

    return (
        <div className="mt-8 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                        {Icons.List ? <Icons.List className="h-4 w-4" /> : <span>=</span>}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                            Catálogo de Actividades
                            <Tooltip content="Estas actividades aplican específicamente a la zonificación PGOEDF del predio consultado.">
                                <span className="ml-1 text-gray-600 hover:text-gray-800 text-xs cursor-help">ⓘ</span>
                            </Tooltip>
                        </h3>
                        <p className="text-[10px] text-gray-600">Consulta los usos permitidos y prohibidos</p>
                    </div>
                </div>
            </div>

            {/* Controls Container */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">

                {/* Search & Tabs Row */}
                <div className="flex flex-col gap-3 mb-4">
                    {/* Search Input */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                            {Icons.Search ? <Icons.Search className="h-4 w-4" /> : <span>🔍</span>}
                        </div>
                        <input
                            type="text"
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                            placeholder="Buscar actividad (ej. vivienda, comercio, abarrotes)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <Tooltip content="Limpiar búsqueda">
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                                >
                                    ✕
                                </button>
                            </Tooltip>
                        )}
                    </div>

                    {/* Accessible Tabs (Headless UI Pattern) */}
                    <div className="flex p-1 bg-gray-100 rounded-lg shrink-0" role="tablist" aria-label="Filtro de actividades">
                        <button
                            role="tab"
                            aria-selected={activeTab === 'prohibidas'}
                            aria-controls="panel-prohibidas"
                            id="tab-prohibidas"
                            onClick={() => setActiveTab('prohibidas')}
                            className={`flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-guinda ${activeTab === 'prohibidas'
                                ? 'bg-white text-red-700 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Prohibidas ({analysis.prohibitedActivities?.length || 0})
                        </button>
                        <button
                            role="tab"
                            aria-selected={activeTab === 'permitidas'}
                            aria-controls="panel-permitidas"
                            id="tab-permitidas"
                            onClick={() => setActiveTab('permitidas')}
                            className={`flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-guinda ${activeTab === 'permitidas'
                                ? 'bg-white text-green-700 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Permitidas ({analysis.allowedActivities?.length || 0})
                        </button>
                    </div>
                </div>

                {/* Sector Chips & Mobile Index */}
                {allSectors.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Filtrar por Sector</span>
                            {(selectedSectors.size > 0) && (
                                <button onClick={clearFilters} className="text-[10px] text-blue-500 hover:text-blue-700 font-medium hover:underline">
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                            {allSectors.map(sec => {
                                const isSelected = selectedSectors.has(sec);
                                return (
                                    <button
                                        key={sec}
                                        onClick={() => toggleSector(sec)}
                                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all active:scale-95 text-left ${isSelected
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {sec}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Results List (Tab Panel) */}
            <div
                role="tabpanel"
                id={`panel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                className="animate-in fade-in slide-in-from-bottom-2 focus:outline-none"
                tabIndex={0}
            >
                <div className="text-[10px] text-gray-600 font-medium mb-2 text-right">
                    Mostrando {filteredList.length} de {sourceList.length} resultados
                </div>

                {filteredList.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <div className="text-2xl mb-2 opacity-20">🔍</div>
                        <div className="text-sm font-semibold text-gray-500">No se encontraron actividades</div>
                        <div className="text-xs text-gray-600">Intenta ajustar tu búsqueda o los filtros de sector</div>
                        <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-xs font-bold text-gray-600 hover:text-blue-600">
                            Ver todo
                        </button>
                    </div>
                ) : (
                    <GroupedActivities
                        title={activeTab === 'prohibidas' ? "Listado de Prohibiciones" : "Listado de Usos Permitidos"}
                        activities={filteredList}
                        icon={activeTab === 'prohibidas'
                            ? (Icons.XCircle ? <Icons.XCircle className="h-4 w-4" /> : null)
                            : (Icons.CheckCircle ? <Icons.CheckCircle className="h-4 w-4" /> : null)
                        }
                        headerClass={activeTab === 'prohibidas' ? "text-red-800" : "text-green-800"}
                        bgClass="bg-white shadow-sm hover:shadow-md transition-shadow"
                        accentColor={activeTab === 'prohibidas' ? COLORS.error : COLORS.success}
                    />
                )}
            </div>
        </div>
    );
};

export default memo(ActivityCatalogController);
