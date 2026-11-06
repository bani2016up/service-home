import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Keep public artwork separate from protected application assets on other hosts.
    assetsDir: 'landing-assets',
    rolldownOptions: {
      input: ['index.html', 'auth-required.html', 'auth-denied.html', 'auth-error.html'],
    },
  },
});
