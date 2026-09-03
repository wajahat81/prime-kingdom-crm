import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // This block controls your production build
  build: {
    sourcemap: false, 
  },
  
  // This block controls your local development server
  server: {
    host: true, 
    port: 5173,
    watch: {
      usePolling: true, 
    },
    hmr: {
        clientPort: 5173
    }
  }
})