/**
 * 应用入口文件
 * 城市POI可视化与分析平台
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import 'ol/ol.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 全局样式
import '@/assets/styles/global.scss'

// 根组件
import App from './App.vue'

// 路由
import router from './router'

// 创建 Vue 应用实例
const app = createApp(App)

// 注册 Pinia 状态管理
const pinia = createPinia()
app.use(pinia)

// 注册 Vue Router
app.use(router)

// 注册 Element Plus（中文语言包）
app.use(ElementPlus, {
  locale: zhCn,
  size: 'default'
})

// 全局注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 挂载应用
app.mount('#app')
