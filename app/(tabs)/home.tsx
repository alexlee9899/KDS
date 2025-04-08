import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { OrderCard } from "../../components/OrderCard";
import { useOrders } from "../../contexts/OrderContext";
import { theme } from "../../styles/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/styles/color";
import { useLanguage } from "@/contexts/LanguageContext";

const { width } = Dimensions.get("window");
const PADDING = 16;
const CARD_MARGIN = 8;
const STANDARD_CARDS_PER_ROW = 3;
const COMPACT_CARDS_PER_ROW = 5;

export default function HomeScreen() {
  const { orders, loading, error, removeOrder } = useOrders();
  const [viewMode, setViewMode] = useState<"standard" | "compact">("standard");
  const { t } = useLanguage();

  // 加载保存的视图模式设置
  useEffect(() => {
    const loadViewMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem("viewMode");
        if (savedMode === "compact" || savedMode === "standard") {
          setViewMode(savedMode);
        }
      } catch (error) {
        console.error("加载视图模式失败:", error);
      }
    };

    loadViewMode();
  }, []);

  // 切换视图模式
  const toggleViewMode = async (mode: "standard" | "compact") => {
    setViewMode(mode);
    try {
      await AsyncStorage.setItem("viewMode", mode);
    } catch (error) {
      console.error("保存视图模式失败:", error);
    }
  };

  // 根据视图模式计算每行卡片数
  const cardsPerRow =
    viewMode === "compact" ? COMPACT_CARDS_PER_ROW : STANDARD_CARDS_PER_ROW;

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
        <Text style={styles.noOrdersText}>{t("noOrders")}</Text>
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
      <View style={styles.headerContainer}>
        <Text style={styles.title}>
          {t("newOrders")} ({orders.length})
        </Text>

        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === "standard" && styles.activeViewModeButton,
            ]}
            onPress={() => toggleViewMode("standard")}
          >
            <Text
              style={[
                styles.viewModeButtonText,
                viewMode === "standard" && styles.activeViewModeButtonText,
              ]}
            >
              Standard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === "compact" && styles.activeViewModeButton,
            ]}
            onPress={() => toggleViewMode("compact")}
          >
            <Text
              style={[
                styles.viewModeButtonText,
                viewMode === "compact" && styles.activeViewModeButtonText,
              ]}
            >
              Compact
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardsContainer}>
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            style={[
              styles.cardStyle,
              {
                width:
                  (width - PADDING * 2 - CARD_MARGIN * (cardsPerRow - 1)) /
                  cardsPerRow,
              },
            ]}
            onOrderComplete={removeOrder}
            onOrderCancel={removeOrder}
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
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  viewModeContainer: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f5f5f5",
  },
  activeViewModeButton: {
    backgroundColor: colors.primary,
  },
  viewModeButtonText: {
    color: "#555",
    fontWeight: "500",
    fontSize: 14,
  },
  activeViewModeButtonText: {
    color: "white",
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: CARD_MARGIN,
  },
  cardStyle: {
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
