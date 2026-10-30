import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import axe from 'axe-core';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';
import { TemaProvider } from '../context/TemaContext';
import { ToastProvider } from '../context/ToastContext';

/** Tokens do mock: Tiago (admin) e Ana (colaboradora). Ver services/mock/db.js. */
export const TOKEN_ADMIN = 'mock-token-101';
export const TOKEN_COLABORADOR = 'mock-token-102';

/**
 * Renderiza a aplicação inteira (provedores + rotas reais) a partir de `rota`.
 * Com `token`, começa com a sessão já aberta.
 */
export function renderizarApp(rota = '/', { token } = {}) {
  if (token) localStorage.setItem('cara-cursos-token', token);
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <TemaProvider>
            <ToastProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </ToastProvider>
          </TemaProvider>
        ),
      },
    ],
    { initialEntries: [rota] },
  );
  const usuario = userEvent.setup();
  return { usuario, router, ...render(<RouterProvider router={router} />) };
}

/** Roda o axe e devolve as violações (contraste fica de fora: o jsdom não calcula cores). */
export async function violacoesA11y(container) {
  const { violations } = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  return violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
}
