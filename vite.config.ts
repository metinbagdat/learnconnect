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
    
    // ✅ KRİTİK: Production'da minify'i kapatıyoruz - TDZ hatalarını önlemek için
    // "Cannot access 'A' before initialization" hatası minify sırasında oluşuyor
    // Geçici olarak minify kapalı, site çalışır hale gelince tekrar açabiliriz
    minify: false,
    target: 'es2020',
    
    // ✅ Sourcemap'i 'hidden' yap - üretilir ama client tarafından istenmedikçe sunulmaz
    // Bu build süresini ve dosya boyutunu azaltır, ancak gerektiğinde debug için kullanılabilir
    sourcemap: 'hidden',
    cssCodeSplit: true,
    reportCompressedSize: false,
    
    rollupOptions: {
      // ✅ Preserve entry signatures to maintain proper module initialization order
      // 'exports-only' ensures that entry modules maintain their export structure
      // This prevents TDZ errors by ensuring proper initialization order
      preserveEntrySignatures: 'exports-only',
      
      // ✅ Optimize module hoisting to prevent lexical declaration errors
      // This ensures proper initialization order and prevents TDZ (Temporal Dead Zone) errors
      treeshake: {
        // ✅ Less aggressive tree-shaking to prevent TDZ issues
        // 'smallest' preset can break initialization order by removing code that's needed for proper init
        // 'recommended' is safer and prevents TDZ errors
        preset: 'recommended',
        moduleSideEffects: (id) => {
          // Preserve side effects for all modules to ensure proper initialization order
          // This prevents TDZ errors caused by tree-shaking removing necessary code
          // Critical for preventing "Cannot access 'A' before initialization" errors
          
          // Always preserve side effects for node_modules (they may have initialization code)
          if (id.includes('node_modules')) {
            return true;
          }
          
          // Preserve side effects for app code that may have initialization logic
          if (id.includes('/pages/') || id.includes('/components/') || id.includes('/lib/')) {
            return true;
          }
          
          // Be conservative - preserve side effects for all app code
          // This is safer than being too aggressive and causing TDZ errors
          return true;
        },
        // ✅ Don't use property read side effects optimization
        // This can cause issues with module initialization
        propertyReadSideEffects: true,
        // ✅ Preserve try-catch side effects (important for error handling)
        tryCatchDeoptimization: false,
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
        // Exclude src/App.jsx from build (we use client/src/App.tsx instead)
        if (id.includes('/src/App.jsx') || id.includes('\\src\\App.jsx')) {
          return true;
        }
        return false;
      },
      
      output: {
        // ✅ ES modules format - better TDZ handling
        format: 'es',
        // ✅ Simplified output - no aggressive code generation that causes TDZ issues
        interop: 'auto',
        // ✅ Ensure proper module boundaries to prevent TDZ errors
        // This prevents circular dependencies and ensures proper initialization order
        preserveModules: false,
        
        // ✅ Simplified chunk splitting strategy to prevent initialization order issues
        // Keep related code together and ensure proper load order
        // Lazy-loaded pages are automatically split by Vite, so we only need to handle vendors
        manualChunks: (id) => {
          // Don't split node_modules too aggressively - keep related packages together
          if (id.includes('node_modules')) {
            // Core React and DOM - must load first (critical path)
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Router - loads early but after React
            if (id.includes('wouter')) {
              return 'router-vendor';
            }
            // Query library - depends on React
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            // UI components - group all Radix UI together (large but cohesive)
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Form handling - depends on React
            if (id.includes('react-hook-form') || id.includes('@hookform/resolvers')) {
              return 'form-vendor';
            }
            // Charts - large library, keep separate
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            // Icons - lightweight, can be grouped
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'icons-vendor';
            }
            // Date utilities - small, can be grouped
            if (id.includes('date-fns') || id.includes('react-day-picker')) {
              return 'date-vendor';
            }
            // Markdown - medium size
            if (id.includes('react-markdown')) {
              return 'markdown-vendor';
            }
            // Animation - large library
            if (id.includes('framer-motion')) {
              return 'motion-vendor';
            }
            // Utilities - small, group together to reduce chunks
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('zod') || id.includes('zod-validation-error')) {
              return 'utils-vendor';
            }
            // All other node_modules in one chunk to avoid too many chunks
            // This reduces the chance of TDZ errors from complex dependency chains
            return 'vendor';
          }
          // App code stays in separate chunks (handled by Vite automatically)
          // Vite's automatic code splitting is better at handling app code dependencies
          return null;
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
