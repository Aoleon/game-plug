import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
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
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes("node_modules")) {
            // React and React DOM
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            // Framer Motion (heavy library)
            if (id.includes("framer-motion")) {
              return "framer-motion";
            }
            // Radix UI components
            if (id.includes("@radix-ui")) {
              return "radix-ui";
            }
            // TanStack Query
            if (id.includes("@tanstack/react-query")) {
              return "react-query";
            }
            // Recharts (heavy charting library)
            if (id.includes("recharts")) {
              return "recharts";
            }
            // Other large libraries
            if (id.includes("lucide-react") || id.includes("date-fns")) {
              return "utils";
            }
            // All other node_modules
            return "vendor";
          }
        },
        // Optimize chunk size
        chunkSizeWarningLimit: 1000,
      },
    },
    // Enable minification
    minify: "esbuild",
    // Source maps for production debugging (can be disabled for smaller bundles)
    sourcemap: false,
    // Target modern browsers for smaller bundles
    target: "esnext",
    // CSS code splitting
    cssCodeSplit: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
