# 🔍 Auditoría Integral — Visor de Consulta Ciudadana (V-3)

Proyecto: React 18 + Vite + Tailwind + Leaflet · Cliente: SEDEMA (gobierno CDMX)
Fecha: 2026-07-30 · 42 archivos fuente, ~6.225 líneas.

Cada hallazgo tiene un **ID** (C=Crítico, A=Alto, M=Medio, B=Bajo). Dime los IDs que quieras arreglar.

## Resumen por gravedad

| Nivel | Cantidad | Naturaleza |
|---|---|---|
| 🔴 Crítico | 3 | Rompen funcionalidad, accesibilidad legal o seguridad grave |
| 🟠 Alto | 12 | Impacto real en calidad, UX, mantenibilidad o seguridad |
| 🟡 Medio | 22 | Deuda técnica, robustez, accesibilidad, código muerto |
| 🔵 Bajo | 18 | Pulido, consistencia, detalles |

> **Ya resuelto en sesiones previas:** test arreglado (1/1 verde), ESLint 0 warnings, bundle dividido (de 3.5 MB monolito a chunks) y carga diferida del stack PDF. No se listan aquí.

---

## 🔴 CRÍTICO

### C1 · Bug: *closure* obsoleto en el click del mapa — ✅ RESUELTO (2026-07-30)
> Corregido con *living refs* (`onLocationSelectRef`/`onZoomChangeRef`) en `MapViewer.jsx`: los listeners de `click`/`zoomend` ahora llaman siempre a la versión más reciente del callback, viendo el `dataCache` actualizado.

**Archivo:** `src/components/map/MapViewer.jsx` (efecto init con deps `[]`, listener `map.on('click', e => onLocationSelect(e.latlng))`)
El listener captura `onLocationSelect`/`dataCache` del primer render, cuando aún no llegaron `edomex`, `morelos` ni `anpInternal` (se cargan en segundo plano y `useAppData` crea un objeto nuevo). El listener nunca se re-suscribe.
**Efecto:** al hacer **click** en el mapa, el análisis usa datos viejos → nunca determina "fuera de CDMX" (`analysisEngine.js:27`) ni la zonificación interna de ANP (`:158`). La **búsqueda por dirección sí funciona** (usa props frescas), lo que produce resultados inconsistentes entre click y búsqueda.
**Fix:** guardar `onLocationSelect` en un `ref` actualizado cada render, o leer `dataCache` desde el store dentro de `performAnalysis`.

### C2 · Accesibilidad: panel de capas y botones de icono inoperables por teclado / lector de pantalla — ✅ RESUELTO (2026-07-30)
> **ToggleSwitch** ahora es `<button role="switch" aria-checked>` operable con Tab + Space/Enter, con `focus-visible` ring y `aria-label`. Se añadió `aria-label` a **todos** los botones de icono (Ayuda, Capas, Zoom ±, Reset, Mi ubicación, FAB, Buscar, Limpiar, Cerrar capas), `aria-expanded` a Capas y al FAB, `aria-pressed` a los botones de mapa base, `aria-label` a los inputs de búsqueda y al slider de opacidad, y `aria-hidden` a los SVG decorativos. Verificado: lint 0, tests y build OK. *(Recomendado: prueba de teclado/lector real en el navegador.)*

**Archivos:** `src/components/ui/ToggleSwitch.jsx:3-20`, `src/components/map/Legend.jsx` (toggles), `src/components/layout/MapControls.jsx`, `MobileSearchBar.jsx:126`, `SearchLogicDesktop.jsx:182`
`ToggleSwitch` es un `<div onClick>` sin `role="switch"`, `aria-checked`, `tabindex` ni teclado → todo el panel de capas es inusable sin ratón. Los botones solo-icono (Ayuda, Capas, Zoom ±, FAB, Reset, Mi ubicación, Buscar, Limpiar, Cerrar) **no tienen `aria-label`** (el tooltip de tippy no aporta nombre accesible).
**Por qué es crítico:** es un sitio de **gobierno**, donde la accesibilidad (WCAG 2.1 AA) suele ser obligación legal.
**Fix:** `ToggleSwitch` → `<button role="switch" aria-checked>` con Space/Enter; `aria-label` explícito en cada botón de icono.

### C3 · Seguridad: vulnerabilidades de dependencias — ✅ PARCIAL (2026-07-30)
**Estado:** `npm audit` mostró 16 vulnerabilidades. **13 resueltas** con `npm audit fix` (no destructivo) — todas de tooling de desarrollo/build (babel, ajv, brace-expansion, minimatch, postcss, rollup, ws, etc.) que **no llegan al bundle de producción**.

**Residual aceptado (decisión del usuario, 2026-07-30):**
- `jspdf → dompurify` (moderada): viaja al bundle, pero se **confirmó que `doc.html()` NO se usa** en `PdfExportController.jsx` (solo `doc.text`, `doc.autoTable`, `addImage` + `html2canvas` por separado), por lo que la ruta vulnerable de dompurify **no es alcanzable** → riesgo real ≈ nulo. Cerrarla requiere `jspdf@4.2.1` + `jspdf-autotable@5` (breaking, migra la API `doc.autoTable({...})` → `autoTable(doc, {...})` en `:1054,:1092,:946`). **Se deja pendiente** hasta poder verificar visualmente el PDF exportado.
- Resto (esbuild/vite/vitest/eslint-plugin-react): solo tooling de desarrollo (el aviso de esbuild afecta únicamente al *dev-server*), requieren saltos mayores (vite@8). Sin impacto en producción.

---

## 🟠 ALTO

### A1 · Sin tests de la lógica crítica — ✅ RESUELTO (2026-07-30)
> Añadidos 3 archivos de test (29 casos + el smoke = 30): `geoUtils.test.js` (isPointInPolygon con hoyos/MultiPolygon/bordes, findFeature con prioridad inversa y descarte por bbox, parseCoordinateInput decimal/DMS/rango, isStrictNumber), `domain/zoningRules.test.js` (todos los predicados) y `analysisEngine.test.js` (NO_DATA, OUTSIDE_CDMX, URBAN, CONSERVATION con cruce de actividades, ANP).

Solo existe `App.test.jsx` (smoke). No hay cobertura de `isPointInPolygon`/`findFeature` (geoUtils), `analyzeLocation` (analysisEngine), predicados de dominio (zoningRules) ni `parseCoordinateInput`.
**Fix prioritario:** tests de punto-en-polígono (Polygon con hoyo, MultiPolygon, dentro/fuera/borde), `findFeature` (prioridad inversa + descarte por bbox), `analyzeLocation` (cada `status`), y parsing de coordenadas DMS/decimal.

### A2 · Higiene de repositorio — ✅ RESUELTO (2026-07-30)
> Creado `.gitignore` (excluye `node_modules/`, `dist/`, `docs/`, `.env`, `*.pdf`) y `.env.example` (documenta `VITE_MAPBOX_TOKEN`). Eliminados `dist/` (build huérfano) y `public/data/` (3.4 MB duplicados); los 2 scripts de inspección se repuntaron a `src/data/`. `pgoedf.pdf` (4.2 MB) y `docs/` se dejan en disco pero ya están en `.gitignore` (no se versionarán). *(Nota: puedes borrar `pgoedf.pdf` manualmente si no lo necesitas como fuente.)*

- `pgoedf.pdf` (4,3 MB) en la raíz, no referenciado por ningún fuente.
- `dist/` — build obsoleto y huérfano (la config compila a `docs/`).
- `docs/` (9,6 MB de build) versionado, pese a que el workflow de CI lo reconstruye.
- **Falta `.gitignore`** (confirmado ausente) y `.env.example`.
- `public/data/` (~2,5 MB) duplica `src/data/` (solo lo usan scripts).
**Fix:** crear `.gitignore` (node_modules, dist, docs, *.local, *.pdf), sacar el PDF y el build del repo, consolidar los datos.

### A3 · Seguridad: token de Mapbox hardcodeado — ✅ RESUELTO (2026-07-30)
> Token movido a `import.meta.env.VITE_MAPBOX_TOKEN` (constants.js); valor real en `.env` (ignorado por git). El workflow de deploy inyecta el token desde el secreto de GitHub `VITE_MAPBOX_TOKEN`. **Pendiente por el usuario:** añadir ese secreto en GitHub y restringir el token por dominio en Mapbox.

**Archivo:** `src/utils/constants.js` (`MAPBOX_TOKEN` con un token `pk.*` hardcodeado — redactado)
Embebido en los bundles públicos (`docs/`, `dist/`). Los `pk.` son públicos por diseño, pero el riesgo es **abuso de cuota/facturación** si no está restringido.
**Fix:** (1) **rotar** el token (ya está expuesto), (2) **restringir por URL/dominio** en el panel de Mapbox, (3) reducir scopes, (4) mover a `import.meta.env.VITE_MAPBOX_TOKEN` con `.env` no versionado.

### A4 · `HelpModal` se cierra con Enter + sin foco accesible — ✅ RESUELTO (2026-07-30)
> Ya cierra **solo con Escape** (no con Enter). Añadidos `role="dialog"`, `aria-modal`, `aria-labelledby`, *focus trap* con Tab/Shift+Tab, foco inicial al abrir y restauración del foco al disparador al cerrar (vía ref para no re-ejecutar el efecto). Eliminados los `console.log` (también cierra B9).

**Archivo:** `src/components/modals/HelpModal.jsx:29-38`
El listener global cierra con **Enter además de Escape** (cierre accidental con cualquier Enter). Sin `role="dialog"`, `aria-modal`, foco inicial, restauración de foco ni *focus trap*.
**Fix:** cerrar solo con Escape, añadir roles ARIA, atrapar y restaurar el foco.

### A5 · Duplicación total de la lógica de búsqueda — ✅ RESUELTO (2026-07-30)
> Extraído el hook `src/hooks/useAddressSearch.js` (debounce, parsing de coordenadas, autocompletado, historial y selección) y el helper `src/utils/searchHistory.js`. `MobileSearchBar` y `SearchLogicDesktop` quedaron como solo-presentación; se unificaron comportamientos (supresión de sugerencias para coordenadas y guardado de historial) y se eliminó el estado muerto `flash` (parte de B17).

**Archivos:** `MobileSearchBar.jsx` y `SearchLogicDesktop.jsx`
`safeSearch/safeParse`, `handleChange` (debounce), `handleSubmit`, `handleSelectSuggestion` y todo el manejo de `search_history` están **duplicados íntegros** en ambos.
**Fix:** extraer un hook `useAddressSearch()` + helper `searchHistory` (read/push) en utils; dejar los componentes como solo-presentación.

### A6 · Áreas táctiles por debajo de 44px (móvil) — ✅ RESUELTO (2026-07-30)
> Los 9 botones de control del mapa (`MapControls`) subieron de 40px (`w-10 h-10`) a 44px (`w-11 h-11`), cumpliendo WCAG 2.5.5. Los botones pequeños de las barras de búsqueda quedan dentro de contenedores de 44px de alto, y los toggles de capas tienen como objetivo la fila completa (área amplia).

**Archivos:** `MapControls.jsx` (botones `w-10 h-10`=40px), `ToggleSwitch.jsx:10` (28×16px), `Legend.jsx:69`, `BottomSheetMobile.jsx:190`, `MobileSearchBar.jsx:129,140` (~34px).
Menores al mínimo WCAG 2.5.5 (44×44) — difíciles con el dedo en un uso mayoritariamente móvil.
**Fix:** controles de mapa a `w-11 h-11`, agrandar switch y ampliar área táctil de botones pequeños.

### A7 · Inconsistencia del color institucional (dos guindas) — ✅ RESUELTO (2026-07-30)
> Definidos tokens Tailwind `guinda` (#9d2148) y `guinda-dark` (#7d1d3a) en `tailwind.config.js`. Todas las clases arbitrarias `-[#9d2148]`/`-[#9d2449]` migradas a `*-guinda`, y los 4 tonos de hover unificados a `*-guinda-dark`. Los 22 usos de la variante `#9d2449` y los hex sueltos en estilos/PDF unificados al canónico `#9d2148`. Ya no queda ninguna variante fuera de marca.

`styles/main.css:7` define `--color-primary: #9d2148`, pero el código mezcla **`#9d2148` (44 usos) y `#9d2449` (22 usos)** de forma intercambiable (p. ej. `InstitutionalHeader.jsx:4` vs `SidebarDesktop.jsx:106`). Además 4 tonos de hover distintos.
**Fix:** un único token en `tailwind.config.js` (`colors.guinda`), eliminar hex hardcodeados.

### A8 · Contraste de texto insuficiente (falla WCAG AA) — ✅ RESUELTO (2026-07-30)
> Los 26 usos de `text-gray-400` (#9ca3af, ~2.5:1) en texto informativo se subieron a `text-gray-600` (#4b5563, ~7:1, cumple AA). Se ajustaron los hovers que quedaron redundantes a `hover:text-gray-800` para preservar el feedback. Placeholders (`placeholder-gray-400`) intactos.

Uso extendido de `text-gray-400` (#9ca3af, ~2.5:1 sobre blanco) en etiquetas: `Legend.jsx:86,111,143,193,248`, `SidebarDesktop.jsx:68`, `BottomSheetMobile.jsx:172`, `MobileSearchBar.jsx:111`.
**Fix:** mínimo `text-gray-600` para texto informativo; reservar gray-400 para decorativo.

### A9 · `alert()` nativo pese a existir sistema de toasts — ✅ RESUELTO (2026-07-30)
> Los 5 `alert()` reemplazados: App (export no listo) y geolocalización (SearchLogicDesktop, 2) → `addToast`; el hook `useAddressSearch` notifica "sin resultados" vía toast; y en PdfExportController se quitó el `alert` (el `reject` ya dispara el toast de error en App). Cero `alert()` en el código.

`MobileSearchBar.jsx:79`, `SearchLogicDesktop.jsx:100,264,286`, `App.jsx:120`, `PdfExportController.jsx:906`. Diálogos bloqueantes e inconsistentes con `addToast`.
**Fix:** sustituir por `addToast(..., 'error')`.

### A10 · Sin retroalimentación accesible en carga/proceso — ✅ RESUELTO (2026-07-30)
> `ToastContainer` ahora es una región `aria-live="polite"` y cada toast tiene `role="alert"` (errores) o `role="status"`. `ExportProgressOverlay` tiene `role="status" aria-live aria-busy`, y la pantalla de carga inicial `role="status"`.

`ToastSystem.jsx:18` sin `role="status"`/`aria-live`; overlays de exportación y spinners sin anuncio. Ni "Error al generar PDF" ni el progreso se comunican a lectores de pantalla.
**Fix:** `aria-live="polite"` (assertive para errores) en toasts; `role="status" aria-busy` en overlays.

### A11 · `PdfExportController.jsx` monolítico (1.255 líneas) — ✅ RESUELTO (2026-07-30)
> Dividido en `controllers/pdf/`: `pdfTheme.jsx` (tokens T/S/C + estilos + PdfBox), `QrCodeImg.jsx`, `staticMap.js` (getStaticMapUrl/preloadImage), `tableHelpers.js` (processGroupedData) y `PdfFicha.jsx` (plantilla, 452 líneas). El controlador quedó en **612 líneas** (orquestación + lógica imperativa de mapa/export). Extracción mecánica (sin cambios de lógica); build/lint/tests OK. **⚠️ Recomendado verificar visualmente un PDF exportado**, ya que la salida no se puede validar automáticamente.

Mezcla helpers de mapa estático, `QrCodeImg`, constantes de estilo, la plantilla `PdfFicha` completa y toda la orquestación jsPDF/html2canvas.
**Fix:** dividir en `pdf/QrCodeImg.jsx`, `pdf/PdfFicha.jsx`, `pdf/pdfTheme.js`, `pdf/mapImage.js`, `pdf/tableHelpers.js` y dejar el controlador en ~200 líneas.

### A12 · Content-Security-Policy ausente — ✅ RESUELTO (2026-07-30)
> Plugin de Vite (`apply: 'build'`) que inyecta una CSP restrictiva en el `index.html` de producción (no en dev, para no romper el HMR de `@vitejs/plugin-react`). Limita `script-src 'self'`, `object-src 'none'`, y permite solo los orígenes reales (Mapbox, Google Fonts, unpkg). Verificado: presente en `docs/index.html`.

`index.html` sin CSP (ni meta ni cabecera). Sin defensa en profundidad frente a inyección, y hay recursos de terceros (Google Fonts, unpkg/Leaflet) — la CSS de Fonts sin SRI.
**Fix:** CSP restrictiva por cabecera del hosting o `<meta http-equiv>` limitando `script-src`, `connect-src` (api.mapbox.com), etc.

---

## 🟡 MEDIO

### M1 · Race del reverse-geocoding (dirección obsoleta) — ✅ RESUELTO (2026-07-30)
> `useAnalysisStore` ahora usa `get()` y solo aplica la dirección si `analysis.coordinate` sigue coincidiendo con el punto de la petición; respuestas fuera de orden se descartan.

`useAnalysisStore.js:59` — `getReverseGeocoding().then(set(...))` sin cancelación. Con clicks rápidos A→B, la dirección de A puede sobrescribir la de B (y entra al PDF). **Fix:** descartar la respuesta si la coordenada ya cambió (token/AbortController).

### M2 · `getFeatureBounds` revienta con `geometry: null` — ✅ RESUELTO (2026-07-30)
> Guard de `geometry`/`coordinates` nulos (devuelve un bbox vacío que nunca coincide). `findFeature` ahora salta esas features sin lanzar. Cubierto por test de regresión en `geoUtils.test.js`.

`geoUtils.js:69-70` accede a `geom.type` sin guarda; GeoJSON permite `geometry:null`. Una sola feature nula lanza TypeError y aborta el análisis del punto. **Fix:** guarda de geometría nula.

### M3 · Exportación PDF sin timeout global — ✅ RESUELTO (2026-07-30)
> `App.handleExportClick` envuelve el export en `Promise.race` con un timeout de 25 s; si algo se cuelga, se rechaza, se muestra el toast de error y `isExporting` se restablece (el spinner nunca queda pegado). El siguiente export limpia cualquier mapa huérfano.

`PdfExportController.jsx` — si `html2canvas` (:954) se cuelga, la promesa nunca resuelve y `isExporting` queda `true` (spinner infinito). **Fix:** `Promise.race` con timeout (15-20s) que limpie estado.

### M4 · `exportMapInstance` sin cleanup en unmount — ✅ RESUELTO (2026-07-30)
> `useEffect` de limpieza en `PdfExportController` que hace `exportMapInstance.current?.remove()` al desmontar.

`PdfExportController.jsx:756/649` — el mapa Leaflet off-screen no se destruye si el componente se desmonta a mitad de exportación (fuga). **Fix:** `useEffect(() => () => exportMapInstance.current?.remove(), [])`.

### M5 · Optional chaining inconsistente en `properties` — ✅ RESUELTO (2026-07-30)
> `analysisEngine.js`: `cdmx?.features?.length`, `alc?.properties?.NOMBRE || "CDMX"`, `z.properties?.CLAVE`, `z.properties?.PGOEDF`.

`analysisEngine.js:25` (`cdmx?.features.length` sin `features?`), `:37` `alc.properties.NOMBRE`, `:74` `z.properties.CLAVE` sin `?.`. `findFeature` no garantiza `properties`. **Fix:** `?.` consistente en todo acceso a `properties.*`.

### M6 · `JSON.parse` de localStorage sin try/catch (5 sitios) — ✅ RESUELTO (2026-07-30, junto con A5)
> Todos los accesos a `search_history` pasan ahora por `src/utils/searchHistory.js`, con `readSearchHistory`/`pushSearchHistory` envueltos en try/catch y validación de forma. Ya no queda ningún `JSON.parse(localStorage...)` sin proteger.

`MobileSearchBar.jsx:117,164`, `SearchLogicDesktop.jsx:79,172,232`. Un `search_history` corrupto lanza excepción al enfocar el input y rompe la búsqueda. **Fix:** try/catch → `[]` + validar forma; centralizar en helper.

### M7 · z-index ad-hoc sin escala — ✅ RESUELTO (2026-07-30)
> Definida una escala `zIndex` en `tailwind.config.js` (sidebar, sidebar-toggle, sheet, header, legend, map-overlay, search, suggest, toast, modal). Todos los `z-[NNNN]` arbitrarios migrados a tokens (`z-modal`, `z-toast`, `z-legend`, …); el orden de apilamiento ahora es intencional y documentado.

`HelpModal`, `OnboardingTour` y `ExportProgressOverlay` comparten **`z-[9999]`**; el orden lo decide el DOM. Valores dispersos (5000, 3000, 2000, 1110, 1100, 1050, 1020). **Fix:** escala de capas por tokens (base/overlay/panel/modal/toast).

### M8 · Sugerencias de búsqueda sin patrón combobox ARIA — ✅ RESUELTO (2026-07-30)
> Patrón combobox implementado en el hook `useAddressSearch` (navegación con ↑/↓, Enter selecciona la resaltada, Escape cierra) y en ambas barras: input con `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"` y `aria-activedescendant`; lista con `role="listbox"` y opciones con `role="option"`/`aria-selected` + resaltado visual.

`SearchLogicDesktop.jsx:157-255`, `MobileSearchBar.jsx:109-186` — sin `role="combobox"`, sin navegación por flechas, sin `<label>`/`aria-label`; Enter solo elige la primera. **Fix:** combobox ARIA con teclado.

### M9 · `OnboardingTour` no es diálogo accesible — ✅ RESUELTO (2026-07-30)
> Añadidos `role="dialog"`, `aria-modal`, `aria-labelledby`, cierre con Escape, foco inicial, *focus trap* con Tab y restauración de foco al cerrar.

`OnboardingTour.jsx:60-121` — sin `role="dialog"`, sin cierre con Escape ni *focus trap*. **Fix:** tratarlo como diálogo accesible.

### M10 · SVG decorativos sin `aria-hidden` — ✅ RESUELTO (2026-07-30)
> `IconBase` (Icons.jsx) ahora aplica `aria-hidden="true" focusable="false"` por defecto a todos los iconos (sobrescribible por props); los SVG inline de mapa/búsqueda ya se marcaron en C2.

### M11 · `invalidateMapRef` — ref y prop muertos — ✅ RESUELTO (2026-07-30)
> Eliminado el ref en App.jsx, la prop, el destructuring y el bloque de asignación/limpieza en MapViewer.jsx.

`App.jsx:65,254` + `MapViewer.jsx:147-151,261` — se crea, pasa y asigna, pero **nunca se invoca**. **Fix:** eliminar ref, prop y bloque de asignación.

### M12 · 4 props muertas App → MapViewer — ✅ RESUELTO (2026-07-30)
> Eliminadas del JSX de `<MapViewer>` (`setVisibleMapLayers`, `setVisibleZoningCats`, `setActiveBaseLayer`, `setGlobalOpacity`). Además se removió `setVisibleMapLayers` del destructuring de App y de `useMapStore` (quedó huérfano).

`App.jsx:245-252` pasa `setVisibleMapLayers`, `setVisibleZoningCats`, `setActiveBaseLayer`, `setGlobalOpacity`, que MapViewer ya no consume. **Fix:** dejar de pasarlas.

### M13 · Acciones de store nunca consumidas — ✅ RESUELTO (2026-07-30)
> Eliminadas: `setSidebarOpen`, `removeToast`, `resetUI` (useUIStore); `resetMap` (useMapStore); `setAnalysis`, `setAnalyzing`, `toggleZoningCat` (useAnalysisStore). Los toasts siguen auto-descartándose por el `setTimeout` de `addToast`.

`useUIStore` (`setSidebarOpen`, `removeToast`, `resetUI`), `useMapStore` (`resetMap`), `useAnalysisStore` (`setAnalysis`, `setAnalyzing`, `toggleZoningCat`). **Fix:** eliminarlas.

### M14 · `useToast` / `ToastProvider` muertos — ✅ RESUELTO (2026-07-30)
> Eliminados de `ToastSystem.jsx`; `App` ahora renderiza `<VisorApp/>` directamente dentro del `ErrorBoundary`.

`ToastSystem.jsx:6,12` — `useToast` nunca importado; `ToastProvider` es un no-op decorativo. **Fix:** borrarlos; `App` renderiza `<VisorApp/>` directo en el `ErrorBoundary`.

### M15 · GeoJSON duplicado en disco — ✅ RESUELTO (2026-07-30, junto con A2)
> Eliminado `public/data/` (~3.4 MB); los scripts de inspección leen ahora de `src/data/`.

`src/data/` vs `public/data/` (~2,5 MB, mismos 8 archivos, solo usados por scripts). **Fix:** consolidar en `src/data/`, eliminar `public/data/`.

### M16 · Builders de capa GeoJSON casi idénticos — ✅ RESUELTO (2026-07-30)
> `addCoreLayer` y `addLayer` unificados en `createGeoLayer(map, {...})` en `utils/leafletHelpers.js` (comportamiento preservado vía params: `bringToFrontOnHover` y un callback `bindTooltip` por capa).

`MapViewer.jsx:185-216` (`addCoreLayer`) vs `:273-299` (`addLayer`) — estilo/hover/tooltip duplicados. **Fix:** unificar en `createGeoLayer(...)`.

### M17 · `MapViewer.jsx` grande (548 líneas) — 🟡 PARCIAL (2026-07-30)
> Extraídos `escapeHtml`, `bindColoredTooltip` y `createGeoLayer` a `utils/leafletHelpers.js`; MapViewer bajó a **492 líneas**. La descomposición completa de los 6 `useEffect` imperativos en hooks (`useMapInit`, `useZoningLayers`, …) se **difiere**: es alto riesgo sin poder verificar el mapa visualmente. Recomendado hacerlo con QA visual.

6 `useEffect` imperativos de Leaflet + helpers inline. **Fix:** extraer `utils/leafletHelpers.js` y hooks (`useMapInit`, `useZoningLayers`, `useLocationMarker`).

### M18 · ~52 líneas de comentarios de deliberación de IA — ✅ RESUELTO (2026-07-30)
> Eliminados los ~48 comentarios dentro del destructuring más los bloques de deliberación en `triggerExport` y `handleClose` de `BottomSheetMobile.jsx`.

`BottomSheetMobile.jsx:12-64` (y 124-129, 137-146) — prosa interna dentro de un destructuring de 4 campos. **Fix:** eliminar.

### M19 · README desincronizado — ✅ RESUELTO (2026-07-30)
> README reescrito: corregido `useVisorState`→`useAppData` y la ubicación de `MapViewer` (`map/`), añadidos Zustand + `src/stores/`, los hooks, `utils/` reales, la sección de pruebas, la config de `.env`/CSP y el árbol de directorios completo y actualizado.

`README.md:29` menciona `useVisorState` (no existe; es `useAppData`); no menciona `src/stores/` (Zustand); ubica `MapViewer` en `layout/` (está en `map/`). **Fix:** actualizar árbol y stack.

### M20 · Sin manejo de estado offline — ✅ RESUELTO (2026-07-30)
> Nuevo hook `useOnlineStatus` (escucha `online`/`offline`). App muestra un banner ámbar (`role="status" aria-live="assertive"`) cuando no hay conexión. La búsqueda ya no intenta geocodificar sin red y distingue "sin conexión" de "cero resultados" (la consulta por coordenadas sigue funcionando offline con los datos locales).

No hay chequeos `navigator.onLine`. Sin red, la búsqueda muestra "No se encontraron coincidencias" (engañoso) y el mapa falla en silencio. **Fix:** detectar offline y distinguir de "cero resultados".

### M21 · Foco de teclado poco visible — ✅ RESUELTO (2026-07-30)
> Regla global en `main.css` con `:where(button, a, input, ...):focus-visible { outline: 2px solid var(--color-primary) }` (specificity 0, solo teclado, sobrescribible por estilos de componente).

### M22 · Sin memoización de componentes pesados — ✅ RESUELTO (2026-07-30)
> `React.memo` en `ActivityCatalogController`, `GroupedActivities`, `LocationSummary`, `ZoningResultCard`, `NormativeInstrumentCard` y `CitizenSummaryCard`; `allSectors` ahora con `useMemo`. Evita re-renders en cascada cuando cambian estados no relacionados.

`ResultsContent`, `GroupedActivities` y las cards no usan `React.memo`; re-render en cascada al cambiar estado del padre. `allSectors` (ActivityCatalogController.jsx:18) se recalcula en cada render. **Fix:** `React.memo` + `useMemo` para `allSectors`. *(Nota: Fuse.js sí está bien memoizado.)*

---

## 🔵 BAJO

### B1 · lat/lng de URL sin validar rango — ✅ RESUELTO (2026-07-30)
`App.jsx` deep-link ahora valida `|lat|<=90 && |lng|<=180`.
`App.jsx:172-176` — solo `!isNaN`, sin `|lat|<=90 / |lng|<=180`. **Fix:** reutilizar la validación de `parseCoordinateInput`.

### B2 · Posible ReDoS en regex DMS — ✅ RESUELTO (2026-07-30)
`parseCoordinateInput` descarta entradas > 100 caracteres antes de las regex DMS.
`geoUtils.js:219-220` — clases `\s` solapadas entre cuantificadores. Impacto bajo (input acotado). **Fix:** anclar/acotar longitud.

### B3 · `getReverseGeocoding` sin `Number()`/encode — ✅ RESUELTO (2026-07-30)
Coacciona `Number(lat)`/`Number(lng)` y aborta si no son numéricos antes de construir la URL.
`geoUtils.js:267` — interpola `${lng},${lat}` sin forzar numérico. **Fix:** `Number()` antes de interpolar.

### B4 · `feature._bbox` muta los objetos de datos — ✅ RESUELTO (2026-07-30)
`getFeatureBounds` cachea en un `WeakMap` en vez de escribir `_bbox` en la feature.
`geoUtils.js:79` — contamina el GeoJSON; fuga si se serializa. **Fix:** usar `WeakMap` para el caché de bbox.

### B5 · Errores de carga en segundo plano silenciados — ✅ RESUELTO (2026-07-30)
`useAppData` muestra un toast de error si falla la carga secundaria (edomex/morelos/anpInternal).
`useAppData.js:104-106` — solo `console.error`; si fallan edomex/morelos/anpInternal, la app sigue sin aviso ni reintento. **Fix:** avisar/reintentar.

### B6 · Typo en mensaje al usuario — ✅ RESUELTO (2026-07-30)
"La columa" → "La columna" en `analysisEngine.js`.
`analysisEngine.js:136` — "La **columa**" → "columna".

### B7 · `isPDU` frágil — ✅ RESUELTO (2026-07-30)
Ahora se deriva de `zoningKey.startsWith('PDU_')` en vez del texto libre `zoningName`.
`analysisEngine.js:128` — se calcula sobre el texto `zoningName` (`includes('POBLAD')`), no sobre la clave. **Fix:** derivar de `zoningKey.startsWith('PDU_')`.

### B8 · `analyzeLocation` es `async` sin `await` — ✅ RESUELTO (2026-07-30)
Quitado el `async` (la función es puramente síncrona); los callers con `await` siguen funcionando.
`analysisEngine.js:8` — no hay awaits; el async es innecesario. **Fix:** quitar `async` o documentarlo.

### B9 · `console.log` en producción — ✅ RESUELTO (2026-07-30, con A4)
`HelpModal.jsx` "Close clicked" / "Entendido clicked" eliminados.

### B10 · `tailwind.config.js` sin tokens — ✅ RESUELTO (2026-07-30)
> `theme.extend` ahora define `colors` (guinda, guinda-dark, dorado) y una escala `zIndex` (con M7). La tipografía se mantiene con utilidades de Tailwind (no se tokenizó a escala custom para no reescribir ~60 tamaños; el mínimo se subió en B12).

### B11 · Dorado/acento inconsistente — ✅ RESUELTO (2026-07-30)
> Token `dorado` (#bc955c) en Tailwind; `via-[#bc955c]` → `via-dorado` y `--color-accent` unificado a #bc955c. *(La paleta interna del PDF en `pdfTheme.jsx` mantiene sus tonos propios de impresión, intencionalmente.)*

### B12 · Tamaños de fuente muy pequeños en móvil — ✅ RESUELTO (2026-07-30)
> Los `text-[9px]` (los más ilegibles) subidos a `text-[11px]`. Los `text-[10px]` (micro-etiquetas en mayúsculas) se conservan a propósito por densidad; se recomienda una revisión visual si se quiere 11px en todo.

### B13 · Alias `@` configurado pero sin usar — ✅ RESUELTO (2026-07-30)
Eliminado el alias `@` y el import `path` de `vite.config.js` (no se usaba en ningún import).

### B14 · `MapControls.jsx` mal ubicado — ✅ RESUELTO (2026-07-30)
Movido a `components/map/MapControls.jsx` (imports internos intactos, ya que `layout/`↔`map/` son hermanos); actualizado el import en App.

### B15 · SVG duplicados que ya existen o deberían estar en Icons — ✅ RESUELTO (2026-07-30)
> Añadidos `Icons.Plus`/`Icons.Minus`; los 4 SVG de zoom inline en `MapControls` y las 2 "X" inline en las barras de búsqueda reemplazados por `Icons.Plus`/`Icons.Minus`/`Icons.X`.

### B16 · Import de `Icons` inconsistente (named vs default) — ✅ RESUELTO (2026-07-30)
> Los 4 archivos con `import { Icons }` migrados a `import Icons` (default); eliminado el `export const Icons` redundante (queda solo `export default`).

### B17 · Código muerto menor — ✅ RESUELTO (2026-07-30)
> `flash` eliminado (con A5) y `DATA_FILES: {}` eliminado de `constants.js`. El comentario "deprecated" de `setInputRef` ya había desaparecido al reescribir los componentes en A5.

### B18 · Dos ErrorBoundary de clase casi iguales — ✅ RESUELTO (2026-07-30)
> Unificados en un solo `ErrorBoundary` con prop `variant` (`"section"` = fallback inline con "Reintentar"; default = pantalla completa con recarga). `SectionErrorBoundary.jsx` eliminado; `ResultsContent` usa `<ErrorBoundary variant="section">`.

`SectionErrorBoundary.jsx` y `ui/ErrorBoundary.jsx`. **Fix:** unificar en uno parametrizable.

---

## ✅ Revisado y correcto (sin acción)
- Enlaces `target="_blank"` usan `rel="noreferrer"` con URLs estáticas (sin tabnabbing).
- Geolocalización solo tras acción explícita del usuario, con manejo de errores.
- Búsqueda Mapbox usa `encodeURIComponent`; el render de sugerencias es JSX (auto-escapado).
- El bottom sheet usa `svh` y breakpoints `md:` coherentes (sin solapamientos de layout).
- Fuse.js está correctamente memoizado (no se re-instancia en cada render).
- `findFeature` ya optimiza con bounding-box antes del punto-en-polígono.
