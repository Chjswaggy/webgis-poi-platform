/**
 * 聚合图层 Composable
 * 城市POI可视化与分析平台
 * 封装 OpenLayers 聚合(Cluster)渲染功能
 */

import { ref } from 'vue'
import { Feature } from 'ol'
import { Point } from 'ol/geom'
import { fromLonLat } from 'ol/proj'
import VectorLayer from 'ol/layer/Vector'
import ClusterSource from 'ol/source/Cluster'
import VectorSource from 'ol/source/Vector'
import { Style, Circle, Fill, Stroke, Text } from 'ol/style'

/**
 * 聚合图层组合式函数
 * @returns {Object}
 */
export function useCluster() {
  const clusterLayer = ref(null)

  /**
   * 创建聚合图层
   * @param {Ref} map - 地图实例
   * @returns {VectorLayer}
   */
  function createClusterLayer(map) {
    if (!map.value) return null

    // 创建基础矢量源
    const vectorSource = new VectorSource()

    // 创建聚合源
    const clusterSource = new ClusterSource({
      source: vectorSource,
      distance: 40, // 聚合距离（像素）
      minDistance: 20
    })

    // 创建聚合图层
    const layer = new VectorLayer({
      source: clusterSource,
      style: clusterStyle,
      zIndex: 8
    })

    map.value.addLayer(layer)
    clusterLayer.value = layer
    return layer
  }

  /**
   * 聚合样式函数
   * @param {Feature} feature - 聚合要素
   * @returns {Style}
   */
  function clusterStyle(feature) {
    const features = feature.get('features')
    const size = features ? features.length : 1

    // 根据数量设置不同颜色和大小
    let color = '#409EFF'
    let radius = 15

    if (size >= 50) {
      color = '#F56C6C' // 红色 - 大量
      radius = 25
    } else if (size >= 20) {
      color = '#E6A23C' // 橙色 - 中量
      radius = 20
    } else if (size >= 10) {
      color = '#67C23A' // 绿色 - 少量
      radius = 17
    }

    return new Style({
      image: new Circle({
        radius: radius,
        fill: new Fill({ color: color }),
        stroke: new Stroke({
          color: '#FFFFFF',
          width: 2
        })
      }),
      text: new Text({
        text: size.toString(),
        fill: new Fill({ color: '#FFFFFF' }),
        font: 'bold 12px sans-serif'
      })
    })
  }

  /**
   * 渲染聚合数据
   * @param {Array} poiList - POI 数据数组
   */
  function renderClusterData(poiList) {
    if (!clusterLayer.value) return

    const clusterSource = clusterLayer.value.getSource()
    const vectorSource = clusterSource.getSource()

    vectorSource.clear()

    const features = poiList.map(poi => {
      return new Feature({
        geometry: new Point(fromLonLat(poi.coordinates)),
        poiData: poi
      })
    })

    vectorSource.addFeatures(features)
    console.log(`聚合图层渲染 ${features.length} 个点`)
  }

  /**
   * 设置聚合距离
   * @param {number} distance - 距离（像素）
   */
  function setDistance(distance) {
    if (clusterLayer.value) {
      const clusterSource = clusterLayer.value.getSource()
      clusterSource.setDistance(distance)
    }
  }

  return {
    clusterLayer,
    createClusterLayer,
    renderClusterData,
    setDistance
  }
}
