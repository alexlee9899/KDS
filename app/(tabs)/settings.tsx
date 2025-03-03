import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { theme } from "../../styles/theme";
import * as Network from "expo-network";

export default function SettingsScreen() {
  const [ipAddress, setIpAddress] = useState<string>("获取中...");
  const [port, setPort] = useState<string>("4321"); // 默认端口
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchNetworkInfo() {
      try {
        // 使用expo-network获取IP地址
        const ip = await Network.getIpAddressAsync();
        setIpAddress(ip || "unknown IP address");
        setLoading(false);
      } catch (error) {
        console.error("Fail to get IP address:", error);
        setIpAddress("Fail to get IP address");
        setLoading(false);
      }
    }

    fetchNetworkInfo();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>System Settings</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Internet Settings</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Device IP Address:</Text>
          <Text style={styles.infoValue}>{ipAddress}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>TCP Server Port:</Text>
          <Text style={styles.infoValue}>{port}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.infoText}>KDS System v1.0.0</Text>
        <Text style={styles.infoText}>© 2023 Pospal Australia Pty Ltd</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundColor,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1a1a1a",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
});
