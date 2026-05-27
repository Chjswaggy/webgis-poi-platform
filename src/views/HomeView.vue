<!--
  HomeView.vue - 首页视图
  城市POI可视化与分析平台
  左侧面板 + 中间地图 + 右侧分析面板 的三栏布局
-->

<template>
  <div class="home-view">
    <!-- 左侧面板 - POI 筛选与列表 -->
    <aside class="side-panel left-panel">
      <div class="panel-section">
        <h3 class="panel-title">
          <el-icon><Search /></el-icon>
          POI 搜索
        </h3>
        <el-input
          v-model="keyword"
          placeholder="搜索 POI 名称或地址..."
          :prefix-icon="Search"
          clearable
          @input="handleSearchInput"
        />
        <div class="data-source-toggle">
          <el-radio-group v-model="dataSource" size="small" @change="handleDataSourceChange">
            <el-radio-button label="mock">模拟数据</el-radio-button>
            <el-radio-button label="realtime">真实数据</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div class="panel-section">
        <h3 class="panel-title">
          <el-icon><Filter /></el-icon>
          分类筛选
        </h3>
        <div class="category-list">
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="category-item"
            :class="{ active: activeCategories.includes(cat.id) }"
            @click="toggleCategory(cat.id)"
          >
            <span class="category-dot" :style="{ backgroundColor: cat.color }"></span>
            <span class="category-name">{{ cat.name }}</span>
            <span class="category-count">{{ getCategoryCount(cat.id) }}</span>
          </div>
        </div>
      </div>

      <div class="panel-section">
        <h3 class="panel-title">
          <el-icon><List /></el-icon>
          POI 列表
          <span class="poi-total">共 {{ filteredCount }} 个</span>
        </h3>
        <div class="poi-list">
          <div
            v-for="poi in displayPois"
            :key="poi.id"
            class="poi-item"
            :class="{ selected: selectedPoiId === poi.id }"
            @click="handlePoiClick(poi)"
          >
            <div class="poi-item-header">
              <span class="poi-name">{{ poi.name }}</span>
              <el-tag size="small" :color="getCategoryColor(poi.category)" effect="dark">
                {{ poi.subCategory }}
              </el-tag>
            </div>
            <div class="poi-item-info">{{ poi.address }}</div>
          </div>
          <el-empty v-if="displayPois.length === 0" description="暂无 POI 数据" :image-size="60" />
        </div>
      </div>
    </aside>

    <!-- 中间地图区域 -->
    <div class="map-wrapper">
      <div ref="mapContainerRef" class="map-container"></div>

      <!-- 地图工具栏 -->
      <div class="map-toolbar">
        <el-tooltip content="放大" placement="left">
          <el-button circle size="small" @click="handleZoomIn">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="缩小" placement="left">
          <el-button circle size="small" @click="handleZoomOut">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="复位" placement="left">
          <el-button circle size="small" @click="handleResetView">
            <el-icon><Aim /></el-icon>
          </el-button>
        </el-tooltip>
      </div>

      <!-- 底图切换 -->
      <div class="basemap-switcher">
        <el-select
          v-model="currentBaseMap"
          size="small"
          style="width: 130px"
          @change="changeBaseMap"
        >
          <template #prefix>
            <el-icon><MapLocation /></el-icon>
          </template>
          <el-option
            v-for="item in baseMapOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>

      <!-- 分析模式切换 -->
      <div class="analysis-toolbar">
        <el-button-group>
          <el-button
            size="small"
            :type="analysisMode === '' ? 'primary' : 'default'"
            @click="setMode('')"
          >
            <el-icon><Pointer /></el-icon> 标注
          </el-button>
          <el-button
            size="small"
            :type="analysisMode === 'heatmap' ? 'primary' : 'default'"
            @click="setMode('heatmap')"
          >
            <el-icon><Sunny /></el-icon> 热力图
          </el-button>
          <el-button
            size="small"
            :type="analysisMode === 'cluster' ? 'primary' : 'default'"
            @click="setMode('cluster')"
          >
            <el-icon><Grid /></el-icon> 聚合
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 右侧面板 - 统计与分析 -->
    <aside class="side-panel right-panel">
      <div class="panel-section">
        <h3 class="panel-title">
          <el-icon><DataAnalysis /></el-icon>
          POI 统计
        </h3>
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-value">{{ totalCount }}</div>
            <div class="stat-label">POI 总数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ categoryCount }}</div>
            <div class="stat-label">分类数</div>
          </div>
        </div>
      </div>

      <div class="panel-section">
        <h3 class="panel-title">
          <el-icon><PieChart /></el-icon>
          分类占比
        </h3>
        <div ref="pieChartRef" class="chart-container"></div>
      </div>

      <div class="panel-section">
        <h3 class="panel-title">
          <el-icon><Histogram /></el-icon>
          分类统计
        </h3>
        <div ref="barChartRef" class="chart-container"></div>
      </div>

      <!-- 空间分析面板 -->
      <div class="panel-section">
        <h3 class="panel-title">
          <el-icon><Location /></el-icon>
          缓冲区分析
        </h3>
        <div class="analysis-controls">
          <div class="radius-control">
            <span class="control-label">半径: {{ bufferRadius }}米</span>
            <el-slider v-model="bufferRadius" :min="100" :max="5000" :step="100" />
          </div>
          <div class="analysis-buttons">
            <el-button
              type="primary"
              size="small"
              :disabled="!selectedPoi"
              @click="handleBufferAnalysis"
              :loading="isAnalyzing"
            >
              <el-icon><Aim /></el-icon>
              执行分析
            </el-button>
            <el-button size="small" @click="clearBufferLayer">
              <el-icon><Delete /></el-icon>
              清除
            </el-button>
          </div>
          <div v-if="!selectedPoi" class="analysis-hint">
            <el-alert type="info" :closable="false" show-icon>
              <template #title>请先选择一个POI</template>
            </el-alert>
          </div>
        </div>

        <!-- 分析结果 -->
        <div v-if="analysisResult" class="analysis-result">
          <div class="result-summary">
            <div class="result-item">
              <span class="result-label">半径范围:</span>
              <span class="result-value">{{ analysisResult.radius }}米</span>
            </div>
            <div class="result-item">
              <span class="result-label">范围内POI:</span>
              <span class="result-value highlight">{{ analysisResult.totalCount }}个</span>
            </div>
          </div>

          <!-- 分类统计 -->
          <div v-if="Object.keys(analysisResult.categoryStats).length > 0" class="result-stats">
            <div class="stats-title">分类统计</div>
            <div class="stats-list">
              <div
                v-for="(stat, cat) in analysisResult.categoryStats"
                :key="cat"
                class="stats-item"
              >
                <span class="stats-dot" :style="{ backgroundColor: stat.color }"></span>
                <span class="stats-name">{{ stat.name }}</span>
                <span class="stats-count">{{ stat.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近邻结果 -->
        <div v-if="nearestResult && nearestResult.length > 0" class="nearest-result">
          <div class="stats-title">最近邻POI (Top 5)</div>
          <div class="nearest-list">
            <div
              v-for="(poi, index) in nearestResult"
              :key="poi.id"
              class="nearest-item"
              @click="handlePoiClick(poi)"
            >
              <span class="nearest-rank">{{ index + 1 }}</span>
              <span class="nearest-name">{{ poi.name }}</span>
              <span class="nearest-distance">{{ poi.distance.toFixed(0) }}m</span>
            </div>
          </div>
        </div>
      </div>

      <!-- POI 详情面板 -->
      <div v-if="selectedPoi" class="panel-section poi-detail">
        <h3 class="panel-title">
          <el-icon><Document /></el-icon>
          POI 详情
        </h3>
        <div class="detail-content">
          <h4 class="detail-name">{{ selectedPoi.name }}</h4>
          <div class="detail-row">
            <span class="detail-label">分类：</span>
            <el-tag size="small" :color="getCategoryColor(selectedPoi.category)" effect="dark">
              {{ selectedPoi.subCategory }}
            </el-tag>
          </div>
          <div class="detail-row">
            <span class="detail-label">地址：</span>
            <span>{{ selectedPoi.address }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">坐标：</span>
            <span>{{ selectedPoi.coordinates?.[0].toFixed(4) }}, {{ selectedPoi.coordinates?.[1].toFixed(4) }}</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Search, Filter, List, ZoomIn, ZoomOut, Aim, Pointer, Sunny, Grid, DataAnalysis, PieChart, Histogram, Document, MapLocation, Location, Delete } from '@element-plus/icons-vue'
import { usePoiStore } from '@/stores/poiStore'
import { useMap, BASE_MAPS } from '@/composables/useMap'
import { usePOI } from '@/composables/usePOI'
import { usePOILayer } from '@/composables/usePOILayer'
import { useSpatialAnalysis } from '@/composables/useSpatialAnalysis'
import { POI_CATEGORIES, BEIJING_CENTER, DEFAULT_ZOOM } from '@/utils/constants'
import * as echarts from 'echarts'
import { Style, Fill, Stroke, Circle, Text } from 'ol/style'

// ==========================================
// 地图
// ==========================================
const mapContainerRef = ref(null)
const { map, isMapReady, currentBaseMap, flyTo, getCurrentView, updateSize, changeBaseMap, getSource, getLayer, setLayerVisible } = useMap(mapContainerRef)

// 底图选项
const baseMapOptions = Object.entries(BASE_MAPS).map(([key, val]) => ({
  value: key,
  label: val.name
}))

// ==========================================
// POI 数据
// ==========================================
const poiStore = usePoiStore()
const { loadPois, handleSearch, getCategoryColor, clearFilters } = usePOI()

// 本地搜索关键词
const keyword = ref('')
const selectedPoiId = ref(null)

// 数据源模式：'mock' 模拟数据，'realtime' 高德真实数据
const dataSource = ref('mock')

// 分析模式
const analysisMode = ref('')

// 分类列表
const categories = POI_CATEGORIES

// 当前激活的分类
const activeCategories = computed(() => poiStore.activeCategories)

// 筛选后的 POI
const filteredPois = computed(() => poiStore.filteredPoiList)

// 显示的 POI 列表（限制数量避免性能问题）
const displayPois = computed(() => filteredPois.value.slice(0, 100))

// 筛选后总数
const filteredCount = computed(() => poiStore.filteredCount)

// POI 总数
const totalCount = computed(() => poiStore.totalPoiCount)

// ==========================================
// POI 图层
// ==========================================
const poiSource = computed(() => getSource('poiLayer'))

const {
  initPOILayer,
  renderPOIs,
  flyToPOI,
  popupVisible
} = usePOILayer({
  map,
  poiSource,
  onSelectPOI: (poi) => {
    poiStore.selectPoi(poi)
    selectedPoiId.value = poi.id
  }
})

// ==========================================
// 空间分析
// ==========================================
const {
  isAnalyzing,
  analysisResult,
  bufferRadius,
  selectedCenter,
  nearestResult,
  performBufferAnalysis,
  findNearestPOIs,
  clearAnalysis
} = useSpatialAnalysis({
  map,
  poiList: filteredPois
})

// 监听筛选后的 POI 变化，重新渲染地图
watch(filteredPois, (newPois) => {
  if (newPois && newPois.length > 0) {
    // 根据当前模式渲染对应图层
    if (analysisMode.value === 'heatmap') {
      renderHeatmap(newPois)
    } else if (analysisMode.value === 'cluster') {
      renderCluster(newPois)
    } else {
      renderPOIs(newPois)
    }
  }
}, { deep: true })

// 分类数
const categoryCount = computed(() => categories.length)

// 选中的 POI
const selectedPoi = computed(() => poiStore.selectedPoi)

// ==========================================
// 热力图和聚合图层渲染
// ==========================================
import { Feature } from 'ol'
import { Point } from 'ol/geom'
import { fromLonLat } from 'ol/proj'

/**
 * 渲染热力图
 * @param {Array} poiList
 */
function renderHeatmap(poiList) {
  console.log('renderHeatmap called, poiList length:', poiList.length)
  const heatmapSource = getSource('heatmapLayer')
  console.log('heatmapSource:', heatmapSource)
  if (!heatmapSource) {
    console.error('热力图源不存在')
    return
  }

  heatmapSource.clear()

  const features = poiList.map(poi => {
    return new Feature({
      geometry: new Point(fromLonLat(poi.coordinates)),
      weight: 1
    })
  })

  heatmapSource.addFeatures(features)
  console.log(`热力图渲染 ${features.length} 个点`)
}

/**
 * 渲染聚合图层
 * @param {Array} poiList
 */
function renderCluster(poiList) {
  // 通过 getLayer 获取图层，再获取 ClusterSource，再获取底层 VectorSource
  const layer = getLayer('clusterLayer')
  if (!layer) {
    console.error('聚合图层不存在')
    return
  }

  const source = layer.getSource()
  if (!source || typeof source.getSource !== 'function') {
    console.error('聚合源不正确，期望 ClusterSource')
    return
  }

  const baseSource = source.getSource()
  if (!baseSource) return

  baseSource.clear()

  const features = poiList.map(poi => {
    return new Feature({
      geometry: new Point(fromLonLat(poi.coordinates)),
      poiData: poi
    })
  })

  baseSource.addFeatures(features)
  console.log(`聚合图层渲染 ${features.length} 个点`)
}

// ==========================================
// 图表
// ==========================================
const pieChartRef = ref(null)
const barChartRef = ref(null)
let pieChart = null
let barChart = null

/**
 * 初始化饼图
 */
function initPieChart() {
  if (!pieChartRef.value) return
  pieChart = echarts.init(pieChartRef.value)
  updatePieChart()
}

/**
 * 更新饼图数据
 */
function updatePieChart() {
  if (!pieChart) return
  const stats = poiStore.categoryStats
  const data = Object.values(stats).map(cat => ({
    name: cat.name,
    value: cat.count,
    itemStyle: { color: cat.color }
  }))

  pieChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 11 }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 12, fontWeight: 'bold' }
      },
      data: data
    }]
  })
}

/**
 * 初始化柱状图
 */
function initBarChart() {
  if (!barChartRef.value) return
  barChart = echarts.init(barChartRef.value)
  updateBarChart()
}

/**
 * 更新柱状图数据
 */
function updateBarChart() {
  if (!barChart) return
  const stats = poiStore.categoryStats
  const cats = Object.values(stats)

  barChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: 10,
      right: 10,
      bottom: 5,
      top: 10,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: cats.map(c => c.name),
      axisLabel: { fontSize: 10, interval: 0 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10 }
    },
    series: [{
      type: 'bar',
      data: cats.map(c => ({
        value: c.count,
        itemStyle: { color: c.color, borderRadius: [4, 4, 0, 0] }
      })),
      barWidth: '50%'
    }]
  })
}

// ==========================================
// 事件处理
// ==========================================

/**
 * 搜索输入处理
 */
function handleSearchInput(val) {
  handleSearch(val)
}

/**
 * 数据源切换处理
 */
async function handleDataSourceChange(mode) {
  console.log('切换数据源到:', mode)
  await loadPois({ source: mode })
}

/**
 * 切换分类
 */
function toggleCategory(categoryId) {
  poiStore.toggleCategory(categoryId)
}

/**
 * 获取分类 POI 数量
 */
function getCategoryCount(categoryId) {
  return poiStore.categoryStats[categoryId]?.count || 0
}

/**
 * 点击 POI 项
 */
function handlePoiClick(poi) {
  selectedPoiId.value = poi.id
  poiStore.selectPoi(poi)
  // 飞行到 POI 位置并显示弹窗
  flyToPOI(poi.id, 16)
}

/**
 * 设置分析模式
 */
function setMode(mode) {
  console.log('setMode called:', mode)
  analysisMode.value = mode
  poiStore.setAnalysisMode(mode)

  // 清除之前的分析结果
  clearBufferLayer()

  // 切换图层显示
  if (mode === 'heatmap') {
    console.log('切换到热力图模式')
    // 显示热力图，隐藏 POI 图层
    setLayerVisible('poiLayer', false)
    setLayerVisible('heatmapLayer', true)
    setLayerVisible('clusterLayer', false)
    // 渲染热力图
    console.log('调用 renderHeatmap, POI数量:', filteredPois.value.length)
    renderHeatmap(filteredPois.value)
  } else if (mode === 'cluster') {
    // 显示聚合图层，隐藏 POI 和热力图
    setLayerVisible('poiLayer', false)
    setLayerVisible('heatmapLayer', false)
    setLayerVisible('clusterLayer', true)
    // 渲染聚合图层
    renderCluster(filteredPois.value)
  } else {
    // 默认标注模式：显示 POI，隐藏热力图和聚合
    setLayerVisible('poiLayer', true)
    setLayerVisible('heatmapLayer', false)
    setLayerVisible('clusterLayer', false)
    // 重新渲染 POI
    renderPOIs(filteredPois.value)
  }
}

/**
 * 执行缓冲区分析
 */
function handleBufferAnalysis() {
  if (!selectedPoi.value) {
    alert('请先选择一个POI作为中心点')
    return
  }
  const center = selectedPoi.value.coordinates
  const result = performBufferAnalysis(center, bufferRadius.value)

  if (result && result.olFeature) {
    // 显示缓冲区
    const bufferSource = getSource('bufferLayer')
    if (bufferSource) {
      bufferSource.clear()
      bufferSource.addFeature(result.olFeature)

      // 设置缓冲区样式
      const bufferLayer = getLayer('bufferLayer')
      if (bufferLayer) {
        bufferLayer.setStyle(new Style({
          fill: new Fill({ color: 'rgba(64, 158, 255, 0.2)' }),
          stroke: new Stroke({ color: '#409EFF', width: 2, lineDash: [5, 5] })
        }))
      }
    }

    // 查找最近邻
    findNearestPOIs(center, 5)
  }
}

/**
 * 清除缓冲区图层
 */
function clearBufferLayer() {
  const bufferSource = getSource('bufferLayer')
  if (bufferSource) {
    bufferSource.clear()
  }
  clearAnalysis()
}

/**
 * 地图放大
 */
function handleZoomIn() {
  if (!map.value) return
  const view = map.value.getView()
  const zoom = view.getZoom()
  view.setZoom(zoom + 1)
}

/**
 * 地图缩小
 */
function handleZoomOut() {
  if (!map.value) return
  const view = map.value.getView()
  const zoom = view.getZoom()
  view.setZoom(zoom - 1)
}

/**
 * 复位地图视图
 */
function handleResetView() {
  flyTo(BEIJING_CENTER, DEFAULT_ZOOM)
}

// ==========================================
// 生命周期
// ==========================================

onMounted(async () => {
  // 加载 POI 数据
  await loadPois()

  // 等待 DOM 更新后初始化
  await nextTick()

  // 初始化 POI 图层
  initPOILayer()

  // 初始化图表
  initPieChart()
  initBarChart()

  // 初始渲染 POI 到地图
  if (filteredPois.value.length > 0) {
    renderPOIs(filteredPois.value)
  }
})

// 监听 POI 数据变化，更新图表
watch(
  () => [poiStore.poiList, poiStore.activeCategories, poiStore.searchKeyword],
  () => {
    updatePieChart()
    updateBarChart()
  },
  { deep: true }
)

// 窗口大小变化时更新图表和地图
window.addEventListener('resize', () => {
  pieChart?.resize()
  barChart?.resize()
  updateSize()
})
</script>

<style lang="scss" scoped>
.home-view {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
  background: $bg-color;
}

.data-source-toggle {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

// ---------- 侧边面板通用样式 ----------
.side-panel {
  width: $sidebar-width;
  background: $bg-white;
  box-shadow: $box-shadow-light;
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
  z-index: 100;
  transition: width $transition-duration $ease-out;
  animation: slideInLeft 0.4s $ease-out;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;

    &:hover {
      background: rgba(0, 0, 0, 0.2);
    }
  }
}

.panel-section {
  padding: 16px;
  border-bottom: 1px solid $border-lighter;
  animation: fadeIn 0.3s $ease-out;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.5);
  }
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12px;
  user-select: none;

  .el-icon {
    color: $primary-color;
    font-size: 16px;
    transition: transform $transition-fast;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.poi-total {
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  color: $text-secondary;
  background: $bg-color;
  padding: 2px 8px;
  border-radius: 10px;
}

// ---------- 左侧面板 ----------
.left-panel {
  border-right: 1px solid $border-lighter;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: $border-radius-lg;
  cursor: pointer;
  transition: all $transition-fast $ease-out;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 3px;
    height: 100%;
    background: transparent;
    transition: background $transition-fast;
  }

  &:hover {
    background-color: $bg-hover;
    transform: translateX(2px);

    &::before {
      background: $primary-color;
    }
  }

  &.active {
    background-color: $bg-hover;

    &::before {
      background: $primary-color;
    }
  }
}

.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
  transition: transform $transition-fast;

  .category-item:hover & {
    transform: scale(1.2);
  }
}

.category-name {
  flex: 1;
  font-size: 13px;
  color: $text-regular;
  transition: color $transition-fast;

  .category-item:hover & {
    color: $text-primary;
  }
}

.category-count {
  font-size: 11px;
  color: $text-secondary;
  background: $bg-color;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  transition: all $transition-fast;

  .category-item:hover & {
    background: rgba(64, 158, 255, 0.15);
    color: $primary-color;
  }
}

.poi-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.poi-item {
  padding: 12px;
  border-radius: $border-radius-lg;
  cursor: pointer;
  border: 1px solid transparent;
  background: $bg-white;
  transition: all $transition-fast $ease-out;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 0;
    height: 100%;
    background: linear-gradient(90deg, rgba(64, 158, 255, 0.1), transparent);
    transition: width $transition-fast;
    border-radius: $border-radius-lg;
    pointer-events: none;
  }

  &:hover {
    background-color: $bg-hover;
    border-color: $border-light;
    transform: translateX(4px);
    box-shadow: $box-shadow-light;

    &::after {
      width: 100%;
    }
  }

  &.selected {
    background-color: $bg-hover;
    border-color: $primary-color;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
}

.poi-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.poi-name {
  font-size: 13px;
  font-weight: 500;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.poi-item-info {
  font-size: 12px;
  color: $text-secondary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ---------- 中间地图区域 ----------
.map-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #e8f4f8 0%, #f5f7fa 100%);
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-toolbar {
  position: absolute;
  right: 16px;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: $map-controls-zindex;
  animation: slideInRight 0.4s $ease-out 0.2s both;

  .el-button {
    box-shadow: $box-shadow-light;
    transition: all $transition-fast $ease-out;

    &:hover {
      transform: scale(1.1);
      box-shadow: $box-shadow;
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.analysis-toolbar {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: $map-controls-zindex;
  animation: slideUp 0.4s $ease-out 0.3s both;

  .el-button-group {
    box-shadow: $box-shadow;
    border-radius: $border-radius-lg;
    overflow: hidden;
  }
}

.basemap-switcher {
  position: absolute;
  left: 16px;
  bottom: 24px;
  z-index: $map-controls-zindex;
  animation: slideInLeft 0.4s $ease-out 0.3s both;

  .el-select {
    box-shadow: $box-shadow-light;
  }
}

// ---------- 右侧面板 ----------
.right-panel {
  border-left: 1px solid $border-lighter;
  animation: slideInRight 0.4s $ease-out;
}

.stat-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-card {
  text-align: center;
  padding: 16px 12px;
  background: linear-gradient(135deg, $bg-color 0%, $bg-white 100%);
  border-radius: $border-radius-lg;
  border: 1px solid $border-lighter;
  transition: all $transition-fast $ease-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $box-shadow-light;
    border-color: $border-light;
  }
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: $primary-color;
  line-height: 1;
  transition: transform $transition-fast;

  .stat-card:hover & {
    transform: scale(1.05);
  }
}

.stat-label {
  font-size: 12px;
  color: $text-secondary;
  margin-top: 6px;
}

.chart-container {
  width: 100%;
  height: 200px;
  border-radius: $border-radius;
  overflow: hidden;
}

// ---------- POI 详情 ----------
.poi-detail {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, transparent 100%);
  border-radius: $border-radius-lg;
  margin: 8px;
  padding: 12px !important;

  .detail-content {
    padding: 8px 0;
  }
}

.detail-name {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid $primary-color;
  display: inline-block;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: $text-regular;
  padding: 4px 0;
  transition: background $transition-fast;
  border-radius: $border-radius;

  &:hover {
    background: rgba(64, 158, 255, 0.05);
    padding-left: 4px;
  }
}

.detail-label {
  color: $text-secondary;
  flex-shrink: 0;
  min-width: 50px;
}

// ---------- 空间分析样式 ----------
.analysis-controls {
  .radius-control {
    margin-bottom: 12px;
    padding: 8px;
    background: $bg-color;
    border-radius: $border-radius;

    .control-label {
      display: block;
      font-size: 12px;
      color: $text-secondary;
      margin-bottom: 8px;
      font-weight: 500;
    }
  }

  .analysis-buttons {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;

    .el-button {
      flex: 1;
      transition: all $transition-fast $ease-out;

      &:not(:disabled):hover {
        transform: translateY(-2px);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .analysis-hint {
    margin-top: 8px;
    animation: fadeIn 0.3s $ease-out;
  }
}

.analysis-result {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid $border-light;
  animation: slideUp 0.4s $ease-out;

  .result-summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
    padding: 12px;
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, transparent 100%);
    border-radius: $border-radius-lg;

    .result-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      padding: 4px 0;

      .result-label {
        color: $text-secondary;
      }

      .result-value {
        color: $text-regular;
        font-weight: 500;

        &.highlight {
          color: $primary-color;
          font-size: 18px;
          font-weight: 700;
        }
      }
    }
  }
}

.result-stats,
.nearest-result {
  .stats-title {
    font-size: 12px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid $primary-color;
    display: inline-block;
  }

  .stats-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stats-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    padding: 6px 8px;
    border-radius: $border-radius;
    transition: all $transition-fast;

    &:hover {
      background: $bg-hover;
    }

    .stats-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .stats-name {
      flex: 1;
      color: $text-regular;
    }

    .stats-count {
      color: $text-secondary;
      font-weight: 600;
      background: $bg-color;
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 11px;
    }
  }
}

.nearest-list {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .nearest-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: $bg-color;
    border-radius: $border-radius-lg;
    cursor: pointer;
    transition: all $transition-fast $ease-out;
    border: 1px solid transparent;

    &:hover {
      background: $bg-hover;
      border-color: $primary-color;
      transform: translateX(4px);
      box-shadow: $box-shadow-light;
    }

    .nearest-rank {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, $primary-color 0%, $primary-color-dark 100%);
      color: white;
      font-size: 11px;
      font-weight: 700;
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
    }

    .nearest-name {
      flex: 1;
      font-size: 12px;
      color: $text-regular;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
    }

    .nearest-distance {
      font-size: 11px;
      color: $text-secondary;
      font-weight: 600;
      background: rgba(64, 158, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
    }
  }
}

// ---------- 响应式调整 ----------
@media (max-width: $breakpoint-lg) {
  .side-panel {
    width: $sidebar-width-sm;
  }
}

@media (max-width: $breakpoint-md) {
  .home-view {
    flex-direction: column;
  }

  .side-panel {
    width: 100%;
    height: auto;
    max-height: 250px;
    border: none;
    border-bottom: 1px solid $border-lighter;
  }

  .left-panel {
    order: 1;
  }

  .map-wrapper {
    order: 2;
    height: calc(100% - 500px);
    min-height: 300px;
  }

  .right-panel {
    order: 3;
  }
}

@media (max-width: $breakpoint-sm) {
  .panel-section {
    padding: 12px;
  }

  .panel-title {
    font-size: 13px;
  }

  .stat-value {
    font-size: 22px;
  }

  .poi-list {
    max-height: 200px;
  }
}
</style>
