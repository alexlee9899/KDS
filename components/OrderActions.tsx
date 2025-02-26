import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

interface OrderActionsProps {
  orderId: string;
  onDone: () => void;
  onCancel: () => void;
}

export const OrderActions: React.FC<OrderActionsProps> = ({
  orderId,
  onDone,
  onCancel,
}) => {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={[styles.button, styles.doneButton]}
        onPress={onDone}
      >
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
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
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  doneButton: {
    backgroundColor: "#69ab6b",
  },
  cancelButton: {
    backgroundColor: "#272020",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
