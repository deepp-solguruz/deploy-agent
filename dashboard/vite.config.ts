import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/task': 'http://localhost:8000',
            '/approve': 'http://localhost:8000',
            '/files': 'http://localhost:8000',
            '/rollback': 'http://localhost:8000',
        }
    }
})
