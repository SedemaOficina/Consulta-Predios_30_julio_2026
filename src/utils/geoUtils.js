import { CONSTANTS } from './constants';

// --- HELPERS GEOESPACIALES ---

export const isPointInPolygon = (point, feature) => {
    if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number') return false;
    if (!feature?.geometry?.type || !feature?.geometry?.coordinates) return false;
    const x = point.lng; // GeoJSON: X = longitud
    const y = point.lat; // GeoJSON: Y = latitud

    const { type, coordinates } = feature.geometry;

    const pointInRing = (ring) => {
        let inside = false;

        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0]; // lng
            const yi = ring[i][1]; // lat
            const xj = ring[j][0]; // lng
            const yj = ring[j][1]; // lat

            const denom = (yj - yi);
            if (denom === 0) continue;
            const intersect =
                ((yi > y) !== (yj > y)) &&
                (x < ((xj - xi) * (y - yi)) / denom + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    };

    if (type === 'Polygon') {
        if (!pointInRing(coordinates[0])) return false;
        const holes = coordinates.slice(1);
        if (holes.length && holes.some(h => pointInRing(h))) return false;
        return true;
    }

    if (type === 'MultiPolygon') {
        return coordinates.some(poly => {
            if (!pointInRing(poly[0])) return false;
            const holes = poly.slice(1);
            if (holes.length && holes.some(h => pointInRing(h))) return false;
            return true;
        });
    }

    return false;
};

// OPTIMIZATION: BBox Helper (Lazy Calculation).
// Cached in a WeakMap keyed by the feature so we never mutate the source
// GeoJSON objects (which could otherwise leak `_bbox` if serialized).
const bboxCache = new WeakMap();
const EMPTY_BBOX = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

export const getFeatureBounds = (feature) => {
    const cached = bboxCache.get(feature);
    if (cached) return cached;

    // GeoJSON allows `"geometry": null`; treat it as an empty (never-matching)
    // bounding box instead of throwing.
    const geom = feature?.geometry;
    if (!geom?.coordinates) {
        bboxCache.set(feature, EMPTY_BBOX);
        return EMPTY_BBOX;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    const processRing = (ring) => {
        for (let i = 0; i < ring.length; i++) {
            const [x, y] = ring[i];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    };

    if (geom.type === 'Polygon') {
        processRing(geom.coordinates[0]);
    } else if (geom.type === 'MultiPolygon') {
        for (let i = 0; i < geom.coordinates.length; i++) {
            processRing(geom.coordinates[i][0]);
        }
    }

    const bbox = { minX, minY, maxX, maxY };
    bboxCache.set(feature, bbox);
    return bbox;
};

export const findFeature = (p, c) => {
    if (!c?.features) return null;

    const x = p.lng;
    const y = p.lat;

    // ✅ Reverse loop: prioritize layers on top (last in array)
    for (let i = c.features.length - 1; i >= 0; i--) {
        const f = c.features[i];

        // 1. FAST CHECK: Bounding Box
        const bbox = getFeatureBounds(f);
        if (x < bbox.minX || x > bbox.maxX || y < bbox.minY || y > bbox.maxY) {
            continue; // Skip complex calculation
        }

        // 2. SLOW CHECK: Point in Polygon (Only if passed BBox)
        if (isPointInPolygon(p, f)) return f;
    }
    return null;
};

export const getZoningColor = (key) => {
    if (!key) return '#ccc';
    const k = key.toString().toUpperCase();
    const catInfo = CONSTANTS.ZONING_CAT_INFO || {};
    const cat = Object.keys(catInfo).find(c => k.startsWith(c));
    return cat ? catInfo[cat].color : '#9ca3af';
};

export const getAnpZoningColor = (zoningName) => {
    const name = (zoningName || '').toLowerCase();

    // Paleta semántica
    if (name.includes('protección') || name.includes('nucleo') || name.includes('núcleo')) return '#ef4444';
    if (name.includes('restringid')) return '#f97316';
    if (name.includes('aprovechamiento')) return '#84cc16';
    if (name.includes('tradicional')) return '#eab308';
    if (name.includes('publico') || name.includes('público')) return '#06b6d4';
    if (name.includes('restauraci')) return '#10b981';
    if (name.includes('recuperacion') || name.includes('recuperación')) return '#10b981';

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const fallbackPalette = ['#f472b6', '#22d3ee', '#fbbf24', '#a3e635', '#f87171', '#c084fc'];
    return fallbackPalette[Math.abs(hash) % fallbackPalette.length];
};

export const getZoningStyle = (feature) => {
    let color;
    let fillOpacity = 0.2;

    if (feature.properties?.CLAVE) {
        color = getZoningColor(feature.properties.CLAVE);
    }
    else if (feature.properties?.ZONIFICACION) {
        color = getAnpZoningColor(feature.properties.ZONIFICACION);
        fillOpacity = 0.4;
    }
    else {
        color = '#8b5cf6';
    }

    return {
        color: color,
        weight: 1.5,
        opacity: 0.9,
        fillColor: color,
        fillOpacity: fillOpacity,
        interactive: true
    };
};

export const getSectorStyle = (sectorName) => {
    const norm = (sectorName || '').toLowerCase().trim();
    if (norm.includes('agrícola') || norm.includes('agricola') || norm.includes('agro')) {
        return { bg: '#FEF9C3', border: '#FACC15', text: '#854D0E' };
    }
    if (norm.includes('pecuario') || norm.includes('ganad')) {
        return { bg: '#FFEDD5', border: '#FB923C', text: '#9A3412' };
    }
    if (norm.includes('forestal') || norm.includes('bosque')) {
        return { bg: '#DCFCE7', border: '#22C55E', text: '#14532D' };
    }
    if (norm.includes('turismo') || norm.includes('eco')) {
        return { bg: '#E0E7FF', border: '#6366F1', text: '#312E81' };
    }
    if (norm.includes('infra') || norm.includes('equip')) {
        return { bg: '#F3F4F6', border: '#9CA3AF', text: '#374151' };
    }
    return { bg: '#F3F4F6', border: '#9CA3AF', text: '#374151' };
};


// --- SEARCH HELPERS ---

export const isStrictNumber = (val) => {
    if (typeof val !== 'string') return false;
    return !isNaN(val) && !isNaN(parseFloat(val));
};

export const parseCoordinateInput = (input) => {
    if (!input || typeof input !== 'string') return null;
    const s = input.trim();
    // A coordinate string is always short; bail on pathologically long input to
    // avoid catastrophic backtracking in the DMS regexes below (ReDoS).
    if (s.length > 100) return null;

    const tryDecimal = (text) => {
        if (/[°'"NnSsEeWw]/.test(text)) return null;
        if (text.includes(',')) {
            const parts = text.split(',').map(p => p.trim());
            if (parts.length === 2 && isStrictNumber(parts[0]) && isStrictNumber(parts[1])) {
                const lat = Number(parts[0]);
                const lng = Number(parts[1]);
                if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
            }
        }
        const spaceParts = text.trim().split(/\s+/);
        if (spaceParts.length === 2 && isStrictNumber(spaceParts[0]) && isStrictNumber(spaceParts[1])) {
            const lat = Number(spaceParts[0]);
            const lng = Number(spaceParts[1]);
            if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
        }
        return null;
    };

    const decimal = tryDecimal(s);
    if (decimal) return decimal;

    const dmsToDecimal = (deg, min, sec, hemi) => {
        let d = parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
        hemi = (hemi || '').toUpperCase();
        if (hemi === 'S' || hemi === 'W') d *= -1;
        return d;
    };

    const latMatch = s.match(/(\d+)[°\s]+(\d+)['’\s]+(\d+(?:\.\d+)?)["\s]*([NnSs])/);
    const lonMatch = s.match(/(\d+)[°\s]+(\d+)['’\s]+(\d+(?:\.\d+)?)["\s]*([EeWw])/);

    if (latMatch && lonMatch) {
        const lat = dmsToDecimal(latMatch[1], latMatch[2], latMatch[3], latMatch[4]);
        const lng = dmsToDecimal(lonMatch[1], lonMatch[2], lonMatch[3], lonMatch[4]);
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    return null;
};

export const searchMapboxPlaces = async (query) => {
    if (!query) return [];
    const token = CONSTANTS.MAPBOX_TOKEN;
    const bbox = '-99.3649,19.0482,-98.9403,19.5927';
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&bbox=${bbox}&country=mx&limit=5&language=es`;

    try {
        const r = await fetch(url);
        if (!r.ok) return [];
        const d = await r.json();
        return d.features.map(f => ({
            id: f.id,
            label: f.text, // Nombre corto
            fullLabel: f.place_name,
            lat: f.center[1],
            lng: f.center[0]
        }));
    } catch (e) {
        console.error('Mapbox error:', e);
        return [];
    }
};

export const getBaseLayerUrl = (name) => {
    const token = CONSTANTS.MAPBOX_TOKEN;
    if (name === 'STREETS') return `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/256/{z}/{x}/{y}?access_token=${token}`;
    if (name === 'SATELLITE') return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}?access_token=${token}`;
    if (name === 'TOPO') return `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}?access_token=${token}`;
    return `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/256/{z}/{x}/{y}?access_token=${token}`;
};

export const getReverseGeocoding = async (lat, lng, apiKey) => {
    const token = apiKey || CONSTANTS.MAPBOX_TOKEN;
    if (!token) {
        console.warn("Mapbox API Key no configurada.");
        return null;
    }
    // Coerce to numbers so only numeric values are ever interpolated into the URL.
    const safeLat = Number(lat);
    const safeLng = Number(lng);
    if (Number.isNaN(safeLat) || Number.isNaN(safeLng)) return null;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${safeLng},${safeLat}.json?types=address,poi&language=es&access_token=${token}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error fetching address');
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            return data.features[0].place_name;
        }
        return null;
    } catch (error) {
        console.error("Error en geocodificación:", error);
        return null;
    }
};

export const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export const generateFolio = () => {
    const now = new Date();
    const iso = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    return `F-${iso}`;
};
