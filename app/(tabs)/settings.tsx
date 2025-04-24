import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { theme } from "../../styles/theme";
import * as Network from "expo-network";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CategoryType } from "@/services/distributionService";
import { useLanguage } from "../../contexts/LanguageContext";
import { SupportedLanguage } from "../../constants/translations";

// KDS角色类型
enum KDSRole {
  MASTER = "master",
  SLAVE = "slave",
}

// 设置相关的常量
const STORAGE_KEY_COMPACT_CARDS_PER_ROW = "compact_cards_per_row";
const DEFAULT_COMPACT_CARDS_PER_ROW = "5";

export default function SettingsScreen() {
  const { language, t, changeLanguage } = useLanguage();
  const [ipAddress, setIpAddress] = useState<string>("获取中...");
  const [port, setPort] = useState<string>("4321"); // 默认端口
  const [loading, setLoading] = useState<boolean>(true);
  const [kdsRole, setKdsRole] = useState<KDSRole>(KDSRole.MASTER);
  const [masterIP, setMasterIP] = useState<string>("");
  const [newSubKdsIP, setNewSubKdsIP] = useState<string>("");
  const [subKdsList, setSubKdsList] = useState<
    { ip: string; category: CategoryType }[]
  >([]);

  // 添加Compact模式下每行卡片数量状态
  const [compactCardsPerRow, setCompactCardsPerRow] = useState<string>(
    DEFAULT_COMPACT_CARDS_PER_ROW
  );

  // 加载保存的设置
  useEffect(() => {
    async function loadSettings() {
      try {
        // 获取设备IP地址
        const ip = await Network.getIpAddressAsync();
        setIpAddress(ip || "未知IP地址");

        // 加载保存的设置
        const savedRole = await AsyncStorage.getItem("kds_role");
        if (savedRole) setKdsRole(savedRole as KDSRole);

        const savedPort = await AsyncStorage.getItem("kds_port");
        if (savedPort) setPort(savedPort);

        const savedMasterIP = await AsyncStorage.getItem("master_ip");
        if (savedMasterIP) setMasterIP(savedMasterIP);

        const savedSubKds = await AsyncStorage.getItem("sub_kds_list");
        if (savedSubKds) setSubKdsList(JSON.parse(savedSubKds));

        // 加载Compact模式每行卡片数量
        const savedCompactCardsPerRow = await AsyncStorage.getItem(
          STORAGE_KEY_COMPACT_CARDS_PER_ROW
        );
        if (savedCompactCardsPerRow) {
          setCompactCardsPerRow(savedCompactCardsPerRow);
        }

        setLoading(false);
      } catch (error) {
        console.error("加载设置失败:", error);
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  // 保存设置
  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem("kds_role", kdsRole);
      await AsyncStorage.setItem("kds_port", port);
      await AsyncStorage.setItem("master_ip", masterIP);
      await AsyncStorage.setItem("sub_kds_list", JSON.stringify(subKdsList));

      // 保存Compact模式每行卡片数量
      await AsyncStorage.setItem(
        STORAGE_KEY_COMPACT_CARDS_PER_ROW,
        compactCardsPerRow
      );

      Alert.alert("成功", "设置已保存");
    } catch (error) {
      Alert.alert("错误", "保存设置失败");
    }
  };

  // 添加子KDS - 自动分配品类
  const addSubKds = () => {
    if (!newSubKdsIP.trim()) {
      Alert.alert("错误", "请输入IP地址");
      return;
    }

    // 检查IP是否已存在
    if (subKdsList.some((kds) => kds.ip === newSubKdsIP)) {
      Alert.alert("错误", "此IP已添加");
      return;
    }

    // 自动分配品类 (轮流分配不同品类)
    const categories = [
      CategoryType.DRINKS,
      CategoryType.HOT_FOOD,
      CategoryType.COLD_FOOD,
      CategoryType.DESSERT,
    ];

    // 根据现有子KDS数量决定分配哪个品类
    const categoryIndex = subKdsList.length % categories.length;
    const assignedCategory = categories[categoryIndex];

    setSubKdsList([
      ...subKdsList,
      { ip: newSubKdsIP, category: assignedCategory },
    ]);
    setNewSubKdsIP(""); // 清空输入框
  };

  // 删除子KDS
  const removeSubKds = (ip: string) => {
    setSubKdsList(subKdsList.filter((kds) => kds.ip !== ip));
  };

  // 获取品类显示名称
  const getCategoryDisplayName = (category: CategoryType) => {
    switch (category) {
      case CategoryType.DRINKS:
        return "饮料";
      case CategoryType.HOT_FOOD:
        return "热食";
      case CategoryType.COLD_FOOD:
        return "冷食";
      case CategoryType.DESSERT:
        return "甜点";
      case CategoryType.ALL:
        return "全部";
      default:
        return "未知";
    }
  };

  // 处理语言切换
  const handleLanguageChange = async (newLanguage: SupportedLanguage) => {
    await changeLanguage(newLanguage);
  };

  // 处理Compact模式每行卡片数量变更
  const handleCompactCardsPerRowChange = (value: string) => {
    setCompactCardsPerRow(value);
  };

  // 重置设置
  const resetSettings = () => {
    Alert.alert(t("resetSettings"), t("confirmReset"), [
      {
        text: t("cancel"),
        style: "cancel",
      },
      {
        text: t("confirm"),
        onPress: async () => {
          // 重置为英文
          await changeLanguage("en");
          // 重置其他设置
          await AsyncStorage.removeItem("viewMode");
          // 重置Compact模式每行卡片数量
          await AsyncStorage.setItem(
            STORAGE_KEY_COMPACT_CARDS_PER_ROW,
            DEFAULT_COMPACT_CARDS_PER_ROW
          );
          setCompactCardsPerRow(DEFAULT_COMPACT_CARDS_PER_ROW);
          // 可以添加其他需要重置的设置
        },
      },
    ]);
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
      <Text style={styles.title}>{t("settings")}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("kdsRole")}</Text>

        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              kdsRole === KDSRole.MASTER && styles.roleButtonActive,
            ]}
            onPress={() => setKdsRole(KDSRole.MASTER)}
          >
            <Text
              style={
                kdsRole === KDSRole.MASTER
                  ? styles.roleTextActive
                  : styles.roleText
              }
            >
              {t("masterKDS")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleButton,
              kdsRole === KDSRole.SLAVE && styles.roleButtonActive,
            ]}
            onPress={() => setKdsRole(KDSRole.SLAVE)}
          >
            <Text
              style={
                kdsRole === KDSRole.SLAVE
                  ? styles.roleTextActive
                  : styles.roleText
              }
            >
              {t("subKDS")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t("localIPAddress")}</Text>
          <Text style={styles.infoValue}>{ipAddress}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t("tcpPort")}</Text>
          <TextInput
            style={styles.textInput}
            value={port}
            onChangeText={setPort}
            keyboardType="number-pad"
          />
        </View>

        {kdsRole === KDSRole.SLAVE && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("masterKDSIPAddress")}</Text>
            <TextInput
              style={styles.textInput}
              value={masterIP}
              onChangeText={setMasterIP}
              placeholder="例如: 192.168.1.100"
            />
          </View>
        )}

        {kdsRole === KDSRole.MASTER && (
          <>
            <Text style={styles.subsectionTitle}>{t("subKDSManagement")}</Text>
            <Text style={styles.infoText}>{t("addSubKDS")}</Text>

            <View style={styles.addKdsContainer}>
              <TextInput
                style={[styles.textInput, { flex: 1, marginRight: 10 }]}
                value={newSubKdsIP}
                onChangeText={setNewSubKdsIP}
                placeholder={t("enterSubKDSIPAddress")}
              />
              <TouchableOpacity style={styles.addButton} onPress={addSubKds}>
                <Text style={styles.addButtonText}>{t("add")}</Text>
              </TouchableOpacity>
            </View>

            {subKdsList.length > 0 ? (
              subKdsList.map((kds, index) => (
                <View key={index} style={styles.subKdsItem}>
                  <Text>
                    {kds.ip} ({getCategoryDisplayName(kds.category)})
                  </Text>
                  <TouchableOpacity onPress={() => removeSubKds(kds.ip)}>
                    <Text style={styles.removeButton}>{t("delete")}</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noItemsText}>{t("noSubKDS")}</Text>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.saveButton, { maxWidth: 200, alignSelf: "center" }]}
          onPress={saveSettings}
        >
          <Text style={styles.saveButtonText}>{t("saveSettings")}</Text>
        </TouchableOpacity>
      </View>

      {/* 显示设置卡片 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("displaySettings")}</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>{t("cardsPerRow")}:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={compactCardsPerRow}
              style={styles.languagePicker}
              onValueChange={handleCompactCardsPerRowChange}
              dropdownIconColor="#666"
            >
              <Picker.Item label="3" value="3" />
              <Picker.Item label="4" value="4" />
              <Picker.Item label="5" value="5" />
              <Picker.Item label="6" value="6" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            { marginTop: 10, maxWidth: 200, alignSelf: "center" },
          ]}
          onPress={saveSettings}
        >
          <Text style={styles.saveButtonText}>{t("applyChanges")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("language")}</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>{t("selectLanguage")}:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={language}
              style={styles.languagePicker}
              onValueChange={(itemValue: SupportedLanguage) =>
                handleLanguageChange(itemValue)
              }
              dropdownIconColor="#666"
            >
              <Picker.Item label={t("english")} value="en" />
              <Picker.Item label={t("chinese")} value="zh" />
            </Picker>
          </View>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("systemInfo")}</Text>
        <Text style={styles.infoText}>{t("systemVersion")}: 1.0.0</Text>
        <Text style={styles.infoText}>{t("copyright")}</Text>
      </View>

      {/* <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>
        <Text style={styles.resetButtonText}>{t("resetSettings")}</Text>
      </TouchableOpacity> */}
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
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 20,
    marginBottom: 8,
    color: "#444",
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
  roleSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: "#007AFF",
  },
  roleText: {
    fontSize: 16,
    color: "#333",
  },
  roleTextActive: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
  textInput: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    fontSize: 16,
    minWidth: 120,
  },
  addKdsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  subKdsItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  removeButton: {
    color: "red",
  },
  noItemsText: {
    fontSize: 16,
    color: "#999",
    marginTop: 8,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
  },
  resetButton: {
    backgroundColor: "#ff3b30",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  resetButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    overflow: "hidden",
    width: 150,
  },
  languagePicker: {
    width: 150,
    height: 55,
    color: "#333",
  },
});
