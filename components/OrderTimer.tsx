import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FormattedOrder } from "@/services/types";
import { NativeModules } from "react-native";
import { checkPrinter } from "../services/orderPrinter";
import { colors } from "../styles/color";
import { useOrders } from "@/contexts/OrderContext";
const { Printer_K1215 } = NativeModules;

interface OrderTimerProps {
  order: FormattedOrder;
}

export const OrderTimer: React.FC<OrderTimerProps> = ({ order }) => {
  const [elapsedTime, setElapsedTime] = useState(0); // 存储已经过去的时间（秒）
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    // 计算初始时间差
    calculateTimeDifference();

    // 每秒更新一次时间差
    const interval = setInterval(() => {
      calculateTimeDifference();
    }, 1000);

    return () => clearInterval(interval);
  }, [order.pickupTime]);

  // 计算订单生成时间与当前时间的差值（秒）
  const calculateTimeDifference = () => {
    try {
      // 解析订单的pickupTime（已转换为悉尼时区的字符串）
      const pickupDate = new Date(order.pickupTime);

      // 获取当前时间
      const now = new Date();

      // 计算时间差（毫秒）
      const diffMs = now.getTime() - pickupDate.getTime();

      // 转换为秒并确保不为负数
      const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

      // 更新状态
      setElapsedTime(diffSeconds);
    } catch (error) {
      console.error("计算时间差异失败:", error);
      setElapsedTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 根据时间获取状态文本和颜色
  const getStatusInfo = () => {
    const minutes = Math.floor(elapsedTime / 60);

    if (minutes < 5) {
      return { text: "Action", color: colors.activeColor }; // 红色
    } else if (minutes < 8) {
      return { text: "Urgent", color: colors.urgentColor }; // 黄色
    } else {
      return { text: "Delayed", color: colors.delayedColor }; // 红色
    }
  };

  const statusInfo = getStatusInfo();

  const handlePrint = async () => {
    if (isPrinting) return;

    setIsPrinting(true);
    try {
      // 检查打印机连接状态
      const isReady = await checkPrinter();

      if (!isReady) {
        Alert.alert("未连接", "打印机未连接，请先连接打印机");
        return;
      }

      // 直接打印当前订单
      const result = await Printer_K1215.printOrder(order);

      if (result) {
        Alert.alert("成功", `订单 #${order.orderId || order.id} 已成功打印`);
      } else {
        Alert.alert("失败", "打印订单失败，请检查打印机连接");
      }
    } catch (error) {
      console.error("打印订单失败:", error);
      Alert.alert("错误", `打印过程出错: ${error}`);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <View style={styles.headerRight}>
      <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
      <View
        style={[styles.statusButton, { backgroundColor: statusInfo.color }]}
      >
        <Text style={styles.statusButtonText}>{statusInfo.text}</Text>
      </View>
      <TouchableOpacity
        style={[styles.printButton, isPrinting && styles.disabledButton]}
        onPress={handlePrint}
        disabled={isPrinting}
      >
        {isPrinting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Ionicons name="print-outline" size={20} color="white" />
            <Text style={styles.printButtonText}>Print</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timer: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  printButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.buttonColor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  printButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
