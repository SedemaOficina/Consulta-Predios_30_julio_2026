/* eslint-disable react-refresh/only-export-components */
// Shared PDF style tokens and the small PdfBox layout helper used by PdfFicha.
export const T = {
    font: 'Roboto, Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    base: 10,       // Reduced slightly for density
    small: 8.5,
    micro: 7.5,
    h1: 15,         // Larger Header
    h2: 12,
    lead: 10,
    lh: 1.2
};

export const S = {
    pageW: 794,
    pagePad: 30,    // Increased margins
    gap1: 5,
    gap2: 12,
    gap3: 20,
    radius: 4,
    hair: '1px solid #d1d5db' // Slightly darker hair
};

// OFFICIAL PALETTE (Based on InstitutionalHeader)
export const C = {
    ink: '#333333',     // Dark Gray (Gris Oscuro)
    sub: '#666666',     // Medium Gray
    guinda: '#9d2148',  // Guinda Oficial
    dorado: '#D4C19C',  // Dorado Oficial
    gris: '#B38E5D',    // (Variant, using Dorado/Gris blend usually, adhering to header usage)
    hair: '#d1d5db',
    panel: '#f8f9fa',
    sc: '#3B7D23',
    su: '#2563EB',      // Brighter Blue for digital
    red: '#B91C1C',
    green: '#15803D'
};

export const styleH2 = {
    fontSize: `${T.h2}px`,
    fontWeight: 700,
    color: C.guinda,
    borderBottom: `2px solid ${C.dorado}`,
    paddingBottom: '4px',
    marginBottom: `${S.gap2}px`,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

export const styleLabel = {
    fontSize: `${T.small}px`,
    color: C.sub,
    fontWeight: 600,
    textTransform: 'uppercase',
    marginBottom: '2px'
};

export const styleValue = {
    fontSize: `${T.base}px`,
    color: C.ink,
    fontWeight: 400
};

export const PdfBox = ({ title, children, style }) => (
    <div style={{ ...style }}>
        <div style={styleLabel}>{title}</div>
        <div style={styleValue}>{children}</div>
    </div>
);

// Table Styles
export const tblC = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: `${T.small}px`
};
export const thC = {
    textAlign: 'left',
    padding: '6px 8px',
    borderBottom: `2px solid ${C.dorado}`,
    color: C.guinda,
    fontWeight: 700,
    verticalAlign: 'bottom'
};
export const tdC = (i) => ({
    padding: '6px 8px',
    borderBottom: `1px solid ${C.hair}`,
    backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb',
    color: C.ink,
    verticalAlign: 'top'
});
