import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { CONSTANTS } from '../utils/constants';
import useUIStore from '../stores/useUIStore';
import activitiesCsv from '../data/tabla_actividades_pgoedf.csv?raw';
import cdmxGeoRaw from '../data/cdmx.geojson?raw';
import scGeoRaw from '../data/suelo-de-conservacion-2020.geojson?raw';
import alcaldiasGeoRaw from '../data/alcaldias.geojson?raw';
import MainZoningRaw from '../data/zoonificacion_pgoedf_2000_sin_anp.geojson?raw';
import LinkMapInternal from '../data/anp_consolidada.geojson?raw';

const useAppData = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataCache, setDataCache] = useState({
        cdmx: null,
        alcaldias: null,
        sc: null,
        edomex: null,
        morelos: null,
        zoning: null,
        anpInternal: null,
        anp: null,
        rules: null
    });

    useEffect(() => {
        const loadData = async () => {
            // Helper to merge features
            const mergeFeatures = (list) => {
                const out = { type: 'FeatureCollection', features: [] };
                (list || []).forEach(fc => {
                    if (fc?.features?.length) out.features.push(...fc.features);
                });
                return out;
            };

            try {
                // 1. Critical Data - Imported Statically (Instant Load)
                // Parse raw JSON strings
                // Rules parsing
                const rulesParsed = Papa.parse(activitiesCsv, { header: true, skipEmptyLines: true });
                const rules = rulesParsed?.data || [];
                if (rulesParsed?.errors?.length) console.warn("CSV Parse Warnings:", rulesParsed.errors);

                setDataCache(prev => ({
                    ...prev,
                    cdmx: JSON.parse(cdmxGeoRaw),
                    alcaldias: JSON.parse(alcaldiasGeoRaw),
                    sc: JSON.parse(scGeoRaw),
                    zoning: JSON.parse(MainZoningRaw),
                    anp: JSON.parse(LinkMapInternal),
                    rules: rules
                }));

                // Allow UI to render immediately with critical data
                setLoading(false);

                // 2. Background Data - Dynamic Imports (Lazy Loaded Chunks)
                try {
                    // Dynamic Importer using Vite's import.meta.glob.
                    // Exclude the files that are statically imported above, so they
                    // are not both statically and dynamically imported (which would
                    // keep them in the main chunk and emit a Vite warning).
                    const geojsonGlobs = import.meta.glob([
                        '../data/*.geojson',
                        '!../data/cdmx.geojson',
                        '!../data/alcaldias.geojson',
                        '!../data/suelo-de-conservacion-2020.geojson',
                        '!../data/zoonificacion_pgoedf_2000_sin_anp.geojson',
                        '!../data/anp_consolidada.geojson',
                    ], { query: '?raw', import: 'default' });

                    const loadGeo = async (filename) => {
                        const path = `../data/${filename}`;
                        const loader = geojsonGlobs[path];
                        if (!loader) {
                            console.warn(`GeoJSON not found: ${filename}`);
                            return { type: 'FeatureCollection', features: [] };
                        }
                        const raw = await loader();
                        return JSON.parse(raw);
                    };

                    const [anpInternalList, edomex, morelos] = await Promise.all([
                        Promise.all([
                            loadGeo('Zon_Bosque_de_Tlalpan.geojson'),
                            loadGeo('Zon_Cerro_de_la_Estrella.geojson'),
                            loadGeo('Zon_Desierto_de_los_Leones.geojson'),
                            loadGeo('Zon_Ejidos_de_Xochimilco.geojson'),
                            loadGeo('Zon_La_Loma.geojson'),
                            loadGeo('Zon_Sierra_de_Guadalupe.geojson'),
                            loadGeo('Zon_Sierra_de_Santa_Catarina.geojson')
                        ]),
                        loadGeo('edomex.geojson'),
                        loadGeo('morelos.geojson')
                    ]);

                    setDataCache(prev => ({
                        ...prev,
                        anpInternal: mergeFeatures(anpInternalList),
                        edomex,
                        morelos
                    }));
                } catch (bgErr) {
                    console.error("Secondary Data Load Error:", bgErr);
                    // Surface the degraded state instead of failing silently: the
                    // core analysis still works, but "outside CDMX" context and the
                    // internal ANP zoning depend on this background data.
                    useUIStore.getState().addToast(
                        'No se pudieron cargar algunos datos complementarios. El análisis principal sigue disponible.',
                        'error'
                    );
                }

            } catch (err) {
                console.error("Critical Data Load Error:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return { loading, error, dataCache, constants: CONSTANTS };
};

export default useAppData;
