import React, { useEffect, useState, useRef, useCallback } from "react";
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
import { FormattedOrder } from "@/services/types";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const PADDING = 16;
const CARD_MARGIN = 8;
const STANDARD_CARDS_PER_ROW = 3;
const DEFAULT_COMPACT_CARDS_PER_ROW = 5;

// 设置相关的常量
const STORAGE_KEY_COMPACT_CARDS_PER_ROW = "compact_cards_per_row";

export default function HomeScreen() {
  const { orders, loading, error, removeOrder } = useOrders();
  const [viewMode, setViewMode] = useState<"standard" | "compact">("standard");
  const { t } = useLanguage();
  const [compactCardsPerRow, setCompactCardsPerRow] = useState<number>(
    DEFAULT_COMPACT_CARDS_PER_ROW
  );
  const [selectedShopName, setSelectedShopName] = useState<string>("");

  // 每次页面获得焦点时加载设置
  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        try {
          // 加载视图模式
          const savedMode = await AsyncStorage.getItem("viewMode");
          if (savedMode === "compact" || savedMode === "standard") {
            setViewMode(savedMode);
          }

          // 加载Compact模式每行卡片数量
          const savedCompactCardsPerRow = await AsyncStorage.getItem(
            STORAGE_KEY_COMPACT_CARDS_PER_ROW
          );
          if (savedCompactCardsPerRow) {
            setCompactCardsPerRow(parseInt(savedCompactCardsPerRow));
          }
        } catch (error) {
          console.error("加载设置失败:", error);
        }
      };

      loadSettings();

      // 设置一个定时器，每秒检查一次设置变化
      const intervalId = setInterval(async () => {
        try {
          const savedCompactCardsPerRow = await AsyncStorage.getItem(
            STORAGE_KEY_COMPACT_CARDS_PER_ROW
          );
          if (
            savedCompactCardsPerRow &&
            parseInt(savedCompactCardsPerRow) !== compactCardsPerRow
          ) {
            setCompactCardsPerRow(parseInt(savedCompactCardsPerRow));
          }
        } catch (error) {
          console.error("检查设置变化失败:", error);
        }
      }, 1000);

      // 清理函数
      return () => clearInterval(intervalId);
    }, [compactCardsPerRow])
  );

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
    viewMode === "compact" ? compactCardsPerRow : STANDARD_CARDS_PER_ROW;

  // 添加这个适配器函数
  const handleOrderRemove = (order: FormattedOrder) => {
    removeOrder(order.id);
  };

  useEffect(() => {
    const loadShopInfo = async () => {
      try {
        const shopName = await AsyncStorage.getItem("selectedShopName");
        if (shopName) {
          setSelectedShopName(shopName);
        }
      } catch (error) {
        console.error("加载店铺信息失败:", error);
      }
    };

    loadShopInfo();
  }, []);

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
    <View style={styles.container}>
      {selectedShopName && (
        <View style={styles.shopInfoContainer}>
          <Text style={styles.shopInfoText}>
            {t("currentShop")}: {selectedShopName}
          </Text>
        </View>
      )}
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
                Compact ({compactCardsPerRow})
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
              onOrderComplete={handleOrderRemove}
              onOrderCancel={handleOrderRemove}
            />
          ))}
        </View>
      </ScrollView>
    </View>
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
  shopInfoContainer: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  shopInfoText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
