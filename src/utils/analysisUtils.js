import { CONSTANTS } from './constants';

/* Helper de Zonificación Display */
export const getZoningDisplay = (analysis) => {
    if (!analysis) return '';
    if (analysis.zoningKey === 'ANP') return 'ÁREA NATURAL PROTEGIDA';
    if (analysis.zoningKey === 'NODATA') return 'Información no disponible';

    const store = CONSTANTS.ZONING_CAT_INFO || {};
    const catInfo = store[analysis.zoningKey];
    if (catInfo && catInfo.label) return catInfo.label;

    return analysis.zoningName || 'Sin información';
};

/* Helper Texto Contraste (YIQ) */
export const getContrastYIQ = (hexcolor) => {
    if (!hexcolor) return 'black';
    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length === 3) hexcolor = hexcolor.split('').map(c => c + c).join('');
    var r = parseInt(hexcolor.substr(0, 2), 16);
    var g = parseInt(hexcolor.substr(2, 2), 16);
    var b = parseInt(hexcolor.substr(4, 2), 16);
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

/* Helper Texto Explicativo (Citizen Summary) */
export const getCitizenExplanation = (analysis) => {
    if (!analysis) return null;

    const { status, zoningKey, isANP, alcaldia } = analysis;

    if (status === 'OUTSIDE_CDMX') {
        const estado = analysis.outsideContext;
        if (estado) {
            return `La ubicación consultada se localiza en el **${estado}**. La presente herramienta corresponde a normatividad de la **Ciudad de México**, por lo que **no aplica** en este territorio. La determinación normativa corresponde a las **autoridades competentes del ${estado}**.`;
        } else {
            return `La ubicación consultada se localiza **fuera de la Ciudad de México**. La normatividad consultada en este visor **no es aplicable** en este territorio. La determinación normativa corresponde a las **autoridades estatales o municipales competentes**.`;
        }
    }

    if (status === 'URBAN_SOIL') {
        if (isANP) {
            return `Aunque el punto se ubica en **Suelo Urbano**, se localiza dentro de un **Área Natural Protegida (ANP)**. En estos casos, la regulación específica de usos y destinos del suelo se determina por el **Programa de Manejo** correspondiente, conforme al PGOEDF.`;
        }
        return `El punto se ubica en **Suelo Urbano**. La regulación aplicable en materia de usos del suelo se determina mediante los **Programas de Desarrollo Urbano** (Delegacionales o Parciales) y la autoridad competente en la demarcación correspondiente (**${alcaldia || 'la alcaldía'}**).`;
    }

    if (status === 'CONSERVATION_SOIL') {
        // ANP CASE
        if (isANP) {
            return `El punto se ubica en **Suelo de Conservación** y dentro de un **Área Natural Protegida (ANP)**. Conforme al PGOEDF, la regulación específica de usos y destinos del suelo se define por el **Programa de Manejo** correspondiente.`;
        }

        // ZONING CASES (PGOEDF)
        switch (zoningKey) {
            case 'RE':
                return `Zona orientada a la **restauración ecológica** de áreas con afectación. En el marco del PGOEDF, la gestión ambiental se enfoca en **recuperar la cobertura y funcionalidad** del territorio, priorizando acciones compatibles con la conservación de bienes y servicios ambientales.`;
            case 'FC':
            case 'FCE':
            case 'FP':
            case 'FPE':
                return `Zona con **altos valores ambientales** asociados a vegetación natural y funciones clave como **recarga del acuífero** y **conservación de biodiversidad**. El PGOEDF establece que su uso debe ser **planificado y regulado** para evitar deterioro, frenar el cambio de cobertura natural y asegurar la permanencia de los ecosistemas.`;
            case 'PR':
            case 'PRA':
                return `Zona con aptitud para **actividades productivas rurales**. El PGOEDF orienta estas actividades para que sean **compatibles con la conservación de recursos naturales** y para minimizar conflictos ambientales, promoviendo el aprovechamiento sustentable en función de la capacidad del territorio.`;
            case 'AE':
            case 'AEE':
            case 'AF':
            case 'AFE':
                return `Zona con **alto potencial para actividades agrícolas y pecuarias**. El PGOEDF señala que deben evitarse prácticas que alteren la **capacidad física y productiva del suelo**, aplicar **técnicas de conservación de suelo y agua**, y promover el uso de **composta y abonos orgánicos**, reduciendo al máximo productos químicos.`;
            case 'PDU_ER':
                return `Zona identificada por Programas de Desarrollo Urbano (PDU) para **equipamientos** en territorio rural. Conforme al PGOEDF, estos polígonos se regulan por los **Programas Delegacionales o Parciales** aplicables y deben considerarse en congruencia con la gestión del Suelo de Conservación.`;
            case 'PDU_PR':
                return `Zona identificada como **Poblado Rural** dentro de los Programas de Desarrollo Urbano (PDU). Conforme al PGOEDF, estos polígonos se regulan por los **Programas Delegacionales o Parciales** aplicables, al tratarse de asentamientos y áreas normadas por planeación urbana vigente.`;
            default:
                return `El punto se ubica en **Suelo de Conservación**. El PGOEDF define una zonificación para delinear un patrón de usos del suelo que **maximice servicios ambientales** (incluida la **recarga del acuífero**) y la capacidad productiva, y que **minimice conflictos ambientales**, asignando actividades conforme a la capacidad del territorio para sostenerlas y frenar el cambio de cobertura natural.`;
        }
    }
    return null;
};
