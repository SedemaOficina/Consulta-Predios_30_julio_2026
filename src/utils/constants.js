

export const CONSTANTS = {
    COLORS: {
        primary: '#9d2148',
        secondary: '#BC955C',
        success: '#15803d',
        warning: '#b45309',
        error: '#b91c1c',
        info: '#1d4ed8',
        sc: '#5a7c47', // Suelo de Conservación (Muted/Olive Green to distinguish from FC)
        su: '#2563EB',
        anp: '#9333ea',
        text: '#111827',
        subtext: '#4b5563',
        border: '#d1d5db',
        bg: '#f3f4f6',
        white: '#ffffff'
    },
    ZONING_CAT_INFO: {
        FC: { color: '#0d421d', label: 'Forestal Conservación' }, // Darker Forest Green
        FCE: { color: '#4ade80', label: 'Forestal Conservación Especial' },
        FP: { color: '#0e7490', label: 'Forestal Protección' },
        FPE: { color: '#0284c7', label: 'Forestal Protección Especial' },
        AE: { color: '#fbbf24', label: 'Agroecológico' },
        AEE: { color: '#eab308', label: 'Agroecológico Especial' },
        AF: { color: '#65a30d', label: 'Agroforestal' },
        AFE: { color: '#a3e635', label: 'Agroforestal Especial' },
        PDU_PP: { color: '#e11d48', label: 'Programas Parciales' },
        PDU_PR: { color: '#d97706', label: 'Poblados Rurales' },
        PDU_ZU: { color: '#94a3b8', label: 'Zona Urbana' },
        PDU_ER: { color: '#3b82f6', label: 'Equipamiento Rural' },
        ANP_ZON: { color: '#7e22ce', label: 'Zonificación ANP (interna)' }
    },
    ZONING_ORDER: [
        'FC', 'FCE', 'FP', 'FPE', 'AF', 'AFE', 'AE', 'AEE',
        'PDU_PP', 'PDU_PR', 'PDU_ZU', 'PDU_ER'
    ],
    LAYER_STYLES: {
        sc: { color: '#3B7D23', fill: '#3B7D23', label: 'Suelo de Conservación' },
        anp: { color: '#a855f7', fill: '#a855f7', label: 'Áreas Naturales Protegidas' },
        alcaldias: { color: '#FFFFFF', border: '#555', label: 'Límite Alcaldías' },
        edomex: { color: '#FFD86B', label: 'Estado de México' },
        morelos: { color: '#B8A1FF', label: 'Estado de Morelos' }
    },
    MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN,
    INITIAL_CENTER: [19.34, -99.145],
    INITIAL_ZOOM: 10,
    FOCUS_ZOOM: 16,
    CONTACT_INFO: {
        phone: "55 5278 3500 ext. 1234",
        hours: "Lunes a Viernes 09:00 - 15:00 hrs"
    }
};
