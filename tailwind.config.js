/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Institutional "guinda" (see --color-primary in src/styles/main.css).
                // Use bg-guinda / text-guinda / ring-guinda / hover:bg-guinda-dark, etc.
                guinda: {
                    DEFAULT: '#9d2148',
                    dark: '#7d1d3a',
                },
                // Institutional gold accent.
                dorado: '#bc955c',
            },
            // Named layering scale so stacking order is intentional and documented,
            // instead of scattered arbitrary z-[NNNN] values.
            zIndex: {
                'sidebar': '1020',
                'sidebar-toggle': '1030',
                'sheet': '1050',
                'header': '1100',
                'legend': '1110',
                'map-overlay': '1200',
                'search': '2000',
                'suggest': '3000',
                'toast': '5000',
                'modal': '9999',
            },
        },
    },
    plugins: [],
}
