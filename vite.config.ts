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
  build: {
    // 使用 esbuild 进行压缩（比 terser 快 10-100 倍）
    minify: 'esbuild',
    // 启用 CSS 代码拆分
    cssCodeSplit: true,
    // 目标浏览器 - 使用 esnext 以获得最佳性能
    target: 'esnext',
    // 禁用 source map 生成以加快构建速度
    sourcemap: false,
    // 压缩选项
    esbuild: {
      // 移除 console 和 debugger
      drop: ['console', 'debugger'],
      // 移除 JSX 注释
      legalComments: 'none'
    },
    // Rollup 选项
    rollupOptions: {
      // 外部化 Monaco Editor - 从 CDN 加载，不参与构建
      external: ['monaco-editor'],
      output: {
        // 手动代码拆分
        manualChunks(id) {
          // 将 node_modules 中的依赖打包到 vendor（排除 monaco-editor）
          if (id.includes('node_modules')) {
            // vue-flow 相关依赖单独打包
            if (id.includes('@vue-flow')) {
              return 'vue-flow'
            }
            // 其他第三方依赖
            return 'vendor'
          }
        },
        // 资源文件命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        // 全局变量映射（用于 external 的包）
        globals: {
          'monaco-editor': 'monaco'
        }
      }
    },
    // 依赖预构建优化
    optimizeDeps: {
      // 使用 esbuild 预构建
      esbuildOptions: {
        target: 'esnext'
      },
      include: [
        'vue',
        '@vue-flow/core',
        '@vue-flow/background',
        '@vue-flow/controls',
        '@vue-flow/minimap'
      ],
      // 排除不需要预构建的包
      exclude: ['monaco-editor']
    },
    // 减少 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 空格换行符规范化
    logLevel: 'error'
  },
  css: {
    // 禁用 CSS source map
    devSourcemap: false,
    preprocessorOptions: {
      scss: {
        // 注入全局变量（延迟执行以减少解析开销）
        additionalData: `@use "@/assets/styles/variables.scss" as *;`
      }
    }
  },
  // 减少 ESBuild 打包时的日志
  clearScreen: false
})
