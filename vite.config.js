import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "tailwindcss"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use base path from environment variable
  // - Vercel: base = "/" (mặc định)
  // - GitHub Pages: set VITE_BASE_PATH="/twilio-sms-web" trong .env hoặc Vercel env vars
  //base: env.VITE_BASE_PATH || "/",
  base: "/twilio-sms-web",
  server: {
    port: 3000,
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
})
