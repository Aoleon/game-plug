import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ command }) => {
  const plugins = [react(), runtimeErrorOverlay()];

  if (command === "serve" && process.env.REPL_ID !== undefined) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer());
  }

  const isBuild = command === "build";

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    modulePreload: {
      polyfill: false,
    },
    esbuild: {
      drop: isBuild ? ["console", "debugger"] : [],
    },
    optimizeDeps: {
      include: ["@tanstack/react-query", "wouter", "framer-motion"],
    },
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            if (id.includes("@tanstack/react-query")) {
              return "vendor-react-query";
            }
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("wouter")) {
              return "vendor-router";
            }
            if (/[\\/]node_modules[\\/](react|react-dom)[\\/]/.test(id)) {
              return "vendor-react";
            }

            return "vendor";
          },
        },
      },
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
