import { useRef, useEffect, useCallback, lazy, Suspense } from 'react';

// --- STORES & HOOKS ---
import useUIStore from './stores/useUIStore';
import useMapStore from './stores/useMapStore';
import useAnalysisStore from './stores/useAnalysisStore';
import useAppData from './hooks/useAppData';
import useOnlineStatus from './hooks/useOnlineStatus';

// --- COMPONENTS ---
import InstitutionalHeader from './components/layout/InstitutionalHeader';
import SidebarDesktop from './components/layout/SidebarDesktop';
import MobileSearchBar from './components/search/MobileSearchBar';
import MapViewer from './components/map/MapViewer';
import Legend from './components/map/Legend';
import HelpModal from './components/modals/HelpModal';
import BottomSheetMobile from './components/layout/BottomSheetMobile';
import MapControls from './components/map/MapControls';
import OnboardingTour from './components/features/OnboardingTour';

// Lazy-loaded: pulls in the heavy PDF stack (jspdf, html2canvas, qrcode ~215 kB
// gzip) only when the export UI mounts, not on initial page load.
const PdfExportController = lazy(() => import('./components/analysis/controllers/PdfExportController'));

// --- UI COMPONENTS ---
import Icons from './components/ui/Icons';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { ToastContainer } from './components/ui/ToastSystem';

/* ------------------------------------------------ */
/* COMPONENT: VisorApp (Main) */
/* ------------------------------------------------ */
const VisorApp = () => {
    // 1. Data Layer
    const { loading, dataCache, constants, error } = useAppData();
    const isOnline = useOnlineStatus();

    // 2. UI Store
    const {
        isSidebarOpen, toggleSidebar,
        isLegendOpen, setLegendOpen,
        isHelpOpen, setHelpOpen,
        setMobileSheetState,
        addToast
    } = useUIStore();

    // 3. Map Store
    const {
        location, setLocation,
        currentZoom, setZoom,
        activeBaseLayer, setActiveBaseLayer,
        globalOpacity, setGlobalOpacity,
        visibleMapLayers, toggleLayer
    } = useMapStore();

    // 4. Analysis Store
    const {
        analysis, analyzing, extraDataLoaded, setExtraDataLoaded,
        approximateAddress, setApproximateAddress,
        visibleZoningCats, setVisibleZoningCats,
        isExporting, setExporting,
        exportProgress, setExportProgress,
        performAnalysis, resetAnalysis
    } = useAnalysisStore();

    // 5. Refs (kept local as they are imperative handles)
    const resetMapViewRef = useRef(null);
    const zoomInRef = useRef(null);
    const zoomOutRef = useRef(null);
    const desktopSearchInputRef = useRef(null);
    const mobileSearchInputRef = useRef(null);

    // --- ACTIONS ADAPTERS ---

    // Wrapper for Location Select to inject Refs and Dependencies
    const onLocationSelect = (coord) => {
        const lat = Number(coord?.lat);
        const lng = Number(coord?.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return;

        const c = { lat, lng };
        const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        // UI Updates
        setLocation(c);
        setApproximateAddress(null);
        if (desktopSearchInputRef.current) desktopSearchInputRef.current(text);
        if (mobileSearchInputRef.current) mobileSearchInputRef.current(text);

        // Execute Store Action
        performAnalysis(c, dataCache, constants);
    };

    const handleReset = () => {
        setLocation(null);
        resetAnalysis();
        setApproximateAddress(null);
        setMobileSheetState('collapsed');
        if (resetMapViewRef.current) resetMapViewRef.current();
    };

    const exportHandlerRef = useRef(null);
    const setExportHandler = (fn) => (exportHandlerRef.current = fn);

    const handleExportClick = useCallback(async (e) => {
        const exportFn = exportHandlerRef.current;
        if (typeof exportFn === 'function') {
            if (isExporting) return;
            setExporting(true);
            let timeoutId;
            try {
                // Safety timeout so a hung html2canvas/leaflet-image never leaves
                // the export spinner stuck on forever.
                const timeout = new Promise((_, reject) => {
                    timeoutId = setTimeout(
                        () => reject(new Error('La generación del PDF tardó demasiado.')),
                        25000
                    );
                });
                await Promise.race([exportFn(e), timeout]);
                addToast('Documento PDF generado exitosamente', 'success');
            } catch (err) {
                console.error("Export Error", err);
                addToast('Error al generar PDF', 'error');
            } finally {
                clearTimeout(timeoutId);
                setExporting(false);
                setExportProgress(0);
            }
        } else {
            addToast('Aún no se puede exportar. Intenta recargar la página.', 'error');
        }
    }, [isExporting, addToast, setExporting, setExportProgress]);

    const handleUserLocation = () => {
        navigator.geolocation.getCurrentPosition(
            p => {
                const coord = { lat: p.coords.latitude, lng: p.coords.longitude };
                onLocationSelect(coord);
            },
            (e) => {
                console.warn(e);
                addToast("No se pudo obtener tu ubicación actual. Revisa permisos.", 'error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const toggleZoningGroup = useCallback(() => {
        toggleLayer('zoning');
    }, [toggleLayer]);

    // Event Listener for Remote PDF Triggers (e.g. from BottomSheetMobile)
    useEffect(() => {
        const handleTrigger = (e) => {
            if (handleExportClick) handleExportClick(e);
        };
        window.addEventListener('trigger-pdf-export', handleTrigger);
        return () => window.removeEventListener('trigger-pdf-export', handleTrigger);
    }, [handleExportClick]);

    // Initialization Effect: Parse URL Params
    useEffect(() => {
        if (loading) return;

        // Initialize Zoning Cats if needed (move to store later?)
        if (constants?.ZONING_ORDER && Object.keys(visibleZoningCats).length === 0) {
            const d = {};
            constants.ZONING_ORDER.forEach(k => d[k] = true);
            setVisibleZoningCats(d);
        }

        // Simulate deprecated values for component compat
        if (!extraDataLoaded) setExtraDataLoaded(true);

        /* 
           NOTE: systemError handling from useVisorState is removed/simplified here.
           If `error` from useAppData exists, we show it below.
        */

        const initUrlParams = async () => {
            const params = new URLSearchParams(window.location.search);
            const lat = parseFloat(params.get("lat"));
            const lng = parseFloat(params.get("lng"));
            const hasCoords = !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

            if (hasCoords) onLocationSelect({ lat, lng });
        };

        // Only run once when loaded
        initUrlParams();
    }, [loading, constants]); // eslint-disable-line react-hooks/exhaustive-deps

    if (error) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border-l-4 border-red-600">
                    <Icons.AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Error de Inicialización</h1>
                    <p className="text-sm text-gray-600 mb-6">Error cargando datos: {error}</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors">
                        Recargar Página
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center text-guinda flex-col gap-3" role="status" aria-live="polite">
                <Icons.Loader2 aria-hidden="true" className="animate-spin h-10 w-10" />
                <span className="text-sm font-medium animate-pulse">Cargando visor...</span>
            </div>
        );
    }

    return (
        <div className={`flex flex-col w-full h-full overflow-hidden ${loading || analyzing ? 'cursor-wait' : ''}`} style={{ background: 'var(--bg-soft-gradient)' }}>
            {!isOnline && (
                <div
                    role="status"
                    aria-live="assertive"
                    className="flex-shrink-0 bg-amber-500 text-white text-xs font-semibold text-center py-1.5 px-4"
                >
                    Sin conexión a internet. El mapa base y la búsqueda de direcciones no están disponibles; puedes consultar por coordenadas.
                </div>
            )}
            <InstitutionalHeader />
            <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
                {/* Mobile Search Overlay */}
                <div className="md:hidden absolute top-4 left-0 right-0 z-search px-4 pointer-events-none flex justify-center">
                    <div className="w-full max-w-lg pointer-events-auto">
                        <MobileSearchBar
                            onLocationSelect={onLocationSelect}
                            onReset={handleReset}
                            setInputRef={mobileSearchInputRef}
                            initialValue={analysis ? `${analysis.coordinate.lat.toFixed(6)}, ${analysis.coordinate.lng.toFixed(6)}` : ''}
                        />
                    </div>
                </div>

                <SidebarDesktop
                    analysis={analysis}
                    approximateAddress={approximateAddress}
                    onLocationSelect={onLocationSelect}
                    onReset={handleReset}
                    isOpen={isSidebarOpen}
                    onToggle={toggleSidebar}
                    onExportPDF={handleExportClick}
                    desktopSearchSetRef={desktopSearchInputRef}
                    isLoading={analyzing}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                    onOpenHelp={() => setHelpOpen(true)}
                />

                <div className="relative flex-1 h-full w-full">
                    <MapViewer
                        location={location}
                        onLocationSelect={onLocationSelect}
                        analysisStatus={analysis?.status}
                        isANP={analysis?.isANP}
                        visibleMapLayers={visibleMapLayers}
                        visibleZoningCats={visibleZoningCats}
                        extraDataLoaded={extraDataLoaded}
                        activeBaseLayer={activeBaseLayer}
                        globalOpacity={globalOpacity}
                        resetMapViewRef={resetMapViewRef}
                        zoomInRef={zoomInRef}
                        zoomOutRef={zoomOutRef}
                        selectedAnpId={analysis?.anpId}
                        dataCache={dataCache}
                        onZoomChange={setZoom}
                    />

                    <ToastContainer />

                    {loading && (
                        <div className="absolute inset-0 z-search bg-white/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                            <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
                                <div className="w-10 h-10 border-4 border-gray-200 border-l-guinda rounded-full animate-spin mb-3"></div>
                                <span className="text-gray-800 font-bold text-sm">Cargando mapa base...</span>
                            </div>
                        </div>
                    )}

                    <Legend
                        visibleMapLayers={visibleMapLayers}
                        toggleLayer={toggleLayer}
                        isOpen={isLegendOpen}
                        setIsOpen={setLegendOpen}
                        visibleZoningCats={visibleZoningCats}
                        toggleZoningGroup={toggleZoningGroup}
                        setVisibleZoningCats={setVisibleZoningCats}
                        activeBaseLayer={activeBaseLayer}
                        setActiveBaseLayer={setActiveBaseLayer}
                        selectedAnpId={analysis?.anpId}
                        anpName={analysis?.anpNombre}
                        anpGeneralVisible={visibleMapLayers.anp}
                    />

                    <MapControls
                        onOpenHelp={() => setHelpOpen(true)}
                        isLegendOpen={isLegendOpen}
                        setLegendOpen={setLegendOpen}
                        globalOpacity={globalOpacity}
                        setGlobalOpacity={setGlobalOpacity}
                        onResetView={() => resetMapViewRef.current?.()}
                        onUserLocation={handleUserLocation}
                        onZoomIn={() => zoomInRef.current?.()}
                        onZoomOut={() => zoomOutRef.current?.()}
                    />
                </div>

                <BottomSheetMobile />

                <HelpModal
                    isOpen={isHelpOpen}
                    onClose={() => setHelpOpen(false)}
                />

                <Suspense fallback={null}>
                    <PdfExportController
                        analysis={analysis}
                        onExportReady={setExportHandler}
                        onProgress={setExportProgress}
                        dataCache={dataCache}
                        visibleMapLayers={visibleMapLayers}
                        activeBaseLayer={activeBaseLayer}
                        visibleZoningCats={visibleZoningCats}
                        currentZoom={currentZoom}
                        approximateAddress={approximateAddress}
                    />
                </Suspense>

                <OnboardingTour />
            </div>
        </div>
    );
};

// Main App Component with Providers
const App = () => {
    return (
        <ErrorBoundary>
            <VisorApp />
        </ErrorBoundary>
    );
};

export default App;
