import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "tailwindcss"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use base path from environment variable, default to "/" for Vercel
  // Set VITE_BASE_PATH="/twilio-sms-web" for GitHub Pages
  base: import.meta.env.VITE_BASE_PATH || "/",
  server: {
    port: 3000,
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
})
