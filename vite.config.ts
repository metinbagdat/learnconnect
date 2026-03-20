import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
  react({
    jsxRuntime: 'automatic',
  }),
],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  // Use client/ as Vite root so client/index.html loads React (root index.html is legacy static page)
  root: path.resolve(__dirname, "client"),
  optimizeDeps: {
    exclude: ["firebase", "firebase/auth", "firebase/firestore", "firebase/app", "firebase/analytics", "@anthropic-ai/sdk", "ws", "bufferutil"],
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
        format: "es",
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            return "vendor";
          }
          return undefined;
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
    host: "0.0.0.0",
    port: 5173,
    hmr: { 
      host: "localhost",
      port: 5173,
      protocol: "ws"
    },
  },
});
