import L from 'leaflet';

// Escape user/data-derived strings before injecting them into tooltip HTML.
export const escapeHtml = (text) => {
    if (!text) return '';
    return text
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Bind a styled, colored tooltip (optional prefix) to a Leaflet layer.
export const bindColoredTooltip = (layerInstance, label, color, prefix = '') => {
    const safeLabel = escapeHtml(label);
    const html = `
        <div style="
            background: ${color};
            color: #fff;
            padding: 5px 10px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 11px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            text-transform: uppercase;
            letter-spacing: 0.025em;
            border: 1px solid rgba(255,255,255,0.2);
            white-space: nowrap;
        ">
            ${prefix ? `<span style="opacity:0.8; margin-right:4px;">${prefix}</span>` : ''}
            ${safeLabel}
        </div>
        `;
    layerInstance.bindTooltip(html, {
        sticky: true,
        className: 'colored-tooltip-container',
        direction: 'top',
        offset: [0, -10]
    });
};

/**
 * Build a GeoJSON layer with the shared hover behaviour and a caller-provided
 * tooltip binder, then add it to the map. Returns the layer (or null if empty).
 */
export const createGeoLayer = (map, { data, style, pane, interactive = true, bringToFrontOnHover = false, bindTooltip }) => {
    if (!data?.features?.length) return null;

    const layer = L.geoJSON(data, {
        pane,
        style,
        interactive,
        onEachFeature: (feature, layerInstance) => {
            if (interactive && !L.Browser.mobile) {
                layerInstance.on('mouseover', () => {
                    layerInstance.setStyle({ weight: 3, fillOpacity: 0.3 });
                    if (bringToFrontOnHover) layerInstance.bringToFront();
                });
                layerInstance.on('mouseout', () => layerInstance.setStyle(style));
            }
            if (bindTooltip) bindTooltip(feature, layerInstance);
        }
    });

    map.addLayer(layer);
    return layer;
};
