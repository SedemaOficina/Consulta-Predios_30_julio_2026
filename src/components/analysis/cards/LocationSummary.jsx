import { memo } from 'react';
import Icons from '../../ui/Icons';
import { CONSTANTS } from '../../../utils/constants';
import { getZoningColor } from '../../../utils/geoUtils';
import { getZoningDisplay, getContrastYIQ } from '../../../utils/analysisUtils';
import { isConservationSoil, isUrbanSoil, isOutsideCDMX, hasZoningData } from '../../../utils/domain/zoningRules';

const LocationSummary = ({ analysis, approximateAddress }) => {
    const COLORS = CONSTANTS.COLORS || {};

    const isSC = isConservationSoil(analysis);
    const isUrban = isUrbanSoil(analysis);
    const isOutside = isOutsideCDMX(analysis);
    const hasData = hasZoningData(analysis);

    let zoningColor = '#9ca3af';
    if (analysis.zoningKey === 'ANP') {
        zoningColor = COLORS.anp || '#9333ea';
    } else if (!hasData) {
        zoningColor = '#9ca3af';
    } else if (analysis.zoningKey && getZoningColor) {
        zoningColor = getZoningColor(analysis.zoningKey);
    }

    const zoningBadgeLabel = hasData && analysis.zoningKey !== 'ANP'
        ? getZoningDisplay(analysis)
        : null;

    if (isOutside) return null;

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 shadow-none animate-slide-up">

            {/* 1. Dirección Aproximada (TOP) */}
            {approximateAddress && (
                <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-start gap-2">
                        {Icons.MapPin && <div className="mt-0.5 text-guinda"><Icons.MapPin className="h-3.5 w-3.5" /></div>}
                        <div>
                            <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-0.5">
                                Dirección Aproximada (Orientativa)
                            </div>
                            <div className="text-xs font-semibold text-gray-800 leading-snug">
                                {approximateAddress}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Alcaldía (SECOND) */}
            <div className="mb-3 pb-3 border-b border-gray-100">
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Alcaldía</div>
                <div className="text-lg font-bold text-gray-900 leading-tight">
                    {analysis.alcaldia || 'Ciudad de México'}
                </div>
            </div>

            {/* 3. Zonificación Primaria */}
            <div className="mb-3 pb-3 border-b border-gray-100">
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">
                    ZONIFICACIÓN PRIMARIA
                </div>
                <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase leading-none"
                    style={{
                        backgroundColor: isSC ? COLORS.sc : isUrban ? COLORS.su : '#6b7280',
                        color: '#ffffff'
                    }}
                >
                    {isSC ? 'Suelo de Conservación' : 'Suelo Urbano'}
                </span>
            </div>

            {/* 4. Zonificación PGOEDF (Only if NOT Urban and has data) */}
            {!isUrban && zoningBadgeLabel && (
                <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">
                        ZONIFICACIÓN PGOEDF
                    </div>
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase leading-none"
                        style={{
                            backgroundColor: zoningColor,
                            color: getContrastYIQ(zoningColor)
                        }}
                    >
                        {zoningBadgeLabel}
                    </span>
                </div>
            )}

            {/* 5. Other Badges (ANP) */}
            <div className="flex flex-wrap items-center gap-2 mb-2">

                {/* Badge ANP */}
                {analysis.isANP && (
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase leading-none bg-[#9333ea] text-white"
                    >
                        ANP
                    </span>
                )}
            </div>


        </div >
    );
};

export default memo(LocationSummary);
