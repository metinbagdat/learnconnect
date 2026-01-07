import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  // Vite koruyucu ayarlar - Anthropic SDK client bundle'a dahil edilmesin
  optimizeDeps: {
    exclude: ["@anthropic-ai/sdk", "ws", "bufferutil"]
  },
  ssr: {
    external: ["@anthropic-ai/sdk"]
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    
    // ✅ KRİTİK DÜZELTME: Minification ayarlarını değiştir
    // esbuild kullan (terser yüklenemedi, esbuild daha güvenli)
    // esbuild hoisting'i daha iyi yönetir ve 'A before initialization' hatalarını önler
    minify: 'esbuild',
    
    // ✅ Optimize for proper variable hoisting
    // This helps prevent "can't access lexical declaration before initialization" errors
    target: 'es2020', // Use modern target for better hoisting
    
    // ✅ Sourcemap'i production'da kapat (security ve performance için)
    // Development'da açık kalır (debug için)
    sourcemap: process.env.NODE_ENV !== 'production',
    cssCodeSplit: true,
    reportCompressedSize: false,
    
    rollupOptions: {
      // ✅ Optimize module hoisting to prevent lexical declaration errors
      // This ensures proper initialization order
      treeshake: {
        moduleSideEffects: (id) => {
          // Preserve side effects for certain modules that need proper initialization
          if (id.includes('node_modules')) {
            // Allow side effects for vendor modules
            return true;
          }
          return false;
        },
      },
      
      // ✅ Circular dependency warning'lerini görmezden gel
      // Lazy loading fixes most circular dependency issues, but some external libraries
      // (drizzle-orm, zod, d3-interpolate, recharts) may still have circular deps
      onwarn(warning, warn) {
        // Suppress circular dependency warnings (lazy loading fixes module order)
        if (warning.code === 'CIRCULAR_DEPENDENCY') {
          const message = warning.message || '';
          // Suppress known circular dependencies from external libraries
          if (
            message.includes('drizzle-orm') ||
            message.includes('zod') ||
            message.includes('d3-interpolate') ||
            message.includes('recharts')
          ) {
            // These are from external libraries and don't affect functionality
            return;
          }
          // Log other circular dependencies for awareness
          console.warn(`⚠️ Circular dependency: ${message}`);
          return;
        }
        
        // Track 'A before initialization' warnings for debugging
        if (warning.message && warning.message.includes('before initialization')) {
          console.warn(`⚠️ Initialization order warning: ${warning.message}`);
          // Don't suppress - we want to know about these
          warn(warning);
          return;
        }
        
        // Pass through all other warnings
        warn(warning);
      },
      
      external: (id) => {
        if (
          id === '@anthropic-ai/sdk' || 
          id.startsWith('@anthropic-ai/sdk/') ||
          id === '@vercel/analytics/react' || 
          id.startsWith('@vercel/analytics/')
        ) {
          return true;
        }
        return false;
      },
      
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['wouter'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers'],
          'icons-vendor': ['lucide-react', 'react-icons'],
          'date-vendor': ['date-fns', 'react-day-picker'],
          'markdown-vendor': ['react-markdown'],
          'motion-vendor': ['framer-motion'],
          'utils-vendor': ['clsx', 'tailwind-merge', 'zod', 'zod-validation-error'],
        },
        
        chunkFileNames: 'js/chunk-[name]-[hash:8].js',
        entryFileNames: 'js/[name]-[hash:8].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `images/[name]-[hash:8][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext || '')) {
            return `fonts/[name]-[hash:8][extname]`;
          }
          return `assets/[name]-[hash:8][extname]`;
        },
      },
    },
  },
  
  server: {
    hmr: {
      overlay: true,
    },
  },
});
