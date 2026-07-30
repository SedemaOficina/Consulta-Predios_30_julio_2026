import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Leaflet needs a real DOM with layout measurements (getBoundingClientRect,
// pane transforms, etc.) that jsdom does not provide, so the real map crashes
// with "Cannot read properties of null (reading 'translate')". For this smoke
// test we replace the map with a lightweight stub and let the rest of the app
// render normally.
vi.mock('./components/map/MapViewer', () => ({
    default: () => <div data-testid="map-viewer-mock" />,
}));

describe('App Smoke Test', () => {
    it('renders the application title', async () => {
        render(<App />);

        // Wait for loading to finish and main content to appear.
        // (The "Cargando visor..." state is not asserted because useAppData
        // parses its critical data synchronously inside the effect, so the
        // loading flag flips to false before the test can observe it.)
        const titleElements = await screen.findAllByText(/Visor de Consulta/i);
        expect(titleElements.length).toBeGreaterThan(0);
    });
});
