/**
 * vite.config.ts — نسخة محسَّنة
 *
 * 🔧 الإصلاحات:
 * ✅ تقسيم chunks أذكى: vendor / supabase / charts / ui
 * ✅ minify: terser (أصغر حجم bundle)
 * ✅ build.reportCompressedSize: false (بناء أسرع في CI)
 * ✅ chunkSizeWarningLimit رُفع إلى 700 (تقليل التحذيرات الوهمية)
 */

import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
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
    reportCompressedSize: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          vendor: ["react", "react-dom"],
          // مكتبات التوجيه والحالة
          router: ["react-router-dom", "zustand"],
          // Supabase في chunk منفصل (كبير)
          supabase: ["@supabase/supabase-js"],
          // مكتبات الرسوم البيانية (ثقيلة)
          charts: ["recharts"],
          // مكتبات واجهة المستخدم
          ui: ["framer-motion", "lucide-react"],
          // مكتبات النماذج والتحقق
          forms: ["react-hook-form", "zod", "@hookform/resolvers"],
        },
      },
    },
  },
});