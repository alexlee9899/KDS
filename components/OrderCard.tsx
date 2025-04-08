import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { FormattedOrder } from "../services/types";
import { Ionicons } from "@expo/vector-icons";
import { OrderTimer } from "./OrderTimer";
import { OrderActions } from "./OrderActions";
import { ConfirmModal } from "./ReuseComponents/ConfirmModal";
import { colors, sourceColors } from "../styles/color";
import { useLanguage } from "../contexts/LanguageContext";

interface OrderCardProps {
  order: FormattedOrder;
  style?: object;
  disabled?: boolean;
  onOrderComplete?: (orderId: string) => void;
  onOrderCancel?: (orderId: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  style,
  disabled = false,
  onOrderComplete,
  onOrderCancel,
}) => {
  const { t } = useLanguage();

  // 跟踪商品的完成状态
  const [completedItems, setCompletedItems] = useState<{
    [key: string]: boolean;
  }>({});

  // 跟踪选项的完成状态
  const [completedOptions, setCompletedOptions] = useState<{
    [key: string]: boolean;
  }>({});

  const [showDoneConfirm, setShowDoneConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // 获取订单来源的颜色
  const getSourceColor = (source: string | undefined) => {
    if (!source) return sourceColors.DEFAULT;

    // 将source转为大写以便匹配
    const upperSource = source.toUpperCase();
    return (
      sourceColors[upperSource as keyof typeof sourceColors] ||
      sourceColors.DEFAULT
    );
  };

  // 获取订单来源的显示名称
  const getSourceDisplayName = (source: string | undefined) => {
    if (!source) return t("unknown");

    // 尝试使用小写的source作为翻译键
    return t(source.toLowerCase());
  };

  // 处理商品点击
  const handleItemClick = (itemId: string) => {
    if (disabled) return;
    setCompletedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // 处理选项点击
  const handleOptionClick = (optionId: string, event: any) => {
    if (disabled) return;
    // 阻止事件冒泡，防止触发父元素的点击事件
    event.stopPropagation();

    setCompletedOptions((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  const handleDoneConfirm = () => {
    setShowDoneConfirm(false);
    // 调用完成订单的回调
    if (onOrderComplete) {
      onOrderComplete(order.id);
    }
  };

  const handleCancelConfirm = () => {
    setShowCancelConfirm(false);
    // 调用取消订单的回调
    if (onOrderCancel) {
      onOrderCancel(order.id);
    }
  };

  // 安全显示文本，如果为空则显示"null"
  const safeText = (text: string | undefined) => {
    return text || "null";
  };

  // 获取订单来源颜色
  const sourceColor = getSourceColor(order.source);
  const sourceName = getSourceDisplayName(order.source);

  return (
    <View style={[styles.orderCard, style]}>
      {/* 添加订单来源指示器 */}
      <View style={[styles.sourceIndicator, { backgroundColor: sourceColor }]}>
        <Text style={styles.sourceText}>{sourceName}</Text>
      </View>

      <View style={styles.textContainer}>
        <ConfirmModal
          visible={showDoneConfirm}
          title={t("complete")}
          message={`${t("confirmComplete")} #${order.order_num}?`}
          confirmText={t("complete")}
          cancelText={t("cancel")}
          onConfirm={handleDoneConfirm}
          onCancel={() => setShowDoneConfirm(false)}
        />

        <ConfirmModal
          visible={showCancelConfirm}
          title={t("cancel")}
          message={`${t("confirmCancel")} #${order.order_num}?`}
          confirmText={t("cancel")}
          cancelText={t("cancel")}
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelConfirm(false)}
          isDanger
        />

        <View style={styles.header}>
          <Text style={styles.orderId} numberOfLines={0} ellipsizeMode="tail">
            {t("order")} #{order.order_num || order.orderId}
          </Text>
          {!disabled && <OrderTimer order={order} />}
        </View>

        {order.orderId && (
          <Text style={styles.orderDetail}>
            {t("orderId")}: {order.orderId}
          </Text>
        )}
        <Text style={styles.orderDetail}>
          {t("pickupMethod")}: {order.pickupMethod}
        </Text>
        <Text style={styles.orderDetail}>
          {t("pickupTime")}: {order.pickupTime}
        </Text>
        {order.tableNumber && (
          <Text style={styles.orderDetail}>
            {t("tableNumber")}: {safeText(order.tableNumber)}
          </Text>
        )}

        <View style={styles.itemsContainer}>
          <ScrollView style={styles.itemsScrollView} nestedScrollEnabled={true}>
            {order.products.map((item, index) => (
              <View key={`${order.id}-item-${index}`}>
                <TouchableOpacity
                  onPress={() => handleItemClick(`${order.id}-item-${index}`)}
                  disabled={disabled}
                  activeOpacity={0.7}
                  style={styles.itemRow}
                >
                  <Text style={styles.itemName}>{item.name}</Text>
                  {completedItems[`${order.id}-item-${index}`] ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.checkColor}
                    />
                  ) : (
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  )}
                </TouchableOpacity>

                {/* 选项列表 */}
                {item.options && item.options.length > 0 && (
                  <View style={styles.optionsContainer}>
                    {item.options.map((option, optIndex) => (
                      <TouchableOpacity
                        key={`${order.id}-item-${index}-option-${optIndex}`}
                        onPress={(e) =>
                          handleOptionClick(
                            `${order.id}-item-${index}-option-${optIndex}`,
                            e
                          )
                        }
                        disabled={disabled}
                        activeOpacity={0.7}
                        style={styles.optionRow}
                      >
                        <View style={styles.optionContent}>
                          <Text style={styles.optionName}>{option.name}:</Text>
                          <Text style={styles.optionValue}>
                            {" "}
                            {safeText(option.value)}
                          </Text>
                          {option.price > 0 && (
                            <Text style={styles.optionPrice}>
                              {" "}
                              (${option.price.toFixed(2)})
                            </Text>
                          )}
                        </View>

                        {completedOptions[
                          `${order.id}-item-${index}-option-${optIndex}`
                        ] && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={colors.checkColor}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={styles.itemDivider} />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
      {!disabled && (
        <View>
          <OrderActions
            orderId={order.id}
            onDone={() => setShowDoneConfirm(true)}
            onCancel={() => setShowCancelConfirm(true)}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    height: 600,
    display: "flex",
    flexDirection: "column",
    position: "relative", // 添加相对定位
  },
  sourceIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    zIndex: 1,
  },
  sourceText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  textContainer: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 12,
    marginBottom: 12,
    flexShrink: 1,
    minWidth: 0,
  },
  orderId: {
    minWidth: "50%",
    flexShrink: 1,
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    flexWrap: "wrap",
    flex: 1,
  },
  orderDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  itemsContainer: {
    flex: 1,
    minHeight: 0,
    marginTop: 8,
  },
  itemsTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 5,
  },
  itemsScrollView: {
    flex: 1,
    minHeight: 0,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    opacity: 1,
  },
  itemName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  itemQuantity: {
    fontSize: 22,
    fontWeight: "700",
    color: "#007AFF",
    marginLeft: 12,
  },
  optionsContainer: {
    marginLeft: 15,
    marginTop: -5,
    marginBottom: 5,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    marginBottom: 4,
  },
  optionContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
  },
  optionName: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  optionValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  optionPrice: {
    fontSize: 14,
    color: "#0066cc",
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 4,
  },
});
