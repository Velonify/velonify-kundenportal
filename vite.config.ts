import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Served at the root of kunden.velonify.de; relative base keeps a plain GitHub Pages URL working too.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5199, strictPort: true },
});
