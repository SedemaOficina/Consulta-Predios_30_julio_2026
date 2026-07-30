import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { CONSTANTS } from '../../utils/constants';
import * as Utils from '../../utils/geoUtils';
import { escapeHtml, bindColoredTooltip, createGeoLayer } from '../../utils/leafletHelpers';

// Fix Leaflet Default Icon issue in Webpack/Vite
import iconArrow from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl: iconArrow, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// All imperative Leaflet logic (init, layers, marker, fly-to) lives in this hook
// so the MapViewer component stays purely presentational.
export function useMapViewer({
    location, onLocationSelect, analysisStatus, isANP, visibleMapLayers,
    visibleZoningCats, extraDataLoaded, activeBaseLayer, resetMapViewRef,
    selectedAnpId, dataCache, onZoomChange, globalOpacity = 0.7, zoomInRef, zoomOutRef
}) {
    // Access Constants lazily or directly
    const {
        LAYER_STYLES,
        ZONING_ORDER,
        ZONING_CAT_INFO,
        INITIAL_CENTER = [19.32, -99.15],
        INITIAL_ZOOM = 11,
        FOCUS_ZOOM = 16
    } = CONSTANTS;

    const {
        getBaseLayerUrl = () => '',
        getZoningStyle = () => ({ color: '#ccc' })
    } = Utils;

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const layersRef = useRef({});          // sc, alcaldias, edomex, morelos, base
    const zoningLayersRef = useRef({});    // {ANP: layer, FC: layer, ... }
    const selectedAnpLayerRef = useRef(null);
    const markerRef = useRef(null);
    const [tilesLoading, setTilesLoading] = useState(true);

    // "Living refs" for the callbacks used inside the once-only init effect
    // below. The map's event listeners are bound a single time on mount, so a
    // plain closure would capture the callbacks (and, through them, the
    // dataCache) from the first render and never see later updates â€” e.g. the
    // background-loaded edomex/morelos/anpInternal layers. Keeping the latest
    // callback in a ref lets the listeners always call the current version.
    const onLocationSelectRef = useRef(onLocationSelect);
    const onZoomChangeRef = useRef(onZoomChange);
    useEffect(() => {
        onLocationSelectRef.current = onLocationSelect;
        onZoomChangeRef.current = onZoomChange;
    }, [onLocationSelect, onZoomChange]);

    // escapeHtml, bindColoredTooltip and createGeoLayer now live in
    // utils/leafletHelpers.js (imported above).

    // 1) INIT MAP
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        const bounds = L.latLngBounds([14.0, -106.0], [24.0, -93.0]);

        const map = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false,
            minZoom: 9,
            maxZoom: 18,
            preferCanvas: true,
            maxBounds: bounds,
            maxBoundsViscosity: 0.5
        }).setView(INITIAL_CENTER, INITIAL_ZOOM);

        L.control.attribution({ position: 'topleft', prefix: false }).addTo(map);
        mapInstance.current = map;

        map.on('zoomend', () => {
            onZoomChangeRef.current?.(map.getZoom());
        });

        let cdmxBounds = null;
        try {
            if (dataCache?.cdmx?.features?.length) {
                const tmp = L.geoJSON(dataCache.cdmx);
                cdmxBounds = tmp.getBounds();
            }
        } catch { /* empty */ }

        if (resetMapViewRef) {
            resetMapViewRef.current = () => {
                try {
                    const m = mapInstance.current;
                    if (!m) return;

                    if (cdmxBounds && cdmxBounds.isValid()) {
                        m.fitBounds(cdmxBounds, { padding: [20, 20] });
                    } else {
                        m.setView(INITIAL_CENTER, INITIAL_ZOOM);
                    }
                } catch { /* empty */ }
            };
        }

        if (zoomInRef) zoomInRef.current = () => map.zoomIn();
        if (zoomOutRef) zoomOutRef.current = () => map.zoomOut();

        // PANES CONFIGURATION
        map.createPane('paneBase');
        map.getPane('paneBase').style.zIndex = 300;

        map.createPane('paneContext');
        map.getPane('paneContext').style.zIndex = 350;

        map.createPane('paneSCOverlay');
        map.getPane('paneSCOverlay').style.zIndex = 375;

        map.createPane('paneOverlay');
        map.getPane('paneOverlay').style.zIndex = 400;

        // BASE TILE
        const base = L.tileLayer(getBaseLayerUrl(activeBaseLayer || 'SATELLITE'), {
            pane: 'paneBase',
            maxZoom: 19,
            tileSize: 256,
            zoomOffset: 0,
            crossOrigin: 'anonymous'
        });

        base.on('loading', () => setTilesLoading(true));
        base.on('load', () => setTilesLoading(false));
        base.addTo(map);
        layersRef.current.base = base;

        // CORE layers (SC, AlcaldÃ­as)
        const sc = dataCache?.sc;
        const alcaldias = dataCache?.alcaldias;
        const styles = LAYER_STYLES || {};

        const addCoreLayer = (name, data, style, tooltipField, pane, interactive = true) => {
            const layer = createGeoLayer(map, {
                data, style, pane, interactive,
                bringToFrontOnHover: true,
                bindTooltip: (feature, layerInstance) => {
                    if (name === 'sc') {
                        bindColoredTooltip(layerInstance, "Suelo de ConservaciÃ³n", styles.sc?.color || '#3B7D23');
                    } else if (tooltipField && feature.properties?.[tooltipField]) {
                        layerInstance.bindTooltip(escapeHtml(feature.properties[tooltipField]), {
                            sticky: true,
                            className: 'custom-tooltip'
                        });
                    }
                }
            });
            if (layer) layersRef.current[name] = layer;
        };

        addCoreLayer(
            'sc',
            sc,
            {
                color: styles.sc?.color || '#3B7D23',
                weight: 1.5,
                opacity: 1,
                fillColor: styles.sc?.fill || '#3B7D23',
                fillOpacity: 0.2,
                interactive: true
            },
            null,
            'paneSCOverlay',
            true
        );

        addCoreLayer(
            'alcaldias',
            alcaldias,
            {
                color: activeBaseLayer === 'SATELLITE' ? '#FFFFFF' : '#374151',
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0
            },
            null,
            'paneContext',
            false
        );

        map.on('click', e => onLocationSelectRef.current?.(e.latlng));

        setTimeout(() => {
            try { map.invalidateSize(); } catch { /* empty */ }
        }, 200);

        return () => {
            try { map.remove(); } catch { /* empty */ }
            mapInstance.current = null;
            if (resetMapViewRef) resetMapViewRef.current = null;
            layersRef.current = {};
            zoningLayersRef.current = {};
            markerRef.current = null;
        };
        // Map is initialized imperatively once on mount; deps intentionally empty.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!mapInstance.current || !extraDataLoaded || !L || !dataCache) return;

        const { edomex, morelos, zoning, anp } = dataCache;
        const styles = LAYER_STYLES || {};

        const addLayer = (name, data, style, tooltipField, pane, interactive = true) => {
            const layer = createGeoLayer(mapInstance.current, {
                data, style, pane, interactive,
                bindTooltip: (feature, layerInstance) => {
                    if (name === 'anp' && feature.properties?.NOMBRE) {
                        bindColoredTooltip(layerInstance, feature.properties.NOMBRE, styles.anp?.color || '#a855f7', "ANP:");
                    } else if (tooltipField && feature.properties?.[tooltipField]) {
                        layerInstance.bindTooltip(escapeHtml(feature.properties[tooltipField]), {
                            sticky: true,
                            className: 'custom-tooltip'
                        });
                    }
                }
            });
            if (layer) layersRef.current[name] = layer;
        };

        if (!layersRef.current.edomex) {
            addLayer('edomex', edomex, {
                color: styles.edomex?.color || '#64748b',
                weight: 1.5,
                dashArray: '4,4',
                opacity: 0.9,
                fillOpacity: 0.1
            }, 'NOMGEO', 'paneContext', true);
        }

        if (!layersRef.current.morelos) {
            addLayer('morelos', morelos, {
                color: styles.morelos?.color || '#64748b',
                weight: 1.5,
                dashArray: '4,4',
                opacity: 0.9,
                fillOpacity: 0.1
            }, 'NOMGEO', 'paneContext', true);
        }

        if (!layersRef.current.anp) {
            addLayer('anp', anp, {
                color: styles.anp?.color || '#a855f7',
                weight: 1.5,
                opacity: 0.9,
                fillColor: styles.anp?.fill || '#a855f7',
                fillOpacity: 0.2
            }, 'NOMBRE', 'paneOverlay', true);
        }

        if (zoning?.features?.length && Object.keys(zoningLayersRef.current).length === 0) {
            const byKey = {};
            (ZONING_ORDER || []).forEach(k => (byKey[k] = []));

            zoning.features.forEach(f => {
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

            (ZONING_ORDER || []).forEach(k => {
                const feats = byKey[k];
                if (!feats?.length) return;

                const fc = { type: 'FeatureCollection', features: feats };
                const catInfo = (ZONING_CAT_INFO || {})[k];
                const fixedColor = catInfo ? catInfo.color : '#9ca3af';

                const layer = L.geoJSON(fc, {
                    pane: 'paneOverlay',
                    style: {
                        color: fixedColor,
                        weight: 1.5,
                        opacity: 0.9,
                        fillColor: fixedColor,
                        fillOpacity: 0.2,
                        interactive: true
                    },
                    interactive: true,
                    onEachFeature: (feature, layerInstance) => {
                        if (!L.Browser.mobile) {
                            layerInstance.on('mouseover', () => {
                                layerInstance.setStyle({ weight: 3, fillOpacity: 0.4 });
                            });
                            layerInstance.on('mouseout', () => {
                                layerInstance.setStyle({ weight: 1.5, fillOpacity: 0.2 });
                            });
                        }

                        const label = feature.properties?.PGOEDF;
                        if (label) {
                            bindColoredTooltip(layerInstance, label, fixedColor);
                        }
                    }
                });

                zoningLayersRef.current[k] = layer;

                const shouldShow = !!visibleMapLayers.zoning && (visibleZoningCats[k] !== false);
                if (shouldShow) mapInstance.current.addLayer(layer);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [extraDataLoaded, dataCache]);

    useEffect(() => {
        if (!mapInstance.current || !dataCache?.anpInternal) return;

        if (selectedAnpLayerRef.current) {
            mapInstance.current.removeLayer(selectedAnpLayerRef.current);
            selectedAnpLayerRef.current = null;
        }

        if (!selectedAnpId || !visibleMapLayers.selectedAnpZoning) return;

        const sel = (selectedAnpId ?? '').toString().trim();
        const candidates = dataCache.anpInternal.features.filter(f => {
            const id = (f.properties?.ANP_ID ?? '').toString().trim();
            return id && id === sel;
        });

        if (candidates.length) {
            const layer = L.geoJSON({ type: 'FeatureCollection', features: candidates }, {
                pane: 'paneOverlay',
                style: (feature) => ({ ...getZoningStyle(feature), fillOpacity: globalOpacity }),
                interactive: true,
                onEachFeature: (feature, layerInstance) => {
                    const label = feature.properties?.ZONIFICACION || 'ZonificaciÃ³n ANP';
                    const style = getZoningStyle(feature);
                    bindColoredTooltip(layerInstance, label, style.color);
                }
            });
            selectedAnpLayerRef.current = layer;
            mapInstance.current.addLayer(layer);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAnpId, visibleMapLayers.selectedAnpZoning, extraDataLoaded, dataCache, globalOpacity]);

    useEffect(() => {
        if (!mapInstance.current || !layersRef.current.base) return;
        setTimeout(() => setTilesLoading(true), 0);
        layersRef.current.base.setUrl(getBaseLayerUrl(activeBaseLayer));

        if (layersRef.current.alcaldias) {
            const newColor = activeBaseLayer === 'SATELLITE' ? '#FFFFFF' : '#374151';
            layersRef.current.alcaldias.setStyle({ color: newColor });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeBaseLayer]);

    useEffect(() => {
        if (!mapInstance.current) return;

        ['sc', 'anp', 'alcaldias', 'edomex', 'morelos'].forEach(k => {
            const layer = layersRef.current[k];
            if (!layer) return;

            if (visibleMapLayers[k] && !mapInstance.current.hasLayer(layer)) mapInstance.current.addLayer(layer);
            if (!visibleMapLayers[k] && mapInstance.current.hasLayer(layer)) mapInstance.current.removeLayer(layer);

            if (layer && visibleMapLayers[k] && layer.setStyle) {
                if (k === 'alcaldias' || k === 'edomex' || k === 'morelos') {
                    /* empty */
                } else {
                    layer.setStyle({ fillOpacity: globalOpacity });
                }
            }
        });

        if (Object.keys(zoningLayersRef.current).length) {
            (ZONING_ORDER || []).forEach(k => {
                const zLayer = zoningLayersRef.current[k];
                if (!zLayer) return;

                const shouldShow = !!visibleMapLayers.zoning && (visibleZoningCats[k] !== false);
                const has = mapInstance.current.hasLayer(zLayer);

                if (shouldShow && !has) mapInstance.current.addLayer(zLayer);
                if (!shouldShow && has) mapInstance.current.removeLayer(zLayer);

                if (shouldShow && zLayer) {
                    zLayer.setStyle({ fillOpacity: globalOpacity });
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibleMapLayers, visibleZoningCats, extraDataLoaded, globalOpacity]);

    useEffect(() => {
        if (!mapInstance.current || !location || !L) return;

        if (markerRef.current) markerRef.current.remove();

        const styles = LAYER_STYLES || {};

        let label = '';
        let bgColor = '#9ca3af';

        if (analysisStatus === 'OUTSIDE_CDMX') {
            label = 'X';
            bgColor = '#b91c1c';
        } else if (analysisStatus === 'CONSERVATION_SOIL') {
            label = 'SC';
            bgColor = styles.sc?.color || '#3B7D23';
        } else if (isANP) {
            label = 'ANP';
            bgColor = '#9333ea';
        } else if (analysisStatus === 'URBAN_SOIL') {
            label = 'SU';
            bgColor = '#3b82f6';
        }

        const safeLabel = escapeHtml(label);

        const iconHtml = `
          <div class="marker-pop" style="
            width:32px;height:32px;background:${bgColor};color:#fff;
            border:3px solid #fff;border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-weight:bold;font-size:10px;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
          ">
            ${safeLabel}
          </div>
          `;

        const icon = L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        markerRef.current = L.marker([location.lat, location.lng], { icon }).addTo(mapInstance.current);

        const currentZoom = mapInstance.current.getZoom();
        const targetZoom = Math.max(currentZoom, FOCUS_ZOOM);
        mapInstance.current.flyTo([location.lat, location.lng], targetZoom, { duration: 0.8 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location, analysisStatus, isANP]);
    return { mapRef, tilesLoading };
}
