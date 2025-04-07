import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { FormattedOrder } from "../services/types";
import { OrderService } from "../services/orderService";
import { DistributionService, KDSRole } from "../services/distributionService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
interface OrderContextType {
  orders: FormattedOrder[];
  networkOrders: FormattedOrder[]; // 网络订单
  tcpOrders: FormattedOrder[]; // TCP订单
  loading: boolean;
  error: string | null;
  removeOrder: (orderId: string, source?: "network" | "tcp" | "all") => void;
  refreshOrders: () => Promise<void>;
  isKDSMaster: boolean;
  networkStatus: "connected" | "disconnected" | "unknown";
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<FormattedOrder[]>([]);
  const [networkOrders, setNetworkOrders] = useState<FormattedOrder[]>([]);
  const [tcpOrders, setTcpOrders] = useState<FormattedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isKDSMaster, setIsKDSMaster] = useState(true); // 默认为主KDS
  const [networkStatus, setNetworkStatus] = useState<
    "connected" | "disconnected" | "unknown"
  >("unknown");

  // 获取KDS角色
  useEffect(() => {
    async function getKDSRole() {
      try {
        const role = await AsyncStorage.getItem("kds_role");
        setIsKDSMaster(role !== "slave");
      } catch (error) {
        console.error("获取KDS角色失败:", error);
      }
    }

    getKDSRole();
  }, []);

  // 初始化订单系统
  useEffect(() => {
    const initSystem = async () => {
      try {
        console.log("初始化订单系统...");
        setLoading(true);

        // 使用新的初始化方法，同时启动网络轮询和TCP服务器
        await OrderService.initialize();

        // 初始化分发服务
        await DistributionService.initialize();

        // 加载已保存的订单
        const savedNetworkOrders = await OrderService.loadNetworkOrders();
        const savedTcpOrders = await OrderService.loadTCPOrders();

        setNetworkOrders(savedNetworkOrders);
        setTcpOrders(savedTcpOrders);
        setOrders([...savedNetworkOrders, ...savedTcpOrders]);

        setLoading(false);
      } catch (error) {
        console.error("初始化失败:", error);
        setError("系统初始化失败");
        setLoading(false);
      }
    };

    initSystem();

    return () => {
      // 清理函数
      OrderService.stopNetworkPolling(); // 停止网络轮询
      DistributionService.shutdown();
    };
  }, []);

  // 设置订单更新回调
  useEffect(() => {
    console.log("设置订单更新回调");

    // 注册回调接收实时订单更新
    OrderService.setOrderUpdateCallback((updatedOrders) => {
      console.log("收到订单更新，订单数量:", updatedOrders.length);

      // 区分网络订单和TCP订单
      const networkOrdersList = updatedOrders.filter(
        (order) => order.source === "network"
      );
      const tcpOrdersList = updatedOrders.filter(
        (order) => order.source === "tcp"
      );

      setNetworkOrders(networkOrdersList);
      setTcpOrders(tcpOrdersList);
      setOrders(updatedOrders); // 所有订单合并显示
    });
  }, []);

  // 移除订单
  const removeOrder = useCallback(
    (orderId: string, source: "network" | "tcp" | "all" = "all") => {
      if (source === "network" || source === "all") {
        setNetworkOrders((prev) => {
          const newOrders = prev.filter((order) => order.id !== orderId);
          // 保存更新后的网络订单列表
          OrderService.saveNetworkOrders(newOrders);
          return newOrders;
        });
      }

      if (source === "tcp" || source === "all") {
        setTcpOrders((prev) => {
          const newOrders = prev.filter((order) => order.id !== orderId);
          // 保存更新后的TCP订单列表
          OrderService.saveTCPOrders(newOrders);
          return newOrders;
        });
      }

      // 更新合并的订单列表
      setOrders((prev) => prev.filter((order) => order.id !== orderId));

      // 调用OrderService的移除方法
      OrderService.removeOrder(orderId);
    },
    []
  );

  // 刷新订单列表
  const refreshOrders = useCallback(async () => {
    try {
      setLoading(true);

      // 强制进行一次网络刷新
      if (networkStatus === "connected") {
        await OrderService.fetchOrdersFromNetwork(
          OrderService.getTimeRangeAroundNow()
        );
      }

      // 获取最新订单
      const savedNetworkOrders = await OrderService.loadNetworkOrders();
      const savedTcpOrders = await OrderService.loadTCPOrders();

      setNetworkOrders(savedNetworkOrders);
      setTcpOrders(savedTcpOrders);
      setOrders([...savedNetworkOrders, ...savedTcpOrders]);

      setLoading(false);
    } catch (error) {
      console.error("刷新订单失败:", error);
      setError("刷新订单失败");
      setLoading(false);
    }
  }, [networkStatus]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        networkOrders,
        tcpOrders,
        loading,
        error,
        removeOrder,
        refreshOrders,
        isKDSMaster,
        networkStatus,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
}
