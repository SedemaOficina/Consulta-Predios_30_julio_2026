import { describe, it, expect } from 'vitest';
import {
    isConservationSoil,
    isUrbanSoil,
    isOutsideCDMX,
    isANP,
    hasZoningData,
    hasSpecificPDU,
    shouldShowNormativeInstrument,
    shouldShowActivitiesCatalog,
    shouldShowZoningResult,
} from './zoningRules';

describe('zoningRules — status predicates', () => {
    it('isConservationSoil', () => {
        expect(isConservationSoil({ status: 'CONSERVATION_SOIL' })).toBe(true);
        expect(isConservationSoil({ status: 'URBAN_SOIL' })).toBe(false);
        expect(isConservationSoil(null)).toBe(false);
    });

    it('isUrbanSoil', () => {
        expect(isUrbanSoil({ status: 'URBAN_SOIL' })).toBe(true);
        expect(isUrbanSoil({ status: 'CONSERVATION_SOIL' })).toBe(false);
    });

    it('isOutsideCDMX', () => {
        expect(isOutsideCDMX({ status: 'OUTSIDE_CDMX' })).toBe(true);
        expect(isOutsideCDMX({ status: 'URBAN_SOIL' })).toBe(false);
    });
});

describe('zoningRules — ANP and zoning data', () => {
    it('isANP recognises both the flag and the ANP key', () => {
        expect(isANP({ isANP: true })).toBe(true);
        expect(isANP({ zoningKey: 'ANP' })).toBe(true);
        expect(isANP({ zoningKey: 'FC' })).toBe(false);
        expect(isANP({})).toBe(false);
    });

    it('hasZoningData treats missing key and NODATA as no data', () => {
        expect(hasZoningData({ zoningKey: 'FC' })).toBe(true);
        expect(hasZoningData({ zoningKey: 'NODATA' })).toBe(false);
        expect(hasZoningData({})).toBe(false);
    });

    it('hasSpecificPDU only matches PDU_ prefixed keys', () => {
        expect(hasSpecificPDU({ zoningKey: 'PDU_PP' })).toBe(true);
        expect(hasSpecificPDU({ zoningKey: 'PDU_ZU' })).toBe(true);
        expect(hasSpecificPDU({ zoningKey: 'FC' })).toBe(false);
        expect(!!hasSpecificPDU({})).toBe(false);
    });
});

describe('zoningRules — visibility rules', () => {
    it('shouldShowNormativeInstrument for SC and Urban only', () => {
        expect(shouldShowNormativeInstrument({ status: 'CONSERVATION_SOIL' })).toBe(true);
        expect(shouldShowNormativeInstrument({ status: 'URBAN_SOIL' })).toBe(true);
        expect(shouldShowNormativeInstrument({ status: 'OUTSIDE_CDMX' })).toBe(false);
    });

    it('shouldShowActivitiesCatalog only for non-PDU conservation soil', () => {
        expect(shouldShowActivitiesCatalog({ status: 'CONSERVATION_SOIL' })).toBe(true);
        expect(shouldShowActivitiesCatalog({ status: 'CONSERVATION_SOIL', isPDU: true })).toBe(false);
        expect(shouldShowActivitiesCatalog({ status: 'CONSERVATION_SOIL', noActivitiesCatalog: true })).toBe(false);
        expect(shouldShowActivitiesCatalog({ status: 'URBAN_SOIL' })).toBe(false);
    });

    it('shouldShowZoningResult only for SC with real zoning data', () => {
        expect(shouldShowZoningResult({ status: 'CONSERVATION_SOIL', zoningKey: 'FC' })).toBe(true);
        expect(shouldShowZoningResult({ status: 'CONSERVATION_SOIL', zoningKey: 'ANP' })).toBe(false);
        expect(shouldShowZoningResult({ status: 'CONSERVATION_SOIL', zoningKey: 'NODATA' })).toBe(false);
        expect(shouldShowZoningResult({ status: 'URBAN_SOIL', zoningKey: 'FC' })).toBe(false);
    });
});
