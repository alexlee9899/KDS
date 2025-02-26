import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
  Dimensions,
} from "react-native";
import { OrderCard } from "../../components/OrderCard";
import { useOrders } from "../../contexts/OrderContext";
import { theme } from "../../styles/theme";
import { OrderService } from "../../services/orderService";
const { width } = Dimensions.get("window");
const PADDING = 16;
const CARD_MARGIN = 8;
const CARDS_PER_ROW = 3;

export default function HomeScreen() {
  const { orders, loading, error, removeOrder } = useOrders();
  const pollingRef = useRef<NodeJS.Timeout>();

  // useEffect(() => {
  //   fetchOrders();

  //   // 只在非TCP模式下进行轮询
  //   if (!OrderService.IsTCPMode) {
  //     pollingRef.current = setInterval(fetchOrders, 5000);
  //   }

  //   return () => {
  //     if (pollingRef.current) {
  //       clearInterval(pollingRef.current);
  //     }
  //   };
  // }, [fetchOrders]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.noOrdersText}>No Orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>New Orders ({orders.length})</Text>
      <View style={styles.cardsContainer}>
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} style={styles.cardStyle} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundColor,
    padding: PADDING,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1a1a1a",
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start", // 从左开始排列
    gap: CARD_MARGIN, // 使用gap替代margin
  },
  cardStyle: {
    // 计算卡片宽度：(总宽度 - 两边padding - 卡片间距) / 3
    width:
      (width - PADDING * 2 - CARD_MARGIN * (CARDS_PER_ROW - 1)) / CARDS_PER_ROW,
    marginBottom: CARD_MARGIN,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
  noOrdersText: {
    fontSize: 38,
    color: "#151010",
    textAlign: "center",
  },
});
