/**
 * OrderService 主类
 * 整合所有模块功能
 */

import { FormattedOrder } from '../types';
import AudioService from '../audioService';

// 导入各模块功能
import * as StorageService from './storageService';
import * as NetworkService from './networkService';
import * as TCPService from './tcpService';
import * as TimeUtils from './timeUtils';
import * as Formatters from './formatters';
import { POLLING_INTERVAL } from './constants';

/**
 * OrderService 类
 * 整合订单管理的所有功能
 */
export class OrderService {
  // 内部状态存储
  private static networkOrders: FormattedOrder[] = [];
  private static tcpOrders: FormattedOrder[] = [];
  private static networkPollingInterval: NodeJS.Timeout | null = null;
  
  // 回调函数存储
  private static networkOrderUpdateCallback: ((orders: FormattedOrder[]) => void) | null = null;
  private static tcpOrderUpdateCallback: ((orders: FormattedOrder[]) => void) | null = null;
  private static combinedOrderUpdateCallback: ((orders: FormattedOrder[]) => void) | null = null;
  
  /**
   * 设置订单更新回调函数
   */
  public static setOrderUpdateCallback(callback: (orders: FormattedOrder[]) => void) {
    this.combinedOrderUpdateCallback = callback;
    console.log('订单更新回调已设置');
    
    // 立即发送当前合并的订单列表
    if (callback) {
      callback([...this.networkOrders, ...this.tcpOrders]);
    }
  }

  /**
   * 添加新网络订单
   */
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
      await StorageService.saveNetworkOrders(this.networkOrders);
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

  /**
   * 添加新TCP订单
   */
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
      await StorageService.saveTCPOrders(this.tcpOrders);
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

  /**
   * 获取所有订单（网络+TCP）
   */
  static async getAllOrders(): Promise<FormattedOrder[]> {
    const networkOrders = await StorageService.loadNetworkOrders();
    const tcpOrders = await StorageService.loadTCPOrders();
    return [...networkOrders, ...tcpOrders];
  }

  /**
   * 删除订单（网络和TCP）
   */
  static async removeOrder(orderId: string) {
    try {
      // 尝试从两种类型的订单中删除
      const networkIndex = this.networkOrders.findIndex(order => order.id === orderId);
      if (networkIndex !== -1) {
        this.networkOrders = await StorageService.removeNetworkOrder(orderId, this.networkOrders);
      }
      
      const tcpIndex = this.tcpOrders.findIndex(order => order.id === orderId);
      if (tcpIndex !== -1) {
        this.tcpOrders = await StorageService.removeTCPOrder(orderId, this.tcpOrders);
      }
      
      // 触发更新回调
      if (this.combinedOrderUpdateCallback) {
        this.combinedOrderUpdateCallback([...this.networkOrders, ...this.tcpOrders]);
      }
    } catch (error) {
      console.error('删除订单失败:', error);
    }
  }

  /**
   * 初始化系统 - 同时启动网络轮询和TCP服务器
   */
  static async initialize() {
    try {
      console.log('===== 初始化订单系统开始 =====');
      
      // 从AsyncStorage加载已有订单
      this.networkOrders = await StorageService.loadNetworkOrders();
      this.tcpOrders = await StorageService.loadTCPOrders();
      
      console.log(`已加载 ${this.networkOrders.length} 个网络订单和 ${this.tcpOrders.length} 个TCP订单`);
      
      // 同时启动网络轮询和TCP服务器，不再根据网络状态切换
      console.log('即将启动网络订单轮询...');
      this.startNetworkPolling();
      
      console.log('即将初始化TCP服务器...');
      TCPService.bindTCPServer().catch(err => {
        console.error('TCP服务器初始化失败，但继续使用网络模式:', err);
      });
      
      console.log('===== 初始化订单系统完成 =====');
      return true;
    } catch (error) {
      console.error('===== 初始化失败 =====', error);
      return false;
    }
  }

  /**
   * 设置TCP回调函数
   */
  static setTCPCallback(callback: (orderData: FormattedOrder) => void) {
    TCPService.setTCPCallback(callback, Formatters.formatTCPOrder, this.addTCPOrder.bind(this));
  }

  /**
   * 绑定TCP服务器（代理到TCPService模块）
   */
  static async bindTCPServer(): Promise<boolean> {
    return TCPService.bindTCPServer();
  }

  /**
   * 开始网络轮询
   */
  static startNetworkPolling() {
    console.log('==== 尝试启动网络订单轮询 ====');
    
    if (this.networkPollingInterval) {
      // 如果已经在轮询，先停止
      console.log('已存在轮询定时器，重置轮询');
      this.stopNetworkPolling();
    }
    
    console.log(`开始网络订单轮询，间隔: ${POLLING_INTERVAL}ms，当前时间: ${new Date().toISOString()}`);
    
    // 立即执行一次
    console.log('立即执行第一次轮询');
    this.fetchOrdersFromNetworkAndProcess();
    
    // 设置定时器
    this.networkPollingInterval = setInterval(() => {
      this.fetchOrdersFromNetworkAndProcess();
    }, POLLING_INTERVAL);
  }

  /**
   * 停止网络轮询
   */
  static stopNetworkPolling() {
    if (this.networkPollingInterval) {
      clearInterval(this.networkPollingInterval);
      this.networkPollingInterval = null;
      console.log('停止网络订单轮询');
    }
  }

  /**
   * 从网络获取订单并处理
   */
  private static async fetchOrdersFromNetworkAndProcess() {
    try {
      const timeRange = TimeUtils.getTimeRangeAroundNow();
      const orders = await NetworkService.fetchOrdersFromNetwork(timeRange, this.addNetworkOrder.bind(this));
      
      if (orders && orders.length > 0) {
        console.log(`获取到 ${orders.length} 个订单，正在处理...`);
        for (const order of orders) {
          // 格式化并添加每个订单
          const formattedOrder = await Formatters.formatNetworkOrder(order);
          console.log(`订单 ${formattedOrder.order_num} 总准备时间: ${formattedOrder.total_prepare_time} 秒`);
          await this.addNetworkOrder(formattedOrder);
        }
      }
    } catch (error) {
      console.error('处理网络订单失败:', error);
    }
  }

  /**
   * 获取历史订单详情
   */
  static async getHistoryOrderDetails(): Promise<FormattedOrder[]> {
    try {
      // 获取原始历史订单数据
      const rawOrders = await NetworkService.fetchHistoryOrders();
      
      // 创建包含过滤后订单的结果对象
      const result = { orders: rawOrders };
      
      // 格式化订单
      return await Formatters.formatOrders(result);
    } catch (error) {
      console.error('获取历史订单失败:', error);
      return []; // 返回空数组而不是抛出错误
    }
  }

  /**
   * 获取产品详情
   */
  static async getProductDetail(productId: string) {
    return NetworkService.getProductDetail(productId);
  }

  /**
   * 获取设备IP地址
   */
  static async getDeviceIP() {
    return NetworkService.getDeviceIP();
  }

  /**
   * 加载网络订单（代理到StorageService模块）
   */
  static async loadNetworkOrders(): Promise<FormattedOrder[]> {
    return StorageService.loadNetworkOrders();
  }

  /**
   * 加载TCP订单（代理到StorageService模块）
   */
  static async loadTCPOrders(): Promise<FormattedOrder[]> {
    return StorageService.loadTCPOrders();
  }

  /**
   * 保存网络订单（代理到StorageService模块）
   */
  static async saveNetworkOrders(orders: FormattedOrder[]): Promise<void> {
    return StorageService.saveNetworkOrders(orders);
  }

  /**
   * 保存TCP订单（代理到StorageService模块）
   */
  static async saveTCPOrders(orders: FormattedOrder[]): Promise<void> {
    return StorageService.saveTCPOrders(orders);
  }

  /**
   * 获取当前时间范围（代理到TimeUtils模块）
   */
  static getTimeRangeAroundNow() {
    return TimeUtils.getTimeRangeAroundNow();
  }
  
  /**
   * 从网络获取订单（代理到NetworkService模块）
   */
  static async fetchOrdersFromNetwork(timeRange: any) {
    return NetworkService.fetchOrdersFromNetwork(timeRange, this.addNetworkOrder.bind(this));
  }

  /**
   * 向特定IP发送TCP数据
   */
  static async sendTCPData(targetIP: string, data: any) {
    return TCPService.sendTCPData(targetIP, data);
  }

  /**
   * 向所有子KDS广播TCP数据
   */
  static async broadcastToSubKDS(data: any, subKDSList: string[]) {
    return TCPService.broadcastToSubKDS(data, subKDSList);
  }

  /**
   * 撤回历史订单到新订单队列
   */
  static async recallOrder(order: FormattedOrder): Promise<boolean> {
    try {
      console.log("撤回历史订单:", order.id);
      
      // 创建一个新的订单副本，避免修改原订单
      const recalledOrder: FormattedOrder = {
        ...order,
        id: `recalled-${order.id}`, // 生成新的ID以避免冲突
        orderTime: new Date().toISOString(), // 更新订单时间为当前时间
        status: 'recalled', // 标记为撤回的订单
      };
      
      // 保存到网络订单存储
      await this.addNetworkOrder(recalledOrder);
      
      console.log("订单撤回成功:", recalledOrder.id);
      return true;
    } catch (error) {
      console.error("撤回订单失败:", error);
      throw error;
    }
  }
} 