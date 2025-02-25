import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrderSearchResponse, OrderDetailResponse, OrderSearchParams, OrderDetailParams, ProductDetailResponse, FormattedOrder } from './types';
import { EventEmitter } from '../utils/eventEmitter';
import orderModule from '../components/orderModule';

const API_BASE_URL = 'https://vend88.com';

export class OrderService {
  private static isTCPMode = false;
  private static readonly TCP_ORDERS_KEY = '@tcp_orders';  // 存储键名
  private static orderModule = orderModule;
  private static tcpOrders: FormattedOrder[] = [];  // 添加存储

  // 添加 getter 方法
  // static get getTCPMode() {
  //   return this.isTCPMode;
  // }

  static get IsTCPMode() {
    console.log('Current TCP mode:', this.isTCPMode);
    return this.isTCPMode;
  }

  // 从 AsyncStorage 加载订单
  private static async loadTCPOrders(): Promise<FormattedOrder[]> {
    try {
      const ordersJson = await AsyncStorage.getItem(this.TCP_ORDERS_KEY);
      return ordersJson ? JSON.parse(ordersJson) : [];
    } catch (error) {
      console.error('加载订单失败:', error);
      return [];
    }
  }

  // 保存订单到 AsyncStorage
  private static async saveTCPOrders(orders: FormattedOrder[]) {
    try {
      await AsyncStorage.setItem(this.TCP_ORDERS_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error('保存订单失败:', error);
    }
  }

  // 添加新订单
  private static async addTCPOrder(order: FormattedOrder) {
    try {
      const orders = await this.loadTCPOrders();
      
      // 检查是否已存在相同ID的订单
      const exists = orders.some(o => o.id === order.id);
      if (!exists) {
        orders.push(order);
        await this.saveTCPOrders(orders);
        EventEmitter.emit('newOrder', order);
        console.log('订单已添加并保存，当前总数:', orders.length);
      } else {
        console.log('订单已存在，ID:', order.id);
      }
    } catch (error) {
      console.error('添加订单失败:', error);
    }
  }

  // 获取所有TCP订单
  static async getTCPOrders(): Promise<FormattedOrder[]> {
    return await this.loadTCPOrders();
  }

  // 删除订单
  static async removeTCPOrder(orderId: string) {
    try {
      const orders = await this.loadTCPOrders();
      const filteredOrders = orders.filter(order => order.id !== orderId);
      await this.saveTCPOrders(filteredOrders);
      console.log('订单已删除，ID:', orderId);
    } catch (error) {
      console.error('删除订单失败:', error);
    }
  }

  // 初始化TCP服务器
  static async initTCPServer() {
    try {
      console.log('正在初始化TCP服务器...');
      await this.orderModule.Bind();
      
      this.orderModule.setOrderCallback(async (orderData) => {
        console.log('收到TCP订单:', orderData);
        const formattedOrder = this.formatTCPOrder(orderData);
        await this.addTCPOrder(formattedOrder);
      });
      
      this.isTCPMode = true;
      console.log('TCP服务器初始化成功');
    } catch (error) {
      console.error('TCP服务器初始化失败:', error);
      this.isTCPMode = false;
    }
  }

  // 格式化 TCP 订单数据
  private static formatTCPOrder(orderData: any): FormattedOrder {
    return {
      id: orderData.orderId || String(Date.now()),
      pickupMethod: 'TCP',
      pickupTime: new Date().toLocaleTimeString(),
      items: orderData.items || [{
            "name": "薯条",
            "quantity": 1
        }]
    };
  }

  // 获取 token
  private static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  }

  //获取今天的时间范围
  private static getTodayTimeRange(): [string, string] {
    const now = new Date();
    const fiveSecondsAgo = new Date(now.getTime() - 10000); // 10秒前
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    return [
      fiveSecondsAgo.toISOString().split('.')[0].replace('T', ' '), // 10秒前
      endOfDay.toISOString().split('.')[0].replace('T', ' ')        // 今天结束
    ];
  }

  // 添加新方法获取今天完整时间范围
  private static getFullDayTimeRange(): [string, string] {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    return [
      startOfDay.toISOString().split('.')[0].replace('T', ' '),
      endOfDay.toISOString().split('.')[0].replace('T', ' ')
    ];
  }

  static async searchOrders(timeRange: [string, string]): Promise<OrderSearchResponse> {
    // const timeRange = this.getTodayTimeRange();
    const searchParams: OrderSearchParams = {
      query: {
        time: timeRange
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}/search/order_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching orders:', error);
      throw error;
    }
  }

  // 获取订单详情
  static async getOrderDetail(orderId: string): Promise<OrderDetailResponse> {
    const token = await this.getToken();
    
    if (!token) {
      throw new Error('No token found');
    }

    const detailParams: OrderDetailParams = {
      token: token,
      order_id: orderId
    };

    try {
      const response = await fetch(`${API_BASE_URL}/order/detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(detailParams)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting order detail:', error);
      throw error;
    }
  }

  // 获取所有今天的订单详情
  static async getAllTodayOrderDetails(): Promise<OrderDetailResponse[]> {
    try {
      // 1. 首先获取今天的所有订单ID
      const searchResult = await this.searchOrders(this.getTodayTimeRange());
      
      // 2. 获取每个订单的详细信息并添加 order_id
      const orderDetails = await Promise.all(
        searchResult.orders.map(async orderId => {
          const detail = await this.getOrderDetail(orderId);
          return {
            ...detail,
            order_id: orderId  // 添加 order_id 到返回数据中
          };
        })
      );

      return orderDetails;
    } catch (error) {
      console.error('Error getting all order details:', error);
      throw error;
    }
  }

  // 获取产品详情
  static async getProductDetail(productId: string): Promise<ProductDetailResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/product/detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: productId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting product detail:', error);
      throw error;
    }
  }

  // 获取格式化的订单信息
  static async getFormattedOrderDetails(): Promise<FormattedOrder[]> {
    if (this.isTCPMode) {
      return this.tcpOrders;  // 返回存储的 TCP 订单
    } else {
      return await this.getOrdersFromServer();
    }
  }

  // 添加新方法获取历史订单
  static async getHistoryOrderDetails(): Promise<FormattedOrder[]> {
    try {
      const timeRange = this.getFullDayTimeRange();

      const searchResult = await this.searchOrders(timeRange);
      const orderDetails = await Promise.all(
        searchResult.orders.map(async orderId => {
          const detail = await this.getOrderDetail(orderId);
          return {
            ...detail,
            order_id: orderId
          };
        })
      );
      console.log(orderDetails);
      return this.formatOrders(orderDetails);
    } catch (error) {
      console.error('Error getting history orders:', error);
      throw error;
    }
  }

  // 添加格式化订单的辅助方法
  private static async formatOrders(orders: OrderDetailResponse[]): Promise<FormattedOrder[]> {
    const formattedOrders: FormattedOrder[] = [];

    for (const order of orders) {
      const productDetails = await Promise.all(
        order.products.map(productId => this.getProductDetail(productId))
      );

      formattedOrders.push({
        id: order.order_id,
        pickupMethod: order.pick_method,
        pickupTime: order.pick_time,
        items: productDetails.map((product, index) => ({
          name: product.name,
          quantity: order.qtys[index]
        }))
      });
    }

    return formattedOrders;
  }

  private static async getOrdersFromServer(): Promise<FormattedOrder[]> {
    try {
      const orders = await this.getAllTodayOrderDetails();
      const formattedOrders: FormattedOrder[] = [];

      for (const order of orders) {
        const productDetails = await Promise.all(
          order.products.map(productId => this.getProductDetail(productId))
        );

        const formattedOrder: FormattedOrder = {
          id: order.order_id,
          pickupMethod: order.pick_method,
          pickupTime: order.pick_time,
          items: productDetails.map((product, index) => ({
            name: product.name,
            quantity: order.qtys[index]
          }))
        };

        formattedOrders.push(formattedOrder);
        console.log(formattedOrder);
      }

      return formattedOrders;
    } catch (error) {
      console.error('Error getting orders from server:', error);
      throw error;
    }
  }

  // 添加移除订单的方法
  static removeOrder(orderId: string) {
    this.tcpOrders = this.tcpOrders.filter(order => order.id !== orderId);
  }
} 