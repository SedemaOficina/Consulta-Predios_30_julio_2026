import { CONSTANTS } from '../../../../utils/constants';

export const getStaticMapUrl = ({ lat, lng, zoom = 14, width = 900, height = 520 }) => {
    const clampedW = Math.min(Math.max(width, 300), 1280);
    const clampedH = Math.min(Math.max(height, 200), 1280);
    const overlay = `pin-s+9d2449(${lng},${lat})`;
    const token = CONSTANTS.MAPBOX_TOKEN;

    if (!token) return '';

    return (
        `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/` +
        `${overlay}/${lng},${lat},${zoom}/${clampedW}x${clampedH}` +
        `?access_token=${token}&logo=false&attribution=false`
    );
};

export const preloadImage = (src) =>
    new Promise((resolve) => {
        if (!src) return resolve(false);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
    });
