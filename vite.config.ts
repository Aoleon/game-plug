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
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer les bibliothèques volumineuses dans leurs propres chunks
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'router-vendor': ['wouter'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
          'animation-vendor': ['framer-motion'],
          'icons-vendor': ['lucide-react'],
          'charts-vendor': ['recharts'],
        },
        // Optimiser les noms de chunks pour le cache
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Optimisations de minification
    minify: 'esbuild',
    target: 'esnext',
    // Augmenter la limite de taille pour les warnings (en KB)
    chunkSizeWarningLimit: 1000,
    // Activer la compression CSS
    cssMinify: true,
  },
  // Optimisations pour le développement
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wouter',
      '@tanstack/react-query',
    ],
    exclude: ['@replit/vite-plugin-cartographer'],
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
