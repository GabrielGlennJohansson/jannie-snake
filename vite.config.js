// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/jannie-snake/',  // ← byt ut mot ditt faktiska reponamn
})
