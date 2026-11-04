import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In development, forward /api calls to the Express server so the
    // browser sees one origin and the JWT cookie works without CORS issues
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
