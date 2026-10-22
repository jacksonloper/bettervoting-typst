import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Typst template, fonts and logo live at the repo root (one level up) and
// are imported directly, so the sandbox always renders the real template.
export default defineConfig({
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
  optimizeDeps: {
    exclude: ['@myriaddreamin/typst-ts-web-compiler'],
  },
  build: { target: 'es2022' },
});
