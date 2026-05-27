/**
 * POI 数据 Composable
 * 城市POI可视化与分析平台
 * 封装 POI 数据的加载、筛选、搜索等功能
 */

import { ref, computed, watch } from 'vue'
import { usePoiStore } from '@/stores/poiStore'
import PoiService from '@/services/poiService'
import { POI_CATEGORIES } from '@/utils/constants'
import { debounce } from '@/utils/helpers'

/**
 * POI 数据组合式函数
 * @returns {Object} POI 相关状态和方法
 */
export function usePOI() {
  const poiStore = usePoiStore()

  // 加载状态
  const loading = ref(false)
  const error = ref(null)

  // 搜索关键词（本地状态，防抖后同步到 Store）
  const localKeyword = ref('')

  // 当前选中的分类
  const selectedCategory = ref(null)

  // 数据源模式：'mock' 模拟数据，'realtime' 实时从高德获取
  const dataSourceMode = ref('mock')

  // 实时数据缓存
  const realtimePoiCache = ref([])

  /**
   * 加载所有 POI 数据
   * @param {Object} options - 加载选项
   * @param {string} options.source - 数据源：'mock' 模拟数据，'realtime' 高德实时数据
   * @param {string} options.city - 城市名称（实时数据时使用）
   * @param {number} options.perCategory - 每个分类的数量（实时数据时使用）
   */
  async function loadPois(options = {}) {
    const {
      source = dataSourceMode.value,
      city = '北京',
      perCategory = 30
    } = options

    loading.value = true
    error.value = null

    try {
      let data = []

      if (source === 'realtime') {
        // 从高德 API 获取实时数据
        console.log('正在从高德 API 获取真实数据...')
        data = await PoiService.fetchMultipleCategories(city, perCategory)
        realtimePoiCache.value = data
      } else {
        // 加载本地模拟数据
        data = await PoiService.fetchAllPois()
      }

      poiStore.setPoiList(data)
      console.log(`成功加载 ${data.length} 个 POI 数据 (数据源: ${source})`)
    } catch (err) {
      error.value = err.message || '加载 POI 数据失败'
      console.error('加载 POI 数据失败:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换数据源模式
   * @param {string} mode - 'mock' 或 'realtime'
   * @param {Object} options - 加载选项
   */
  async function switchDataSource(mode, options = {}) {
    dataSourceMode.value = mode
    await loadPois({ source: mode, ...options })
  }

  /**
   * 搜索 POI（带防抖）
   */
  const debouncedSearch = debounce((keyword) => {
    poiStore.setSearchKeyword(keyword)
  }, 300)

  /**
   * 处理搜索输入
   * @param {string} keyword - 搜索关键词
   */
  function handleSearch(keyword) {
    localKeyword.value = keyword
    debouncedSearch(keyword)
  }

  /**
   * 切换分类筛选
   * @param {string} categoryId - 分类 ID
   */
  function toggleCategoryFilter(categoryId) {
    poiStore.toggleCategory(categoryId)
  }

  /**
   * 全选/取消全选分类
   * @param {boolean} allSelected - 是否全选
   */
  function toggleAllCategories(allSelected) {
    poiStore.setAllCategories(allSelected)
  }

  /**
   * 选中某个 POI
   * @param {Object} poi - POI 对象
   */
  function selectPoi(poi) {
    poiStore.selectPoi(poi)
  }

  /**
   * 获取指定分类的 POI 列表
   * @param {string} categoryId - 分类 ID
   * @returns {Array} POI 数组
   */
  function getPoisByCategory(categoryId) {
    return poiStore.poiList.filter(poi => poi.category === categoryId)
  }

  /**
   * 获取 POI 分类信息
   * @param {string} categoryId - 分类 ID
   * @returns {Object|null} 分类信息
   */
  function getCategoryInfo(categoryId) {
    return POI_CATEGORIES.find(cat => cat.id === categoryId) || null
  }

  /**
   * 获取分类颜色
   * @param {string} categoryId - 分类 ID
   * @returns {string} 颜色值
   */
  function getCategoryColor(categoryId) {
    const category = getCategoryInfo(categoryId)
    return category ? category.color : '#909399'
  }

  /**
   * 清除所有筛选
   */
  function clearFilters() {
    localKeyword.value = ''
    poiStore.clearFilters()
  }

  // 是否所有分类都已选中
  const allCategoriesSelected = computed(() => {
    return poiStore.activeCategories.length === POI_CATEGORIES.length
  })

  return {
    // 状态
    loading,
    error,
    localKeyword,
    selectedCategory,
    dataSourceMode,
    // 计算属性
    allCategoriesSelected,
    // 方法
    loadPois,
    switchDataSource,
    handleSearch,
    toggleCategoryFilter,
    toggleAllCategories,
    selectPoi,
    getPoisByCategory,
    getCategoryInfo,
    getCategoryColor,
    clearFilters
  }
}
