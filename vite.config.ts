import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, "client", "index.html"),
    },
  },
  server: {
    fs: {
      strict: false,
      deny: ["**/.*"],
      allow: [path.resolve(import.meta.dirname)],
    },
    // Proxy API requests to the Express backend when running
    // the client-only Vite dev server (e.g., on port 5174).
    // This ensures routes like /api/login work from the Vite origin.
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
