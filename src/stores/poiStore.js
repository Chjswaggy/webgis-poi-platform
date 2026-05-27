/**
 * POI 状态管理
 * 城市POI可视化与分析平台
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { POI_CATEGORIES } from '@/utils/constants'

export const usePoiStore = defineStore('poi', () => {
  // ==========================================
  // 状态定义
  // ==========================================

  // POI 数据列表
  const poiList = ref([])

  // 当前选中的 POI
  const selectedPoi = ref(null)

  // 当前激活的分类（用于筛选）
  const activeCategories = ref(POI_CATEGORIES.map(cat => cat.id))

  // 搜索关键词
  const searchKeyword = ref('')

  // 地图当前视图范围
  const mapView = ref({
    center: [116.4074, 39.9042],
    zoom: 12
  })

  // 当前分析模式
  const analysisMode = ref('') // '' | 'heatmap' | 'cluster' | 'buffer' | 'kde'

  // 加载状态
  const loading = ref(false)

  // 错误信息
  const error = ref(null)

  // ==========================================
  // 计算属性
  // ==========================================

  // 筛选后的 POI 列表
  const filteredPoiList = computed(() => {
    let result = poiList.value

    // 按分类筛选
    if (activeCategories.value.length > 0 && activeCategories.value.length < POI_CATEGORIES.length) {
      result = result.filter(poi => activeCategories.value.includes(poi.category))
    }

    // 按关键词搜索
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim().toLowerCase()
      result = result.filter(poi =>
        poi.name.toLowerCase().includes(keyword) ||
        (poi.address && poi.address.toLowerCase().includes(keyword))
      )
    }

    return result
  })

  // 各分类 POI 数量统计
  const categoryStats = computed(() => {
    const stats = {}
    POI_CATEGORIES.forEach(cat => {
      stats[cat.id] = {
        ...cat,
        count: poiList.value.filter(poi => poi.category === cat.id).length
      }
    })
    return stats
  })

  // POI 总数
  const totalPoiCount = computed(() => poiList.value.length)

  // 当前筛选后的 POI 总数
  const filteredCount = computed(() => filteredPoiList.value.length)

  // ==========================================
  // 方法
  // ==========================================

  /**
   * 设置 POI 数据
   * @param {Array} data - POI 数据数组
   */
  function setPoiList(data) {
    poiList.value = data
  }

  /**
   * 添加 POI 数据
   * @param {Array|Object} data - POI 数据或数组
   */
  function addPoi(data) {
    if (Array.isArray(data)) {
      poiList.value.push(...data)
    } else {
      poiList.value.push(data)
    }
  }

  /**
   * 选中 POI
   * @param {Object|null} poi - POI 对象
   */
  function selectPoi(poi) {
    selectedPoi.value = poi
  }

  /**
   * 切换分类激活状态
   * @param {string} categoryId - 分类 ID
   */
  function toggleCategory(categoryId) {
    const index = activeCategories.value.indexOf(categoryId)
    if (index > -1) {
      activeCategories.value.splice(index, 1)
    } else {
      activeCategories.value.push(categoryId)
    }
  }

  /**
   * 设置所有分类的激活状态
   * @param {boolean} active - 是否全部激活
   */
  function setAllCategories(active) {
    activeCategories.value = active ? POI_CATEGORIES.map(cat => cat.id) : []
  }

  /**
   * 设置搜索关键词
   * @param {string} keyword - 搜索关键词
   */
  function setSearchKeyword(keyword) {
    searchKeyword.value = keyword
  }

  /**
   * 更新地图视图
   * @param {Object} view - 视图信息 { center, zoom }
   */
  function updateMapView(view) {
    mapView.value = { ...mapView.value, ...view }
  }

  /**
   * 设置分析模式
   * @param {string} mode - 分析模式
   */
  function setAnalysisMode(mode) {
    analysisMode.value = mode
  }

  /**
   * 设置加载状态
   * @param {boolean} status - 加载状态
   */
  function setLoading(status) {
    loading.value = status
  }

  /**
   * 设置错误信息
   * @param {string|null} msg - 错误信息
   */
  function setError(msg) {
    error.value = msg
  }

  /**
   * 清除所有筛选条件
   */
  function clearFilters() {
    activeCategories.value = POI_CATEGORIES.map(cat => cat.id)
    searchKeyword.value = ''
    selectedPoi.value = null
  }

  /**
   * 重置整个 Store
   */
  function resetStore() {
    poiList.value = []
    selectedPoi.value = null
    activeCategories.value = POI_CATEGORIES.map(cat => cat.id)
    searchKeyword.value = ''
    mapView.value = { center: [116.4074, 39.9042], zoom: 12 }
    analysisMode.value = ''
    loading.value = false
    error.value = null
  }

  return {
    // 状态
    poiList,
    selectedPoi,
    activeCategories,
    searchKeyword,
    mapView,
    analysisMode,
    loading,
    error,
    // 计算属性
    filteredPoiList,
    categoryStats,
    totalPoiCount,
    filteredCount,
    // 方法
    setPoiList,
    addPoi,
    selectPoi,
    toggleCategory,
    setAllCategories,
    setSearchKeyword,
    updateMapView,
    setAnalysisMode,
    setLoading,
    setError,
    clearFilters,
    resetStore
  }
})
