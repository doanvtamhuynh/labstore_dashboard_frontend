import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react') || id.includes('react-router-dom')) return 'react'
          if (id.includes('recharts')) return 'charts'
          if (id.includes('@tanstack') || id.includes('axios')) return 'query'
          if (id.includes('@microsoft/signalr')) return 'realtime'
          return 'vendor'
        },
      },
    },
  },
})
