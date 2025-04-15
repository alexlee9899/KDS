import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_API } from '../config/api';

const API_BASE_URL = BASE_API;
const warehouseId = '6672310309b356dd04293cb9';
// 定义库存项接口
export interface StockItem {
  name: string;
  product_id: string;
  qty: number;
  prepare_time?: number; // 添加准备时间字段
}

// 定义库存响应接口
export interface StockResponse {
  products: Record<string, StockItem[]>;
  status_code: number;
}

export class StockService {
  // 获取仓库库存
  static async getWarehouseStock(warehouseId: string): Promise<StockResponse> {
    const token = await this.getToken();
    
    if (!token) {
      throw new Error('没有找到令牌');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/warehouse/get_sotck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          warehouse_id: warehouseId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取库存信息错误:', error);
      throw error;
    }
  }

  // 获取所有低库存商品
  static async getLowStockItems(warehouseId: string, threshold: number = 10): Promise<StockItem[]> {
    try {
      const stockResponse = await this.getWarehouseStock(warehouseId);
      const lowStockItems: StockItem[] = [];

      // 遍历所有分类和商品
      Object.values(stockResponse.products).forEach(categoryItems => {
        categoryItems.forEach(item => {
          if (item.qty <= threshold) {
            lowStockItems.push(item);
          }
        });
      });

      return lowStockItems;
    } catch (error) {
      console.error('获取低库存商品错误:', error);
      throw error;
    }
  }

  // 获取特定分类的库存
  static async getCategoryStock(warehouseId: string, category: string): Promise<StockItem[]> {
    try {
      const stockResponse = await this.getWarehouseStock(warehouseId);
      return stockResponse.products[category] || [];
    } catch (error) {
      console.error(`获取${category}分类库存错误:`, error);
      throw error;
    }
  }

  // 获取所有库存分类
  static async getStockCategories(warehouseId: string): Promise<string[]> {
    try {
      const stockResponse = await this.getWarehouseStock(warehouseId);
      return Object.keys(stockResponse.products);
    } catch (error) {
      console.error('获取库存分类错误:', error);
      throw error;
    }
  }

  // 获取单个商品库存
  static async getProductStock(warehouseId: string, productId: string): Promise<StockItem | null> {
    try {
      const stockResponse = await this.getWarehouseStock(warehouseId);
      
      // 遍历所有分类查找商品
      for (const category in stockResponse.products) {
        const product = stockResponse.products[category].find(
          item => item.product_id === productId
        );
        
        if (product) {
          return product;
        }
      }
      
      return null; // 未找到商品
    } catch (error) {
      console.error('获取商品库存错误:', error);
      throw error;
    }
  }

  // 获取Token辅助方法
  private static async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem("token");
      console.log("token", token);
      return token;
    } catch (error) {
      console.error("获取token错误:", error);
      return null;
    }
  }

  // 更新商品库存
  static async updateProductStock(
    warehouseId: string,
    productId: string,
    qty: number
  ): Promise<any> {
    const token = await this.getToken();
    
    if (!token) {
      throw new Error('没有找到令牌');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/warehouse/stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          warehouse_id: warehouseId,
          product_id: productId,
          qty: qty
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('更新库存错误:', error);
      throw error;
    }
  }

  // 获取商品准备时间
  static async getProductPrepareTime(productId: string): Promise<number> {
    try {
      const token = await this.getToken();
      
      if (!token) {
        throw new Error('没有找到令牌');
      }
      
      const response = await fetch(`${API_BASE_URL}/product/detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`);
      }

      const productDetails = await response.json();
      return productDetails.prepare_time || 0;
    } catch (error) {
      console.error(`获取商品准备时间失败:`, error);
      return 0;
    }
  }

  // 更新商品准备时间
  static async updateProductPrepareTime(productId: string, prepareTime: number): Promise<any> {
    try {
      const token = await this.getToken();
      
      if (!token) {
        throw new Error('没有找到令牌');
      }
      
      const response = await fetch(`${API_BASE_URL}/product/update_prepare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          product_id: productId,
          prepare_time: prepareTime
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`更新商品准备时间失败:`, error);
      throw error;
    }
  }
} 