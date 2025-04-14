/**
 * OrderService 导出文件
 * 
 * 注意：此文件仅用于与现有代码兼容
 * 所有新代码应直接导入 './orderService/index' 
 */

import { OrderService } from './orderService/index';
import * as TCPService from './orderService/tcpService';

// 导出 OrderService 类
export { OrderService };

// 导出TCP相关方法
export const bindTCPServer = TCPService.bindTCPServer;

// 默认导出
export default OrderService;