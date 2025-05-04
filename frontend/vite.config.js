import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // This binds Vite to all network interfaces, allowing other devices to access it.
    port: 5173,        // The port where the frontend will run
    hmr: {
      host: process.env.VITE_BACKEND_URL, // Access the env variable with process.env in vite.config.js
    },
  },
});
