/**
 * 地理编码服务
 * 城市POI可视化与分析平台
 */

import axios from 'axios'
import { AMAP_API_KEY, AMAP_API_BASE } from '@/utils/constants'

/**
 * 地理编码服务类
 * 提供地址与坐标之间的转换功能
 */
class GeocodeService {
  /**
   * 地址转坐标（地理编码）
   * 使用高德地图 Web 服务 API
   * @param {string} address - 地址文本
   * @param {string} city - 城市名称（可选）
   * @returns {Promise<Object>} { lng, lat, formattedAddress }
   */
  static async geocode(address, city = '北京') {
    try {
      // 如果没有配置 API Key，返回模拟数据
      if (!AMAP_API_KEY) {
        console.warn('未配置高德地图 API Key，使用模拟数据')
        return GeocodeService._mockGeocode(address)
      }

      const response = await axios.get(`${AMAP_API_BASE}/geocode/geo`, {
        params: {
          key: AMAP_API_KEY,
          address: address,
          city: city,
          output: 'JSON'
        }
      })

      if (response.data.status === '1' && response.data.geocodes.length > 0) {
        const geo = response.data.geocodes[0]
        const [lng, lat] = geo.location.split(',').map(Number)
        return {
          lng,
          lat,
          formattedAddress: geo.formatted_address
        }
      }

      throw new Error('未找到匹配的地址')
    } catch (error) {
      console.error('地理编码失败:', error)
      return GeocodeService._mockGeocode(address)
    }
  }

  /**
   * 坐标转地址（逆地理编码）
   * @param {number} lng - 经度
   * @param {number} lat - 纬度
   * @returns {Promise<Object>} { formattedAddress, province, city, district }
   */
  static async reverseGeocode(lng, lat) {
    try {
      if (!AMAP_API_KEY) {
        console.warn('未配置高德地图 API Key，使用模拟数据')
        return GeocodeService._mockReverseGeocode(lng, lat)
      }

      const response = await axios.get(`${AMAP_API_BASE}/geocode/regeo`, {
        params: {
          key: AMAP_API_KEY,
          location: `${lng},${lat}`,
          output: 'JSON'
        }
      })

      if (response.data.status === '1') {
        const regeo = response.data.regeocode
        return {
          formattedAddress: regeo.formatted_address,
          province: regeo.addressComponent.province,
          city: regeo.addressComponent.city,
          district: regeo.addressComponent.district,
          township: regeo.addressComponent.township
        }
      }

      throw new Error('逆地理编码失败')
    } catch (error) {
      console.error('逆地理编码失败:', error)
      return GeocodeService._mockReverseGeocode(lng, lat)
    }
  }

  /**
   * 模拟地理编码（用于开发测试）
   * @private
   */
  static _mockGeocode(address) {
    // 根据地址关键词返回模拟坐标
    const mockLocations = {
      '天安门': { lng: 116.3975, lat: 39.9087 },
      '故宫': { lng: 116.3972, lat: 39.9163 },
      '中关村': { lng: 116.3107, lat: 39.9819 },
      '国贸': { lng: 116.4594, lat: 39.9085 },
      '西单': { lng: 116.3726, lat: 39.9122 },
      '王府井': { lng: 116.4103, lat: 39.9138 },
      '三里屯': { lng: 116.4541, lat: 39.9344 },
      '望京': { lng: 116.4704, lat: 39.9965 },
      '五道口': { lng: 116.3380, lat: 39.9925 },
      '朝阳大悦城': { lng: 116.4737, lat: 39.9211 }
    }

    for (const [key, coord] of Object.entries(mockLocations)) {
      if (address.includes(key)) {
        return {
          lng: coord.lng + (Math.random() - 0.5) * 0.005,
          lat: coord.lat + (Math.random() - 0.5) * 0.005,
          formattedAddress: `北京市${address}`
        }
      }
    }

    // 默认返回北京中心附近随机坐标
    return {
      lng: 116.4074 + (Math.random() - 0.5) * 0.1,
      lat: 39.9042 + (Math.random() - 0.5) * 0.1,
      formattedAddress: `北京市${address}`
    }
  }

  /**
   * 模拟逆地理编码（用于开发测试）
   * @private
   */
  static _mockReverseGeocode(lng, lat) {
    const districts = ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区', '通州区', '昌平区']
    const district = districts[Math.floor(Math.random() * districts.length)]
    return {
      formattedAddress: `北京市${district}某街道`,
      province: '北京市',
      city: '北京市',
      district: district,
      township: '某街道'
    }
  }
}

export default GeocodeService
