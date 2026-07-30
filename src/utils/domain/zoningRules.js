/**
 * Domain rules for Zoning Analysis
 * Centralizes logic for determining soil types, ANP status, and visibility rules.
 */

export const isConservationSoil = (analysis) => {
    return analysis?.status === 'CONSERVATION_SOIL';
};

export const isUrbanSoil = (analysis) => {
    return analysis?.status === 'URBAN_SOIL';
};

export const isOutsideCDMX = (analysis) => {
    return analysis?.status === 'OUTSIDE_CDMX';
};

export const isANP = (analysis) => {
    return !!(analysis?.isANP || analysis?.zoningKey === 'ANP');
};

export const hasZoningData = (analysis) => {
    // NODATA is explicitly "no data"
    if (!analysis?.zoningKey || analysis.zoningKey === 'NODATA') return false;
    return true;
};

export const hasSpecificPDU = (analysis) => {
    return analysis?.zoningKey && analysis.zoningKey.startsWith('PDU_');
};

export const shouldShowNormativeInstrument = (analysis) => {
    const isSC = isConservationSoil(analysis);
    const isUrban = isUrbanSoil(analysis);
    // Show for SC or Urban
    return isSC || isUrban;
};

export const shouldShowActivitiesCatalog = (analysis) => {
    // Only Conservation Soil
    // Not PDU_ specific types (unless they follow PGOEDF rules, but generally PDU means Urban rules apply)
    // explicitly blocked by noActivitiesCatalog flag
    return isConservationSoil(analysis) && !analysis?.isPDU && !analysis?.noActivitiesCatalog;
};

export const shouldShowZoningResult = (analysis) => {
    const isSC = isConservationSoil(analysis);
    if (!isSC) return false;

    // Don't show if simple ANP (handled by ANP card usually) or NODATA or OUTSIDE
    if (analysis?.zoningKey === 'ANP') return false;
    if (!hasZoningData(analysis)) return false;

    return true;
};
