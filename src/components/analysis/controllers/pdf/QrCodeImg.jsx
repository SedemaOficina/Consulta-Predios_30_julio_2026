import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export const QrCodeImg = ({ value, size = 74 }) => {
    const [src, setSrc] = useState(null);

    useEffect(() => {
        if (!value) return;
        // Generate QR as Data URL
        QRCode.toDataURL(value, {
            width: size,
            margin: 0,
            errorCorrectionLevel: 'M'
        })
            .then(url => {
                setSrc(url);
            })
            .catch(err => {
                console.error("QR Generation Error", err);
            });
    }, [value, size]);

    if (!value) return null;

    if (src) {
        return (
            <img
                src={src}
                alt="QR visor"
                style={{
                    width: size,
                    height: size,
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    display: 'block'
                }}
            />
        );
    }

    return (
        <div style={{ width: size, height: size, border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb' }} />
    );
};
