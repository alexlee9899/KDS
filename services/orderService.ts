import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrderSearchResponse, OrderDetailResponse, OrderSearchParams, OrderDetailParams, ProductDetailResponse, FormattedOrder } from './types';
import orderModule from './orderModule';
import * as Network from 'expo-network';
import AudioService from './audioService';  // 导入音频服务
import { getToken } from '../utils/auth';
import { DistributionService } from './distributionService';
const API_BASE_URL = 'https://vend88.com';
const POLLING_INTERVAL = 5000; // 5秒轮询间隔

export class OrderService {
  // 存储键名
  private static readonly NETWORK_ORDERS_KEY = '@network_orders';
  private static readonly TCP_ORDERS_KEY = '@tcp_orders';
  
  private static orderModule = orderModule;
  private static networkOrders: FormattedOrder[] = [];  // 网络订单
  private static tcpOrders: FormattedOrder[] = [];  // TCP订单
  private static networkPollingInterval: NodeJS.Timeout | null = null;
  
  // 添加订单更新回调属性
  private static networkOrderUpdateCallback: ((orders: FormattedOrder[]) => void) | null = null;
  private static tcpOrderUpdateCallback: ((orders: FormattedOrder[]) => void) | null = null;
  private static combinedOrderUpdateCallback: ((orders: FormattedOrder[]) => void) | null = null;
  
  // 设置合并订单更新回调
  public static setOrderUpdateCallback(callback: (orders: FormattedOrder[]) => void) {
    this.combinedOrderUpdateCallback = callback;
    console.log('订单更新回调已设置');
    
    // 立即发送当前合并的订单列表
    if (callback) {
      callback([...this.networkOrders, ...this.tcpOrders]);
    }
  }

  // 从 AsyncStorage 加载网络订单
  public static async loadNetworkOrders(): Promise<FormattedOrder[]> {
    try {
      const ordersJson = await AsyncStorage.getItem(this.NETWORK_ORDERS_KEY);
      return ordersJson ? JSON.parse(ordersJson) : [];
    } catch (error) {
      console.error('加载网络订单失败:', error);
      return [];
    }
  }
  
  // 从 AsyncStorage 加载TCP订单
  public static async loadTCPOrders(): Promise<FormattedOrder[]> {
    try {
      const ordersJson = await AsyncStorage.getItem(this.TCP_ORDERS_KEY);
      return ordersJson ? JSON.parse(ordersJson) : [];
    } catch (error) {
      console.error('加载TCP订单失败:', error);
      return [];
    }
  }

  // 保存网络订单到 AsyncStorage
  public static async saveNetworkOrders(orders: FormattedOrder[]) {
    try {
      await AsyncStorage.setItem(this.NETWORK_ORDERS_KEY, JSON.stringify(orders));
      // 更新内存中的订单列表
      this.networkOrders = orders;
      
      // 触发合并回调
      if (this.combinedOrderUpdateCallback) {
        this.combinedOrderUpdateCallback([...this.networkOrders, ...this.tcpOrders]);
      }
    } catch (error) {
      console.error('保存网络订单失败:', error);
    }
  }
  
  // 保存TCP订单到 AsyncStorage
  public static async saveTCPOrders(orders: FormattedOrder[]) {
    try {
      await AsyncStorage.setItem(this.TCP_ORDERS_KEY, JSON.stringify(orders));
      // 更新内存中的订单列表
      this.tcpOrders = orders;
      
      // 触发合并回调
      if (this.combinedOrderUpdateCallback) {
        this.combinedOrderUpdateCallback([...this.networkOrders, ...this.tcpOrders]);
      }
    } catch (error) {
      console.error('保存TCP订单失败:', error);
    }
  }

  // 添加新网络订单
  public static async addNetworkOrder(order: FormattedOrder): Promise<void> {
    try {
      // 检查订单是否已存在
      const existingOrderIndex = this.networkOrders.findIndex((o) => o.id === order.id);
      if (existingOrderIndex !== -1) {
        console.log(`网络订单已存在,ID: ${order.id}`);
        return;
      }

      // 添加新订单
      this.networkOrders = [order, ...this.networkOrders];
      await this.saveNetworkOrders(this.networkOrders);
      console.log(`网络订单已添加并保存，当前总数: ${this.networkOrders.length}`);
     
      // 播放新订单提示音
      AudioService.playNewOrderAlert();
      
      // 触发网络订单和合并订单回调
      if (this.networkOrderUpdateCallback) {
        this.networkOrderUpdateCallback(this.networkOrders);
      }
      
      if (this.combinedOrderUpdateCallback) {
        this.combinedOrderUpdateCallback([...this.networkOrders, ...this.tcpOrders]);
      }
    } catch (error) {
      console.error('添加网络订单失败:', error);
    }
  }

  // 添加新TCP订单
  public static async addTCPOrder(order: FormattedOrder): Promise<void> {
    try {
      // 检查订单是否已存在
      const existingOrderIndex = this.tcpOrders.findIndex((o) => o.id === order.id);
      if (existingOrderIndex !== -1) {
        console.log(`TCP订单已存在,ID: ${order.id}`);
        return;
      }

      // 添加新订单
      this.tcpOrders = [order, ...this.tcpOrders];
      await this.saveTCPOrders(this.tcpOrders);
      console.log(`TCP订单已添加并保存，当前总数: ${this.tcpOrders.length}`);
     
      // 播放新订单提示音
      AudioService.playNewOrderAlert();
      
      // 触发TCP订单和合并订单回调
      if (this.tcpOrderUpdateCallback) {
        this.tcpOrderUpdateCallback(this.tcpOrders);
      }
      
      if (this.combinedOrderUpdateCallback) {
        this.combinedOrderUpdateCallback([...this.networkOrders, ...this.tcpOrders]);
      }
    } catch (error) {
      console.error('添加TCP订单失败:', error);
    }
  }

  
  // 获取所有订单（网络+TCP）
  static async getAllOrders(): Promise<FormattedOrder[]> {
    const networkOrders = await this.loadNetworkOrders();
    const tcpOrders = await this.loadTCPOrders();
    return [...networkOrders, ...tcpOrders];
  }

  // 删除网络订单
  static async removeNetworkOrder(orderId: string) {
    try {
      const orders = await this.loadNetworkOrders();
      const filteredOrders = orders.filter(order => order.id !== orderId);
      await this.saveNetworkOrders(filteredOrders);
      console.log('网络订单已删除，ID:', orderId);
    } catch (error) {
      console.error('删除网络订单失败:', error);
    }
  }
  
  // 删除TCP订单
  static async removeTCPOrder(orderId: string) {
    try {
      const orders = await this.loadTCPOrders();
      const filteredOrders = orders.filter(order => order.id !== orderId);
      await this.saveTCPOrders(filteredOrders);
      console.log('TCP订单已删除，ID:', orderId);
    } catch (error) {
      console.error('删除TCP订单失败:', error);
    }
  }

  // 初始化系统 - 同时启动网络轮询和TCP服务器
  static async initialize() {
    try {
      console.log('初始化订单系统...');
      
      // 从AsyncStorage加载已有订单
      this.networkOrders = await this.loadNetworkOrders();
      this.tcpOrders = await this.loadTCPOrders();
      
      console.log(`已加载 ${this.networkOrders.length} 个网络订单和 ${this.tcpOrders.length} 个TCP订单`);
      
      // 同时启动网络轮询和TCP服务器，不再根据网络状态切换
      console.log('启动网络订单轮询...');
      this.startNetworkPolling();
      
      console.log('初始化TCP服务器...');
      this.bindTCPServer().catch(err => {
        console.error('TCP服务器初始化失败，但继续使用网络模式:', err);
      });
      
      return true;
    } catch (error) {
      console.error('初始化失败:', error);
      return false;
    }
  }

  // 拆分出 bind 初始化
  static async bindTCPServer() {
    try {
      console.log('正在初始化TCP服务器...');
      await this.orderModule.bind();
      console.log('TCP服务器初始化成功');
      return true;
    } catch (error) {
      console.error('TCP服务器初始化失败:', error);
      throw error;
    }
  }

  // 单独的设置TCP回调函数
  static setTCPCallback(callback: (orderData: FormattedOrder) => void) {
    try {
      console.log('设置TCP订单回调...');
      
      this.orderModule.setOrderCallback(async (orderData) => {
        console.log('收到原始TCP订单数据:', orderData);
        
        // 格式化订单数据
        const formattedOrder = this.formatTCPOrder(orderData);
        
        // 添加到TCP本地存储
        await this.addTCPOrder(formattedOrder);
        
        // 调用外部回调
        callback(formattedOrder);
      });
    } catch (error) {
      console.error('设置TCP回调失败:', error);
      throw error;
    }
  }

  // 格式化 TCP 订单数据
  private static formatTCPOrder(orderData: any): FormattedOrder {
    try {
      // 确保有订单ID
      const orderId = orderData.order_num || orderData.orderId || orderData.id || String(Date.now());
      
      // 提取并格式化订单项
      const items = Array.isArray(orderData.items) ? orderData.items : [];
      
      const formattedOrder: FormattedOrder = {
        id: orderId,
        orderTime: orderData.time || new Date().toISOString(),
        pickupMethod: orderData.pickupMethod || orderData.pick_method || "未知",
        pickupTime: orderData.pickupTime || orderData.pick_time || new Date().toISOString(),
        order_num: orderData.order_num?.toString() || orderId,
        items: items.map((item: any) => ({
          id: item.id || `tcp-item`,
          name: item.name || "未知商品",
          quantity: item.quantity || 1,
          price: item.price || 0,
          options: Array.isArray(item.options) ? item.options : []
        })),
        source: 'tcp' // 标记来源为TCP
      };
      
      return formattedOrder;
    } catch (error) {
      console.error('格式化TCP订单失败:', error);
      // 返回一个基本订单对象
      return {
        id: String(Date.now()),
        pickupMethod: "格式化错误",
        pickupTime: new Date().toISOString(),
        order_num: String(Date.now()),
        items: [],
        source: 'tcp'
      };
    }
  }

  // 生成当天的时间范围
  private static getFullDayTimeRange(): [string, string] {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const startTime = `${year}-${month}-${day} 00:00:00`;
    const endTime = `${year}-${month}-${day} 23:59:59`;
    
    return [startTime, endTime];
  }

  // 修改后的函数，适应服务器时区
  private static getTimeRangeAroundNow(): [string, string] {
    // 获取当前本地时间
    const now = new Date();
    
    // 计算5秒前（本地时间）
    const fiveSecondsAgo = new Date(now.getTime() - 5000);
    
    // 计算今晚零点（本地时间）
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);  // 设置为明天
    midnight.setHours(0, 0, 0, 0);  // 设置为零点
    
    // 服务器与本地时区的差值（小时）
    // 如果服务器是 UTC-3，本地是 UTC+8，则差值为 -11 小时
    const serverTimezoneOffset = -11; 
    
    // 将本地时间转换为服务器时区时间
    const serverFiveSecondsAgo = new Date(fiveSecondsAgo);
    serverFiveSecondsAgo.setHours(serverFiveSecondsAgo.getHours() + serverTimezoneOffset);
    
    const serverMidnight = new Date(midnight);
    serverMidnight.setHours(serverMidnight.getHours() + serverTimezoneOffset);
    
    // 格式化为服务器期望的日期格式 "YYYY-MM-DD HH:MM:SS"
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };
    
    console.log(`本地时间范围: ${formatDate(fiveSecondsAgo)} 到 ${formatDate(midnight)}`);
    console.log(`服务器时间范围: ${formatDate(serverFiveSecondsAgo)} 到 ${formatDate(serverMidnight)}`);
    
    // 返回服务器时区的时间范围
    return [formatDate(serverFiveSecondsAgo), formatDate(serverMidnight)];
  }

  // 开始网络轮询
  static startNetworkPolling() {
    if (this.networkPollingInterval) {
      // 如果已经在轮询，先停止
      this.stopNetworkPolling();
    }
    
    console.log('开始网络订单轮询，间隔:', POLLING_INTERVAL, 'ms');
    
    // 立即执行一次
    this.fetchOrdersFromNetwork();
    
    // 设置定时器
    this.networkPollingInterval = setInterval(() => {
      this.fetchOrdersFromNetwork();
    }, POLLING_INTERVAL);
  }

  // 停止网络轮询
  static stopNetworkPolling() {
    if (this.networkPollingInterval) {
      clearInterval(this.networkPollingInterval);
      this.networkPollingInterval = null;
      console.log('停止网络订单轮询');
    }
  }

  // 从网络获取订单
  static async fetchOrdersFromNetwork() {
    try {
      // 获取token
      const token = await getToken();
      if (!token) {
        console.error('无法获取访问令牌，请先登录');
        return;
      }
      
      // 获取时间范围
      const timeRange = this.getTimeRangeAroundNow();
      
      // 准备请求体
      const requestBody = {
        token: token,
        query: {
          time: timeRange
        },
        detail: true,
        page_size: 10000,
        page_idx: 0
      };
      
      
      
      // 发送请求
      const response = await fetch(`${API_BASE_URL}/search/order_search_v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`);
      }
      
      const result = await response.json();
      
      
      // 检查返回的订单数据
      if (result && result.orders && Array.isArray(result.orders)) {
        // 处理每个订单
        for (const order of result.orders) {
          // 只处理新订单 - 状态为unpaid或dispatch
          if (order.status === 'unpaid' || order.status === 'dispatch') {
            // 格式化订单数据
            const formattedOrder = await this.formatNetworkOrder(order);
            
            // 添加到网络订单存储
            await this.addNetworkOrder(formattedOrder);
          }
        }
      }
    } catch (error) {
      console.error('网络获取订单失败:', error);
    }
  }
  
  // 格式化网络订单
  private static async formatNetworkOrder(order: any): Promise<FormattedOrder> {
    try {
      // 无需再调用getProductDetail，因为产品详情已经包含在订单数据中
      // 直接格式化产品项
      const formattedItems = order.products.map((product: any, index: number) => {
        return {
          id: product._id || `item-${index}-${Date.now()}`,
          name: product.name || '未知商品',
          quantity: product.qty || 1,
          price: product.price || 0,
          options: Array.isArray(product.option) ? product.option.map((opt: any) => ({
            name: opt.name || '选项',
            value: String(opt.qty || 1),
            price: opt.price_adjust || 0
          })) : []
        };
      });

      return {
        id: order.order_num.toString(), // 使用order_num作为ID
        orderTime: order.time,
        pickupMethod: order.pick_method,
        pickupTime: order.pick_time,
        order_num: order.order_num.toString(),
        status: order.status, 
        
        items: formattedItems,
        source: 'network' // 标记来源为网络
      };
    } catch (error) {
      console.error('格式化网络订单失败:', error, order);
      
      // 返回基本订单对象而不是抛出错误
      return {
        id: (order.order_num || Date.now()).toString(),
        orderTime: order.time || new Date().toISOString(),
        pickupMethod: order.pick_method || '未知',
        pickupTime: order.pick_time || new Date().toISOString(),
        order_num: (order.order_num || Date.now()).toString(),
        status: order.status || '未知',
  
        items: [],
        source: 'network'
      };
    }
  }

  static async searchOrders(timeRange: [string, string]): Promise<OrderSearchResponse> {
    const token = await getToken();
    
    if (!token) {
      throw new Error('未找到令牌');
    }
    
    const searchParams: OrderSearchParams = {
      query: {
        time: timeRange
      },
      detail: true,
      page_size: 10000,
      page_idx: 0
    };

    try {
      const response = await fetch(`${API_BASE_URL}/search/order_search_v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams)
      });

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('搜索订单失败:', error);
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
        throw new Error(`HTTP错误! 状态: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取产品详情失败:', error);
      throw error;
    }
  }

  // 添加新方法获取历史订单
  static async getHistoryOrderDetails(): Promise<FormattedOrder[]> {
    try {
      const timeRange = this.getFullDayTimeRange();

      const searchResult = await this.searchOrders(timeRange);
      return this.formatOrders(searchResult);
    } catch (error) {
      console.error('获取历史订单失败:', error);
      throw error;
    }
  }

  // 修改格式化订单的辅助方法
  private static async formatOrders(ordersData: any): Promise<FormattedOrder[]> {
    const formattedOrders: FormattedOrder[] = [];

    // 确保我们有订单数组
    const orders = ordersData.orders || [];
    
    for (const order of orders) {
      try {
        // 获取商品详情 - 如果需要的话
        const productDetails = await Promise.all(
          order.products.map((productId: any) => this.getProductDetail(productId))
        );

        // 格式化当前订单选项
        const formattedItems = productDetails.map((product, index) => {
          // 获取当前产品的选项
          const productOptions = order.options[index] || [];
          
          return {
            id: product.product_id || `item-${index}-${Date.now()}`,
            name: product.name,
            quantity: order.qtys[index],
            price: order.product_prices[index] || 0,
            options: productOptions.map((opt: any) => ({
              name: opt.name || '选项',
              value: String(opt.qty || 1),
              price: opt.price_adjust || 0
            }))
          };
        });

        formattedOrders.push({
          id: order.order_num.toString(), // 使用order_num作为ID
          orderTime: order.time,
          pickupMethod: order.pick_method,
          pickupTime: order.pick_time,
          order_num: order.order_num.toString(),
          status: order.status, // 添加订单状态
          
          items: formattedItems,
          source: 'history'     // 标记来源为历史数据
        });
      } catch (error) {
        console.error('格式化订单失败:', error, order);
        // 继续处理下一个订单
      }
    }

    return formattedOrders;
  }

  // 添加移除订单的方法
  static removeOrder(orderId: string) {
    // 从两个数据源中移除订单
    this.networkOrders = this.networkOrders.filter(order => order.id !== orderId);
    this.tcpOrders = this.tcpOrders.filter(order => order.id !== orderId);
  }

  // 获取设备IP地址
  public static async getDeviceIP(): Promise<string> {
    try {
      // 使用expo-network获取IP
      const ip = await Network.getIpAddressAsync();
      return ip || "unknown";
    } catch (error) {
      console.error("获取IP地址失败:", error);
      return "unknown";
    }
  }

  // 向特定IP发送TCP数据
  public static async sendTCPData(targetIP: string, data: any): Promise<boolean> {
    try {
      // 使用原生模块发送TCP数据
      const result = await this.orderModule.sendTCPData(targetIP, JSON.stringify(data));
      return result;
    } catch (error) {
      console.error(`向 ${targetIP} 发送TCP数据失败:`, error);
      return false;
    }
  }

  // 向所有子KDS广播TCP数据
  public static async broadcastToSubKDS(data: any, subKDSList: string[]): Promise<void> {
    for (const ip of subKDSList) {
      await this.sendTCPData(ip, data);
    }
  }
} 