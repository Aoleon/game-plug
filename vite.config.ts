import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ command }) => {
  const isDev = command === "serve";
  const plugins = [react()];

  if (isDev) {
    plugins.push(runtimeErrorOverlay());

    if (process.env.REPL_ID !== undefined) {
      const { cartographer } = await import("@replit/vite-plugin-cartographer");
      plugins.push(cartographer());
    }
  }

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
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("framer-motion")) return "vendor-framer-motion";
              if (id.includes("@tanstack/react-query")) return "vendor-react-query";
              if (id.includes("recharts")) return "vendor-recharts";
              if (id.includes("qrcode.react")) return "vendor-qrcode";
              if (id.includes("@radix-ui")) return "vendor-radix";
              if (id.includes("lucide-react")) return "vendor-lucide";
              if (id.includes("wouter")) return "vendor-router";
              if (id.includes("memoizee")) return "vendor-memoizee";
              return "vendor";
            }
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
