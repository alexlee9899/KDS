import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { FormattedOrder } from "../services/types";
import { OrderService } from "../services/orderService";

interface OrderContextType {
  orders: FormattedOrder[];
  loading: boolean;
  error: string | null;
  removeOrder: (orderId: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<FormattedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化 TCP 服务和设置回调 - 只执行一次
  useEffect(() => {
    const initTCPSystem = async () => {
      try {
        console.log("正在初始化TCP系统...");
        setLoading(true);

        // 步骤1: 绑定TCP服务器
        await OrderService.bindTCPServer();
        console.log("TCP服务器绑定成功");

        // 步骤2: 加载已保存的TCP订单 (如果有)
        const savedOrders = await OrderService.getTCPOrders();
        setOrders(savedOrders);

        // 步骤3: 设置TCP数据回调，当新订单到达时更新状态
        OrderService.setTCPCallback((newOrder) => {
          console.log("收到新TCP订单:", newOrder.id);

          // 更新React状态中的订单列表
          setOrders((prev) => {
            // 检查订单是否已存在
            const exists = prev.some((order) => order.id === newOrder.id);
            if (!exists) {
              return [...prev, newOrder]; // 添加新订单
            }
            return prev; // 如果已存在则不变
          });
        });

        setLoading(false);
      } catch (error) {
        console.error("TCP初始化失败:", error);
        setError("TCP服务器初始化失败");
        setLoading(false);
      }
    };

    // 执行初始化
    initTCPSystem();

    // 清理函数 - 组件卸载时关闭TCP服务器
    return () => {
      console.log("关闭TCP服务器...");
      OrderService.closeTCPServer();
    };
  }, []); // 空依赖数组，只执行一次

  // 删除订单
  const removeOrder = useCallback((orderId: string) => {
    // 从React状态中移除
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.id !== orderId)
    );

    // 同时从服务层和存储中移除
    OrderService.removeTCPOrder(orderId);
  }, []);

  return (
    <OrderContext.Provider
      value={{
        orders,
        loading,
        error,
        removeOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders必须在OrderProvider内部使用");
  }
  return context;
};
