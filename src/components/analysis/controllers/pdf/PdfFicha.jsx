import React from 'react';
import { CONSTANTS } from '../../../../utils/constants';
import { getZoningColor, formatDateTime, generateFolio } from '../../../../utils/geoUtils';
import { T, S, C, styleH2, PdfBox, tblC, thC, tdC } from './pdfTheme';
import { QrCodeImg } from './QrCodeImg';

const PdfFicha = React.forwardRef(({ analysis, mapImage, includeActivities = true, approximateAddress }, ref) => {
    if (!analysis) return null;

    const { COLORS, ZONING_CAT_INFO } = CONSTANTS;

    const fecha = formatDateTime(analysis.timestamp || new Date());
    // Folio includes seconds now (14 chars: YYYYMMDDHHmmss)
    const folio = generateFolio ? generateFolio() : `F-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;

    const isUrban = analysis.status === 'URBAN_SOIL';
    const isSC = analysis.status === 'CONSERVATION_SOIL';
    const isOutside = analysis.status === 'OUTSIDE_CDMX';
    const outsideContextName = analysis.outsideContext || null;
    const isANP = analysis.isANP || analysis.zoningKey === 'ANP';

    const statusLabel =
        isSC ? 'Suelo de Conservación' :
            isUrban ? 'Suelo Urbano' :
                isOutside ? 'Fuera de la Ciudad de México' :
                    'Información no disponible';

    const direccion =
        approximateAddress ||
        analysis.address ||
        analysis.placeName ||
        analysis.label ||
        'Sin dirección disponible (consulta por coordenadas).';

    const coordText = `${analysis.coordinate.lat.toFixed(5)}, ${analysis.coordinate.lng.toFixed(5)}`;
    const visorUrl = `${window.location.origin}${window.location.pathname}?lat=${analysis.coordinate.lat}&lng=${analysis.coordinate.lng}&open=1`;

    const detalleProhibidas = analysis.prohibitedActivities || [];
    const detallePermitidas = analysis.allowedActivities || [];

    // Zoning Logic
    let zoningColor = '#6b7280';
    if (isANP) {
        zoningColor = COLORS?.anp || '#9d2148';
    } else if (analysis.zoningKey === 'NODATA') {
        zoningColor = '#9ca3af';
    } else if (analysis.zoningKey && getZoningColor) {
        zoningColor = getZoningColor(analysis.zoningKey);
    }

    // Resolve Friendly Name using Map if available, else fallback to zoningName
    let friendlyName = analysis.zoningName || 'Sin información';
    if (ZONING_CAT_INFO && analysis.zoningKey && ZONING_CAT_INFO[analysis.zoningKey]?.label) {
        friendlyName = ZONING_CAT_INFO[analysis.zoningKey].label;
    }

    const zoningDisplay = isANP ? 'ÁREA NATURAL PROTEGIDA' :
        analysis.zoningKey === 'NODATA' ? 'Información no disponible' :
            friendlyName;

    /* Styles moved to module scope */

    // --- CITIZEN SUMMARY LOGIC ---
    const getExplanation = () => {
        const { status, zoningKey, isANP, alcaldia } = analysis;
        if (status === 'OUTSIDE_CDMX') {
            const estado = analysis.outsideContext || 'otro estado';
            return `La ubicación consultada se localiza en el ${estado}. Las regulaciones de la Ciudad de México no aplican en este territorio. La determinación normativa corresponde a las autoridades locales del ${estado}.`;
        }
        if (status === 'URBAN_SOIL') {
            if (isANP) return `Aunque es zona urbana, este punto está dentro de una Área Natural Protegida. Esto significa que la prioridad es el medio ambiente y aplican reglas especiales de conservación por encima de las normas urbanas comunes.`;
            return `Te encuentras en Suelo Urbano. Aquí predominan las actividades residenciales, comerciales y de servicios. Las reglas de construcción dependen de la SEDUVI y del Plan de Desarrollo Urbano de ${alcaldia || 'la alcaldía'}.`;
        }
        if (status === 'CONSERVATION_SOIL') {
            if (isANP) return `¡Estás en una zona muy importante! Este punto es parte de una Área Natural Protegida (ANP). Su objetivo principal es preservar la biodiversidad. Aquí las construcciones están muy restringidas y se sigue un Plan de Manejo específico.`;
            switch (zoningKey) {
                case 'RE': return `Estás en una zona de Rescate Ecológico. Estas áreas han sido afectadas por actividades humanas pero buscamos restaurarlas. La prioridad es reforestar y evitar que la mancha urbana crezca más.`;
                case 'FC': case 'FCE': case 'FP': case 'FPE': return `Estás en una zona Forestal. Es el pulmón de la ciudad. Aquí la prioridad absoluta es mantener el bosque sano. Prácticamente no se permite construir viviendas ni comercios para proteger el agua y el aire de todos.`;
                case 'PR': case 'PRA': return `Estás en una zona de Producción Rural. Aquí se fomenta la agricultura y la agroindustria tradicional. Se permiten actividades del campo, pero no fraccionamientos residenciales urbanos.`;
                case 'AE': case 'AEE': case 'AF': case 'AFE': return `Estás en una zona Agroecológica. Se busca un equilibrio entre la agricultura tradicional y el cuidado de la naturaleza. Puedes cultivar la tierra, siempre y cuando uses técnicas amigables con el medio ambiente.`;
                case 'PDU_ER': return `Estás en una zona de Equipamiento Rural. Aquí se permiten instalaciones necesarias para la comunidad rural, como escuelas, centros de salud o deportivos, siempre bajo reglas estrictas.`;
                case 'PDU_PR': return `Estás en un Poblado Rural. Es una comunidad histórica dentro del suelo de conservación. Tienen reglas especiales que permiten vivienda y comercio local, pero siempre limitando el crecimiento hacia el bosque.`;
                default: return `Te encuentras en Suelo de Conservación. Es la reserva ecológica de la ciudad (bosques, humedales, zonas agrícolas). Aquí no aplican las normas urbanas comunes y el objetivo es evitar la urbanización para proteger los servicios ambientales.`;
            }
        }
        return null;
    };
    const summaryText = getExplanation();

    return (
        <div
            ref={ref}
            style={{
                width: `${S.pageW}px`,
                minHeight: '1080px', // A4 Height Context
                padding: `40px 50px`, // Extended margins
                fontFamily: T.font,
                fontSize: `${T.base}px`,
                lineHeight: T.lh,
                color: C.ink,
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between', // Footer push
                boxSizing: 'border-box'
            }}
        >
            <div>
                {/* --- HEADER --- */}
                <div id="pdf-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '35px', borderBottom: `2px solid ${C.dorado}`, paddingBottom: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <img src={`${import.meta.env.BASE_URL}assets/logo-sedema.png`} alt="SEDEMA" style={{ height: '65px', objectFit: 'contain', display: 'block', marginBottom: '10px' }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: C.guinda, textTransform: 'uppercase', lineHeight: 1 }}>
                            Ficha Informativa
                        </div>
                        <div style={{ fontSize: '12px', color: C.sub, marginTop: '4px', fontStyle: 'italic', marginBottom: '8px' }}>
                            Consulta Ciudadana de Zonificación
                        </div>
                        <div style={{ fontSize: '10px', color: C.ink, lineHeight: 1.4 }}>
                            <div style={{ marginBottom: '2px' }}><strong>Folio:</strong> <span style={{ fontFamily: T.mono }}>{folio}</span></div>
                            <div><strong>Fecha:</strong> {fecha}</div>
                        </div>
                    </div>
                </div>

                {/* --- SECTION 1: UBICACIÓN --- */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={styleH2}>Ubicación del Punto</div>
                    <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                        <div style={{ flex: '1' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                <tbody>
                                    {/* Row 1: Entidad & Coordenadas */}
                                    <tr>
                                        <td style={{ verticalAlign: 'top', width: '50%', paddingRight: '15px', paddingBottom: '10px' }}>
                                            <PdfBox title="Entidad Federativa">
                                                {isOutside ? (outsideContextName || 'Otro Estado') : 'Ciudad de México'}
                                            </PdfBox>
                                        </td>
                                        <td style={{ verticalAlign: 'top', width: '50%', paddingBottom: '10px' }}>
                                            <PdfBox title="Coordenadas Geográficas">
                                                <span style={{ fontFamily: T.mono, fontSize: '11px', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                                                    {coordText}
                                                </span>
                                            </PdfBox>
                                        </td>
                                    </tr>

                                    {/* Row 2: Alcaldia (Conditional) */}
                                    {!isOutside && (
                                        <tr>
                                            <td style={{ verticalAlign: 'top', paddingRight: '15px', paddingBottom: '10px' }}>
                                                <PdfBox title="Alcaldía">{analysis.alcaldia || 'N/D'}</PdfBox>
                                            </td>
                                            <td style={{ verticalAlign: 'top', paddingBottom: '10px' }}></td>
                                        </tr>
                                    )}

                                    {/* Row 3: Direccion (Full width) */}
                                    <tr>
                                        <td colSpan="2" style={{ verticalAlign: 'top', paddingBottom: '10px' }}>
                                            <PdfBox title="Dirección Aproximada / Lugar">{direccion}</PdfBox>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        {/* --- MAP --- */}
                        <div style={{ flex: '0 0 320px' }}>
                            <div style={{
                                border: `1px solid ${C.hair}`,
                                height: '200px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                position: 'relative',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                {mapImage ? (
                                    <img src={mapImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Mapa" />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.sub, fontSize: '11px', flexDirection: 'column', gap: '5px' }}>
                                        <div className="animate-pulse bg-gray-200 w-full h-full"></div>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '9px', color: C.sub, textAlign: 'center', fontStyle: 'italic' }}>
                                * Ubicación referencial
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- SECTION 2: NORMATIVIDAD --- */}
                <div style={{ marginBottom: `${S.gap3}px` }}>
                    <div style={styleH2}>Normatividad Aplicable</div>

                    {isOutside ? (
                        <div style={{ background: '#FFF5F5', padding: '20px', borderRadius: '6px', border: `1px solid ${C.red}`, textAlign: 'center' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: C.red, marginBottom: '10px', textTransform: 'uppercase' }}>
                                Fuera de Jurisdicción de la CDMX
                            </div>
                            <div style={{ fontSize: '11px', color: C.ink, lineHeight: 1.5, maxWidth: '600px', margin: '0 auto' }}>
                                El punto consultado no se encuentra dentro del territorio de la Ciudad de México.
                                La Secretaría del Medio Ambiente de la CDMX no tiene atribuciones para determinar la normatividad urbana o ambiental en esta ubicación.
                                <br /><br />
                                Le sugerimos consultar a las autoridades estatales o municipales correspondientes de <strong>{outsideContextName || 'la entidad federativa respectiva'}</strong>.
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                            {/* COL 1: SUELO */}
                            <div style={{ background: C.panel, padding: '16px', borderRadius: '6px', border: `1px solid ${C.hair}` }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: C.sub, textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Clasificación de Suelo</div>
                                <div style={{ fontSize: '15px', fontWeight: 800, color: isSC ? C.sc : isUrban ? C.su : C.red, lineHeight: 1.3 }}>
                                    {statusLabel}
                                </div>
                                {isSC && (
                                    <div style={{ fontSize: '10px', color: C.green, marginTop: '6px', fontStyle: 'italic' }}>
                                        Regulado por el PGOEDF 2000
                                    </div>
                                )}
                            </div>

                            {/* COL 2: ZONIFICACION / ANP */}
                            {/* COL 2: ZONIFICACION / ANP (STACKED IF BOTH EXIST) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                                {/* 1. ZONIFICATION SPECIFIC (Show if exists and is NOT just the ANP fallback) */}
                                {analysis.zoningKey && analysis.zoningKey !== 'ANP' && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '12px', height: '12px', background: zoningColor, border: '1px solid #999', flexShrink: 0 }}></div>
                                            <div style={{ fontSize: '12px', fontWeight: 800, color: C.ink, lineHeight: 1.2 }}>
                                                {zoningDisplay}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 2. REGIMEN ANP */}
                                {isANP && (
                                    <div style={{ background: '#FAF5FF', padding: '12px', borderRadius: '4px', border: `1px solid #7E22CE` }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#7E22CE', textTransform: 'uppercase', marginBottom: '8px', borderBottom: `1px solid #E9D5FF`, paddingBottom: '4px' }}>Régimen ANP</div>

                                        <div style={{ marginBottom: '6px' }}>
                                            <div style={{ fontSize: '9px', fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Nombre Oficial</div>
                                            <div style={{ fontSize: '11px', fontWeight: 800, color: C.ink }}>{analysis.anpNombre || analysis.zoningName || 'Área Natural Protegida'}</div>
                                        </div>

                                        <div style={{ marginBottom: '6px' }}>
                                            <div style={{ fontSize: '9px', fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Categoría</div>
                                            <div style={{ fontSize: '10px', color: C.ink }}>{analysis.anpCategoria || 'No disponible'}</div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '8px' }}>
                                            <div>
                                                <div style={{ fontSize: '8px', fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Decreto</div>
                                                <div style={{ fontSize: '10px', color: C.ink }}>{analysis.anpTipoDecreto || 'N/D'}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '8px', fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Fecha</div>
                                                <div style={{ fontSize: '10px', color: C.ink }}>{analysis.anpFechaDecreto || 'N/D'}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '8px', fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Superficie</div>
                                                <div style={{ fontSize: '10px', color: C.ink }}>{analysis.anpSupDecretada ? `${analysis.anpSupDecretada} ha` : 'N/D'}</div>
                                            </div>
                                        </div>

                                        {/* MANAGEMENT PROGRAM LINK */}
                                        <div style={{ marginTop: '8px', borderTop: '1px solid #E9D5FF', paddingTop: '6px' }}>
                                            <div style={{ fontSize: '8px', fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Programa de Manejo</div>
                                            <div style={{ fontSize: '9px', color: '#2563EB', wordBreak: 'break-all' }}>
                                                {analysis.anpUrl ? analysis.anpUrl : 'Consulte en: sedema.cdmx.gob.mx/programas'}
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '10px', color: '#7E22CE', fontStyle: 'italic', lineHeight: 1.3, fontWeight: 500 }}>
                                            Área Natural Protegida: Este punto se encuentra dentro de un ANP y se rige por su Programa de Manejo.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- RESUMEN NORMATIVO (CITIZEN SUMMARY) --- */}
                    {summaryText && !isOutside && (
                        <div style={{
                            marginBottom: '15px',
                            background: isOutside ? 'linear-gradient(to bottom right, #fef2f2, #ffffff)' : 'linear-gradient(to bottom right, #eff6ff, #ffffff)',
                            padding: '16px',
                            borderRadius: '8px',
                            border: isOutside ? '1px solid #fca5a5' : '1px solid #bfdbfe',
                            display: 'flex',
                            gap: '12px'
                        }}>
                            <div style={{
                                flexShrink: 0,
                                width: '24px',
                                height: '24px',
                                background: isOutside ? '#fee2e2' : '#dbeafe',
                                borderRadius: '50%',
                                color: isOutside ? '#b91c1c' : '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: 'serif',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                lineHeight: 1
                            }}>
                                {isOutside ? '!' : 'i'}
                            </div>
                            <div>
                                {!isOutside && (
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        Resumen Normativo
                                    </div>
                                )}
                                <div style={{ fontSize: '12px', color: isOutside ? '#991b1b' : '#1e3a8a', lineHeight: 1.5, fontWeight: 500 }}>
                                    {summaryText}
                                </div>
                            </div>
                        </div>
                    )}



                    {/* --- INSTRUMENTO RECTOR (Urban Only) --- */}
                    {!isOutside && isUrban && !isANP && !isSC && (
                        <div style={{ marginTop: '15px', background: C.panel, padding: '16px', borderRadius: '6px', border: `1px solid ${C.hair}` }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: C.sub, textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Instrumento Rector</div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: C.ink, marginBottom: '6px' }}>
                                Programa Delegacional de Desarrollo Urbano
                            </div>
                            <div style={{ fontSize: '10px', color: C.ink, marginBottom: '10px', lineHeight: 1.4 }}>
                                Instrumento de planeación urbana que establece los usos, reservas y destinos del suelo.
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ fontSize: '10px', color: C.su, fontWeight: 700, textDecoration: 'underline' }}>
                                    Ver Programas Delegacionales
                                </div>
                                <div style={{ fontSize: '10px', color: C.su, fontWeight: 700, textDecoration: 'underline' }}>
                                    Ver Programas Parciales (Zonas Especiales)
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ANP INTERNA */}
                    {analysis.hasInternalAnpZoning && analysis.anpInternalFeature && (
                        <div style={{ marginTop: '10px', padding: '10px', border: `1px solid #7E22CE`, background: '#FAF5FF', borderRadius: '4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#7E22CE', textTransform: 'uppercase', marginBottom: '4px' }}>Zonificación Interna ANP</div>
                            <div style={{ fontSize: '9px', color: C.sub, textTransform: 'uppercase' }}>Zonificación Programa de Manejo</div>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: C.heading, marginBottom: '6px' }}>
                                {analysis.anpInternalFeature.properties?.ZONIFICACION || analysis.anpInternalFeature.properties?.CATEGORIA_PROTECCION || 'Zonificación Específica'}
                            </div>
                            <div style={{ fontSize: '10px', color: '#7E22CE', fontStyle: 'italic', fontWeight: 500 }}>
                                Área Natural Protegida: Este punto se encuentra dentro de un ANP y se rige por su Programa de Manejo.
                            </div>
                        </div>
                    )}
                </div>

                {/* --- SECTION 3: ACTIVIDADES (Solo SC) --- */}
                {/* CONDITIONAL RENDER: Only if includeActivities is TRUE */}
                {includeActivities && isSC && !isANP && !analysis.isPDU && !analysis.noActivitiesCatalog && (
                    <div>
                        <div style={styleH2}>Catálogo de Actividades (Suelo de Conservación)</div>

                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: C.green, marginBottom: '6px', textTransform: 'uppercase' }}>Permitidas</div>
                            {detallePermitidas.length === 0 ? (
                                <div style={{ fontSize: '10px', fontStyle: 'italic', color: C.sub }}>Sin actividades permitidas específicas listadas.</div>
                            ) : (
                                <table style={tblC}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...thC, color: C.green, borderBottomColor: C.green }}>Actividad</th>
                                            <th style={{ ...thC, color: C.green, borderBottomColor: C.green }}>Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detallePermitidas.map((a, i) => (
                                            <tr key={i}>
                                                <td style={tdC(i)} width="40%"><strong>{a.general}</strong></td>
                                                <td style={tdC(i)}>{a.specific}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: C.red, marginBottom: '6px', textTransform: 'uppercase' }}>Prohibidas</div>
                            {detalleProhibidas.length === 0 ? (
                                <div style={{ fontSize: '10px', fontStyle: 'italic', color: C.sub }}>Sin actividades prohibidas específicas listadas.</div>
                            ) : (
                                <table style={tblC}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...thC, color: C.red, borderBottomColor: C.red }}>Actividad</th>
                                            <th style={{ ...thC, color: C.red, borderBottomColor: C.red }}>Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detalleProhibidas.map((a, i) => (
                                            <tr key={i}>
                                                <td style={tdC(i)} width="40%"><strong>{a.general}</strong></td>
                                                <td style={tdC(i)}>{a.specific}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* --- FOOTER --- */}
                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: `1px solid ${C.dorado}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                        <div style={{ flex: '1' }}>
                            <div style={{ fontSize: '9px', color: C.sub, textAlign: 'justify', lineHeight: 1.4, marginBottom: '5px' }}>
                                <strong>Aviso Importante:</strong> Este documento es de carácter informativo y orientativo. No constituye un dictamen legal ni sustituye a los Certificados de Zonificación de Uso del Suelo o Trámites oficiales ante la SEDEMA o SEDUVI. La información presentada se basa en las capas geográficas vigentes en el Visor Ciudadano.
                            </div>
                            <div style={{ fontSize: '9px', color: C.sub }}>
                                Para trámites oficiales, acuda a la Ventanilla Única de la SEDEMA.
                            </div>
                        </div>
                        <div style={{ width: '120px', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: C.ink }}>
                                Escanear para validar &rarr;
                            </div>
                            <QrCodeImg value={visorUrl} size={60} />
                        </div>
                    </div>
                </div>

            </div>
        </div >
    );
});

PdfFicha.displayName = 'PdfFicha';

export default PdfFicha;
