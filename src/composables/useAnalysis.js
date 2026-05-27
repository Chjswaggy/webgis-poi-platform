/**
 * 空间分析 Composable
 * 城市POI可视化与分析平台
 * 封装热力图、缓冲区分析、核密度分析等空间分析功能
 */

import { ref, computed } from 'vue'
import { usePoiStore } from '@/stores/poiStore'
import { DEFAULT_BUFFER_RADIUS } from '@/utils/constants'
import { calculateDistance } from '@/utils/mapUtils'

/**
 * 空间分析组合式函数
 * @param {Object} mapContext - 地图上下文（来自 useMap）
 * @returns {Object} 分析相关状态和方法
 */
export function useAnalysis(mapContext) {
  const poiStore = usePoiStore()

  // 当前分析模式
  const currentMode = ref('')

  // 缓冲区半径（米）
  const bufferRadius = ref(DEFAULT_BUFFER_RADIUS)

  // 分析结果
  const analysisResult = ref(null)

  // 分析中状态
  const analyzing = ref(false)

  /**
   * 执行缓冲区分析
   * 查找指定 POI 周围指定半径内的其他 POI
   * @param {Object} centerPoi - 中心 POI
   * @param {number} radius - 缓冲区半径（米）
   * @returns {Object} 缓冲区分析结果
   */
  function bufferAnalysis(centerPoi, radius = bufferRadius.value) {
    if (!centerPoi || !centerPoi.coordinates) return null

    const centerCoord = centerPoi.coordinates
    const poisInBuffer = poiStore.filteredPoiList.filter(poi => {
      if (poi.id === centerPoi.id) return false
      const distance = calculateDistance(centerCoord, poi.coordinates)
      return distance <= radius
    })

    const result = {
      center: centerPoi,
      radius: radius,
      pois: poisInBuffer,
      count: poisInBuffer.length,
      // 按分类统计
      byCategory: {}
    }

    poisInBuffer.forEach(poi => {
      if (!result.byCategory[poi.category]) {
        result.byCategory[poi.category] = 0
      }
      result.byCategory[poi.category]++
    })

    analysisResult.value = result
    return result
  }

  /**
   * 执行最近邻分析
   * 查找距离指定 POI 最近的 N 个 POI
   * @param {Object} centerPoi - 中心 POI
   * @param {number} count - 返回数量
   * @returns {Array} 最近的 POI 列表（按距离排序）
   */
  function nearestNeighborAnalysis(centerPoi, count = 10) {
    if (!centerPoi || !centerPoi.coordinates) return []

    const centerCoord = centerPoi.coordinates
    const poisWithDistance = poiStore.filteredPoiList
      .filter(poi => poi.id !== centerPoi.id)
      .map(poi => ({
        ...poi,
        distance: calculateDistance(centerCoord, poi.coordinates)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count)

    return poisWithDistance
  }

  /**
   * 执行密度分析
   * 将地图区域划分为网格，统计每个网格中的 POI 数量
   * @param {Object} bounds - 地图边界 { minLng, minLat, maxLng, maxLat }
   * @param {number} gridSize - 网格大小（度）
   * @returns {Array} 网格数据
   */
  function densityAnalysis(bounds, gridSize = 0.01) {
    const gridData = []
    const cols = Math.ceil((bounds.maxLng - bounds.minLng) / gridSize)
    const rows = Math.ceil((bounds.maxLat - bounds.minLat) / gridSize)

    // 初始化网格
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        gridData.push({
          lng: bounds.minLng + (i + 0.5) * gridSize,
          lat: bounds.minLat + (j + 0.5) * gridSize,
          count: 0
        })
      }
    }

    // 统计每个网格中的 POI 数量
    poiStore.filteredPoiList.forEach(poi => {
      if (!poi.coordinates) return
      const col = Math.floor((poi.coordinates[0] - bounds.minLng) / gridSize)
      const row = Math.floor((poi.coordinates[1] - bounds.minLat) / gridSize)
      const index = row * cols + col
      if (index >= 0 && index < gridData.length) {
        gridData[index].count++
      }
    })

    // 过滤掉没有 POI 的网格
    return gridData.filter(cell => cell.count > 0)
  }

  /**
   * 获取分类统计饼图数据
   * @returns {Array} ECharts 饼图数据
   */
  function getCategoryPieData() {
    const stats = poiStore.categoryStats
    return Object.values(stats).map(cat => ({
      name: cat.name,
      value: cat.count,
      itemStyle: { color: cat.color }
    }))
  }

  /**
   * 获取分类统计柱状图数据
   * @returns {Object} ECharts 柱状图配置
   */
  function getCategoryBarData() {
    const stats = poiStore.categoryStats
    return {
      categories: Object.values(stats).map(cat => cat.name),
      values: Object.values(stats).map(cat => cat.count),
      colors: Object.values(stats).map(cat => cat.color)
    }
  }

  /**
   * 设置分析模式
   * @param {string} mode - 分析模式
   */
  function setAnalysisMode(mode) {
    currentMode.value = mode
    poiStore.setAnalysisMode(mode)

    // 切换模式时清除之前的分析结果
    analysisResult.value = null
  }

  /**
   * 清除分析结果
   */
  function clearAnalysis() {
    currentMode.value = ''
    analysisResult.value = null
    poiStore.setAnalysisMode('')
  }

  return {
    // 状态
    currentMode,
    bufferRadius,
    analysisResult,
    analyzing,
    // 方法
    bufferAnalysis,
    nearestNeighborAnalysis,
    densityAnalysis,
    getCategoryPieData,
    getCategoryBarData,
    setAnalysisMode,
    clearAnalysis
  }
}
