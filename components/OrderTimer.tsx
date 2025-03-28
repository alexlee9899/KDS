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
const { Printer_K1215 } = NativeModules;

interface OrderTimerProps {
  order: FormattedOrder;
}

export const OrderTimer: React.FC<OrderTimerProps> = ({ order }) => {
  const [timer, setTimer] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleCall = () => {
    console.log("Calling order:", order.id);
  };

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
      <Text style={styles.timer}>{formatTime(timer)}</Text>
      <TouchableOpacity style={styles.callButton} onPress={handleCall}>
        <Ionicons name="call-outline" size={20} color="white" />
        <Text style={styles.callButtonText}>Call</Text>
      </TouchableOpacity>
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
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.buttonCallColor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
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
  callButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  printButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
