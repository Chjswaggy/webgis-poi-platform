import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// GitHub Pages deployment configuration
const repoName = 'webgis-poi-platform' // 替换为你的仓库名称

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 全局注入 SCSS 变量，所有组件中可直接使用 $primary-color 等变量
        additionalData: `@use "@/assets/styles/variables" as *;`
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    // GitHub Pages 部署时使用相对路径
    base: './',
    // 构建优化：手动分包，分离大型第三方库
    rollupOptions: {
      output: {
        manualChunks: {
          // OpenLayers 单独打包
          'vendor-ol': ['ol'],
          // ECharts 单独打包
          'vendor-echarts': ['echarts'],
          // Turf.js 单独打包
          'vendor-turf': ['@turf/turf'],
          // Vue 核心生态
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          // Element Plus 单独打包
          'vendor-element': ['element-plus', '@element-plus/icons-vue']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
