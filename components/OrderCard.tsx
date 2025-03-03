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
import { ConfirmModal } from "./ConfirmModal";

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
  const [completedItems, setCompletedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [showDoneConfirm, setShowDoneConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleItemClick = (itemId: string) => {
    if (disabled) return;
    setCompletedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
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

  return (
    <View style={[styles.orderCard, style]}>
      <ConfirmModal
        visible={showDoneConfirm}
        title="complete order"
        message={`confirm complete order #${order.id}?`}
        confirmText="complete"
        cancelText="cancel"
        onConfirm={handleDoneConfirm}
        onCancel={() => setShowDoneConfirm(false)}
      />

      <ConfirmModal
        visible={showCancelConfirm}
        title="cancel order"
        message={`confirm cancel order #${order.id}?`}
        confirmText="cancel"
        cancelText="cancel"
        onConfirm={handleCancelConfirm}
        onCancel={() => setShowCancelConfirm(false)}
        isDanger
      />

      <View style={styles.header}>
        <Text style={styles.orderId} numberOfLines={0} ellipsizeMode="tail">
          Order #{order.id}
        </Text>
        {!disabled && <OrderTimer orderId={order.id} />}
      </View>

      <Text style={styles.pickupMethod}>
        Pickup Method: {order.pickupMethod}
      </Text>
      <Text style={styles.pickupTime}>Pickup Time: {order.pickupTime}</Text>
      <View style={styles.itemsContainer}>
        <Text style={styles.itemsTitle}>Items:</Text>
        <ScrollView style={styles.itemsScrollView} nestedScrollEnabled={true}>
          {order.items.map((item, index) => (
            <TouchableOpacity
              key={`${order.id}-item-${index}`}
              onPress={() => handleItemClick(`${order.id}-item-${index}`)}
              disabled={disabled}
              activeOpacity={0.7}
              style={styles.itemRow}
            >
              <Text style={styles.itemName}>{item.name}</Text>
              {completedItems[`${order.id}-item-${index}`] ? (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              ) : (
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {!disabled && (
        <OrderActions
          orderId={order.id}
          onDone={() => setShowDoneConfirm(true)}
          onCancel={() => setShowCancelConfirm(true)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    height: 500,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    flexShrink: 1, // 允许整个header缩放
    minWidth: 0, // 允许内容缩小
  },
  orderId: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    flexShrink: 1, // 允许文本缩小
    flexWrap: "wrap", // 允许文本换行
    flex: 1, // 占据可用空间
  },
  pickupMethod: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  pickupTime: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  itemsContainer: {
    flex: 1,
    minHeight: 0,
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
});
