/**
 * 地图工具函数
 * 城市POI可视化与分析平台
 */

import { fromLonLat, toLonLat } from 'ol/proj'
import { getDistance } from 'ol/sphere'
import { BEIJING_CENTER, DISPLAY_PROJECTION, MAP_PROJECTION } from './constants'

/**
 * WGS84 坐标转 Web Mercator (EPSG:3857)
 * @param {Array<number>} lonLat - [经度, 纬度]
 * @returns {Array<number>} [x, y] 投影坐标
 */
export function wgs84ToMercator(lonLat) {
  return fromLonLat(lonLat)
}

/**
 * Web Mercator (EPSG:3857) 转 WGS84 坐标
 * @param {Array<number>} coords - [x, y] 投影坐标
 * @returns {Array<number>} [经度, 纬度]
 */
export function mercatorToWgs84(coords) {
  return toLonLat(coords)
}

/**
 * 计算两点之间的距离（Haversine 公式）
 * @param {Array<number>} coord1 - [经度1, 纬度1]
 * @param {Array<number>} coord2 - [经度2, 纬度2]
 * @returns {number} 距离（米）
 */
export function calculateDistance(coord1, coord2) {
  return getDistance(coord1, coord2)
}

/**
 * 格式化距离显示
 * @param {number} meters - 距离（米）
 * @returns {string} 格式化后的距离字符串
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}米`
  }
  return `${(meters / 1000).toFixed(2)}公里`
}

/**
 * 计算多边形面积
 * @param {Array<Array<number>>} coordinates - 多边形顶点坐标数组 [[lng, lat], ...]
 * @returns {number} 面积（平方米）
 */
export function calculateArea(coordinates) {
  if (!coordinates || coordinates.length < 3) return 0

  // 使用球面多边形面积计算
  const R = 6371000 // 地球半径（米）
  const toRad = (deg) => (deg * Math.PI) / 180
  let total = 0

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length
    const lat1 = toRad(coordinates[i][1])
    const lat2 = toRad(coordinates[j][1])
    const dLng = toRad(coordinates[j][0] - coordinates[i][0])

    total += dLng * (2 + Math.sin(lat1) + Math.sin(lat2))
  }

  return Math.abs(total * R * R / 2)
}

/**
 * 格式化面积显示
 * @param {number} sqMeters - 面积（平方米）
 * @returns {string} 格式化后的面积字符串
 */
export function formatArea(sqMeters) {
  if (sqMeters < 10000) {
    return `${Math.round(sqMeters)}平方米`
  }
  if (sqMeters < 1000000) {
    return `${(sqMeters / 10000).toFixed(2)}公顷`
  }
  return `${(sqMeters / 1000000).toFixed(2)}平方公里`
}

/**
 * 创建圆形范围的坐标点
 * @param {Array<number>} center - 中心点 [经度, 纬度]
 * @param {number} radius - 半径（米）
 * @param {number} segments - 分段数（默认64）
 * @returns {Array<Array<number>>} 坐标点数组
 */
export function createCircleCoordinates(center, radius, segments = 64) {
  const coords = []
  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments
    const dx = radius * Math.cos(angle)
    const dy = radius * Math.sin(angle)
    // 简单的平面近似，适用于小范围
    const deltaLng = (dx / 111320) / Math.cos((center[1] * Math.PI) / 180)
    const deltaLat = dy / 110540
    coords.push([center[0] + deltaLng, center[1] + deltaLat])
  }
  return coords
}

/**
 * 判断点是否在矩形范围内
 * @param {Array<number>} point - 点坐标 [lng, lat]
 * @param {Array<number>} bounds - 边界 [minLng, minLat, maxLng, maxLat]
 * @returns {boolean} 是否在范围内
 */
export function isPointInBounds(point, bounds) {
  return (
    point[0] >= bounds[0] &&
    point[0] <= bounds[2] &&
    point[1] >= bounds[1] &&
    point[1] <= bounds[3]
  )
}

/**
 * 获取北京中心点坐标
 * @returns {Array<number>} [经度, 纬度]
 */
export function getBeijingCenter() {
  return BEIJING_CENTER
}

/**
 * 获取地图显示投影
 * @returns {string} 投影标识
 */
export function getDisplayProjection() {
  return DISPLAY_PROJECTION
}

/**
 * 获取地图数据投影
 * @returns {string} 投影标识
 */
export function getMapProjection() {
  return MAP_PROJECTION
}

/**
 * 根据缩放级别获取合适的 POI 显示密度
 * @param {number} zoom - 缩放级别
 * @returns {number} 最大显示 POI 数量
 */
export function getMaxPoiCount(zoom) {
  const densityMap = {
    4: 50,
    6: 100,
    8: 200,
    10: 500,
    12: 1000,
    14: 2000,
    16: 5000,
    18: 10000
  }
  // 找到最接近的缩放级别
  const levels = Object.keys(densityMap).map(Number).sort((a, b) => a - b)
  let maxCount = 10000
  for (const level of levels) {
    if (zoom <= level) {
      maxCount = densityMap[level]
      break
    }
  }
  return maxCount
}

/**
 * 生成 POI 特征样式
 * @param {Object} category - POI 分类信息
 * @param {boolean} isSelected - 是否选中
 * @returns {Object} OpenLayers 样式对象
 */
export function createPoiStyle(category, isSelected = false) {
  const size = isSelected ? 12 : 8
  return {
    image: {
      type: 'circle',
      radius: size,
      fill: {
        color: category.color
      },
      stroke: {
        color: '#FFFFFF',
        width: isSelected ? 3 : 2
      }
    },
    text: isSelected
      ? {
          text: category.name,
          font: '12px sans-serif',
          fill: { color: '#333333' },
          stroke: { color: '#FFFFFF', width: 2 },
          offsetY: -20
        }
      : undefined
  }
}
