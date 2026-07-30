import { memo } from 'react';
import Icons from '../../ui/Icons';
import Tooltip from '../../ui/Tooltip';
import { isConservationSoil, isUrbanSoil, hasSpecificPDU } from '../../../utils/domain/zoningRules';
const NormativeInstrumentContainer = ({ children }) => (
    <div className="bg-gray-50/50 rounded-lg p-3 mb-4 border border-gray-100/50">
        <div className="flex items-start gap-3 opacity-80 hover:opacity-100 transition-opacity">
            <div className="shrink-0 mt-0.5 text-gray-600">
                {Icons.BookOpen ? <Icons.BookOpen className="h-4 w-4" /> : <span>📖</span>}
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    </div>
);

const NormativeInstrumentCard = ({ analysis }) => {
    // Rules 
    const isSC = isConservationSoil(analysis);
    const isUrban = isUrbanSoil(analysis);
    const hasPDU = hasSpecificPDU(analysis);

    if (!isSC && !isUrban) return null;

    /* Component extracted to module scope */

    if (isSC) {
        return (
            <NormativeInstrumentContainer>
                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-0.5">
                    Fuente Normativa
                </div>
                <div className="text-xs font-semibold text-gray-700 mb-1">
                    PGOEDF (Ordenamiento Ecológico)
                </div>
                <Tooltip content="Consultar documento oficial">
                    <a
                        href="https://paot.org.mx/centro/programas/pgoedf.pdf"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 hover:underline"
                    >
                        Ver documento oficial
                        {Icons.ExternalLink && <Icons.ExternalLink className="h-2.5 w-2.5" />}
                    </a>
                </Tooltip>
            </NormativeInstrumentContainer>
        );
    }

    if (isUrban) {
        return (
            <NormativeInstrumentContainer>
                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-0.5">
                    Fuente Normativa
                </div>
                <div className="text-xs font-semibold text-gray-700 mb-1">
                    {hasPDU ? 'Programa Parcial (PPDU)' : 'Programa Delegacional (PDDU)'}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Tooltip content="Ir a sitio de SEDUVI - Delegacionales">
                        <a
                            href="https://metropolis.cdmx.gob.mx/programas-delegacionales-de-desarrollo-urbano"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 hover:underline"
                        >
                            Programas Delegacionales
                            {Icons.ExternalLink && <Icons.ExternalLink className="h-2.5 w-2.5" />}
                        </a>
                    </Tooltip>
                    <Tooltip content="Ir a sitio de SEDUVI - Parciales">
                        <a
                            href="https://metropolis.cdmx.gob.mx/programas-parciales-de-desarrollo-urbano"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 hover:underline"
                        >
                            Programas Parciales
                            {Icons.ExternalLink && <Icons.ExternalLink className="h-2.5 w-2.5" />}
                        </a>
                    </Tooltip>
                </div>
            </NormativeInstrumentContainer>
        );
    }

    return null;
};

export default memo(NormativeInstrumentCard);
