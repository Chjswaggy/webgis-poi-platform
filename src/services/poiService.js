/**
 * POI 服务层
 * 城市POI可视化与分析平台
 */

import axios from 'axios'
import { AMAP_API_KEY, AMAP_API_BASE } from '@/utils/constants'

// 创建 axios 实例
const request = axios.create({
  baseURL: '',
  timeout: 15000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('请求失败:', error.message)
    return Promise.reject(error)
  }
)

/**
 * 高德 POI 类型编码到本地分类的映射
 */
const TYPE_MAPPING = {
  '050000': 'food',      // 餐饮服务
  '060000': 'shopping',  // 购物服务
  '100000': 'hotel',     // 住宿服务
  '150000': 'transport', // 交通设施服务
  '141200': 'education', // 科教文化服务
  '090000': 'medical'    // 医疗保健服务
}

/**
 * POI 服务类
 */
class PoiService {
  /**
   * 获取所有 POI 数据（从本地 JSON 文件）
   * 使用 fetch 加载 public 目录下的静态文件
   * @returns {Promise<Array>} POI 数据数组
   */
  static async fetchAllPois() {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/pois.json`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data.features || data.data || data
    } catch (error) {
      console.error('获取 POI 数据失败:', error)
      throw new Error('获取 POI 数据失败，请检查网络连接')
    }
  }

  /**
   * 从高德地图获取真实 POI 数据
   * @param {Object} options - 搜索选项
   * @param {string} options.city - 城市名称，默认北京
   * @param {string} options.types - 高德 POI 类型编码
   * @param {number} options.offset - 每页数量，默认25
   * @param {number} options.page - 页码，默认1
   * @param {string} options.keywords - 关键词
   * @returns {Promise<Array>} POI 数据数组
   */
  static async fetchPoisFromAmap(options = {}) {
    const {
      city = '北京',
      types = '',
      offset = 25,
      page = 1,
      keywords = ''
    } = options

    try {
      const params = {
        key: AMAP_API_KEY,
        city,
        offset,
        page,
        output: 'JSON',
        extensions: 'all'
      }

      if (types) {
        params.types = types
      }
      if (keywords) {
        params.keywords = keywords
      }

      const response = await axios.get(`${AMAP_API_BASE}/place/text`, { params })

      if (response.data.status === '1') {
        const pois = response.data.pois || []
        console.log(`高德 API 返回 ${pois.length} 条 POI，总计 ${response.data.count} 条`)

        return pois.map((poi, index) => {
          // 解析坐标
          const [lng, lat] = poi.location ? poi.location.split(',').map(Number) : [0, 0]

          // 映射分类
          const typeCode = poi.type?.split(';')[0] || ''
          const category = _mapAmapTypeToLocal(typeCode)

          return {
            id: poi.id || `amap_${Date.now()}_${index}`,
            name: poi.name || '',
            category: category,
            subCategory: poi.type?.split(';')[0] || poi.type || '',
            address: poi.address || '未知地址',
            coordinates: [lng, lat],
            rating: poi.biz_ext?.rating || '',
            createTime: new Date().toISOString().slice(0, 10)
          }
        })
      }

      console.warn('高德 API 返回失败:', response.data)
      return []
    } catch (error) {
      console.error('从高德获取 POI 失败:', error)
      throw error
    }
  }

  /**
   * 批量获取多个分类的 POI 数据
   * @param {string} city - 城市
   * @param {number} perCategory - 每个分类的数量
   * @returns {Promise<Array>} 合并后的 POI 数组
   */
  static async fetchMultipleCategories(city = '北京', perCategory = 30) {
    const categoryTypes = [
      { category: 'food', types: '050000', name: '餐饮' },
      { category: 'hotel', types: '100000', name: '住宿' },
      { category: 'transport', types: '150000', name: '交通' },
      { category: 'shopping', types: '060000', name: '购物' },
      { category: 'education', types: '141200', name: '教育' },
      { category: 'medical', types: '090000', name: '医疗' }
    ]

    const allPois = []
    let globalId = 1

    for (const cat of categoryTypes) {
      try {
        const pois = await PoiService.fetchPoisFromAmap({
          city,
          types: cat.types,
          offset: perCategory,
          page: 1
        })

        pois.forEach(poi => {
          poi.id = globalId++
          poi.category = cat.category
          allPois.push(poi)
        })

        console.log(`获取 ${cat.name} POI: ${pois.length} 条`)
      } catch (error) {
        console.error(`获取 ${cat.name} POI 失败:`, error)
      }
    }

    return allPois
  }

  /**
   * 根据分类获取 POI 数据
   * @param {string} category - 分类 ID
   * @returns {Promise<Array>} 该分类下的 POI 数据
   */
  static async fetchPoisByCategory(category) {
    try {
      const allPois = await PoiService.fetchAllPois()
      return allPois.filter(poi => poi.category === category)
    } catch (error) {
      console.error(`获取分类 ${category} POI 失败:`, error)
      throw error
    }
  }

  /**
   * 根据 ID 获取单个 POI
   * @param {string|number} id - POI ID
   * @returns {Promise<Object|null>} POI 对象
   */
  static async fetchPoiById(id) {
    try {
      const allPois = await PoiService.fetchAllPois()
      return allPois.find(poi => poi.id === id) || null
    } catch (error) {
      console.error(`获取 POI ${id} 失败:`, error)
      throw error
    }
  }

  /**
   * 搜索 POI
   * @param {string} keyword - 搜索关键词
   * @param {Array<string>} categories - 分类筛选
   * @returns {Promise<Array>} 搜索结果
   */
  static async searchPois(keyword, categories = []) {
    try {
      let results = await PoiService.fetchAllPois()

      // 按分类筛选
      if (categories.length > 0) {
        results = results.filter(poi => categories.includes(poi.category))
      }

      // 按关键词搜索
      if (keyword && keyword.trim()) {
        const kw = keyword.trim().toLowerCase()
        results = results.filter(poi =>
          poi.name.toLowerCase().includes(kw) ||
          (poi.address && poi.address.toLowerCase().includes(kw)) ||
          (poi.subCategory && poi.subCategory.toLowerCase().includes(kw))
        )
      }

      return results
    } catch (error) {
      console.error('搜索 POI 失败:', error)
      throw error
    }
  }

  /**
   * 获取 POI 统计信息
   * @returns {Promise<Object>} 统计信息
   */
  static async fetchPoiStats() {
    try {
      const allPois = await PoiService.fetchAllPois()
      const stats = {
        total: allPois.length,
        byCategory: {},
        bySubCategory: {}
      }

      allPois.forEach(poi => {
        // 按主分类统计
        if (!stats.byCategory[poi.category]) {
          stats.byCategory[poi.category] = 0
        }
        stats.byCategory[poi.category]++

        // 按子分类统计
        if (poi.subCategory) {
          if (!stats.bySubCategory[poi.subCategory]) {
            stats.bySubCategory[poi.subCategory] = 0
          }
          stats.bySubCategory[poi.subCategory]++
        }
      })

      return stats
    } catch (error) {
      console.error('获取 POI 统计失败:', error)
      throw error
    }
  }
}

/**
 * 将高德 POI 类型编码映射为本地分类
 * @private
 */
function _mapAmapTypeToLocal(typeCode) {
  // 高德分类编码前6位
  const code6 = typeCode.substring(0, 6)

  if (TYPE_MAPPING[code6]) {
    return TYPE_MAPPING[code6]
  }

  // 更细致的匹配
  if (typeCode.includes('05')) return 'food'      // 餐饮
  if (typeCode.includes('06')) return 'shopping'  // 购物
  if (typeCode.includes('07') || typeCode.includes('10')) return 'hotel'  // 住宿
  if (typeCode.includes('15')) return 'transport' // 交通
  if (typeCode.includes('14')) return 'education' // 教育
  if (typeCode.includes('09')) return 'medical'   // 医疗

  return 'food' // 默认餐饮
}

export default PoiService
