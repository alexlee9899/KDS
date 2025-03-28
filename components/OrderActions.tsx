import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { colors } from "../styles/color";

interface OrderActionsProps {
  orderId: string;
  onDone: () => void;
  onCancel: () => void;
  style?: ViewStyle;
}

export const OrderActions: React.FC<OrderActionsProps> = ({
  orderId,
  onDone,
  onCancel,
  style,
}) => {
  return (
    <View style={[styles.buttonContainer, style]}>
      <TouchableOpacity
        style={[styles.button, styles.leftButton]}
        onPress={onDone}
      >
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.button, styles.rightButton]}
        onPress={onCancel}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: "hidden",
    backgroundColor: "#3498db", // 匹配截图中的蓝色
    width: "100%",
    height: 50, // 设置一个固定高度// 使用绝对定位
    bottom: 0, // 放置在底部
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  leftButton: {
    // 左按钮样式
  },
  rightButton: {
    // 右按钮样式
  },
  divider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)", // 半透明白色分隔线
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
