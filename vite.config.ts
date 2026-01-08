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
    
    // ✅ Preserve entry signatures to ensure proper initialization order
    // This ensures the main entry point initializes before lazy-loaded chunks
    preserveEntrySignatures: 'strict',
    
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
        // ✅ Optimized chunk splitting strategy to prevent initialization order issues
        // Group related vendors together and ensure proper load order
        manualChunks(id) {
          // Core React and DOM - must load first
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // Router - loads early, needed for route resolution
          if (id.includes('node_modules/wouter')) {
            return 'router-vendor';
          }
          
          // Query library - loads early for data fetching
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query-vendor';
          }
          
          // UI components - group all Radix UI together
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui-vendor';
          }
          
          // Form handling - group together
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform')) {
            return 'form-vendor';
          }
          
          // Charts
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'chart-vendor';
          }
          
          // Icons - group together
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-icons')) {
            return 'icons-vendor';
          }
          
          // Date utilities
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/react-day-picker')) {
            return 'date-vendor';
          }
          
          // Markdown
          if (id.includes('node_modules/react-markdown')) {
            return 'markdown-vendor';
          }
          
          // Animation
          if (id.includes('node_modules/framer-motion')) {
            return 'motion-vendor';
          }
          
          // Utilities - group common utils together
          if (
            id.includes('node_modules/clsx') ||
            id.includes('node_modules/tailwind-merge') ||
            id.includes('node_modules/zod') ||
            id.includes('node_modules/zod-validation-error')
          ) {
            return 'utils-vendor';
          }
          
          // All other node_modules go into a common vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
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
