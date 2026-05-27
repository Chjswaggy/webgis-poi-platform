/**
 * 工具函数集合
 * 城市POI可视化与分析平台
 */

/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 需要节流的函数
 * @param {number} interval - 间隔时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, interval = 300) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

/**
 * 深拷贝对象
 * @param {*} obj - 需要深拷贝的对象
 * @returns {*} 深拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof RegExp) return new RegExp(obj)
  const clone = new obj.constructor()
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key])
    }
  }
  return clone
}

/**
 * 生成唯一 ID
 * @param {string} prefix - ID 前缀
 * @returns {string} 唯一 ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 格式化数字（添加千分位）
 * @param {number} num - 数字
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 将颜色值转换为带透明度的颜色
 * @param {string} color - 十六进制颜色值（如 #FF0000）
 * @param {number} opacity - 透明度（0-1）
 * @returns {string} rgba 颜色值
 */
export function colorWithAlpha(color, opacity) {
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * 根据分类 ID 获取分类信息
 * @param {string} categoryId - 分类 ID
 * @returns {Object|null} 分类信息
 */
export function getCategoryById(categoryId) {
  // 动态导入避免循环依赖
  const { POI_CATEGORIES } = require('./constants')
  return POI_CATEGORIES.find(cat => cat.id === categoryId) || null
}

/**
 * 数据分组
 * @param {Array} array - 数组
 * @param {string|Function} key - 分组键或函数
 * @returns {Object} 分组后的对象
 */
export function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key]
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {})
}

/**
 * 数组去重
 * @param {Array} array - 数组
 * @param {string|Function} key - 去重键或函数
 * @returns {Array} 去重后的数组
 */
export function uniqueBy(array, key) {
  const seen = new Set()
  return array.filter(item => {
    const value = typeof key === 'function' ? key(item) : item[key]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

/**
 * 休眠函数
 * @param {number} ms - 休眠时间（毫秒）
 * @returns {Promise} Promise
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 安全的 JSON 解析
 * @param {string} str - JSON 字符串
 * @param {*} defaultValue - 解析失败时的默认值
 * @returns {*} 解析结果
 */
export function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str)
  } catch (e) {
    return defaultValue
  }
}
