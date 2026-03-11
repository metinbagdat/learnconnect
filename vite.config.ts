import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
  react({
    jsxRuntime: 'automatic', // Use React 17+ automatic JSX transform
  }),
],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  optimizeDeps: {
    include: ["firebase", "firebase/auth", "firebase/firestore"],
    exclude: ["@anthropic-ai/sdk", "ws", "bufferutil"],
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    target: "es2020",
    minify: "esbuild",
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // ✅ ES modules format - better TDZ handling
        format: 'es',
        // ✅ Simplified output - no aggressive code generation that causes TDZ issues
        interop: 'auto',
        // ✅ Ensure proper module boundaries to prevent TDZ errors
        // This prevents circular dependencies and ensures proper initialization order
        preserveModules: false,
        
        // Keep all third-party deps in one vendor chunk.
        // This avoids React initialization order issues seen with SES/lockdown environments
        // (e.g. "React is undefined" from use-sync-external-store shim).
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          return null;
        },
        chunkFileNames: "js/[name]-[hash:8].js",
        entryFileNames: "js/[name]-[hash:8].js",
        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name?.split(".").pop() || "";
          if (/png|jpe?g|svg|gif|webp|ico/i.test(ext)) return "images/[name]-[hash:8][extname]";
          if (/woff2?|eot|ttf|otf/i.test(ext)) return "fonts/[name]-[hash:8][extname]";
          return "assets/[name]-[hash:8][extname]";
        },
      },
      onwarn(warning, warn) {
        if (warning.code === "CIRCULAR_DEPENDENCY") return;
        warn(warning);
      },
    },
  },
  server: {
    hmr: { overlay: true },
  },
});
