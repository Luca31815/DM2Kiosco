import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/')
          const nmIndex = normalizedId.lastIndexOf('/node_modules/')
          if (nmIndex === -1) return undefined

          const pkgPath = normalizedId.slice(nmIndex + '/node_modules/'.length)

          if (/^(?:react|react-dom|scheduler|react-router|react-router-dom)\//.test(pkgPath)) {
            return 'vendor-react'
          }
          if (/^(?:recharts|victory-vendor|d3-[^/]+)\//.test(pkgPath)) {
            return 'vendor-recharts'
          }
          if (/^(?:framer-motion|motion-dom|motion-utils)\//.test(pkgPath)) {
            return 'vendor-motion'
          }
          if (pkgPath.startsWith('@supabase/')) {
            return 'vendor-supabase'
          }
          if (pkgPath.startsWith('swr/')) {
            return 'vendor-swr'
          }
          if (pkgPath.startsWith('lucide-react/')) {
            return 'vendor-icons'
          }
          if (/^(?:react-markdown|unified|property-information|space-separated-tokens|comma-separated-tokens)\/|^(?:remark-|rehype-|micromark|mdast-|hast-|unist-|vfile)/.test(pkgPath)) {
            return 'vendor-markdown'
          }
          if (/^(?:react-hot-toast|goober)\//.test(pkgPath)) {
            return 'vendor-toast'
          }
          return undefined
        }
      }
    }
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'swr', 'recharts', 'framer-motion', 'lucide-react'],
  }
})
