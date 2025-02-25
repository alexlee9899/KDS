import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { OrderCard } from "../../components/OrderCard";
import { OrderService } from "../../services/orderService";
import { FormattedOrder } from "../../services/types";
import { useFocusEffect } from "@react-navigation/native";
import { theme } from "../../styles/theme";

const { width } = Dimensions.get("window");
const PADDING = 16;
const CARD_MARGIN = 8;
const CARDS_PER_ROW = 3;

export default function HistoryScreen() {
  const [historyOrders, setHistoryOrders] = useState<FormattedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      console.log("History页面获得焦点，刷新数据");
      loadHistoryOrders();
    }, [])
  );

  const loadHistoryOrders = async () => {
    try {
      setLoading(true);
      const orders = await OrderService.getHistoryOrderDetails();
      setHistoryOrders(orders);
    } catch (error) {
      setError("Failed to load history orders");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerText}>
        Today's Order History ({historyOrders.length})
      </Text>
      <View style={styles.cardsContainer}>
        {historyOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            style={styles.cardStyle}
            disabled={true}
          />
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
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: CARD_MARGIN,
  },
  cardStyle: {
    width:
      (width - PADDING * 2 - CARD_MARGIN * (CARDS_PER_ROW - 1)) / CARDS_PER_ROW,
    marginBottom: CARD_MARGIN,
  },
});
