import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "XDashboard",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
    },
    cssCodeSplit: false, // ✅ one dist/xdashboard.css (good for a UI lib)
    rollupOptions: {
      external: [
        "@xpell/ui",
        "@xpell/core"
      ],
      output: {
        exports: "named",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "xdashboard.css";
          }

          return "[name][extname]";
        },
      },
    },
  },
});
