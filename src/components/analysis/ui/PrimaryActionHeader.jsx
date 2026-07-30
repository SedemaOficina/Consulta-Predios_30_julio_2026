/* React removed */
import Icons from '../../ui/Icons';
import Tooltip from '../../ui/Tooltip';

// --- REFACTORED HEADER (Desktop Only) ---
const PrimaryActionHeader = ({ analysis, onExportPDF, isExporting, exportProgress }) => {
    // Visible on Desktop only.
    if (!analysis?.coordinate) return null;

    return (
        <div className="mb-4 bg-white sticky top-0 z-50 pb-3 border-b border-gray-100 md:block hidden animate-in fade-in">
            {/* Action Buttons */}
            <div className="flex gap-3">
                <Tooltip content="Ver ubicación exacta en Google Maps">
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${analysis.coordinate.lat},${analysis.coordinate.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-bold text-xs shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        {Icons.MapIcon && <Icons.MapIcon className="h-4 w-4 text-blue-500" />}
                        <span>Google Maps</span>
                    </a>
                </Tooltip>

                <Tooltip content="Generar ficha PDF con los resultados de la conuslta">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            if (!isExporting && onExportPDF) onExportPDF(e);
                        }}
                        disabled={isExporting}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-bold text-xs text-white shadow-sm transition-all active:scale-95
                        ${isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-guinda hover:bg-guinda-dark'}`}
                    >
                        {isExporting ? (
                            <div className="flex items-center gap-2">
                                {Icons.Loader2 ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : <div className="h-3 w-3 rounded-full border-2 border-white/50 border-t-white animate-spin" />}
                                <span>{exportProgress ? `${exportProgress}%` : 'Generando...'}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                {Icons.Pdf && <Icons.Pdf className="h-4 w-4" />}
                                <span>Descargar Ficha</span>
                            </div>
                        )}
                    </button>
                </Tooltip>
            </div>
        </div>
    );
};

export default PrimaryActionHeader;
