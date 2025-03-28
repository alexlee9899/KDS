import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates'; // 需要先安装这个包

const API_URL = 'https://vend88.com';

export interface LoginResponse {
  message: string;
  role: string;
  status_code: number;
  token: string;
}

type AuthStateListener = (isAuthenticated: boolean) => void;
const listeners = new Set<AuthStateListener>();

// 将getToken独立导出，以便在各个服务中使用
export const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    console.error("获取token错误:", error);
    return null;
  }
};

export const auth = {
  // 添加认证状态监听器
  addAuthStateListener(listener: AuthStateListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // 通知所有监听器状态变化
  notifyAuthStateChange(isAuthenticated: boolean) {
    listeners.forEach(listener => listener(isAuthenticated));
  },

  // 登录
  async login(email: string, password: string) {
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();
      
      if (data.status_code === 200) {
        // 保存 token
        await AsyncStorage.setItem('token', data.token);
        // 通知状态变化
        auth.notifyAuthStateChange(true);
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: '网络错误' };
    }
  },

  // 登出
  async logout() {
    try {
      // 仅删除 token，而不是清空所有存储
      await AsyncStorage.removeItem('token');
      // 通知所有监听器认证状态变为 false
      auth.notifyAuthStateChange(false);
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  },

  // 检查是否已登录
  async isAuthenticated() {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  },

  // 导出getToken方法
  getToken,
}; 