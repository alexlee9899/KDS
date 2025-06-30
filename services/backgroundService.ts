/**
 * 后台服务控制模块
 * 提供控制Android后台服务的API
 */

import { NativeModules, Platform } from 'react-native';

const { KDSBackgroundServiceModule } = NativeModules;

/**
 * 检查后台服务模块是否可用
 */
const isBackgroundServiceAvailable = (): boolean => {
  return Platform.OS === 'android' && KDSBackgroundServiceModule != null;
};

/**
 * 启动后台服务
 */
export const startBackgroundService = async (): Promise<boolean> => {
  if (!isBackgroundServiceAvailable()) {
    console.log('后台服务仅在Android平台可用');
    return false;
  }
  
  try {
    const result = await KDSBackgroundServiceModule.startService();
    console.log('后台服务启动结果:', result);
    return result;
  } catch (error) {
    console.error('启动后台服务失败:', error);
    return false;
  }
};

/**
 * 停止后台服务
 */
export const stopBackgroundService = async (): Promise<boolean> => {
  if (!isBackgroundServiceAvailable()) {
    console.log('后台服务仅在Android平台可用');
    return false;
  }
  
  try {
    const result = await KDSBackgroundServiceModule.stopService();
    console.log('后台服务停止结果:', result);
    return result;
  } catch (error) {
    console.error('停止后台服务失败:', error);
    return false;
  }
};

/**
 * 检查后台服务是否正在运行
 */
export const isBackgroundServiceRunning = async (): Promise<boolean> => {
  if (!isBackgroundServiceAvailable()) {
    console.log('后台服务仅在Android平台可用');
    return false;
  }
  
  try {
    const result = await KDSBackgroundServiceModule.isServiceRunning();
    console.log('后台服务运行状态:', result);
    return result;
  } catch (error) {
    console.error('检查后台服务状态失败:', error);
    return false;
  }
};

/**
 * 手动触发检查新订单
 */
export const checkNewOrders = async (): Promise<boolean> => {
  if (!isBackgroundServiceAvailable()) {
    console.log('后台服务仅在Android平台可用');
    return false;
  }
  
  try {
    const result = await KDSBackgroundServiceModule.checkNewOrders();
    console.log('触发检查新订单结果:', result);
    return result;
  } catch (error) {
    console.error('触发检查新订单失败:', error);
    return false;
  }
}; 