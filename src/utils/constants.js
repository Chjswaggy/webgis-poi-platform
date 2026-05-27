/**
 * 常量定义文件
 * 城市POI可视化与分析平台
 */

// ==========================================
// POI 分类定义
// ==========================================
export const POI_CATEGORIES = [
  {
    id: 'food',
    name: '餐饮',
    icon: 'Bowl',
    color: '#F56C6C',
    bgColor: 'rgba(245, 108, 108, 0.15)',
    subCategories: ['中餐厅', '外国餐厅', '快餐店', '咖啡厅', '茶馆', '酒吧']
  },
  {
    id: 'hotel',
    name: '住宿',
    icon: 'House',
    color: '#E6A23C',
    bgColor: 'rgba(230, 162, 60, 0.15)',
    subCategories: ['星级酒店', '经济型酒店', '民宿', '青年旅社', '公寓']
  },
  {
    id: 'transport',
    name: '交通',
    icon: 'Van',
    color: '#409EFF',
    bgColor: 'rgba(64, 158, 255, 0.15)',
    subCategories: ['地铁站', '公交站', '火车站', '机场', '停车场']
  },
  {
    id: 'shopping',
    name: '购物',
    icon: 'ShoppingCart',
    color: '#67C23A',
    bgColor: 'rgba(103, 194, 58, 0.15)',
    subCategories: ['购物中心', '超市', '便利店', '市场', '专卖店']
  },
  {
    id: 'education',
    name: '教育',
    icon: 'Reading',
    color: '#909399',
    bgColor: 'rgba(144, 147, 153, 0.15)',
    subCategories: ['大学', '中学', '小学', '培训机构', '图书馆']
  },
  {
    id: 'medical',
    name: '医疗',
    icon: 'FirstAidKit',
    color: '#B37FEB',
    bgColor: 'rgba(179, 127, 235, 0.15)',
    subCategories: ['三甲医院', '社区医院', '诊所', '药店', '体检中心']
  }
]

// ==========================================
// 地图相关常量
// ==========================================

// 北京中心坐标 (WGS84)
export const BEIJING_CENTER = [116.4074, 39.9042]

// 默认地图缩放级别
export const DEFAULT_ZOOM = 12

// 最小缩放级别
export const MIN_ZOOM = 4

// 最大缩放级别
export const MAX_ZOOM = 18

// 地图投影 (EPSG:4326 - WGS84)
export const MAP_PROJECTION = 'EPSG:4326'

// 显示投影 (EPSG:3857 - Web Mercator)
export const DISPLAY_PROJECTION = 'EPSG:3857'

// ==========================================
// 分析相关常量
// ==========================================

// 热力图半径
export const HEATMAP_RADIUS = 20

// 热力图模糊度
export const HEATMAP_BLUR = 15

// 缓冲区默认半径 (米)
export const DEFAULT_BUFFER_RADIUS = 500

// 核密度分析默认带宽
export const DEFAULT_KDE_BANDWIDTH = 1000

// ==========================================
// API 相关常量
// ==========================================

// 模拟数据接口
export const MOCK_API_BASE = '/data'

// 高德地图 Web 服务 API Key
export const AMAP_API_KEY = '091cf88e261109c4ca4ef3097535f408'

// 高德地图 Web 服务 API 基础 URL
export const AMAP_API_BASE = 'https://restapi.amap.com/v3'

// ==========================================
// 图层名称
// ==========================================
export const LAYER_NAMES = {
  BASE: 'baseLayer',           // 底图图层
  POI: 'poiLayer',             // POI 标注图层
  HEATMAP: 'heatmapLayer',     // 热力图图层
  CLUSTER: 'clusterLayer',     // 聚合图层
  BUFFER: 'bufferLayer',       // 缓冲区图层
  ROUTE: 'routeLayer',         // 路线图层
  ANALYSIS: 'analysisLayer'    // 分析结果图层
}
