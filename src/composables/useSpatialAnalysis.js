/**
 * useSpatialAnalysis.js
 * 空间分析功能 Composable
 * 提供缓冲区分析、最近邻分析等功能
 */

import { ref, computed } from 'vue'
import * as turf from '@turf/turf'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Feature } from 'ol'
import { Point, Polygon } from 'ol/geom'

/**
 * 空间分析功能
 * @param {Object} options - 配置选项
 * @param {Ref} options.map - 地图实例
 * @param {Ref} options.poiList - POI列表
 * @returns {Object} 空间分析功能
 */
export function useSpatialAnalysis(options) {
  const { map, poiList } = options

  // 分析状态
  const isAnalyzing = ref(false)
  const analysisResult = ref(null)
  const bufferRadius = ref(1000) // 默认缓冲区半径 1000米
  const selectedCenter = ref(null) // 缓冲区中心点

  // 最近邻分析结果
  const nearestResult = ref(null)

  /**
   * 创建缓冲区
   * @param {Array} center - 中心点坐标 [lng, lat]
   * @param {Number} radius - 半径（米）
   * @returns {Object} Turf feature
   */
  function createBuffer(center, radius) {
    const point = turf.point(center)
    const buffered = turf.buffer(point, radius, { units: 'meters' })
    return buffered
  }

  /**
   * 将Turf多边形转换为OpenLayers Feature
   * @param {Object} turfPolygon - Turf多边形
   * @returns {Feature} OpenLayers Feature
   */
  function turfToOlFeature(turfPolygon) {
    const coords = turfPolygon.geometry.coordinates[0].map(coord => fromLonLat(coord))
    const polygon = new Polygon([coords])
    return new Feature({
      geometry: polygon,
      type: 'buffer'
    })
  }

  /**
   * 执行缓冲区分析
   * @param {Array} center - 中心点坐标 [lng, lat]
   * @param {Number} radius - 半径（米）
   * @returns {Object} 分析结果
   */
  function performBufferAnalysis(center, radius = bufferRadius.value) {
    if (!center || !radius) {
      console.warn('缓冲区分析需要中心点和半径')
      return null
    }

    isAnalyzing.value = true
    selectedCenter.value = center
    bufferRadius.value = radius

    try {
      // 创建缓冲区
      const buffer = createBuffer(center, radius)

      // 查找缓冲区内的POI
      const poisInBuffer = poiList.value.filter(poi => {
        const poiPoint = turf.point(poi.coordinates)
        return turf.booleanPointInPolygon(poiPoint, buffer)
      })

      // 按分类统计
      const categoryStats = {}
      poisInBuffer.forEach(poi => {
        const cat = poi.category
        if (!categoryStats[cat]) {
          categoryStats[cat] = {
            count: 0,
            name: poi.subCategory,
            color: poi.color
          }
        }
        categoryStats[cat].count++
      })

      const result = {
        center,
        radius,
        buffer,
        poisInBuffer,
        totalCount: poisInBuffer.length,
        categoryStats,
        olFeature: turfToOlFeature(buffer)
      }

      analysisResult.value = result
      isAnalyzing.value = false

      console.log(`缓冲区分析完成: 半径 ${radius}米, 找到 ${poisInBuffer.length} 个POI`)
      return result
    } catch (error) {
      console.error('缓冲区分析失败:', error)
      isAnalyzing.value = false
      return null
    }
  }

  /**
   * 查找最近的POI
   * @param {Array} center - 中心点坐标 [lng, lat]
   * @param {Number} limit - 返回数量限制
   * @returns {Array} 最近的POI列表
   */
  function findNearestPOIs(center, limit = 5) {
    if (!center || !poiList.value.length) {
      return []
    }

    const from = turf.point(center)

    // 计算距离并排序
    const poisWithDistance = poiList.value.map(poi => {
      const to = turf.point(poi.coordinates)
      const distance = turf.distance(from, to, { units: 'meters' })
      return { ...poi, distance }
    })

    // 按距离排序
    poisWithDistance.sort((a, b) => a.distance - b.distance)

    // 取前N个
    const nearest = poisWithDistance.slice(0, limit)
    nearestResult.value = nearest

    console.log(`最近邻分析完成: 找到 ${nearest.length} 个最近POI`)
    return nearest
  }

  /**
   * 计算POI密度
   * @param {Array} bounds - 边界 [minLng, minLat, maxLng, maxLat]
   * @param {Number} gridSize - 网格大小（米）
   * @returns {Array} 密度网格
   */
  function calculateDensity(bounds, gridSize = 500) {
    if (!bounds || !poiList.value.length) {
      return []
    }

    try {
      const bbox = bounds
      const cellSize = gridSize / 1000 // 转换为千米

      // 创建点集合
      const points = turf.featureCollection(
        poiList.value.map(poi => turf.point(poi.coordinates))
      )

      // 计算密度
      const densityGrid = turf.pointGrid(bbox, cellSize, { units: 'kilometers' })
      const density = turf.collect(densityGrid, points, 'density', 'density')

      console.log(`密度分析完成: 网格大小 ${gridSize}米`)
      return density
    } catch (error) {
      console.error('密度分析失败:', error)
      return []
    }
  }

  /**
   * 清除分析结果
   */
  function clearAnalysis() {
    analysisResult.value = null
    nearestResult.value = null
    selectedCenter.value = null
    console.log('分析结果已清除')
  }

  /**
   * 获取缓冲区样式
   * @returns {Object} OpenLayers样式
   */
  function getBufferStyle() {
    return {
      fill: {
        color: 'rgba(64, 158, 255, 0.2)'
      },
      stroke: {
        color: '#409EFF',
        width: 2,
        lineDash: [5, 5]
      }
    }
  }

  return {
    // 状态
    isAnalyzing,
    analysisResult,
    bufferRadius,
    selectedCenter,
    nearestResult,

    // 方法
    performBufferAnalysis,
    findNearestPOIs,
    calculateDensity,
    clearAnalysis,
    createBuffer,
    turfToOlFeature,
    getBufferStyle
  }
}
