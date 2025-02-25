import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface OrderTimerProps {
  orderId: string;
}

export const OrderTimer: React.FC<OrderTimerProps> = ({ orderId }) => {
  const [timer, setTimer] = useState(0);

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
    console.log("Calling order:", orderId);
  };

  return (
    <View style={styles.headerRight}>
      <Text style={styles.timer}>{formatTime(timer)}</Text>
      <TouchableOpacity style={styles.callButton} onPress={handleCall}>
        <Ionicons name="call-outline" size={20} color="white" />
        <Text style={styles.callButtonText}>Call</Text>
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
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  callButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
