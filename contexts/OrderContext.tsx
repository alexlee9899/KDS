import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { FormattedOrder } from "../services/types";
import { OrderService } from "../services/orderService";
import { EventEmitter } from "../utils/eventEmitter";

interface OrderContextType {
  orders: FormattedOrder[];
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  setOrders: (orders: FormattedOrder[]) => void;
  removeOrder: (orderId: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<FormattedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 添加 TCP 订单监听
  useEffect(() => {
    // 初始化 TCP 服务器
    OrderService.initTCPServer();

    // 监听新订单事件
    const subscription = EventEmitter.addListener("newOrder", (newOrder) => {
      setOrders((prev) => [...prev, newOrder]);
    });

    return () => subscription.remove();
  }, []);

  const removeOrder = useCallback((orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.id !== orderId)
    );
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      // 只在首次加载时显示loading状态
      if (orders.length === 0) {
        setLoading(true);
      }

      const formattedOrders = await OrderService.getFormattedOrderDetails();

      // 检查是否有新订单
      const existingOrderIds = new Set(orders.map((order) => order.id));
      const newOrders = formattedOrders.filter(
        (order) =>
          !existingOrderIds.has(order.id) && // 筛选新订单
          order.pickupMethod !== "TEMP" // 排除 TEMP 订单
      );

      // 只在有新订单时更新状态
      if (newOrders.length > 0) {
        setOrders((prevOrders) => [...prevOrders, ...newOrders]);
        console.log("发现新订单:", newOrders.length, "个");
      }
    } catch (error) {
      setError("获取订单失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [orders]); // 添加 orders 作为依赖

  return (
    <OrderContext.Provider
      value={{ orders, loading, error, fetchOrders, setOrders, removeOrder }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
};
