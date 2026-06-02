import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  // المسار الأساسي للموقع على GitHub Pages
  // يجب أن يطابق اسم الـ repo بدون شرطة في البداية
  // (يستخدم GitHub Pages: https://username.github.io/REPO_NAME/)
  base: "/Al-Rafidain/",
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
