import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: '/chinese-learning-app/',  // GitHub Pages base path
    define: {
      // Ensure API_KEY is always a string, even if empty, to prevent "process is not defined" error in browser
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
  };
});