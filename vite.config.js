import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Quando o backend Java estiver no ar, as chamadas /api serão
    // redirecionadas para ele (evita problemas de CORS em desenvolvimento).
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
