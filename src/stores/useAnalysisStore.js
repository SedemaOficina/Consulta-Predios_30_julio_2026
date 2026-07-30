import { create } from 'zustand';
import { analyzeLocation } from '../utils/analysisEngine';
import { getReverseGeocoding } from '../utils/geoUtils';
import useUIStore from './useUIStore';

const useAnalysisStore = create((set, get) => ({
    analysis: null,
    analyzing: false,
    extraDataLoaded: false,
    approximateAddress: null,
    visibleZoningCats: {},
    isExporting: false,
    exportProgress: 0,

    // Actions
    setExtraDataLoaded: (loaded) => set({ extraDataLoaded: loaded }),

    setApproximateAddress: (address) => set({ approximateAddress: address }),

    setExporting: (isExporting) => set({ isExporting }),

    setExportProgress: (progress) => set({ exportProgress: progress }),

    setVisibleZoningCats: (cats) => set((state) => ({
        visibleZoningCats: typeof cats === 'function' ? cats(state.visibleZoningCats) : cats
    })),

    resetAnalysis: () => set({
        analysis: null,
        analyzing: false,
        approximateAddress: null
    }),

    // Async Actions
    performAnalysis: async (coord, dataCache, constants) => {
        const { addToast } = useUIStore.getState();
        const lat = Number(coord?.lat);
        const lng = Number(coord?.lng);

        if (Number.isNaN(lat) || Number.isNaN(lng)) return;

        set({ analyzing: true, analysis: null, approximateAddress: null });

        try {
            // 1. Reverse Geocoding
            const token = constants?.MAPBOX_TOKEN;
            if (token) {
                getReverseGeocoding(lat, lng, token).then(address => {
                    if (!address) return;
                    // Guard against out-of-order responses: only apply the address
                    // if the current analysis still matches this request's point.
                    const current = get().analysis?.coordinate;
                    if (current && current.lat === lat && current.lng === lng) {
                        set({ approximateAddress: address });
                    }
                });
            }

            // 2. Analysis
            if (analyzeLocation) {
                const res = await analyzeLocation({ lat, lng }, dataCache);
                set({ analysis: res });

                if (res.status === 'OUTSIDE_CDMX') {
                    addToast('El punto seleccionado está fuera de la CDMX', 'info');
                } else {
                    addToast('¡Información encontrada!', 'success');
                }
            }
        } catch (err) {
            console.error("Analysis Error", err);
            addToast('Hubo un inconveniente al consultar este punto.', 'error');
        } finally {
            set({ analyzing: false });
        }
    }
}));

export default useAnalysisStore;
