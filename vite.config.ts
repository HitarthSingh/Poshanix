import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Public base URL when serving the built app (useful when hosting under a specific domain)
  base: 'https://cayman-lion-austin-astrology.trycloudflare.com/',
  server: {
    // Allow this host when Vite validates incoming requests
    allowedHosts: [
      'cayman-lion-austin-astrology.trycloudflare.com'
    ]
  },
})
