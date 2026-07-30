import { useState } from 'react';
import { InView } from 'react-intersection-observer';
import StickyBox from 'react-sticky-box';

import Icons from '../ui/Icons';
import Tooltip from '../ui/Tooltip';
import { CONSTANTS } from '../../utils/constants';
import { getZoningDisplay } from '../../utils/analysisUtils';
import {
    isANP,
    hasZoningData,
    isUrbanSoil,
    isOutsideCDMX,
    isConservationSoil,
    shouldShowActivitiesCatalog
} from '../../utils/domain/zoningRules';

// UI
import InlineAlert from './ui/InlineAlert';
import PrimaryActionHeader from './ui/PrimaryActionHeader';
import ExportProgressOverlay from './ui/ExportProgressOverlay';
import ErrorBoundary from '../ui/ErrorBoundary';

// Cards
import LocationSummary from './cards/LocationSummary';
import CitizenSummaryCard from './cards/CitizenSummaryCard';
import NormativeInstrumentCard from './cards/NormativeInstrumentCard';
import ZoningResultCard from './cards/ZoningResultCard';
import { AnpGeneralCard, AnpInternalCard } from './cards/AnpCards';
import LegalDisclaimer from './cards/LegalDisclaimer';

// Controllers
import ActivityCatalogController from './controllers/ActivityCatalogController';


const ResultsContent = ({ analysis, approximateAddress, onExportPDF, isExporting, exportProgress }) => {
    const [showNotes, setShowNotes] = useState(false);
    const [, setActiveSection] = useState('Resumen');

    // CONSTANTS & COLORS still needed for passing down or internal logic
    const COLORS = CONSTANTS.COLORS || {};

    if (!analysis) return null;

    // Derived Logic using Rules
    const zoningDisplay = getZoningDisplay(analysis);
    const isAnpResult = isANP(analysis);
    const hasData = hasZoningData(analysis);
    const showCatalog = shouldShowActivitiesCatalog(analysis);
    const isSC = isConservationSoil(analysis);
    const isUrban = isUrbanSoil(analysis);
    const isOutside = isOutsideCDMX(analysis);

    return (
        <div className="space-y-3 animate-in pb-4">

            {/* 1. Location and basic context */}
            <InView as="div" onChange={(inView) => inView && setActiveSection('Resumen Contextual')} threshold={0.5}>
                <LocationSummary
                    analysis={analysis}
                    approximateAddress={approximateAddress}
                    onExportPDF={onExportPDF}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                />
            </InView>

            {/* 1.A Primary Actions (Desktop Static) */}
            <div className="hidden md:block z-20">
                <StickyBox offsetTop={45} offsetBottom={20}>
                    <PrimaryActionHeader
                        analysis={analysis}
                        approximateAddress={approximateAddress}
                        onExportPDF={onExportPDF}
                        isExporting={isExporting}
                        exportProgress={exportProgress}
                    />
                </StickyBox>
            </div>

            {/* NEW: Full Screen Overlay for PDF Generation */}
            <ExportProgressOverlay isExporting={isExporting} progress={exportProgress} />

            {/* 1.B Citizen Summary (Rule Based) */}
            <CitizenSummaryCard analysis={analysis} />

            {/* 2. Unified Critical Alerts */}

            {!hasData && !isUrban && !isOutside && (
                <InlineAlert tone="nodata">
                    <strong>Sin Información:</strong> No se encontraron datos de zonificación para esta ubicación.
                </InlineAlert>
            )}

            {isAnpResult && (
                <InlineAlert tone="anp">
                    <strong>Área Natural Protegida:</strong> Este punto se encuentra dentro de un ANP y se rige por su Programa de Manejo.
                </InlineAlert>
            )}

            {/* 3. Instrumento Rector */}
            <NormativeInstrumentCard analysis={analysis} />

            {/* 4. Zonificación PGOEDF (Solo SC) */}
            <ZoningResultCard analysis={analysis} zoningDisplay={zoningDisplay} />

            {/* 5. ANP Details (Si aplica) */}
            <AnpGeneralCard analysis={analysis} />
            <AnpInternalCard analysis={analysis} />

            {/* 6. Catálogo de Actividades (Solo SC, no PDU) - REFACTORED */}

            {/* Error State for Catalog */}
            {analysis?.zoningCatalogError && (
                <div className="mt-6 mb-6">
                    <InlineAlert tone="error">
                        <strong>Error en Catálogo:</strong> {analysis.zoningCatalogError}
                    </InlineAlert>
                </div>
            )}

            {showCatalog && (
                <InView as="div" onChange={(inView) => inView && setActiveSection('Catálogo de Actividades')} threshold={0.2} rootMargin="-20% 0px -50% 0px">
                    <ErrorBoundary variant="section">
                        <ActivityCatalogController analysis={analysis} Icons={Icons} COLORS={COLORS} />
                    </ErrorBoundary>
                </InView>
            )}

            {/* 7. Notas Normativas, Instrumentos, Disclaimers (Soporte) */}
            <InView as="div" onChange={(inView) => inView && setActiveSection('Soporte Normativo')} threshold={0.3}>
                {/* 7. NOTAS moved here logic wise for grouping */}
                {isSC && hasData && !isAnpResult && (
                    <div className="mt-4 mb-4 border border-gray-100 rounded-lg overflow-hidden">
                        <Tooltip content="Ver detalles y excepciones normativas">
                            <button
                                type="button"
                                aria-expanded={showNotes}
                                aria-controls="notes-panel"
                                onClick={() => setShowNotes(!showNotes)}
                                className="w-full flex items-center gap-2 p-3 bg-white hover:bg-gray-50 transition-colors text-left group focus:outline-none focus:bg-gray-50"
                            >
                                <div className="p-1 bg-gray-100 rounded text-gray-500 group-hover:text-gray-700 transition-colors">
                                    {showNotes ? (Icons.ChevronUp ? <Icons.ChevronUp className="h-3 w-3" /> : <span>-</span>) : (Icons.ChevronDown ? <Icons.ChevronDown className="h-3 w-3" /> : <span>+</span>)}
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide group-hover:text-gray-700">
                                    Notas Normativas y Criterios
                                </span>
                            </button>
                        </Tooltip>

                        <div
                            id="notes-panel"
                            hidden={!showNotes}
                            className={`bg-gray-50/50 border-t border-gray-100 ${showNotes ? 'block animate-in slide-in-from-top-1 fade-in' : 'hidden'}`}
                        >
                            <div className="p-3 pl-4 prose prose-sm max-w-none">
                                <ul className="space-y-2">
                                    {[
                                        "Adicionalmente a lo dispuesto en la tabla de usos del suelo, para cualquier obra o actividad que se pretenda desarrollar se deberán contemplar los criterios y lineamientos señalados en el programa de Ordenamiento Ecológico, así como cumplir con los permisos y autorizaciones en materia ambiental del Distrito Federal.",
                                        "Los usos del suelo no identificados en esta tabla deberán cumplir con los permisos y autorizaciones en materia urbana y ambiental aplicables en Suelo de Conservación.",
                                        "En las Areas Naturales Protegidas ANP regirá la zonificación especificada en su respectivo Programa de Manejo.",
                                        "La zonificación denominada PDU corresponde a las áreas normadas por los Programas Delegacionales o Parciales de Desarrollo Urbano vigentes.",
                                        "Las disposiciones de la presente regulación no prejuzgan sobre la propiedad de la tierra.",
                                        "El Suelo de Conservación definido por las barrancas estará regulado por la zonificación Forestal de Conservación FC, conforme al límites establecidos por la Norma de Ordenación N° 21, señalada en los Programas de Desarrollo Urbano.",
                                        "* Se instrumentará un programa de reconversión de esta actividad por la producción de composta. Para ello, se elaborará un padrón de los productores y diseñar y ejecutar un programa de capacitación y proponer paquetes tecnológicos para transferencia y el desarrollo de estudios de mercado para la sustitución progresiva del producto y la reducción de la extracción directa."
                                    ].map((note, idx) => (
                                        <li key={idx} className="text-[10px] text-gray-500 leading-relaxed text-justify relative pl-3">
                                            <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-gray-300"></span>
                                            {note}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* 9. Disclaimer */}
                <LegalDisclaimer />
            </InView>
        </div>
    );
};

export default ResultsContent;
