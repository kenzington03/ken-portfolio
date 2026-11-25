import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      // The site, plus the iOS 26 simulator page (/ioslab.html, noindex): the
      // phone on its own, with Light / Dark and a way to try every screen.
      input: {
        main: resolve(__dirname, 'index.html'),
        ioslab: resolve(__dirname, 'ioslab.html'),
      },
    },
  },
});
