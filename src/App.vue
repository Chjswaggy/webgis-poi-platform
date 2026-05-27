<!--
  App.vue - 根组件
  城市POI可视化与分析平台
  提供整体布局框架：顶部导航 + 主内容区
-->

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-left">
        <div class="logo">
          <el-icon :size="24" color="#409EFF"><Location /></el-icon>
          <h1 class="app-title">城市POI可视化与分析平台</h1>
        </div>
      </div>
      <div class="header-right">
        <span class="header-info">
          <el-icon><InfoFilled /></el-icon>
          数据来源：模拟数据
        </span>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
/**
 * 根组件 - 提供全局布局
 * 使用顶部导航 + 内容区的经典 GIS 布局
 */
</script>

<style lang="scss" scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  height: $header-height;
  background: $bg-white;
  box-shadow: $box-shadow-light;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 1000;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: $text-secondary;
}

.app-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
