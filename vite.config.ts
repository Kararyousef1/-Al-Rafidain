import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  // المسار الأساسي للموقع
  // Netlify يستضيف من الجذر "/"
  // (إذا أردت GitHub Pages لاحقاً، غيّر إلى "/Al-Rafidain/" بعد إعادة تسمية المستودع)
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    // ضمان إنشاء assets بمسارات نسبية لتجنب مشاكل GitHub Pages
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
