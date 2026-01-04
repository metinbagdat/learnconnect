import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
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
    chunkSizeWarningLimit: 2000, // Increase limit to 2MB to reduce warnings
    // Production optimizations
    minify: 'esbuild', // Faster than terser
    sourcemap: process.env.NODE_ENV === 'development', // Source maps only in development
    cssCodeSplit: true, // Split CSS into separate files
    rollupOptions: {
      // Externalize @vercel/analytics and Anthropic SDK to prevent build failures
      // The wrapper component will handle runtime loading gracefully
      external: (id) => {
        // Anthropic SDK ve ilgili paketleri externalize et
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
        // Optimize chunk splitting for better caching
        manualChunks: (id) => {
          // React core
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          // Router
          if (id.includes('wouter')) {
            return 'router-vendor';
          }
          // Query library
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }
          // Radix UI components
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }
          // Charts
          if (id.includes('recharts')) {
            return 'chart-vendor';
          }
          // Form libraries
          if (id.includes('react-hook-form') || id.includes('@hookform')) {
            return 'form-vendor';
          }
          // Icons
          if (id.includes('lucide-react') || id.includes('react-icons')) {
            return 'icons-vendor';
          }
          // Date utilities
          if (id.includes('date-fns')) {
            return 'date-vendor';
          }
          // Markdown
          if (id.includes('react-markdown')) {
            return 'markdown-vendor';
          }
          // Motion/animation
          if (id.includes('framer-motion')) {
            return 'motion-vendor';
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.[^.]*$/, '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext || '')) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
});
