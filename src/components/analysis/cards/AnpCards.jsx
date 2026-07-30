/* React removed */
import Icons from '../../ui/Icons';

export const AnpGeneralCard = ({ analysis }) => {
    if (!analysis || !analysis.isANP) return null;
    const { anpNombre, anpCategoria, anpTipoDecreto, anpFechaDecreto, anpSupDecretada } = analysis;

    return (
        <div className="bg-purple-50 rounded-lg p-3 mb-3 animate-slide-up border border-purple-100">
            <div className="flex items-center gap-2 text-purple-800 font-bold text-xs uppercase mb-2 border-b border-purple-200 pb-1">
                {Icons.Leaf && <Icons.Leaf className="h-3 w-3" />}
                <span>Régimen ANP</span>
            </div>

            <div className="space-y-3 text-xs text-gray-700">
                <div className="grid grid-cols-1 gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Nombre Oficial</span>
                    <span className="font-semibold text-gray-900 leading-tight">{anpNombre || 'No disponible'}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5 tracking-wide">Categoría</span>
                        <span className="font-medium text-gray-900">{anpCategoria || 'N/D'}</span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5 tracking-wide">Decreto</span>
                        <span className="font-medium text-gray-900">{anpTipoDecreto || 'N/D'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5 tracking-wide">Fecha</span>
                        <span className="font-medium text-gray-900">{anpFechaDecreto || 'N/D'}</span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5 tracking-wide">Superficie</span>
                        <span className="font-medium text-gray-900">{anpSupDecretada ? `${anpSupDecretada} ha` : 'N/D'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AnpInternalCard = ({ analysis }) => {
    if (!analysis.hasInternalAnpZoning || !analysis.anpInternalFeature) return null;
    const data = analysis.anpInternalFeature.properties || {};
    const zonificacion = data.ZONIFICACION || data.CATEGORIA_PROTECCION || analysis.anpCategoria || 'N/A';

    return (
        <div className="bg-purple-50 rounded-lg p-3 mb-3 animate-slide-up border border-purple-100">
            <div className="flex items-center gap-2 text-purple-800 font-bold text-xs uppercase mb-2 border-b border-purple-200 pb-1">
                {Icons.Verified && <Icons.Verified className="h-3 w-3" />}
                <span>Zonificación Interna ANP</span>
            </div>

            <div className="space-y-1 text-xs text-gray-700">
                <span className="text-[10px] uppercase font-bold text-gray-500 block tracking-wide">Zonificación Programa de Manejo</span>
                <span className="font-bold text-base text-gray-900 block leading-tight">{zonificacion || 'N/A'}</span>
            </div>
        </div>
    );
};
