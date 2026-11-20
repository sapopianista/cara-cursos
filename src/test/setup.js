import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { resetarMock } from '../services/mock/handlers';

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  resetarMock();
});

// APIs do navegador que o jsdom não implementa.
window.scrollTo = () => {};
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}
