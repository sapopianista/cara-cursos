import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { TemaProvider } from './context/TemaContext';
import { ToastProvider } from './context/ToastContext';
import './index.css';

function Raiz() {
  return (
    <TemaProvider>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </TemaProvider>
  );
}

// Roteador "de dados" (necessário para useBlocker, que avisa sobre alterações
// não salvas). As rotas em si continuam declaradas em <App /> com <Routes>.
const router = createBrowserRouter([{ path: '*', element: <Raiz /> }]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
