import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock fetch globally
const emptyFeatureCollection = { type: 'FeatureCollection', features: [] };
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve(emptyFeatureCollection),
        text: () => Promise.resolve(''),
    })
);

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});
