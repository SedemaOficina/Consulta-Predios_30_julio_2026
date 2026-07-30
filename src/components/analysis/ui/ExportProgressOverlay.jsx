/* React removed */

const ExportProgressOverlay = ({ isExporting, progress }) => {
    if (!isExporting) return null;

    return (
        <div
            className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 max-w-xs w-full mx-4 animate-in zoom-in-95 duration-200">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-gray-100 rounded-full"></div>
                    <div className="absolute inset-0 w-12 h-12 border-4 border-guinda border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-guinda">
                        {progress || 0}%
                    </div>
                </div>
                <div className="text-center">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Generando PDF</h3>
                    <p className="text-xs text-gray-500">Por favor espere un momento...</p>
                </div>
            </div>
        </div>
    );
};

export default ExportProgressOverlay;
