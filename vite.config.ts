
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This base path is crucial for the deployment script.
  // It ensures assets are loaded from the correct sub-directory on the server.
  // The app-name 'problem-buddy-app' is derived from this.
  base: '/problem-buddy-app/',
});
