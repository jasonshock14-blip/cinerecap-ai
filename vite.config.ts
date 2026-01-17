
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 'base: "./"' ensures that assets are loaded relative to the index.html file,
  // which is critical for GitHub Pages hosting.
  base: './',
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
  }
});
