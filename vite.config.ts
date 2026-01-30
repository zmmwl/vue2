import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5172
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/styles/variables.scss" as *;`
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    // 启用并行构建
    parallel: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将 Monaco Editor 分离到单独的 chunk
          if (id.includes('monaco-editor')) {
            return 'monaco-editor'
          }
        }
      }
    },
    // 减小 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000
  }
})
