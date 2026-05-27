/**
 * POI 图层 Composable
 * 城市POI可视化与分析平台
 * 封装 POI 在地图上的渲染、样式、点击交互等功能
 */

import { ref, watch, computed } from 'vue'
import { Feature } from 'ol'
import { Point } from 'ol/geom'
import { fromLonLat } from 'ol/proj'
import { Style, Circle, Fill, Stroke, Text, Icon } from 'ol/style'
import { Select } from 'ol/interaction'
import { click } from 'ol/events/condition'
import Overlay from 'ol/Overlay'
import { POI_CATEGORIES } from '@/utils/constants'

// ==========================================
// 分类样式配置
// ==========================================
const CATEGORY_STYLES = {
  food: { color: '#F56C6C', icon: '🍴' },
  hotel: { color: '#E6A23C', icon: '🏨' },
  transport: { color: '#409EFF', icon: '🚇' },
  shopping: { color: '#67C23A', icon: '🛒' },
  education: { color: '#909399', icon: '📚' },
  medical: { color: '#B37FEB', icon: '🏥' }
}

/**
 * 获取分类样式配置
 * @param {string} categoryId
 * @returns {Object}
 */
function getCategoryStyle(categoryId) {
  return CATEGORY_STYLES[categoryId] || { color: '#909399', icon: '📍' }
}

/**
 * 创建 POI 要素的样式
 * @param {Object} poi - POI 数据
 * @param {boolean} isSelected - 是否被选中
 * @returns {Style}
 */
function createPOIStyle(poi, isSelected = false) {
  const style = getCategoryStyle(poi.category)
  const baseRadius = isSelected ? 10 : 8
  const strokeWidth = isSelected ? 3 : 2

  return new Style({
    image: new Circle({
      radius: baseRadius,
      fill: new Fill({ color: style.color }),
      stroke: new Stroke({
        color: '#FFFFFF',
        width: strokeWidth
      })
    }),
    text: new Text({
      text: style.icon,
      font: '14px "Segoe UI Emoji", "Apple Color Emoji", sans-serif',
      fill: new Fill({ color: '#FFFFFF' }),
      offsetY: -1
    })
  })
}

/**
 * POI 图层组合式函数
 * @param {Object} params
 * @param {Ref} params.map - 地图实例
 * @param {Ref} params.poiSource - POI 图层数据源
 * @param {Function} params.onSelectPOI - 选中 POI 回调
 * @returns {Object}
 */
export function usePOILayer({ map, poiSource, onSelectPOI }) {
  // 当前选中的 POI Feature
  const selectedFeature = ref(null)

  // 弹窗 Overlay
  const popupOverlay = ref(null)

  // 弹窗显示状态
  const popupVisible = ref(false)

  // 弹窗内容
  const popupContent = ref({
    name: '',
    category: '',
    address: '',
    coordinates: null
  })

  /**
   * 创建 POI Feature
   * @param {Object} poi - POI 数据
   * @returns {Feature}
   */
  function createPOIFeature(poi) {
    const feature = new Feature({
      geometry: new Point(fromLonLat(poi.coordinates)),
      poiData: poi
    })
    feature.setId(poi.id)
    feature.setStyle(createPOIStyle(poi))
    return feature
  }

  /**
   * 渲染 POI 列表到地图
   * @param {Array} poiList - POI 数据数组
   */
  function renderPOIs(poiList) {
    if (!poiSource.value) return

    // 清除现有要素
    poiSource.value.clear()

    // 创建并添加新要素
    const features = poiList.map(poi => createPOIFeature(poi))
    poiSource.value.addFeatures(features)

    console.log(`地图渲染 ${features.length} 个 POI`)
  }

  /**
   * 高亮指定 POI
   * @param {string|number} poiId - POI ID
   */
  function highlightPOI(poiId) {
    if (!poiSource.value) return

    const feature = poiSource.value.getFeatureById(poiId)
    if (feature) {
      // 重置之前选中的要素样式
      if (selectedFeature.value) {
        const prevPoi = selectedFeature.value.get('poiData')
        selectedFeature.value.setStyle(createPOIStyle(prevPoi, false))
      }

      // 设置新选中要素样式
      const poi = feature.get('poiData')
      feature.setStyle(createPOIStyle(poi, true))
      selectedFeature.value = feature
    }
  }

  /**
   * 清除高亮
   */
  function clearHighlight() {
    if (selectedFeature.value) {
      const poi = selectedFeature.value.get('poiData')
      selectedFeature.value.setStyle(createPOIStyle(poi, false))
      selectedFeature.value = null
    }
  }

  /**
   * 创建弹窗 Overlay
   */
  function createPopupOverlay() {
    if (!map.value) return

    // 创建弹窗元素
    const popupElement = document.createElement('div')
    popupElement.className = 'poi-popup'
    popupElement.innerHTML = `
      <div class="poi-popup-header">
        <span class="poi-popup-icon"></span>
        <span class="poi-popup-name"></span>
        <button class="poi-popup-close">×</button>
      </div>
      <div class="poi-popup-body">
        <div class="poi-popup-category"></div>
        <div class="poi-popup-address"></div>
      </div>
    `

    // 创建 Overlay
    popupOverlay.value = new Overlay({
      element: popupElement,
      positioning: 'bottom-center',
      offset: [0, -15],
      stopEvent: true
    })

    map.value.addOverlay(popupOverlay.value)

    // 绑定关闭按钮事件
    const closeBtn = popupElement.querySelector('.poi-popup-close')
    closeBtn.addEventListener('click', hidePopup)

    // 点击弹窗外部关闭
    map.value.on('click', (e) => {
      const feature = map.value.forEachFeatureAtPixel(e.pixel, (f) => f)
      if (!feature) {
        hidePopup()
      }
    })
  }

  /**
   * 显示弹窗
   * @param {Object} poi - POI 数据
   * @param {Array} coordinate - 地图坐标
   */
  function showPopup(poi, coordinate) {
    if (!popupOverlay.value) return

    const style = getCategoryStyle(poi.category)
    const categoryInfo = POI_CATEGORIES.find(c => c.id === poi.category)

    popupContent.value = {
      name: poi.name,
      category: categoryInfo?.name || '其他',
      categoryColor: style.color,
      icon: style.icon,
      address: poi.address || '暂无地址信息',
      subCategory: poi.subCategory || '',
      coordinates: poi.coordinates
    }

    // 更新弹窗内容
    const element = popupOverlay.value.getElement()
    element.querySelector('.poi-popup-icon').textContent = style.icon
    element.querySelector('.poi-popup-name').textContent = poi.name
    element.querySelector('.poi-popup-category').textContent = categoryInfo?.name + (poi.subCategory ? ` · ${poi.subCategory}` : '')
    element.querySelector('.poi-popup-category').style.color = style.color
    element.querySelector('.poi-popup-address').textContent = poi.address || '暂无地址信息'

    // 设置位置并显示
    popupOverlay.value.setPosition(coordinate)
    popupVisible.value = true
    element.style.display = 'block'
  }

  /**
   * 隐藏弹窗
   */
  function hidePopup() {
    if (popupOverlay.value) {
      popupOverlay.value.setPosition(undefined)
      popupVisible.value = false
      const element = popupOverlay.value.getElement()
      if (element) {
        element.style.display = 'none'
      }
    }
    clearHighlight()
  }

  /**
   * 初始化点击交互
   */
  function initClickInteraction() {
    if (!map.value) return

    // 创建选择交互
    const selectInteraction = new Select({
      condition: click,
      style: null, // 使用要素自身样式
      layers: (layer) => layer.get('name') === 'poiLayer'
    })

    map.value.addInteraction(selectInteraction)

    // 监听选择事件
    selectInteraction.on('select', (e) => {
      const feature = e.selected[0]
      if (feature) {
        const poi = feature.get('poiData')
        const geometry = feature.getGeometry()
        const coordinate = geometry.getCoordinates()

        // 高亮
        highlightPOI(poi.id)

        // 显示弹窗
        showPopup(poi, coordinate)

        // 回调
        if (onSelectPOI) {
          onSelectPOI(poi)
        }
      } else {
        hidePopup()
      }
    })
  }

  /**
   * 初始化 POI 图层
   */
  function initPOILayer() {
    if (!map.value || !poiSource.value) return

    createPopupOverlay()
    initClickInteraction()

    console.log('POI 图层初始化完成')
  }

  /**
   * 飞行到指定 POI
   * @param {string|number} poiId - POI ID
   * @param {number} zoom - 缩放级别
   */
  function flyToPOI(poiId, zoom = 16) {
    if (!poiSource.value || !map.value) return

    const feature = poiSource.value.getFeatureById(poiId)
    if (feature) {
      const poi = feature.get('poiData')
      const geometry = feature.getGeometry()
      const coordinate = geometry.getCoordinates()

      // 飞行到位置
      const view = map.value.getView()
      view.animate({
        center: coordinate,
        zoom: zoom,
        duration: 800
      })

      // 高亮并显示弹窗
      highlightPOI(poiId)
      setTimeout(() => {
        showPopup(poi, coordinate)
      }, 800)
    }
  }

  return {
    // 状态
    selectedFeature,
    popupVisible,
    popupContent,

    // 方法
    initPOILayer,
    renderPOIs,
    highlightPOI,
    clearHighlight,
    showPopup,
    hidePopup,
    flyToPOI,
    createPOIFeature
  }
}
