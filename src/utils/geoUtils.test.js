import { describe, it, expect } from 'vitest';
import {
    isPointInPolygon,
    findFeature,
    getFeatureBounds,
    parseCoordinateInput,
    isStrictNumber,
} from './geoUtils';

// Helper: build a closed GeoJSON square ring ([lng, lat] order).
const ring = (minLng, minLat, maxLng, maxLat) => [
    [minLng, minLat],
    [minLng, maxLat],
    [maxLng, maxLat],
    [maxLng, minLat],
    [minLng, minLat],
];
const polygon = (minLng, minLat, maxLng, maxLat, properties = {}) => ({
    type: 'Feature',
    properties,
    geometry: { type: 'Polygon', coordinates: [ring(minLng, minLat, maxLng, maxLat)] },
});

describe('isPointInPolygon', () => {
    const square = polygon(0, 0, 10, 10);

    it('returns true for a point inside a simple polygon', () => {
        expect(isPointInPolygon({ lat: 5, lng: 5 }, square)).toBe(true);
    });

    it('returns false for a point outside', () => {
        expect(isPointInPolygon({ lat: 20, lng: 20 }, square)).toBe(false);
    });

    it('respects holes (interior rings)', () => {
        const holed = {
            geometry: { type: 'Polygon', coordinates: [ring(0, 0, 10, 10), ring(3, 3, 7, 7)] },
        };
        expect(isPointInPolygon({ lat: 5, lng: 5 }, holed)).toBe(false); // inside the hole
        expect(isPointInPolygon({ lat: 1, lng: 1 }, holed)).toBe(true);  // in the ring, not the hole
    });

    it('handles MultiPolygon geometries', () => {
        const multi = {
            geometry: {
                type: 'MultiPolygon',
                coordinates: [[ring(0, 0, 5, 5)], [ring(20, 20, 25, 25)]],
            },
        };
        expect(isPointInPolygon({ lat: 22, lng: 22 }, multi)).toBe(true);
        expect(isPointInPolygon({ lat: 10, lng: 10 }, multi)).toBe(false);
    });

    it('returns false for invalid input', () => {
        expect(isPointInPolygon(null, square)).toBe(false);
        expect(isPointInPolygon({ lat: 5, lng: 5 }, {})).toBe(false);
        expect(isPointInPolygon({ lat: 5, lng: 5 }, { geometry: { type: 'Point', coordinates: [5, 5] } })).toBe(false);
    });
});

describe('getFeatureBounds', () => {
    it('computes the bounding box of a polygon', () => {
        const bbox = getFeatureBounds(polygon(-99.3, 19.2, -98.9, 19.6));
        expect(bbox).toEqual({ minX: -99.3, minY: 19.2, maxX: -98.9, maxY: 19.6 });
    });
});

describe('findFeature', () => {
    it('returns null for an empty or missing collection', () => {
        expect(findFeature({ lat: 5, lng: 5 }, null)).toBeNull();
        expect(findFeature({ lat: 5, lng: 5 }, { features: [] })).toBeNull();
    });

    it('prioritises the last matching feature (top layer wins)', () => {
        const fc = {
            features: [
                polygon(0, 0, 10, 10, { id: 'A' }),
                polygon(0, 0, 10, 10, { id: 'B' }),
            ],
        };
        expect(findFeature({ lat: 5, lng: 5 }, fc).properties.id).toBe('B');
    });

    it('rejects points outside every feature via the bounding box', () => {
        const fc = { features: [polygon(0, 0, 10, 10, { id: 'A' })] };
        expect(findFeature({ lat: 50, lng: 50 }, fc)).toBeNull();
    });

    it('skips features with null geometry without throwing', () => {
        const fc = {
            features: [
                { type: 'Feature', properties: { id: 'null-geom' }, geometry: null },
                polygon(0, 0, 10, 10, { id: 'A' }),
            ],
        };
        expect(() => findFeature({ lat: 5, lng: 5 }, fc)).not.toThrow();
        expect(findFeature({ lat: 5, lng: 5 }, fc).properties.id).toBe('A');
    });
});

describe('parseCoordinateInput', () => {
    it('parses decimal "lat, lng"', () => {
        expect(parseCoordinateInput('19.4326, -99.1332')).toEqual({ lat: 19.4326, lng: -99.1332 });
    });

    it('parses space-separated decimals', () => {
        expect(parseCoordinateInput('19.4326 -99.1332')).toEqual({ lat: 19.4326, lng: -99.1332 });
    });

    it('rejects out-of-range values', () => {
        expect(parseCoordinateInput('200, 300')).toBeNull();
    });

    it('rejects non-coordinate text', () => {
        expect(parseCoordinateInput('Polanco, Miguel Hidalgo')).toBeNull();
        expect(parseCoordinateInput('')).toBeNull();
        expect(parseCoordinateInput(null)).toBeNull();
    });

    it('parses DMS coordinates with hemispheres', () => {
        const result = parseCoordinateInput('19°22\'18.8"N 99°04\'25.8"W');
        expect(result).not.toBeNull();
        expect(result.lat).toBeCloseTo(19.3719, 3);
        expect(result.lng).toBeCloseTo(-99.0738, 3);
    });
});

describe('isStrictNumber', () => {
    it('accepts numeric strings and rejects the rest', () => {
        expect(isStrictNumber('19.4')).toBe(true);
        expect(isStrictNumber('-99')).toBe(true);
        expect(isStrictNumber('abc')).toBe(false);
        expect(isStrictNumber('')).toBe(false);
        expect(isStrictNumber(19.4)).toBe(false); // not a string
    });
});
