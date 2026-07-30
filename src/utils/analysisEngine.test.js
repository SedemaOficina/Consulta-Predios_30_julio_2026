import { describe, it, expect } from 'vitest';
import { analyzeLocation } from './analysisEngine';

// --- GeoJSON fixtures ([lng, lat] order) ---
const ring = (minLng, minLat, maxLng, maxLat) => [
    [minLng, minLat],
    [minLng, maxLat],
    [maxLng, maxLat],
    [maxLng, minLat],
    [minLng, minLat],
];
const feature = (minLng, minLat, maxLng, maxLat, properties = {}) => ({
    type: 'Feature',
    properties,
    geometry: { type: 'Polygon', coordinates: [ring(minLng, minLat, maxLng, maxLat)] },
});
const fc = (features) => ({ type: 'FeatureCollection', features });

// A point inside the CDMX test region.
const INSIDE = { lat: 19.4, lng: -99.1 };
const CDMX = fc([feature(-99.3, 19.2, -98.9, 19.6)]);

describe('analyzeLocation', () => {
    it('returns NO_DATA when the data cache is incomplete', async () => {
        expect((await analyzeLocation(INSIDE, null)).status).toBe('NO_DATA');
        expect((await analyzeLocation(INSIDE, { cdmx: null })).status).toBe('NO_DATA');
    });

    it('flags points outside CDMX and resolves the neighbouring state', async () => {
        const cache = {
            cdmx: CDMX,
            edomex: fc([feature(-1, -1, 1, 1)]), // covers {0,0}
            morelos: fc([]),
            alcaldias: fc([]),
            sc: fc([]),
            zoning: fc([]),
            anp: fc([]),
            rules: [],
        };
        const r = await analyzeLocation({ lat: 0, lng: 0 }, cache);
        expect(r.status).toBe('OUTSIDE_CDMX');
        expect(r.outsideContext).toBe('Estado de México');
    });

    it('classifies a point in CDMX outside conservation soil as URBAN_SOIL', async () => {
        const cache = {
            cdmx: CDMX,
            alcaldias: fc([feature(-99.3, 19.2, -98.9, 19.6, { NOMBRE: 'Tlalpan' })]),
            sc: fc([feature(-99.3, 19.5, -98.9, 19.6)]), // does NOT cover INSIDE (lat 19.4)
            zoning: fc([]),
            anp: fc([]),
            rules: [],
        };
        const r = await analyzeLocation(INSIDE, cache);
        expect(r.status).toBe('URBAN_SOIL');
        expect(r.alcaldia).toBe('Tlalpan');
    });

    it('classifies conservation soil and cross-references the activities catalog', async () => {
        const cache = {
            cdmx: CDMX,
            alcaldias: fc([feature(-99.3, 19.2, -98.9, 19.6, { NOMBRE: 'Tlalpan' })]),
            sc: fc([feature(-99.3, 19.2, -98.9, 19.6)]), // covers INSIDE
            zoning: fc([feature(-99.3, 19.2, -98.9, 19.6, { CLAVE: 'FC', PGOEDF: 'Forestal Conservación' })]),
            anp: fc([]),
            rules: [
                { Sector: 'S', 'Actividad general': 'G', 'Actividad específica': 'E1', FC: 'A' },
                { Sector: 'S', 'Actividad general': 'G', 'Actividad específica': 'E2', FC: 'P' },
            ],
        };
        const r = await analyzeLocation(INSIDE, cache);
        expect(r.status).toBe('CONSERVATION_SOIL');
        expect(r.isRestricted).toBe(true);
        expect(r.zoningKey).toBe('FC');
        expect(r.allowedActivities).toHaveLength(1);
        expect(r.prohibitedActivities).toHaveLength(1);
        expect(r.allowedActivities[0].specific).toBe('E1');
        expect(r.prohibitedActivities[0].specific).toBe('E2');
    });

    it('detects ANP status on any soil', async () => {
        const cache = {
            cdmx: CDMX,
            alcaldias: fc([]),
            sc: fc([feature(-99.3, 19.2, -98.9, 19.6)]),
            zoning: fc([]),
            anp: fc([feature(-99.3, 19.2, -98.9, 19.6, { ANP_ID: 7, NOMBRE: 'Bosque de Tlalpan' })]),
            rules: [],
        };
        const r = await analyzeLocation(INSIDE, cache);
        expect(r.isANP).toBe(true);
        expect(r.anpId).toBe(7);
        expect(r.anpNombre).toBe('Bosque de Tlalpan');
    });
});
