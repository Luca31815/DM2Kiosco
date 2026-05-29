import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // SWR data-fetching
          'vendor-swr': ['swr'],
          // Charting library (largest dependency)
          'vendor-recharts': ['recharts'],
          // Animation library
          'vendor-motion': ['framer-motion'],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          // Icon library
          'vendor-icons': ['lucide-react'],
          // UI utilities
          'vendor-ui': ['react-hot-toast', 'react-markdown'],
        }
      }
    }
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'swr', 'recharts', 'framer-motion', 'lucide-react'],
  }
})
