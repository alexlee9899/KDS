import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from "react-native";
import { FormattedOrder } from "../services/types";
import { Ionicons } from "@expo/vector-icons";
import { OrderTimer } from "./OrderTimer";
import { OrderActions } from "./OrderActions";
import { ConfirmModal } from "./ReuseComponents/ConfirmModal";
import { colors, sourceColors } from "../styles/color";
import { useLanguage } from "../contexts/LanguageContext";
import { useCategoryColors } from "../contexts/CategoryColorContext";
import { theme } from "../styles/theme";

interface OrderCardProps {
  order: FormattedOrder;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  onOrderComplete?: (order: FormattedOrder) => void;
  onOrderCancel?: (order: FormattedOrder) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  hideTimer?: boolean;
  hideActions?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  style,
  disabled = false,
  onOrderComplete,
  onOrderCancel,
  selectable = false,
  selected = false,
  onSelect,
  hideTimer = false,
  hideActions = false,
}) => {
  const { t } = useLanguage();
  const { getCategoryColor, categoryColorMap } = useCategoryColors();

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

  // 添加一个状态来强制重新渲染
  const [, forceUpdate] = useState({});

  // 监听颜色映射变化
  useEffect(() => {
    // 当颜色映射变化时，强制更新组件
    forceUpdate({});
  }, [categoryColorMap]);

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
      onOrderComplete(order);
    }
  };

  const handleCancelConfirm = () => {
    setShowCancelConfirm(false);
    // 调用取消订单的回调
    if (onOrderCancel) {
      onOrderCancel(order);
    }
  };

  // 安全显示文本，如果为空则显示"null"
  const safeText = (text: string | undefined) => {
    return text || "null";
  };

  // 获取订单来源颜色
  const sourceColor = getSourceColor(order.source);
  const sourceName = getSourceDisplayName(order.source);

  // 渲染产品项时应用分类颜色
  const renderProductItem = (item: any, index: number) => {
    // 获取产品的分类颜色
    const categoryColor = getCategoryColor(item.category);

    return (
      <View key={`${order.id}-item-${index}`} style={styles.itemContainer}>
        <TouchableOpacity
          onPress={() => handleItemClick(`${order.id}-item-${index}`)}
          disabled={disabled}
          activeOpacity={0.7}
          style={[
            styles.itemRow,
            completedItems[`${order.id}-item-${index}`] && styles.completedItem,
            { backgroundColor: categoryColor }, // 应用分类颜色
          ]}
        >
          <View style={styles.itemNameContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.prepare_time > 0 && (
              <Text style={styles.itemPrepareTime}>
                {t("prepTime")}: {item.prepare_time}s
              </Text>
            )}
          </View>
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
            {item.options.map((option: any, optIndex: number) => (
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
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.7}
      onPress={selectable ? onSelect : undefined}
    >
      <View
        style={[
          styles.orderCard,
          style,
          order.source === "recalled" && styles.recalledOrder,
          selected && styles.selectedCard,
        ]}
      >
        {/* 添加订单来源指示器 */}
        <View
          style={[styles.sourceIndicator, { backgroundColor: sourceColor }]}
        >
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
            {!disabled && !hideTimer && <OrderTimer order={order} />}
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

          {/* 显示总准备时间 */}
          {order.total_prepare_time !== undefined &&
            order.total_prepare_time > 0 && (
              <Text style={styles.prepareTime}>
                {t("totalPrepareTime")}:{" "}
                <Text style={styles.prepareTimeValue}>
                  {order.total_prepare_time}
                </Text>{" "}
                {t("seconds")}
              </Text>
            )}

          <View style={styles.itemsContainer}>
            <ScrollView>
              {order.products.map((item, index) =>
                renderProductItem(item, index)
              )}
            </ScrollView>
          </View>
        </View>
        {!disabled && !hideActions && (
          <View>
            <OrderActions
              orderId={order.id}
              onDone={() => setShowDoneConfirm(true)}
              onCancel={() => setShowCancelConfirm(true)}
            />
          </View>
        )}

        {/* 如果是可选择的，显示选择状态指示器 */}
        {selectable && (
          <View style={styles.selectIndicator}>
            <Ionicons
              name={selected ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={selected ? theme.colors.primaryColor : "#999"}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
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
  itemNameContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1,
  },
  itemName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
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
  itemContainer: {
    marginBottom: 8,
  },
  completedItem: {
    opacity: 0.6,
    backgroundColor: "#e0e0e0",
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primaryColor,
  },
  selectIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 2,
  },
  recalledOrder: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warningColor,
  },
  itemPrepareTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  prepareTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  prepareTimeValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
});
