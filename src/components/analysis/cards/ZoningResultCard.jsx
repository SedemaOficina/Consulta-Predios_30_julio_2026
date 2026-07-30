import { memo } from 'react';
import { getZoningColor } from '../../../utils/geoUtils';
import Tooltip from '../../ui/Tooltip';
import { shouldShowZoningResult } from '../../../utils/domain/zoningRules';

const ZoningResultCard = ({ analysis, zoningDisplay }) => {
    if (!shouldShowZoningResult(analysis)) return null;

    let zoningColor = '#9ca3af';
    if (analysis.zoningKey && getZoningColor) {
        zoningColor = getZoningColor(analysis.zoningKey);
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 shadow-sm animate-slide-up">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
                Zonificación PGOEDF
                <Tooltip content="Zonificación  del Programa General de Ordenamiento Ecológico del DF">
                    <span className="text-gray-300 hover:text-gray-500 transition-colors">ⓘ</span>
                </Tooltip>
            </div>
            <div className="flex items-start gap-2">
                <div
                    className="w-3 h-3 rounded-full mt-1 shrink-0 border border-black/10 shadow-sm"
                    style={{ backgroundColor: zoningColor }}
                />
                <div className="text-base font-bold text-gray-800 leading-snug break-words">
                    {zoningDisplay}
                </div>
            </div>
        </div>
    );
};

export default memo(ZoningResultCard);
