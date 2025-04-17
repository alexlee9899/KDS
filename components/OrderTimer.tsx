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
import { useLanguage } from "../contexts/LanguageContext";
const { Printer_K1215: NativePrinter_K1215 } = NativeModules;

interface OrderTimerProps {
  order: FormattedOrder;
}

export const OrderTimer: React.FC<OrderTimerProps> = ({ order }) => {
  const { t } = useLanguage();
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
    // 获取订单的总准备时间（min）
    const totalPrepareTimeMinutes = order.total_prepare_time || 0;

    // 获取已经过去的时间（分钟）
    const elapsedMinutes = Math.floor(elapsedTime / 60);

    // 如果订单没有准备时间数据，则使用默认逻辑
    if (totalPrepareTimeMinutes === 0) {
      if (elapsedMinutes < 1) {
        return { text: t("active"), color: colors.activeColor };
      } else if (elapsedMinutes < 8) {
        return { text: t("urgent"), color: colors.urgentColor };
      } else {
        return { text: t("delayed"), color: colors.delayedColor };
      }
    }

    // 基于总准备时间的状态判断
    // 如果已过时间小于总准备时间，表示正常
    if (elapsedMinutes < totalPrepareTimeMinutes) {
      return { text: t("active"), color: colors.activeColor };
    }
    // 如果已过时间超过总准备时间但在120%范围内，表示紧急
    else if (elapsedMinutes < totalPrepareTimeMinutes * 1.2) {
      return { text: t("urgent"), color: colors.urgentColor };
    }
    // 如果已过时间超过总准备时间的120%，表示延迟
    else {
      return { text: t("delayed"), color: colors.delayedColor };
    }
  };

  const statusInfo = getStatusInfo();

  // 计算并格式化剩余准备时间
  const getRemainingPrepTime = () => {
    const totalPrepTimeSeconds = order.total_prepare_time || 0;
    if (totalPrepTimeSeconds <= 0) return null;

    // 剩余准备时间（秒）
    const remainingSeconds = Math.max(0, totalPrepTimeSeconds - elapsedTime);
    return formatTime(remainingSeconds);
  };

  const remainingPrepTime = getRemainingPrepTime();

  const handlePrint = async () => {
    if (isPrinting) return;

    setIsPrinting(true);
    try {
      // 检查打印机连接状态
      const isReady = await checkPrinter();

      if (!isReady) {
        Alert.alert(t("notConnected"), t("printerNotConnected"));
        return;
      }

      // 直接打印当前订单
      const result = await Printer_K1215.printOrder(order);

      if (result) {
        Alert.alert(
          t("success"),
          `${t("orderPrinted")} #${order.orderId || order.id}`
        );
      } else {
        Alert.alert(t("failed"), t("printOrderFailed"));
      }
    } catch (error) {
      console.error("打印订单失败:", error);
      Alert.alert(t("error"), `${t("printingError")}: ${error}`);
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
            <Text style={styles.printButtonText}>{t("print")}</Text>
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
