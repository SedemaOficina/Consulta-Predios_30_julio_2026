import React, { useEffect, useRef, Suspense } from 'react';
import Icons from '../ui/Icons';
import SkeletonAnalysis from '../ui/SkeletonAnalysis';
import useAnalysisStore from '../../stores/useAnalysisStore';
import useUIStore from '../../stores/useUIStore';
import useMapStore from '../../stores/useMapStore';

const ResultsContent = React.lazy(() => import('../analysis/ResultsContent'));

const BottomSheetMobile = () => {
    // 1. Store Access
    const {
        analysis,
        approximateAddress,
        isExporting,
        exportProgress
    } = useAnalysisStore();

    const {
        mobileSheetState,
        setMobileSheetState,
        addToast
    } = useUIStore();

    const resultSheetState = mobileSheetState || 'collapsed'; // Fallback
    const sheetRef = useRef(null);
    const startY = useRef(0);

    // Sync local state with global if needed, or just use global.
    // The original code had local 'sheetState' and synced via useEffect.
    // Now we use 'mobileSheetState' directly.

    // Effect to auto-open on analysis change
    useEffect(() => {
        // Debounce or immediate? Original had setTimeout 0
        const timer = setTimeout(() => {
            if (analysis) setMobileSheetState('mid');
            else setMobileSheetState('collapsed');
        }, 0);
        return () => clearTimeout(timer);
    }, [analysis, setMobileSheetState]);

    const goUp = () => setMobileSheetState(resultSheetState === 'collapsed' ? 'mid' : resultSheetState === 'mid' ? 'full' : 'full');
    const goDown = () => setMobileSheetState(resultSheetState === 'full' ? 'mid' : resultSheetState === 'mid' ? 'collapsed' : 'collapsed');
    const toggleFromTap = () => setMobileSheetState(resultSheetState === 'mid' ? 'full' : 'mid');

    const handleTouchStart = (e) => {
        if (e.target.closest('.sheet-header')) startY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        const endY = e.changedTouches[0].clientY;
        const diff = startY.current - endY;
        if (Math.abs(diff) < 60) return;
        if (diff > 0) goUp();
        else goDown();
    };

    const getHeight = () => {
        if (resultSheetState === 'collapsed') return '18svh';
        if (resultSheetState === 'mid') return '45svh';
        return '85svh';
    };

    const isANP = analysis?.isANP;
    const statusLabel = !analysis
        ? 'Busca una dirección o toca el mapa para iniciar la consulta.'
        : analysis?.status === 'OUTSIDE_CDMX'
            ? 'El punto se encuentra fuera de la Ciudad de México.'
            : isANP
                ? 'Área Natural Protegida — consulte el Programa de Manejo correspondiente.'
                : analysis?.status === 'NO_DATA'
                    ? 'No encontramos información específica para esta zona. Podría ser calle o zona federal.'
                    : 'Aquí tienes la información normativa del punto.';

    // Decoupled export trigger: dispatches a window event that App.jsx listens
    // for ('trigger-pdf-export') to run the PDF export without prop threading.
    const triggerExport = (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('trigger-pdf-export'));
    };

    const handleClose = () => {
        // Mirror App.jsx handleReset: clear the analysis, the map location and collapse the sheet.
        useAnalysisStore.getState().resetAnalysis();
        useMapStore.getState()?.setLocation(null);
        setMobileSheetState('collapsed');
    };

    return (
        <div
            ref={sheetRef}
            className="md:hidden fixed bottom-0 left-0 w-full glass-panel rounded-t-[24px] border-b-0 shadow-[0_-5px_30px_rgba(0,0,0,0.15)] z-sheet flex flex-col transition-all duration-300 ease-out"
            style={{ height: getHeight() }}
        >
            <div
                className="sheet-header flex-shrink-0 pt-1 pb-2 px-4 cursor-grab active:cursor-grabbing bg-white relative z-20 rounded-t-[24px]"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onClick={analysis ? toggleFromTap : undefined}
            >
                <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-2" />
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        {analysis ? (
                            <h3 className="font-bold text-sm text-guinda uppercase tracking-wide">
                                RESULTADO DE CONSULTA
                            </h3>
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-3 pb-1 w-full relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-guinda via-dorado to-guinda"></div>
                                <div className="flex items-center gap-2 mb-1 mt-1 bg-white/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-guinda"></div>
                                    <span className="text-[10px] font-black tracking-[0.2em] text-gray-600 uppercase">SEDEMA</span>
                                    <div className="w-2 h-2 rounded-full bg-guinda"></div>
                                </div>
                                <h3 className="font-extrabold text-guinda text-xl mb-1 uppercase tracking-tight leading-none">
                                    Visor de Consulta
                                </h3>
                                <p className="text-sm text-gray-500 text-center px-6 leading-tight font-medium max-w-xs mx-auto">
                                    {statusLabel}
                                </p>
                            </div>
                        )}
                    </div>
                    {analysis && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClose();
                            }}
                            className="p-1.5 rounded-full bg-guinda shadow-sm active:scale-95 transition"
                            aria-label="Cerrar resultados"
                            title="Cerrar ficha"
                        >
                            <Icons.X className="h-4 w-4 text-white" />
                        </button>
                    )}
                </div>
            </div>
            <div className="h-px bg-gray-200 w-full" />

            {/* PERSISTENCE CHANGE: CSS toggling instead of unmounting */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/50 mobile-upscale ${(resultSheetState === 'mid' || resultSheetState === 'full') ? 'block' : 'hidden'}`}>
                <Suspense fallback={<SkeletonAnalysis />}>
                    <ResultsContent
                        analysis={analysis}
                        approximateAddress={approximateAddress}
                        onExportPDF={triggerExport}
                        isExporting={isExporting}
                    />
                </Suspense>
            </div>

            {analysis && (
                <div className="flex-shrink-0 p-3 bg-white border-t border-gray-200 safe-area-bottom flex gap-3 overflow-x-auto">
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${analysis.coordinate.lat},${analysis.coordinate.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-guinda text-white py-2.5 px-4 rounded-full text-xs font-bold shadow-sm hover:bg-guinda-dark transition-colors"
                        title="Ver ubicación en Google Maps"
                    >
                        <Icons.MapIcon className="h-4 w-4" /> Google Maps
                    </a>
                    <button
                        onClick={async () => {
                            const url = `${window.location.origin}${window.location.pathname}?lat=${analysis.coordinate.lat}&lng=${analysis.coordinate.lng}&open=1`;
                            const shareData = {
                                title: 'Consulta Ciudadana SEDEMA',
                                text: `Consulta la información normativa del predio en ${analysis.alcaldia || 'CDMX'}.`,
                                url: url
                            };

                            if (navigator.share) {
                                try {
                                    await navigator.share(shareData);
                                } catch (error) {
                                    // Ignore abort errors (user cancelled)
                                    if (error.name !== 'AbortError') {
                                        console.error('Error sharing:', error);
                                    }
                                }
                            } else {
                                try {
                                    await navigator.clipboard.writeText(url);
                                    addToast('Enlace copiado al portapapeles', 'success');
                                } catch (err) {
                                    console.error('Failed to copy:', err);
                                    addToast('No se pudo copiar el enlace', 'error');
                                }
                            }
                        }}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 py-2.5 px-4 rounded-full text-xs font-bold shadow-sm hover:bg-gray-50"
                        title="Compartir ubicación"
                    >
                        <Icons.Share className="h-4 w-4" /> Compartir
                    </button>
                    <button
                        type="button"
                        onClick={triggerExport}
                        disabled={isExporting}
                        className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 py-2.5 px-4 rounded-full text-xs font-bold shadow-sm hover:bg-gray-50 ${isExporting ? 'opacity-75 cursor-not-allowed' : ''}`}
                        title="Descargar ficha técnica en PDF"
                    >
                        {isExporting ? (
                            <>
                                {Icons.Loader2 ? <Icons.Loader2 className="h-4 w-4 animate-spin text-guinda" /> : <span className="h-4 w-4 rounded-full border-2 border-t-guinda animate-spin" />}
                                Generando... {exportProgress ? `${exportProgress}%` : ''}
                            </>
                        ) : (
                            <>
                                <Icons.Pdf className="h-4 w-4" /> Exportar PDF
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default BottomSheetMobile;
