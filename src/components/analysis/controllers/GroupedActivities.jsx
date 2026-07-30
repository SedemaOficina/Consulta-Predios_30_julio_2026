import { memo } from 'react';
import Icons from '../../ui/Icons';
import { getSectorStyle } from '../../../utils/geoUtils';

const GroupedActivities = ({ title, activities, icon, headerClass, bgClass, accentColor }) => {
    if (!activities || activities.length === 0) return null;

    // 1. Grouping
    const groups = {};
    activities.forEach(a => {
        if (!groups[a.sector]) groups[a.sector] = {};
        if (!groups[a.sector][a.general]) groups[a.sector][a.general] = new Set();
        // Deduplicate specifics using Set
        groups[a.sector][a.general].add(a.specific);
    });

    // 2. Sorting Steps
    const sortedSectors = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    return (
        <details open className={`group rounded-lg border border-gray-200 overflow-hidden mb-3 ${bgClass}`}>
            <summary className={`flex items-center justify-between px-3 py-2.5 cursor-pointer ${headerClass} hover:opacity-90 transition-opacity`}>
                <div className="flex items-center gap-2 font-bold text-xs">
                    {icon}
                    <span>
                        {title}{' '}
                        <span className="text-[10px] font-normal opacity-80">
                            ({activities.length})
                        </span>
                    </span>
                </div>
                {Icons.ChevronDown && <Icons.ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />}
            </summary>

            {/* Mobile Scroll Limit: max-h-[45vh] on mobile only. MD: no limit */}
            <div className="px-3 py-2 bg-white border-t border-gray-100 space-y-3 overflow-y-auto custom-scrollbar max-h-[45vh] md:max-h-none">
                {sortedSectors.map((sector, i) => {
                    const generalsMap = groups[sector];
                    const sortedGenerals = Object.keys(generalsMap).sort((a, b) => a.localeCompare(b));
                    const st = getSectorStyle ? getSectorStyle(sector) : { border: '#ccc', text: '#333' };

                    return (
                        <div key={i} className="mb-2 rounded overflow-hidden border border-gray-100">
                            <div
                                className="px-3 py-1.5 font-bold text-[10px] uppercase tracking-wide bg-gray-50 border-b border-gray-100 text-gray-500"
                            >
                                {sector}
                            </div>

                            <div className="bg-white">
                                {sortedGenerals.map((gen, j) => {
                                    const specificSet = generalsMap[gen];
                                    const specificList = Array.from(specificSet).sort((a, b) => a.localeCompare(b));

                                    return (
                                        <details key={j} className="group/inner border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                            <summary className="px-3 py-2 text-[11px] font-medium text-gray-700 cursor-pointer flex justify-between select-none items-start gap-2">
                                                <div className="flex items-start gap-2">
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                                        style={{ backgroundColor: accentColor || st.border }}
                                                    />
                                                    <span className="leading-snug">{gen}</span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                                    <span className="text-[11px] text-gray-600 bg-gray-100 px-1.5 rounded-full">
                                                        {specificList.length}
                                                    </span>
                                                    {Icons.ChevronDown && <Icons.ChevronDown className="h-3 w-3 text-gray-600 group-open/inner:rotate-180 transition-transform" />}
                                                </div>
                                            </summary>

                                            <ul className="bg-gray-50/30 px-4 py-2 space-y-1.5">
                                                {specificList.map((spec, k) => (
                                                    <li
                                                        key={k}
                                                        className="text-[11px] text-gray-600 pl-3 relative border-l-2 border-gray-200 leading-snug"
                                                    >
                                                        {spec}
                                                    </li>
                                                ))}
                                            </ul>
                                        </details>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </details>
    );
};

export default memo(GroupedActivities);
