import { memo } from 'react';
import Icons from '../../ui/Icons';
import { getCitizenExplanation } from '../../../utils/analysisUtils';

const CitizenSummaryCard = ({ analysis }) => {
    if (!analysis) return null;

    const { status } = analysis;
    const text = getCitizenExplanation(analysis);

    if (!text) return null;

    const isOutside = status === 'OUTSIDE_CDMX';

    // Styles Configuration
    const baseClasses = isOutside
        ? "relative mb-4 rounded-xl p-4 bg-red-50 to-white border border-red-100 shadow-sm animate-in slide-in-from-bottom-2 duration-500"
        : "relative mb-4 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm animate-in slide-in-from-bottom-2 duration-500";

    const iconContainerClasses = isOutside
        ? "shrink-0 mt-0.5 p-1.5 bg-red-100 rounded-lg text-red-600"
        : "shrink-0 mt-0.5 p-1.5 bg-blue-100 rounded-lg text-blue-600";

    const textClasses = isOutside
        ? "text-xs text-red-800 leading-relaxed font-medium"
        : "text-xs text-slate-700 leading-relaxed font-medium";

    return (
        <div className={baseClasses}>
            <div className="flex items-start gap-3 relative z-10">
                <div className={iconContainerClasses}>
                    {isOutside && Icons.AlertTriangle ? <Icons.AlertTriangle className="h-4 w-4" /> : (Icons.Info ? <Icons.Info className="h-4 w-4" /> : <span>i</span>)}
                </div>
                <div>
                    <p className={textClasses}>
                        <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>') }} />
                    </p>
                </div>
            </div>
        </div>
    );
};

export default memo(CitizenSummaryCard);
