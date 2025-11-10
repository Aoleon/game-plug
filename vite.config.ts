import { defineConfig, splitVendorChunkPlugin, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const isProduction = process.env.NODE_ENV === "production";
const devPlugins: PluginOption[] = [];

if (!isProduction) {
  devPlugins.push(runtimeErrorOverlay());

  if (process.env.REPL_ID !== undefined) {
    devPlugins.push(
      await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer()),
    );
  }
}

export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    ...devPlugins,
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
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("lucide-react")) {
            return "vendor-icons";
          }

          if (id.includes("@radix-ui")) {
            return "vendor-radix";
          }

          if (id.includes("@tanstack/react-query")) {
            return "vendor-react-query";
          }

          if (id.includes("framer-motion")) {
            return "vendor-motion";
          }

          if (id.includes("qrcode.react")) {
            return "vendor-qrcode";
          }

          if (id.includes("recharts")) {
            return "vendor-charts";
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
  esbuild: {
    drop: isProduction ? ["console", "debugger"] : [],
  },
});
