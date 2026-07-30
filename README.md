# Visor de Consulta Ciudadana (V-3)

[![CI](https://github.com/SedemaOficina/Consulta-Predios_30_julio_2026/actions/workflows/ci.yml/badge.svg)](https://github.com/SedemaOficina/Consulta-Predios_30_julio_2026/actions/workflows/ci.yml)
[![Deploy](https://github.com/SedemaOficina/Consulta-Predios_30_julio_2026/actions/workflows/deploy.yml/badge.svg)](https://github.com/SedemaOficina/Consulta-Predios_30_julio_2026/actions/workflows/deploy.yml)

🌐 **Sitio en vivo:** https://sedemaoficina.github.io/Consulta-Predios_30_julio_2026/

Aplicación web para la consulta de normatividad urbana y ambiental de la Ciudad de México (SEDEMA). Dado un punto en el mapa (por clic, búsqueda de dirección o coordenadas), determina el tipo de suelo (Conservación / Urbano), la zonificación PGOEDF, si cae en un Área Natural Protegida (ANP) y qué actividades están permitidas o prohibidas, con opción de exportar una Ficha Informativa en PDF.

## Arquitectura

Este proyecto utiliza una arquitectura moderna basada en **Vite** + **React 18**, con estado global en **Zustand** y la lógica de negocio separada en `utils/`.

### Stack Tecnológico
- **Build System**: Vite
- **Framework**: React 18
- **Estado**: Zustand (3 stores)
- **Estilos**: Tailwind CSS (tokens de color `guinda`/`dorado` y escala `zIndex` en `tailwind.config.js`)
- **Mapas**: Leaflet
- **Geocodificación / mapas base**: Mapbox API
- **PDF**: jsPDF + jspdf-autotable + html2canvas + qrcode
- **Pruebas**: Vitest + React Testing Library
- **Linting**: ESLint

### Estructura de Directorios

```
/
├── public/
│   └── assets/               # Assets estáticos (logo-sedema.png)
├── src/
│   ├── components/
│   │   ├── analysis/         # Resultados del análisis (atomizado)
│   │   │   ├── cards/        # Tarjetas de información
│   │   │   ├── controllers/  # Lógica (catálogo de actividades, export PDF)
│   │   │   │   └── pdf/       # Submódulos del PDF (PdfFicha, tema, QR, mapa, tablas)
│   │   │   └── ui/           # UI específica de análisis
│   │   ├── layout/           # Header, Sidebar (desktop), BottomSheet (móvil)
│   │   ├── map/              # MapViewer, MapControls, Legend
│   │   ├── search/           # Barras de búsqueda (desktop y móvil)
│   │   ├── modals/           # HelpModal
│   │   ├── features/         # OnboardingTour
│   │   └── ui/               # Componentes genéricos (Icons, ToggleSwitch, ErrorBoundary, Toasts…)
│   ├── stores/              # Estado global Zustand
│   │   ├── useUIStore.js     #   sidebar, legend, help, toasts
│   │   ├── useMapStore.js    #   ubicación, zoom, capa base, opacidad, capas visibles
│   │   └── useAnalysisStore.js #  análisis, exportación, performAnalysis()
│   ├── hooks/               # Custom hooks
│   │   ├── useAppData.js     #   carga de datos (crítica + diferida)
│   │   ├── useAddressSearch.js # lógica compartida de búsqueda (combobox, historial)
│   │   └── useOnlineStatus.js #  estado de conexión
│   ├── utils/               # Lógica de negocio y helpers
│   │   ├── analysisEngine.js #   motor de análisis (analyzeLocation)
│   │   ├── geoUtils.js       #   punto-en-polígono, parsing de coordenadas, Mapbox
│   │   ├── leafletHelpers.js #   helpers de capas/tooltips de Leaflet
│   │   ├── searchHistory.js  #   historial de búsqueda (localStorage, con try/catch)
│   │   ├── analysisUtils.js  #   textos y utilidades de presentación
│   │   ├── constants.js      #   catálogo de zonificación, colores, config
│   │   └── domain/
│   │       └── zoningRules.js #  reglas de negocio (predicados de visibilidad)
│   ├── data/                # GeoJSON + CSV de zonificación y actividades
│   ├── styles/              # main.css (variables CSS, animaciones)
│   └── test/                # Configuración de pruebas (setup.js)
├── scripts/                 # Scripts de inspección de datos (dev)
├── index.html               # Punto de entrada
├── vite.config.js           # Vite/Vitest + CSP en build + chunking
└── tailwind.config.js       # Tema (tokens de color, zIndex)
```

### Pruebas

La lógica crítica (geoespacial, motor de análisis y reglas de dominio) está cubierta por tests unitarios:
- `src/utils/geoUtils.test.js` — `isPointInPolygon`, `findFeature`, `parseCoordinateInput`.
- `src/utils/analysisEngine.test.js` — `analyzeLocation` (SC / Urbano / fuera de CDMX / ANP).
- `src/utils/domain/zoningRules.test.js` — predicados de dominio.
- `src/App.test.jsx` — prueba de humo del render principal.

## Configuración

El token de Mapbox se lee desde variables de entorno de Vite. Copia `.env.example` a `.env` y define tu token (restríngelo por dominio en el panel de Mapbox):

```bash
cp .env.example .env
# edita .env y define VITE_MAPBOX_TOKEN
```

## Desarrollo

### Instalación
```bash
npm install
```

### Ejecutar Localmente
```bash
npm run dev
```

### Pruebas Automatizadas
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Despliegue

La aplicación se construye para producción en la carpeta `docs/` (configuración para GitHub Pages). El workflow de CI reconstruye y publica en cada push a `main`; una Content-Security-Policy se inyecta automáticamente en el `index.html` de producción.

```bash
npm run build
```
