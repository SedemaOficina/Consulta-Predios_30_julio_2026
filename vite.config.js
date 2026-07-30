import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Inject a Content-Security-Policy only into the production build. It is NOT
// applied in dev because @vitejs/plugin-react's HMR preamble uses inline
// scripts that a strict script-src would block. Adjust the allow-lists if a
// legitimate resource gets blocked in production.
const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "img-src 'self' data: blob: https://api.mapbox.com https://*.tiles.mapbox.com https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com",
    "script-src 'self'",
    "connect-src 'self' https://api.mapbox.com https://*.tiles.mapbox.com https://events.mapbox.com",
    "worker-src 'self' blob:",
].join('; ')

const cspPlugin = {
    name: 'inject-csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
        return html.replace(
            '</title>',
            `</title>\n    <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}" />`
        )
    },
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), cspPlugin],
    server: {
        port: 3000,
    },
    base: '/Consulta-Predios_30_julio_2026/',
    build: {
        outDir: 'docs',
        // The static zoning/boundary GeoJSON bundle is legitimately large
        // (~2.4 MB) and must load at startup; raise the threshold so the size
        // warning only fires on genuine regressions elsewhere.
        chunkSizeWarningLimit: 2600,
        rollupOptions: {
            output: {
                // Split heavy vendor libraries and the eagerly-loaded static
                // GeoJSON into their own chunks. This breaks up the previous
                // ~3.5 MB monolith so the browser caches and downloads pieces in
                // parallel, and an app-code change no longer busts the data/lib
                // caches. Lazily-imported GeoJSON (edomex, morelos, Zon_*) is
                // left untouched so Vite keeps it in its own on-demand chunks.
                manualChunks(id) {
                    if (/[\\/]src[\\/]data[\\/](cdmx|alcaldias|suelo-de-conservacion-2020|zoonificacion_pgoedf_2000_sin_anp|anp_consolidada)\.geojson/.test(id)) return 'app-data';
                    if (id.includes('node_modules')) {
                        if (/[\\/](jspdf|jspdf-autotable|html2canvas|canvg|qrcode|dompurify)[\\/]/.test(id)) return 'vendor-pdf';
                        if (id.includes('leaflet')) return 'vendor-leaflet';
                        if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
                        return 'vendor';
                    }
                },
            },
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.js',
    }
})
