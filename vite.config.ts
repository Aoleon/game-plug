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
    // Optimisations de build pour réduire la taille du bundle
    minify: "esbuild", // Plus rapide que terser
    target: "es2015", // Support des navigateurs modernes
    cssCodeSplit: true, // Split CSS pour chaque chunk
    sourcemap: false, // Désactiver les sourcemaps en production pour réduire la taille
    rollupOptions: {
      output: {
        // Stratégie de chunking optimisée
        manualChunks: (id) => {
          // Séparer les dépendances lourdes dans leurs propres chunks
          if (id.includes("node_modules")) {
            // Framer Motion dans son propre chunk
            if (id.includes("framer-motion")) {
              return "vendor-framer-motion";
            }
            // Recharts dans son propre chunk
            if (id.includes("recharts")) {
              return "vendor-recharts";
            }
            // Radix UI dans un chunk séparé
            if (id.includes("@radix-ui")) {
              return "vendor-radix-ui";
            }
            // React Query dans un chunk séparé
            if (id.includes("@tanstack/react-query")) {
              return "vendor-react-query";
            }
            // Autres dépendances React dans un chunk vendor
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            // Autres dépendances dans un chunk vendor général
            return "vendor";
          }
        },
        // Optimisation des noms de chunks pour le cache
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
    // Augmenter la limite de taille des chunks pour éviter les warnings
    chunkSizeWarningLimit: 1000,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  // Optimisations pour le développement
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
    ],
    exclude: ["framer-motion", "recharts"], // Charger à la demande
  },
});
