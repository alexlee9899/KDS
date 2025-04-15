import AsyncStorage from '@react-native-async-storage/async-storage';
import { FormattedOrder, OrderItem } from './types';
import { OrderService } from './orderService';
import { Alert } from 'react-native';

// KDS角色枚举
export enum KDSRole {
  MASTER = "master",
  SLAVE = "slave"
}

// 品类枚举
export enum CategoryType {
  ALL = "all",
  DRINKS = "drinks",
  HOT_FOOD = "hot_food",
  COLD_FOOD = "cold_food",
  DESSERT = "dessert"
}

// 子KDS信息接口
interface SubKDSInfo {
  ip: string;
  category: CategoryType;
  connected: boolean;
}

export class DistributionService {
  private static role: KDSRole = KDSRole.MASTER;
  private static masterIP: string = "";
  private static category: CategoryType = CategoryType.ALL;
  private static subKdsList: SubKDSInfo[] = [];
  private static tcpSockets: Map<string, any> = new Map(); // 保存与子KDS的连接
  
  private static initialized = false;
  
  // 初始化分发服务
  public static async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // 加载设置
      const savedRole = await AsyncStorage.getItem("kds_role");
      this.role = (savedRole as KDSRole) || KDSRole.MASTER;
      
      const savedMasterIP = await AsyncStorage.getItem("master_ip");
      this.masterIP = savedMasterIP || "";
      
      // 子KDS不再需要手动设置category
      
      const savedSubKds = await AsyncStorage.getItem("sub_kds_list");
      if (savedSubKds) {
        const parsedList = JSON.parse(savedSubKds);
        this.subKdsList = parsedList.map((item: any) => ({
          ...item,
          connected: false
        }));
      }
      
      // 根据角色执行不同的初始化
      if (this.role === KDSRole.MASTER) {
        await this.initializeMaster();
      } else {
        await this.initializeSlave();
      }
      
      this.initialized = true;
      console.log(`KDS初始化完成，当前角色: ${this.role}`);
    } catch (error) {
      console.error("分发服务初始化失败:", error);
      throw error;
    }
  }
  
  // 初始化主KDS
  private static async initializeMaster(): Promise<void> {
    try {
      // 1. 启动TCP服务器
      await OrderService.bindTCPServer();
      
      // 2. 设置回调以接收来自原始订单源的订单
      OrderService.setTCPCallback(async (data: any) => {
        // 检查消息类型
        if (data.type === 'order_ack') {
          // 处理子KDS的订单确认
          console.log(`收到子KDS确认，订单ID: ${data.orderId}, 状态: ${data.status}`);
          // 可以在这里更新订单发送状态
        } 
        else if (data.type === 'order' || data.type === null) {
          // 处理订单数据
          console.log("主KDS收到新订单:", data.id || (data.data && data.data.id));
          
          // 如果数据包含data字段，使用它
          const orderData = data.data || data;
          
          // 处理订单并分发
          await this.processAndDistributeOrder(orderData);
        }
        else {
          console.log("收到未知类型TCP数据:", data);
        }
      });
      
      // 4. 尝试连接所有子KDS
      for (const subKds of this.subKdsList) {
        this.connectToSubKDS(subKds.ip, subKds.category);
      }
    } catch (error) {
      console.error("主KDS初始化失败:", error);
      Alert.alert("错误", "主KDS初始化失败");
      throw error;
    }
  }
  
  // 初始化子KDS
  private static async initializeSlave(): Promise<void> {
    try {
      if (!this.masterIP) {
        console.error("主KDS IP未设置");
        Alert.alert("配置错误", "请设置主KDS的IP地址");
        return;
      }
      
      // 1. 启动TCP服务器以接收来自主KDS的订单
      await OrderService.bindTCPServer();
      
      // 2. 设置回调以接收来自主KDS的订单(子KDS只接收TCP数据)
      OrderService.setTCPCallback((newOrder: FormattedOrder) => {
        console.log("子KDS收到TCP订单:", newOrder.id);
        
        // 保存订单到本地
        OrderService.addTCPOrder(newOrder);
        
        // 发送确认消息回主KDS
        const ackMessage = {
          type: 'order_ack',
          orderId: newOrder.id,
          status: 'received',
          timestamp: new Date().toISOString()
        };
        
        // 假设masterIP已经在初始化时保存
        OrderService.sendTCPData(DistributionService.masterIP, ackMessage);
      });
      
      // 3. 禁用网络订单接收(子KDS只处理从主KDS分发来的订单)
      OrderService.stopNetworkPolling();
      
      // 4. 向主KDS注册
      // this.registerWithMaster();
    } catch (error) {
      console.error("子KDS初始化失败:", error);
      Alert.alert("错误", "子KDS初始化失败");
      throw error;
    }
  }
  
  // 连接到子KDS
  private static async connectToSubKDS(ip: string, category: CategoryType): Promise<void> {
    try {
      console.log(`尝试连接子KDS: ${ip}, 品类: ${category}`);
      
      // 发送连接测试消息
      const testMessage = {
        type: 'connection_test',
        from: 'master',
        timestamp: new Date().toISOString()
      };
      
      const connected = await OrderService.sendTCPData(ip, testMessage);
      
      // 更新连接状态
      this.subKdsList = this.subKdsList.map(kds => 
        kds.ip === ip ? { ...kds, connected } : kds
      );
      
      // 保存更新后的子KDS列表
      await AsyncStorage.setItem("sub_kds_list", JSON.stringify(this.subKdsList));
      
      console.log(`子KDS ${ip} 连接${connected ? '成功' : '失败'}`);
      
      // 如果连接失败，考虑提醒用户
      if (!connected) {
        // 非阻塞提醒
        console.warn(`无法连接到子KDS: ${ip}`);
      }
    } catch (error) {
      console.error(`连接子KDS失败 ${ip}:`, error);
    }
  }
  
  // 向主KDS注册
  // private static async registerWithMaster(): Promise<void> {
  //   try {
  //     console.log(`向主KDS注册: ${this.masterIP}`);
      
  //     // 构建注册消息
  //     const registrationMessage = {
  //       type: 'register',
  //       ip: await OrderService.getDeviceIP(),
  //       timestamp: new Date().toISOString()
  //     };
      
  //     // 发送注册消息到主KDS
  //     const success = await OrderService.sendTCPData(
  //       this.masterIP, 
  //       registrationMessage
  //     );
      
  //     if (success) {
  //       console.log("向主KDS注册成功");
  //       // 保存设置，记录已注册状态
  //       await AsyncStorage.setItem("registered_with_master", "true");
  //     } else {
  //       console.error("向主KDS注册失败");
  //       Alert.alert("注册失败", "无法连接到主KDS，请检查网络或主KDS是否在线");
  //     }
  //   } catch (error) {
  //     console.error("向主KDS注册失败:", error);
  //     Alert.alert("注册错误", "注册过程中发生错误");
  //   }
  // }
  
  // 处理订单并分发给子KDS
  public static async processAndDistributeOrder(order: FormattedOrder): Promise<void> {
    try {
      console.log(`处理并分发订单: ${order.id}`);
      
      // 1. 首先将订单添加到主KDS自己的订单列表（如果是TCP订单，避免重复添加）
      if (order.source !== 'tcp') {
        OrderService.addTCPOrder({...order, source: 'tcp'});
      }
      
      // 2. 按品类分类订单项
      const categorizedItems = this.categorizeOrderItems(order.products);
      
      // 3. 分发到对应的子KDS
      for (const subKds of this.subKdsList) {
        if (!subKds.connected) continue;
        
        const categoryItems = categorizedItems[subKds.category];
        if (!categoryItems || categoryItems.length === 0) continue;
        
        // 创建子订单
        const subOrder: FormattedOrder = {
          ...order,
          products: categoryItems,
          id: order.id,
          source: 'tcp',
          orderTime: order.orderTime,
          pickupMethod: order.pickupMethod,
          pickupTime: order.pickupTime,
          order_num: order.order_num,
        };
        
        // 发送子订单到子KDS
        this.sendOrderToSubKDS(subKds.ip, subOrder);
      }
    } catch (error) {
      console.error("处理并分发订单失败:", error);
    }
  }
  
  // 将订单项按品类分类
  private static categorizeOrderItems(items: OrderItem[]): Record<CategoryType, OrderItem[]> {
    const result: Record<CategoryType, OrderItem[]> = {
      [CategoryType.DRINKS]: [],
      [CategoryType.HOT_FOOD]: [],
      [CategoryType.COLD_FOOD]: [],
      [CategoryType.DESSERT]: [],
      [CategoryType.ALL]: items // 全部品类包含所有项目
    };
    
    for (const item of items) {
      // 这里根据实际情况判断每个商品属于哪个品类
      
      if (item.name.toLowerCase().includes('coffee') || 
          item.name.toLowerCase().includes('tea') || 
          item.name.toLowerCase().includes('juice')) {
        result[CategoryType.DRINKS].push(item);
      }
      else if (item.name.toLowerCase().includes('cake') || 
               item.name.toLowerCase().includes('ice') || 
               item.name.toLowerCase().includes('dessert')) {
        result[CategoryType.DESSERT].push(item);
      }
      else if (item.name.toLowerCase().includes('salad') || 
               item.name.toLowerCase().includes('sandwich')) {
        result[CategoryType.COLD_FOOD].push(item);
      }
      else {
        // 默认归为热食
        result[CategoryType.HOT_FOOD].push(item);
      }
    }
    
    return result;
  }
  
  // 发送订单到子KDS
  private static async sendOrderToSubKDS(ip: string, order: FormattedOrder): Promise<void> {
    try {
      console.log(`发送订单 ${order.id} 到子KDS ${ip}`);
      
      // 构建订单消息
      const orderMessage = {
        type: 'order',
        data: order,
        timestamp: new Date().toISOString()
      };
      
      // 发送订单到子KDS
      const success = await OrderService.sendTCPData(ip, orderMessage);
      
      if (success) {
        console.log(`订单 ${order.id} 成功发送到子KDS ${ip}`);
      } else {
        console.error(`发送订单到子KDS ${ip} 失败`);
      }
    } catch (error) {
      console.error(`发送订单到子KDS ${ip} 失败:`, error);
    }
  }
  
  // 关闭分发服务
  public static async shutdown(): Promise<void> {
    try {
      // 关闭所有TCP连接
      for (const [ip, socket] of this.tcpSockets.entries()) {
        console.log(`关闭与 ${ip} 的连接`);
        // 关闭连接的代码
        // ...
      }
      
      // 清空映射
      this.tcpSockets.clear();
      
      // 关闭TCP服务器
      // await OrderService.closeTCPServer();
      
      this.initialized = false;
      console.log("分发服务已关闭");
    } catch (error) {
      console.error("关闭分发服务失败:", error);
    }
  }

  // 创建并管理TCP连接
  // private static async createConnection(ip: string): Promise<boolean> {
  //   try {
  //     // 获取配置的端口
  //     const savedPort = await AsyncStorage.getItem("kds_port") || "4321";
  //     const port = parseInt(savedPort, 10);
      
  //     // 关闭已存在的连接
  //     if (this.tcpSockets.has(ip)) {
  //       try {
  //         // 尝试关闭现有连接
  //         const socket = this.tcpSockets.get(ip);
  //         // 关闭连接的具体实现取决于你的socket库
  //         this.tcpSockets.delete(ip);
  //       } catch (e) {
  //         console.warn(`关闭旧连接失败: ${ip}`, e);
  //       }
  //     }
      
  //     // 创建新连接 (使用sendTCPData测试连接)
  //     const connected = await OrderService.sendTCPData(ip, {type: 'connection_test'});
  //     if (connected) {
  //       // 存储连接状态
  //       this.tcpSockets.set(ip, { ip, port, connected: true, lastActivity: Date.now() });
  //       return true;
  //     }
  //     return false;
  //   } catch (error) {
  //     console.error(`创建TCP连接失败 ${ip}:`, error);
  //     return false;
  //   }
  // }

  // 检查是否为主KDS
  public static isMaster(): boolean {
    return this.role === KDSRole.MASTER;
  }
} 