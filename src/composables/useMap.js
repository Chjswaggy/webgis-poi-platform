/**
 * 地图 Composable
 * 城市POI可视化与分析平台
 * 封装 OpenLayers 地图初始化、底图切换、图层管理等核心功能
 */

import { ref, onMounted, onBeforeUnmount } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import HeatmapLayer from 'ol/layer/Heatmap'
import VectorSource from 'ol/source/Vector'
import ClusterSource from 'ol/source/Cluster'
import XYZ from 'ol/source/XYZ'
import { fromLonLat } from 'ol/proj'
import { defaults as defaultControls, Zoom, ScaleLine, Attribution } from 'ol/control'
import { BEIJING_CENTER, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, LAYER_NAMES } from '@/utils/constants'

// ==========================================
// 底图配置
// ==========================================
export const BASE_MAPS = {
  gaode: {
    name: '高德矢量',
    key: 'gaode',
    url: 'https://webrd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    attributions: '&copy; 高德地图'
  },
  gaodeSatellite: {
    name: '高德卫星',
    key: 'gaodeSatellite',
    url: 'https://webst0{1-4}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
    attributions: '&copy; 高德地图'
  },
  osm: {
    name: 'OpenStreetMap',
    key: 'osm',
    url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attributions: '&copy; OpenStreetMap contributors'
  }
}

/**
 * 创建底图图层
 * @param {string} mapType - 底图类型 key
 * @returns {TileLayer}
 */
function createBaseLayer(mapType = 'gaode') {
  const config = BASE_MAPS[mapType] || BASE_MAPS.gaode
  return new TileLayer({
    name: LAYER_NAMES.BASE,
    source: new XYZ({
      url: config.url,
      crossOrigin: 'anonymous',
      attributions: config.attributions
    }),
    zIndex: 0
  })
}

/**
 * 地图组合式函数
 * @param {Ref<HTMLElement>} mapRef - 地图容器 DOM 引用
 * @returns {Object} 地图相关状态和方法
 */
export function useMap(mapRef) {
  // 地图实例
  const map = ref(null)

  // 各图层引用
  const layers = ref({})

  // 地图是否已初始化
  const isMapReady = ref(false)

  // 当前底图类型
  const currentBaseMap = ref('gaode')

  /**
   * 初始化地图
   */
  function initMap() {
    if (!mapRef.value || map.value) return

    // 创建底图图层（默认高德矢量）
    const baseLayer = createBaseLayer('gaode')

    // 创建 POI 矢量图层
    const poiSource = new VectorSource()
    const poiLayer = new VectorLayer({
      name: LAYER_NAMES.POI,
      source: poiSource,
      zIndex: 10
    })

    // 创建热力图图层
    const heatmapSource = new VectorSource()
    const heatmapLayer = new HeatmapLayer({
      name: LAYER_NAMES.HEATMAP,
      source: heatmapSource,
      blur: 15,
      radius: 20,
      zIndex: 5
    })

    // 创建聚合图层 - 使用 ClusterSource
    const clusterBaseSource = new VectorSource()
    const clusterSource = new ClusterSource({
      source: clusterBaseSource,
      distance: 40,
      minDistance: 20
    })
    const clusterLayer = new VectorLayer({
      name: LAYER_NAMES.CLUSTER,
      source: clusterSource,
      zIndex: 8
    })

    // 创建分析结果图层
    const analysisSource = new VectorSource()
    const analysisLayer = new VectorLayer({
      name: LAYER_NAMES.ANALYSIS,
      source: analysisSource,
      zIndex: 15
    })

    // 创建缓冲区图层
    const bufferSource = new VectorSource()
    const bufferLayer = new VectorLayer({
      name: LAYER_NAMES.BUFFER,
      source: bufferSource,
      zIndex: 12
    })

    // 创建路线图层
    const routeSource = new VectorSource()
    const routeLayer = new VectorLayer({
      name: LAYER_NAMES.ROUTE,
      source: routeSource,
      zIndex: 13
    })

    // 保存图层引用
    layers.value = {
      baseLayer,
      poiLayer,
      heatmapLayer,
      clusterLayer,
      analysisLayer,
      bufferLayer,
      routeLayer
    }

    // 初始化地图
    map.value = new Map({
      target: mapRef.value,
      layers: [
        baseLayer,
        heatmapLayer,
        bufferLayer,
        analysisLayer,
        routeLayer,
        clusterLayer,
        poiLayer
      ],
      view: new View({
        center: fromLonLat(BEIJING_CENTER),
        zoom: DEFAULT_ZOOM,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM
      }),
      // 添加默认控件：缩放 + 比例尺
      controls: defaultControls({
        attribution: false,
        zoom: false,
        rotate: false
      }).extend([
        new Zoom(),
        new ScaleLine({
          units: 'metric',
          bar: true,
          steps: 4,
          text: true,
          minWidth: 80
        })
      ])
    })

    isMapReady.value = true
    console.log('地图初始化完成，底图：高德矢量')
  }

  /**
   * 切换底图
   * @param {string} mapType - 底图类型 key (gaode / gaodeSatellite / osm)
   */
  function changeBaseMap(mapType) {
    if (!map.value || !BASE_MAPS[mapType]) return

    const oldBaseLayer = layers.value.baseLayer
    const newBaseLayer = createBaseLayer(mapType)

    // 移除旧底图，添加新底图
    map.value.removeLayer(oldBaseLayer)
    map.value.getLayers().insertAt(0, newBaseLayer)

    // 更新图层引用
    layers.value.baseLayer = newBaseLayer
    currentBaseMap.value = mapType

    console.log(`底图切换为：${BASE_MAPS[mapType].name}`)
  }

  /**
   * 获取当前底图类型
   * @returns {string}
   */
  function getCurrentBaseMap() {
    return currentBaseMap.value
  }

  /**
   * 飞行到指定位置
   * @param {Array<number>} center - 中心点 [lng, lat]
   * @param {number} zoom - 缩放级别
   * @param {number} duration - 动画时长（毫秒）
   */
  function flyTo(center, zoom = 15, duration = 1000) {
    if (!map.value) return
    const view = map.value.getView()
    view.animate({
      center: fromLonLat(center),
      zoom: zoom,
      duration: duration
    })
  }

  /**
   * 获取当前视图范围
   * @returns {Object} { center, zoom, extent }
   */
  function getCurrentView() {
    if (!map.value) return null
    const view = map.value.getView()
    const center = view.getCenter()
    return {
      center: center,
      zoom: view.getZoom(),
      extent: view.calculateExtent(map.value.getSize())
    }
  }

  /**
   * 获取指定图层
   * @param {string} layerName - 图层名称
   * @returns {VectorLayer|undefined}
   */
  function getLayer(layerName) {
    return layers.value[layerName]
  }

  /**
   * 获取指定图层的 Source
   * @param {string} layerName - 图层名称
   * @returns {VectorSource|undefined}
   */
  function getSource(layerName) {
    const layer = layers.value[layerName]
    return layer ? layer.getSource() : undefined
  }

  /**
   * 设置图层可见性
   * @param {string} layerName - 图层名称
   * @param {boolean} visible - 是否可见
   */
  function setLayerVisible(layerName, visible) {
    const layer = layers.value[layerName]
    if (layer) {
      layer.setVisible(visible)
    }
  }

  /**
   * 清除图层上的所有要素
   * @param {string} layerName - 图层名称
   */
  function clearLayer(layerName) {
    const layer = layers.value[layerName]
    if (layer) {
      layer.getSource().clear()
    }
  }

  /**
   * 更新地图尺寸
   */
  function updateSize() {
    if (map.value) {
      map.value.updateSize()
    }
  }

  /**
   * 销毁地图
   */
  function destroyMap() {
    if (map.value) {
      map.value.setTarget(null)
      map.value = null
      isMapReady.value = false
    }
  }

  // 组件挂载时初始化地图
  onMounted(() => {
    initMap()
  })

  // 组件卸载前销毁地图
  onBeforeUnmount(() => {
    destroyMap()
  })

  return {
    map,
    layers,
    isMapReady,
    currentBaseMap,
    initMap,
    changeBaseMap,
    getCurrentBaseMap,
    flyTo,
    getCurrentView,
    getLayer,
    getSource,
    setLayerVisible,
    clearLayer,
    updateSize,
    destroyMap
  }
}
