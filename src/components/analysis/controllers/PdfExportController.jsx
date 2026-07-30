import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import leafletImage from 'leaflet-image';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

import { CONSTANTS } from '../../../utils/constants';
import { getBaseLayerUrl } from '../../../utils/geoUtils';

// PDF sub-modules (split out of this controller for readability).
import PdfFicha from './pdf/PdfFicha';
import { processGroupedData } from './pdf/tableHelpers';
import { getStaticMapUrl, preloadImage } from './pdf/staticMap';


const PdfExportController = ({
    analysis,
    onExportReady,
    onProgress,
    dataCache,
    visibleMapLayers,
    activeBaseLayer,
    visibleZoningCats,
    currentZoom = 14,
    approximateAddress
}) => {
    // Direct Access to Constants (imported)
    const { ZONING_ORDER, LAYER_STYLES, ZONING_CAT_INFO } = CONSTANTS;

    const [mapImage, setMapImage] = useState(null);
    // HYBRID MODE STATE: Controls if tables are shown in DOM for capture
    const [includeActivities, setIncludeActivities] = useState(true);

    const pdfRef = useRef(null);
    const exportArmedRef = useRef(false);
    const exportMapInstance = useRef(null);

    // --- A. DIAGNOSTICS & HELPERS ---


    const waitForMapReady = (map) => {
        return new Promise((resolve) => {
            let tilesLoaded = false;
            map.on('load', () => { tilesLoaded = true; });
            if (map._loaded) tilesLoaded = true;

            // Optimized check loop
            let attempts = 0;
            const check = () => {
                attempts++;
                map.invalidateSize(true);

                // If tiles loaded, wait a brief moment for render (300ms vs 800ms)
                if (tilesLoaded) {
                    setTimeout(() => resolve(true), 300);
                    return;
                }

                // Max waits: 20 attempts * 100ms = 2000ms max
                if (attempts > 20) {
                    resolve(true); // Force proceed
                    return;
                }
                setTimeout(check, 100);
            };

            // Backup safety timer reduced from 4000ms to 2500ms
            setTimeout(() => resolve(true), 2500);
            check();
        });
    };

    const waitForImgLoaded = (container, selector) => {
        return new Promise((resolve) => {
            const img = container.querySelector(selector);
            if (!img) return resolve(true);
            if (img.complete && img.naturalHeight !== 0) return resolve(true);
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
            setTimeout(() => resolve(true), 1500);
        });
    };

    const loadLogoData = async () => {
        return new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const c = document.createElement('canvas');
                c.width = img.width;
                c.height = img.height;
                const ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(c.toDataURL('image/png'));
            };
            img.onerror = () => resolve(null);
            img.src = `${import.meta.env.BASE_URL}assets/logo-sedema.png`; // Local asset
        });
    };

    const buildExportMapImage = ({ lat, lng, zoom, analysisStatus, isANP }) => {
        return new Promise((resolve) => {
            (async () => {
                try {
                    // L and leafletImage imported

                    if (!L || typeof leafletImage !== 'function') return resolve(null);

                    const el = document.getElementById('export-map');
                    if (!el) return resolve(null);

                    if (exportMapInstance.current) {
                        try { exportMapInstance.current.remove(); } catch { /* empty */ }
                        exportMapInstance.current = null;
                    }
                    el.innerHTML = '';

                    // Create map off-screen
                    const m = L.map(el, {
                        zoomControl: false, attributionControl: false, preferCanvas: true,
                        fadeAnimation: false, zoomAnimation: false, markerZoomAnimation: false
                    }).setView([lat, lng], zoom);

                    exportMapInstance.current = m;

                    const baseLayerUrl = (typeof getBaseLayerUrl === 'function')
                        ? getBaseLayerUrl(activeBaseLayer || 'SATELLITE')
                        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

                    // Force fast loading options
                    const base = L.tileLayer(baseLayerUrl, {
                        crossOrigin: 'anonymous',
                        maxZoom: 19,
                        updateWhenIdle: false, // Load immediately
                        updateWhenZooming: false,
                        keepBuffer: 2
                    }).addTo(m);

                    const createPane = (name, zIndex) => {
                        if (!m.getPane(name)) m.createPane(name);
                        m.getPane(name).style.zIndex = zIndex;
                        return name;
                    };

                    const contextPane = createPane('contextPane', 400);
                    const overlayPane = createPane('overlayPane', 450);
                    const markerPane = createPane('markerPane', 600);

                    const addGeoJson = (fc, style, pane) => {
                        try {
                            if (!fc?.features?.length) return;
                            L.geoJSON(fc, { pane, style, interactive: false }).addTo(m);
                        } catch { /* empty */ }
                    };

                    // --- LAYERS ---
                    if (visibleMapLayers?.alcaldias && dataCache?.alcaldias) {
                        addGeoJson(dataCache.alcaldias, { color: '#ffffff', weight: 3, dashArray: '8,4', opacity: 0.9, fillOpacity: 0 }, contextPane);
                    }
                    if (visibleMapLayers?.sc && dataCache?.sc) {
                        addGeoJson(dataCache.sc, { color: LAYER_STYLES?.sc?.color || 'green', weight: 1.8, opacity: 0.9, fillColor: LAYER_STYLES?.sc?.fill, fillOpacity: 0.18 }, overlayPane);
                    }
                    if (visibleMapLayers?.anp && dataCache?.anp) {
                        addGeoJson(dataCache.anp, { color: LAYER_STYLES?.anp?.color || '#9333ea', weight: 2, opacity: 1, fillColor: LAYER_STYLES?.anp?.fill || '#9333ea', fillOpacity: 0.2 }, overlayPane);
                    }
                    if (visibleMapLayers?.zoning && dataCache?.zoning?.features?.length) {
                        const byKey = {};
                        (ZONING_ORDER || []).forEach(k => (byKey[k] = []));
                        dataCache.zoning.features.forEach(f => {
                            let k = (f.properties?.CLAVE || '').toString().trim().toUpperCase();
                            if (k === 'PDU' || k === 'PROGRAMAS' || k === 'ZONA URBANA') {
                                const desc = (f.properties?.PGOEDF || '').toLowerCase();
                                if (desc.includes('equipamiento')) k = 'PDU_ER';
                                else if (desc.includes('parcial')) k = 'PDU_PP';
                                else if (desc.includes('poblad') || desc.includes('rural') || desc.includes('habitacional')) k = 'PDU_PR';
                                else if (desc.includes('urbana') || desc.includes('urbano') || desc.includes('barrio')) k = 'PDU_ZU';
                            }
                            if (byKey[k]) byKey[k].push(f);
                        });
                        (ZONING_ORDER || []).forEach((k) => {
                            const isOn = (visibleZoningCats?.[k] !== false);
                            if (!isOn) return;
                            const feats = byKey[k];
                            if (!feats?.length) return;
                            const color = ZONING_CAT_INFO?.[k]?.color || '#9ca3af';
                            addGeoJson({ type: 'FeatureCollection', features: feats }, { color, weight: 1.5, opacity: 0.9, fillColor: color, fillOpacity: 0.2, interactive: false }, overlayPane);
                        });
                    }

                    // --- MARKER (SVG Data URI) ---
                    let bgColor = '#6b7280';
                    if (analysisStatus === 'OUTSIDE_CDMX') bgColor = '#ef4444';
                    else if (analysisStatus === 'CONSERVATION_SOIL') bgColor = LAYER_STYLES?.sc?.color || '#16a34a';
                    else if (isANP) bgColor = '#9333ea';
                    else if (analysisStatus === 'URBAN_SOIL') bgColor = '#3b82f6';

                    const svgString = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="black" flood-opacity="0.3"/>
                        </filter>
                        <circle cx="12" cy="12" r="8" fill="${bgColor}" stroke="white" stroke-width="2.5" filter="url(#shadow)"/>
                    </svg>
                `.trim();
                    const iconUrl = 'data:image/svg+xml;base64,' + btoa(svgString);
                    const icon = L.icon({ iconUrl, iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -10] });
                    L.marker([lat, lng], { icon, pane: markerPane, interactive: false }).addTo(m);

                    await waitForMapReady(m);

                    let settled = false;
                    const done = (img) => {
                        if (settled) return; settled = true;
                        if (exportMapInstance.current === m) {
                            try { m.remove(); } catch { /* empty */ }
                            exportMapInstance.current = null;
                        }
                        resolve(img || null);
                    };

                    const capture = () => {
                        try {
                            leafletImage(m, (err, canvas) => {
                                if (err || !canvas) return done(null);
                                done(canvas.toDataURL('image/png'));
                            });
                        } catch { done(null); }
                    };

                    // OPTIMIZED TIMEOUTS
                    // Reduced safety timeout from 6000ms to 3000ms
                    const safetyTimeout = setTimeout(() => { capture(); }, 3000);

                    // Reduced active wait from 1200ms to 400ms after load
                    base.on('load', () => { setTimeout(() => { clearTimeout(safetyTimeout); capture(); }, 400); });

                    // Reduced fallback from 3500ms to 2000ms
                    setTimeout(() => { if (!settled) capture(); }, 2000);

                } catch { resolve(null); }
            })();
        });
    };

    const handleExportPDF = useCallback(async () => {
        if (!exportArmedRef.current) return;
        exportArmedRef.current = false;

        // Return a promise to allow caller to await
        return new Promise((resolve, reject) => {
            (async () => {
                if (onProgress) onProgress(10); // START

                if (!analysis || !pdfRef.current) {
                    reject("No analysis available");
                    if (onProgress) onProgress(0);
                    return;
                }

                // check imports - they are imported
                if (!jsPDF || typeof html2canvas !== 'function') {
                    // Rejecting surfaces the error toast via App's handleExportClick catch.
                    reject("Libs missing");
                    return;
                }

                try {
                    // 0. Prepare Constants
                    const folio = `F-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;

                    // 1. Prepare Map Image
                    const hasActiveLayers = visibleMapLayers?.sc || (visibleMapLayers?.zoning && dataCache?.zoning) || visibleMapLayers?.anp || visibleMapLayers?.alcaldias;
                    let img = null;
                    let staticUrl = null;

                    if (!hasActiveLayers) {
                        staticUrl = getStaticMapUrl({ lat: analysis.coordinate.lat, lng: analysis.coordinate.lng, zoom: currentZoom });
                        const staticOk = await preloadImage(staticUrl);
                        if (staticOk) img = staticUrl;
                    }
                    if (!img) {
                        img = await buildExportMapImage({ lat: analysis.coordinate.lat, lng: analysis.coordinate.lng, zoom: currentZoom, analysisStatus: analysis.status, isANP: analysis.isANP });
                    }
                    if (onProgress) onProgress(40); // MAP READY
                    setMapImage(img);

                    // 2. Prepare View Mode (Hide Activities for Cover)
                    // We force exclude activities in DOM so we capture a clean single-page cover
                    setIncludeActivities(false);

                    // Wait for Render
                    await new Promise(r => setTimeout(r, 200));
                    await waitForImgLoaded(pdfRef.current, 'img[alt="Mapa"]');
                    await waitForImgLoaded(pdfRef.current, 'img[alt="QR visor"]');

                    const element = pdfRef.current;
                    const doc = new jsPDF('p', 'mm', 'a4');
                    const pdfW = doc.internal.pageSize.getWidth();
                    const pdfH = doc.internal.pageSize.getHeight();

                    const M = 15; // Global Margin
                    const hasAutoTable = !!doc.autoTable;

                    // --- HYBRID STRATEGY ---
                    if (hasAutoTable) {
                        // STEP A: Capture Cover Page (DOM -> Image)
                        const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
                        const scale = isMobile ? 1.5 : 2.0; // Reduced to prevent freeze

                        const canvas = await html2canvas(element, {
                            scale,
                            useCORS: true,
                            backgroundColor: '#ffffff',
                            logging: false,
                            onclone: (clonedDoc) => {
                                const header = clonedDoc.getElementById('pdf-header-row');
                                if (header) header.style.opacity = '0'; // Hide header in capture to start with whitespace
                            }
                        });
                        const coverImgData = canvas.toDataURL('image/jpeg', 0.8); // JPEG is faster/smaller than PNG
                        if (onProgress) onProgress(70); // COVER READY

                        // Yield to UI thread to prevent "Page Unresponsive"
                        await new Promise(r => setTimeout(r, 100));

                        // Pre-load Logo for headers
                        const logoDataUrl = await loadLogoData();
                        const headersDrawn = {};

                        // Helper for Page Header 
                        const addHeader = (pdfDoc, pageNumber) => {
                            if (headersDrawn[pageNumber]) return 15 + 35; // Already drawn

                            let y = M;
                            if (logoDataUrl) {
                                // FIX LOGO ASPECT RATIO
                                const logoProps = pdfDoc.getImageProperties(logoDataUrl);
                                const desiredW = 90; // Increased from 60 for wider logos
                                const ratio = logoProps.height / logoProps.width;
                                const desiredH = desiredW * ratio;
                                pdfDoc.addImage(logoDataUrl, 'PNG', M, y, desiredW, desiredH);
                            }
                            pdfDoc.setFontSize(14);
                            pdfDoc.setFont("helvetica", "bold");
                            pdfDoc.setTextColor(157, 36, 73); // Guinda
                            pdfDoc.text("FICHA INFORMATIVA", pdfW - M, y + 8, { align: 'right' });

                            pdfDoc.setFontSize(9);
                            pdfDoc.setFont("helvetica", "italic");
                            pdfDoc.setTextColor(100);
                            pdfDoc.text("Consulta Ciudadana de Zonificación", pdfW - M, y + 12, { align: 'right' });

                            const dateTitle = analysis.timestamp || new Date().toLocaleString();
                            pdfDoc.setFontSize(8);
                            pdfDoc.setFont("helvetica", "normal");
                            pdfDoc.setTextColor(0);
                            pdfDoc.text(`Folio: ${folio}`, pdfW - M, y + 16, { align: 'right' });
                            pdfDoc.text(`Fecha: ${dateTitle}`, pdfW - M, y + 20, { align: 'right' });

                            // Golden Line moved BELOW Page Number area (approx y+28)
                            pdfDoc.setDrawColor(212, 193, 156); // Dorado
                            pdfDoc.setLineWidth(0.5);
                            pdfDoc.line(M, y + 28, pdfW - M, y + 28);

                            headersDrawn[pageNumber] = true;
                            return y + 35; // increased top margin
                        };

                        // Add Cover with FAST compression
                        doc.addImage(coverImgData, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');

                        // DRAW HEADER ON PAGE 1 (Standardized Vector Header)
                        addHeader(doc, 1);

                        // STEP B: Append Native Table Pages (if SC)
                        const isSC = analysis.status === 'CONSERVATION_SOIL';
                        const isANP = analysis.isANP || analysis.zoningKey === 'ANP';
                        const hasActivities = isSC && !isANP && !analysis.isPDU && !analysis.noActivitiesCatalog;


                        if (hasActivities) {
                            const gap = 8;
                            const colW = (pdfW - (2 * M) - gap) / 2;

                            doc.addPage();
                            const startPage = doc.internal.getCurrentPageInfo().pageNumber;
                            // Manual header for new page
                            let startY = addHeader(doc, startPage);

                            // Data Preparation with Grouping
                            const allowed = processGroupedData(analysis.allowedActivities || []);
                            const prohibited = processGroupedData(analysis.prohibitedActivities || []);

                            // --- TABLE LEFT (Activities Allowed) ---
                            let finalPageLeft = startPage;

                            if (allowed.length > 0) {
                                doc.setFontSize(10);
                                doc.setTextColor(21, 128, 61); // Green
                                doc.setFont("helvetica", "bold");

                                doc.text("PERMITIDAS", M, startY);
                                doc.setFontSize(8);
                                doc.setTextColor(100);
                                doc.setFont("helvetica", "normal");
                                doc.text("Esta tabla detalla las actividades permitidas en la zona, conforme a la normatividad vigente.", M, startY + 4, { maxWidth: colW });

                                const tableStartY = startY + 12;

                                doc.autoTable({
                                    startY: tableStartY,
                                    head: [['Actividad', 'Detalle']],
                                    body: allowed,
                                    theme: 'plain', // Custom styling
                                    headStyles: { fillColor: [21, 128, 61], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center', valign: 'middle' },
                                    styles: { fontSize: 5, cellPadding: 1.5, overflow: 'linebreak', halign: 'left', valign: 'middle', lineColor: [230, 230, 230], lineWidth: 0.1 },
                                    alternateRowStyles: { fillColor: [248, 248, 248] }, // Zebra
                                    columnStyles: { 0: { cellWidth: 25, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
                                    tableWidth: colW,
                                    margin: { left: M, top: 45 },
                                    didDrawPage: (data) => {
                                        addHeader(doc, data.pageNumber);
                                    }
                                });
                                finalPageLeft = doc.internal.getCurrentPageInfo().pageNumber;
                            }

                            // --- TABLE RIGHT (Activities Prohibited) ---
                            // Reset cursor to start parallel render
                            doc.setPage(startPage);

                            let finalPageRight = startPage;

                            if (prohibited.length > 0) {
                                const leftM = M + colW + gap;
                                doc.setFontSize(10);
                                doc.setTextColor(185, 28, 28); // Red
                                doc.setFont("helvetica", "bold");

                                doc.text("PROHIBIDAS", leftM, startY);
                                doc.setFontSize(8);
                                doc.setTextColor(100);
                                doc.setFont("helvetica", "normal");
                                doc.text("Esta tabla detalla las actividades prohibidas.", leftM, startY + 4, { maxWidth: colW });

                                const tableStartY = startY + 12;

                                doc.autoTable({
                                    startY: tableStartY,
                                    head: [['Actividad', 'Detalle']],
                                    body: prohibited,
                                    theme: 'plain',
                                    headStyles: { fillColor: [185, 28, 28], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center', valign: 'middle' },
                                    styles: { fontSize: 5, cellPadding: 1.5, overflow: 'linebreak', halign: 'left', valign: 'middle', lineColor: [230, 230, 230], lineWidth: 0.1 },
                                    alternateRowStyles: { fillColor: [248, 248, 248] }, // Zebra
                                    columnStyles: { 0: { cellWidth: 25, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
                                    tableWidth: colW,
                                    margin: { left: leftM, top: 45 },
                                    didDrawPage: (data) => {
                                        addHeader(doc, data.pageNumber);
                                    }
                                });
                                finalPageRight = doc.internal.getCurrentPageInfo().pageNumber;
                            }

                            // Sync Doc to Content End (Max of both)
                            const maxPage = Math.max(finalPageLeft, finalPageRight);
                            doc.setPage(maxPage);
                        }

                        // --- FINAL: ADD PAGE NUMBERS TO ALL PAGES ---
                        const totalPages = doc.internal.getNumberOfPages();

                        for (let i = 1; i <= totalPages; i++) {
                            doc.setPage(i);
                            // Page Number Position
                            const footerY = 39; // y=15 + 24 = 39. Below Date (35), Above Line (43)

                            doc.setFontSize(8);
                            doc.setTextColor(100);
                            doc.setFont("helvetica", "normal");
                            doc.text(`Página ${i} de ${totalPages}`, pdfW - M, footerY, { align: 'right' });
                        }
                    } else {
                        // Fallback logic
                        doc.text("Vista simplificada", 10, 10);
                    }
                    // --- WATERMARK FUNCTION ---
                    const addWatermark = (pdfDoc, pageNum) => {
                        pdfDoc.setPage(pageNum);
                        pdfDoc.saveGraphicsState();
                        pdfDoc.setGState(new pdfDoc.GState({ opacity: 0.1 }));
                        pdfDoc.setFontSize(40);
                        pdfDoc.setTextColor(150, 150, 150);
                        pdfDoc.setFont('helvetica', 'bold');

                        // Rotate 45 degrees around center
                        // Translate to center first
                        const cx = pdfW / 2;
                        const cy = pdfH / 2;

                        // jsPDF rotation is slightly tricky without advance API, 
                        // but we can use text rotation parameter.
                        pdfDoc.text('DOCUMENTO INFORMATIVO', cx, cy, { align: 'center', angle: 45 });
                        pdfDoc.text('SIN VALIDEZ LEGAL', cx, cy + 15, { align: 'center', angle: 45 });

                        pdfDoc.restoreGraphicsState();
                    };

                    // --- GLOBAL FOOTER: PAGINATION & DISLAIMER ---
                    const totalPages = doc.internal.getNumberOfPages();
                    for (let i = 1; i <= totalPages; i++) {
                        doc.setPage(i);

                        // Apply Watermark
                        addWatermark(doc, i, totalPages);

                        // Disclaimer
                        doc.setFontSize(7);
                        doc.setTextColor(150);
                        doc.setFont("helvetica", "italic");
                        doc.text("Este no es un documento oficial. Consulte la Ventanilla Única de la SEDEMA para trámites oficiales.", pdfW / 2, pdfH - 14, { align: 'center' });

                        // Page Number
                        doc.setFontSize(8);
                        doc.setTextColor(150);
                        doc.setFont("helvetica", "normal");
                        const pageText = `Página ${i} de ${totalPages}`;
                        doc.text(pageText, pdfW / 2, pdfH - 10, { align: 'center' });
                    }

                    if (onProgress) onProgress(90); // TABLES DONE

                    // --- FILENAME GENERATION HELPER ---
                    const generateDetailedFilename = () => {
                        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
                        const folio = `F${timestamp}`;

                        let type = 'ND'; // No detemined
                        const { status, zoningKey, isANP, alcaldia, outsideContext } = analysis;

                        if (status === 'OUTSIDE_CDMX') {
                            type = 'EXTERNO';
                        } else if (status === 'URBAN_SOIL') {
                            type = 'SU';
                            if (isANP) type += '-ANP';
                        } else if (status === 'CONSERVATION_SOIL') {
                            type = 'SC';
                            if (zoningKey) type += `-${zoningKey}`;
                            if (isANP) type += '-ANP';
                        }

                        let location = 'CDMX';
                        if (status === 'OUTSIDE_CDMX') {
                            location = outsideContext || 'EDOMEX';
                        } else {
                            location = alcaldia || 'CDMX';
                        }

                        // Sanitize
                        const cleanType = type.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
                        const cleanLoc = location.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();

                        return `FICHA_${folio}_${cleanType}_${cleanLoc}.pdf`;
                    };

                    const filename = generateDetailedFilename();
                    doc.save(filename);

                    // --- END SAVE ---
                    resolve();
                } catch (error) {
                    console.error("PDF Export failed:", error);
                    reject(error);
                }
            })();
        });
        // buildExportMapImage/onProgress are stable within a render cycle and
        // intentionally excluded to avoid rebuilding the export handler.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [analysis, dataCache, visibleMapLayers, activeBaseLayer, visibleZoningCats, currentZoom]);

    const requestExportPDF = useCallback(async (e) => {
        // Validation: allow event to proceed even if not 'trusted' (for CustomEvents from mobile)
        if (!e) return;
        exportArmedRef.current = true;
        return await handleExportPDF(); // Forward promise
    }, [handleExportPDF]);

    useEffect(() => {
        if (!onExportReady) return;
        onExportReady(requestExportPDF);
        return () => onExportReady(null);
    }, [onExportReady, requestExportPDF]);

    // Tear down any off-screen export map if the component unmounts mid-export.
    useEffect(() => {
        return () => {
            try { exportMapInstance.current?.remove(); } catch { /* empty */ }
            exportMapInstance.current = null;
        };
    }, []);

    if (!analysis) return null;

    return (
        <>
            <div id="export-map" style={{ width: '900px', height: '520px', position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1 }}></div>
            <div style={{ position: 'absolute', top: -9999, left: -9999, width: '794px', zIndex: -1 }}>
                <div style={{ background: '#ffffff' }}>
                    {/* Include Activities controlled by State */}
                    <PdfFicha ref={pdfRef} analysis={analysis} mapImage={mapImage} includeActivities={includeActivities} approximateAddress={approximateAddress} />
                </div>
            </div>
        </>
    );
};

export default PdfExportController;
