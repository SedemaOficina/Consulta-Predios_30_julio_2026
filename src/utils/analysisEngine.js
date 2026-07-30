import { findFeature } from './geoUtils';

/**
 * Core Analysis Logic
 * @param {Object} c - {lat, lng}
 * @param {Object} dataCache - The globally loaded data object
 */
export const analyzeLocation = (c, dataCache) => {
    const r = {
        status: 'NO_DATA',
        isRestricted: false,
        allowedActivities: [],
        prohibitedActivities: [],
        timestamp: new Date().toLocaleString(),
        coordinate: c
    };

    // 1. Validar si está fuera de CDMX
    if (!dataCache || !dataCache.cdmx) {
        r.status = 'NO_DATA';
        r.error = 'Data cache incompleto';
        return r;
    }

    if (dataCache.cdmx?.features?.length && !findFeature(c, dataCache.cdmx)) {
        r.status = 'OUTSIDE_CDMX';
        if (dataCache.edomex && dataCache.morelos) {
            const inEM = findFeature(c, dataCache.edomex);
            const inMOR = findFeature(c, dataCache.morelos);
            r.outsideContext = inEM ? "Estado de México" : inMOR ? "Morelos" : null;
        }
        return r;
    }

    // Alcaldía
    const alc = findFeature(c, dataCache.alcaldias);
    r.alcaldia = alc?.properties?.NOMBRE || "CDMX";

    // 2. Determinar STATUS: URBAN vs CONSERVATION
    if (!dataCache.sc || !dataCache.sc.features?.length) {
        r.status = 'NO_DATA';
        return r;
    }

    const sc = findFeature(c, dataCache.sc);
    if (!sc) {
        r.status = 'URBAN_SOIL';
    } else {
        r.status = 'CONSERVATION_SOIL';
        r.isRestricted = true;
    }

    // 3. Detectar ANP (Cualquier suelo)
    if (dataCache.anp?.features?.length) {
        const anpFeat = findFeature(c, dataCache.anp);
        if (anpFeat) {
            const p = (anpFeat.properties || {});
            r.isANP = true;
            r.anp = { ...p };

            r.anpId = p.ANP_ID ?? null;
            r.anpNombre = p.NOMBRE ?? null;
            r.anpTipoDecreto = p.TIPO_DECRETO ?? null;
            r.anpCategoria = p.CATEGORIA_PROTECCION ?? null;
            r.anpFechaDecreto = p.FECHA_DECRETO ?? null;
            r.anpSupDecretada = p.SUP_DECRETADA ?? null;
        }
    }

    // 4. Zonificación PGOEDF (JERARQUÍA ESTRICTA)
    const z = dataCache.zoning?.features?.length ? findFeature(c, dataCache.zoning) : null;

    if (z) {
        let k = (z.properties?.CLAVE || '').toString().trim().toUpperCase();

        if (k === 'PDU' || k === 'PROGRAMAS' || k === 'ZONA URBANA') {
            const desc = (z.properties.PGOEDF || '').toLowerCase();
            if (desc.includes('parcial')) {
                k = 'PDU_PP';
            } else if (desc.includes('poblad') || desc.includes('rural') || desc.includes('habitacional')) {
                k = 'PDU_PR';
            } else if (desc.includes('urbana') || desc.includes('urbano') || desc.includes('barrio')) {
                k = 'PDU_ZU';
            } else if (desc.includes('equipamiento')) {
                k = 'PDU_ER';
            }
            r.noActivitiesCatalog = true;
        }

        r.zoningKey = k;
        r.zoningName = z.properties?.PGOEDF || r.zoningKey;
    } else {
        if (r.status === 'CONSERVATION_SOIL') {
            if (r.isANP) {
                r.zoningName = "ÁREA NATURAL PROTEGIDA";
                r.zoningKey = "ANP";
            } else {
                r.zoningName = "Información no disponible";
                r.zoningKey = "NODATA";
            }
        } else if (r.status === 'URBAN_SOIL') {
            r.noActivitiesCatalog = true;
            if (r.isANP) {
                r.zoningName = "ÁREA NATURAL PROTEGIDA";
                r.zoningKey = "ANP";
            } else {
                r.zoningName = "Suelo Urbano";
            }
        }
    }

    // 4.1 Cruzar con CSV de actividades
    // Rules can be null (error) or empty array (no data)
    if (r.zoningKey) {
        if (!dataCache.rules) {
            // Null indicates loading error
            r.zoningCatalogError = "Error cargando archivo de reglas (CSV).";
            r.noActivitiesCatalog = true;
        } else if (dataCache.rules.length === 0) {
            // Empty array indicates empty file or parse error treated as empty
            r.zoningCatalogError = "El archivo de reglas está vacío.";
            r.noActivitiesCatalog = true;
        } else {
            // Normal processing ...
            const all = [];
            const pro = [];
            // Derive from the normalized zoning key (PDU_PP/PR/ZU/ER) rather than
            // the free-text zoning name, which rarely contains "PDU".
            r.isPDU = (r.zoningKey || '').startsWith('PDU_');

            if (r.zoningKey === 'ANP' || r.zoningKey === 'NODATA' || r.isPDU) {
                r.noActivitiesCatalog = true;
            } else {
                const hasColumn = Object.prototype.hasOwnProperty.call(dataCache.rules[0], r.zoningKey);

                if (!hasColumn) {
                    r.zoningCatalogError = `La columna '${r.zoningKey}' no existe en la tabla de actividades.`;
                    r.noActivitiesCatalog = true;
                } else {
                    dataCache.rules.forEach(row => {
                        const val = (row[r.zoningKey] || '').trim().toUpperCase();
                        if (!val) return;
                        const act = {
                            sector: (row['Sector'] || row['ector'] || '').trim(),
                            general: (row['Actividad general'] || row['Act_general'] || '').trim(),
                            specific: (row['Actividad específica'] || row['Actividad especifica'] || '').trim()
                        };
                        if (val === 'A') all.push(act);
                        else if (val === 'P') pro.push(act);
                    });
                    r.allowedActivities = all;
                    r.prohibitedActivities = pro;
                }
            }
        }
    }

    // 5. Zonificación Interna ANP
    if (r.isANP && r.anpId && dataCache.anpInternal?.features?.length) {
        const zInt = findFeature(c, dataCache.anpInternal);
        if (zInt) {
            r.anpInternalFeature = zInt;
            r.anpZoningData = { ...zInt.properties };
            r.hasInternalAnpZoning = true;
        }
    }

    return r;
};
