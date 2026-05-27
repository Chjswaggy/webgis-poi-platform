/**
 * 热力图 Composable
 * 城市POI可视化与分析平台
 * 封装 OpenLayers 热力图渲染功能
 */

import { ref } from 'vue'
import { Feature } from 'ol'
import { Point } from 'ol/geom'
import { fromLonLat } from 'ol/proj'
import HeatmapLayer from 'ol/layer/Heatmap'
import VectorSource from 'ol/source/Vector'

/**
 * 热力图组合式函数
 * @returns {Object}
 */
export function useHeatmap() {
  const heatmapLayer = ref(null)

  /**
   * 创建热力图图层
   * @param {Ref} map - 地图实例
   * @returns {HeatmapLayer}
   */
  function createHeatmapLayer(map) {
    if (!map.value) return null

    const source = new VectorSource()
    const layer = new HeatmapLayer({
      source: source,
      blur: 15,
      radius: 20,
      weight: function (feature) {
        // 可以根据 POI 属性设置权重
        return 1
      },
      zIndex: 5
    })

    map.value.addLayer(layer)
    heatmapLayer.value = layer
    return layer
  }

  /**
   * 渲染热力图数据
   * @param {Array} poiList - POI 数据数组
   * @param {VectorSource} source - 热力图源
   */
  function renderHeatmapData(poiList, source) {
    if (!source) return

    source.clear()

    const features = poiList.map(poi => {
      return new Feature({
        geometry: new Point(fromLonLat(poi.coordinates)),
        weight: 1
      })
    })

    source.addFeatures(features)
    console.log(`热力图渲染 ${features.length} 个点`)
  }

  /**
   * 获取热力图源
   * @returns {VectorSource|null}
   */
  function getHeatmapSource() {
    return heatmapLayer.value?.getSource() || null
  }

  /**
   * 设置热力图模糊度
   * @param {number} blur
   */
  function setBlur(blur) {
    if (heatmapLayer.value) {
      heatmapLayer.value.setBlur(blur)
    }
  }

  /**
   * 设置热力图半径
   * @param {number} radius
   */
  function setRadius(radius) {
    if (heatmapLayer.value) {
      heatmapLayer.value.setRadius(radius)
    }
  }

  return {
    heatmapLayer,
    createHeatmapLayer,
    renderHeatmapData,
    getHeatmapSource,
    setBlur,
    setRadius
  }
}
