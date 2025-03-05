import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // 1) Set base to match your subfolder path
  base: "/aposto-chatbot/",

  // 2) Keep your existing plugins
  plugins: [react(), tailwindcss()],
})