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
    // Code splitting 优化
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vue 核心库
          if (id.includes('node_modules/vue') || id.includes('node_modules/@vue')) {
            return 'vue-vendor'
          }
          // Vue Flow 相关
          if (id.includes('node_modules/@vue-flow')) {
            return 'vue-flow'
          }
          // CodeMirror 编辑器
          if (id.includes('node_modules/@codemirror')) {
            return 'codemirror'
          }
          // 其他第三方库
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    },
    // 提高 chunk 大小警告阈值（因为 CodeMirror 和 Vue Flow 本身就比较大）
    chunkSizeWarningLimit: 600
  }
})
