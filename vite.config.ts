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
    
    // ✅ Sourcemap'i production'da da aç (debug için)
    sourcemap: true,
    cssCodeSplit: true,
    reportCompressedSize: false,
    
    rollupOptions: {
      // ✅ Circular dependency warning'lerini görmezden gel
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') {
          // Sadece logla, hata verme
          console.warn(`⚠️ Circular dependency: ${warning.message}`);
          return;
        }
        
        // 'A' ile ilgili uyarıları da görmezden gel
        if (warning.message && warning.message.includes('A') && warning.message.includes('before initialization')) {
          console.warn(`⚠️ Minification warning: ${warning.message}`);
          return;
        }
        
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
