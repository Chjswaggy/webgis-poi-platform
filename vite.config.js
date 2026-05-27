import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 部署配置 - 使用仓库名称作为基础路径
  base: '/webgis-poi-platform/',
  
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
