import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Needed for Docker to expose the port
    port: 5173,
    watch: {
      usePolling: true, // Forces Vite to actively check for file changes in Docker
    },
    // Optional: If you still have HMR issues, add this to ensure the WebSocket connects
    hmr: {
        clientPort: 5173
    }
  }
})