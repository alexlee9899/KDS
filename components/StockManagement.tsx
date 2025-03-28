import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { StockService, StockItem } from "../services/stockService";
import { colors } from "@/styles/color";

// 仓库ID常量
const WAREHOUSE_ID = "6672310309b356dd04293cb9";

// 特殊分类常量
const SOLD_OUT_CATEGORY = "Sold Out";
const LOW_STOCK_CATEGORY = "Low Stock";

const StockManagementScreen = () => {
  // 状态管理
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<StockItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("5");
  const [allProducts, setAllProducts] = useState<StockItem[]>([]);

  // 库存更新相关状态
  const [refillModalVisible, setRefillModalVisible] = useState(false);
  const [refillQuantity, setRefillQuantity] = useState("");

  // 加载库存数据
  const loadStockData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("loadStockData");
      // 获取仓库库存数据
      const stockData = await StockService.getWarehouseStock(WAREHOUSE_ID);
      console.log("stockData", stockData);

      // 提取分类列表并添加特殊分类
      const categoryList = Object.keys(stockData.products);
      const enhancedCategories = [
        ...categoryList,
        SOLD_OUT_CATEGORY,
        LOW_STOCK_CATEGORY,
      ];
      setCategories(enhancedCategories);

      // 收集所有商品用于特殊分类筛选
      const allProductsList: StockItem[] = [];
      Object.values(stockData.products).forEach((categoryItems) => {
        allProductsList.push(...categoryItems);
      });
      setAllProducts(allProductsList);

      // 默认选择第一个分类
      if (categoryList.length > 0 && !selectedCategory) {
        setSelectedCategory(categoryList[0]);
        setProducts(stockData.products[categoryList[0]] || []);
      }

      // 清空已选商品
      //   setSelectedProducts(new Set());
    } catch (err) {
      setError("加载库存数据失败");
      console.error("加载库存数据错误:", err);
    } finally {
      setLoading(false);
    }
  };

  // 选择分类
  const handleCategorySelect = async (category: string) => {
    if (category === selectedCategory) return;

    try {
      setLoading(true);
      setSelectedCategory(category);

      // 处理特殊分类
      if (category === SOLD_OUT_CATEGORY) {
        // 筛选库存为0的商品
        const soldOutProducts = allProducts.filter((item) => item.qty === 0);
        setProducts(soldOutProducts);
      } else if (category === LOW_STOCK_CATEGORY) {
        // 筛选库存告急的商品
        const threshold = parseInt(lowStockThreshold) || 5;
        const lowStockProducts = allProducts.filter(
          (item) => item.qty > 0 && item.qty <= threshold
        );
        setProducts(lowStockProducts);
      } else {
        // 获取常规分类的产品
        const categoryProducts = await StockService.getCategoryStock(
          WAREHOUSE_ID,
          category
        );
        setProducts(categoryProducts);
      }
    } catch (err) {
      setError(`加载${category}分类产品失败`);
      console.error(`加载${category}分类产品错误:`, err);
    } finally {
      setLoading(false);
    }
  };

  // 切换商品选择状态
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(productId)) {
        newSelected.delete(productId);
      } else {
        newSelected.add(productId);
      }
      return newSelected;
    });
  };

  // 标记为售罄
  const handleSoldOut = async () => {
    try {
      setLoading(true);
      const selectedProductIds = Array.from(selectedProducts);

      // 保存当前分类，此后要重新加载它
      const currentCategory = selectedCategory;

      // 更新操作
      console.log("准备将以下商品标记为售罄:", selectedProductIds);
      for (const productId of selectedProductIds) {
        console.log(`更新商品 ${productId} 库存为0...`);
        await StockService.updateProductStock(WAREHOUSE_ID, productId, 0);
      }

      console.log("售罄操作完成，准备重新加载数据...");

      // 添加延迟确保服务器处理完成
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 强制从服务器重新获取数据
      console.log("重新加载库存数据...");
      try {
        // 获取仓库库存数据
        const stockData = await StockService.getWarehouseStock(WAREHOUSE_ID);
        console.log("获取到最新库存数据:", stockData);

        // 提取分类列表并添加特殊分类
        const categoryList = Object.keys(stockData.products);
        const enhancedCategories = [
          ...categoryList,
          SOLD_OUT_CATEGORY,
          LOW_STOCK_CATEGORY,
        ];
        setCategories(enhancedCategories);

        // 收集所有商品用于特殊分类筛选
        const allProductsList: StockItem[] = [];
        Object.values(stockData.products).forEach((categoryItems) => {
          allProductsList.push(...categoryItems);
        });
        console.log("更新全部商品数据，商品总数:", allProductsList.length);
        setAllProducts(allProductsList);

        // 清除选择
        setSelectedProducts(new Set());

        // 重新加载当前分类的商品
        if (currentCategory) {
          // 获取常规分类的产品
          try {
            const categoryProducts = await StockService.getCategoryStock(
              WAREHOUSE_ID,
              currentCategory
            );

            setProducts(categoryProducts);
          } catch (err) {
            console.error(`获取${currentCategory}分类商品失败:`, err);
          }
        }
      } catch (err) {
        console.error("重新加载库存数据失败:", err);
      }

      Alert.alert("成功", "已将选中商品标记为售罄");
    } catch (error) {
      console.error("标记售罄错误:", error);
      setError("标记售罄失败");
    } finally {
      setLoading(false);
    }
  };

  // 补充库存 - 显示输入对话框
  const handleRefill = () => {
    setRefillQuantity("");
    setRefillModalVisible(true);
  };

  // 执行库存更新
  const submitRefill = async () => {
    const qty = parseInt(refillQuantity);

    if (isNaN(qty) || qty < 0) {
      Alert.alert("错误", "请输入有效的库存数量");
      return;
    }

    setRefillModalVisible(false);

    try {
      setLoading(true);
      const selectedProductIds = Array.from(selectedProducts);

      // 保存当前分类，此后要重新加载它
      const currentCategory = selectedCategory;

      // 更新操作
      console.log(`准备将选中商品库存更新为${qty}:`, selectedProductIds);
      for (const productId of selectedProductIds) {
        console.log(`更新商品 ${productId} 库存为 ${qty}...`);
        await StockService.updateProductStock(WAREHOUSE_ID, productId, qty);
      }

      console.log("库存更新完成，准备重新加载数据...");

      // 添加延迟确保服务器处理完成
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 强制从服务器重新获取数据
      console.log("重新加载库存数据...");
      try {
        // 获取仓库库存数据
        const stockData = await StockService.getWarehouseStock(WAREHOUSE_ID);
        console.log("获取到最新库存数据:", stockData);

        // 提取分类列表并添加特殊分类
        const categoryList = Object.keys(stockData.products);
        const enhancedCategories = [
          ...categoryList,
          SOLD_OUT_CATEGORY,
          LOW_STOCK_CATEGORY,
        ];
        setCategories(enhancedCategories);

        // 收集所有商品用于特殊分类筛选
        const allProductsList: StockItem[] = [];
        Object.values(stockData.products).forEach((categoryItems) => {
          allProductsList.push(...categoryItems);
        });
        console.log("更新全部商品数据，商品总数:", allProductsList.length);
        setAllProducts(allProductsList);

        // 清除选择
        setSelectedProducts(new Set());

        // 重新加载当前分类的商品
        console.log("重新加载当前分类:", currentCategory);
        if (currentCategory === SOLD_OUT_CATEGORY) {
          // 筛选库存为0的商品
          const soldOutProducts = allProductsList.filter(
            (item) => item.qty === 0
          );
          console.log("售罄商品数量:", soldOutProducts.length);
          setProducts(soldOutProducts);
        } else if (currentCategory === LOW_STOCK_CATEGORY) {
          // 筛选库存告急的商品
          const threshold = parseInt(lowStockThreshold) || 5;
          const lowStockProducts = allProductsList.filter(
            (item) => item.qty > 0 && item.qty <= threshold
          );
          console.log("库存告急商品数量:", lowStockProducts.length);
          setProducts(lowStockProducts);
        } else if (currentCategory) {
          // 获取常规分类的产品
          try {
            console.log(`获取${currentCategory}分类商品...`);
            const categoryProducts = await StockService.getCategoryStock(
              WAREHOUSE_ID,
              currentCategory
            );
            console.log(
              `${currentCategory}分类商品数量:`,
              categoryProducts.length
            );
            setProducts(categoryProducts);
          } catch (err) {
            console.error(`获取${currentCategory}分类商品失败:`, err);
          }
        }
      } catch (err) {
        console.error("重新加载库存数据失败:", err);
      }

      Alert.alert("成功", `已将选中商品库存更新为${qty}`);
    } catch (error) {
      console.error("补充库存错误:", error);
      setError("补充库存失败");
    } finally {
      setLoading(false);
    }
  };

  // 处理阈值变化
  const handleThresholdChange = (value: string) => {
    // 只允许输入数字
    if (/^\d*$/.test(value)) {
      setLowStockThreshold(value);

      // 如果当前选中的是库存告急分类，则刷新显示
      if (selectedCategory === LOW_STOCK_CATEGORY) {
        const threshold = parseInt(value) || 5;
        const lowStockProducts = allProducts.filter(
          (item) => item.qty > 0 && item.qty <= threshold
        );
        setProducts(lowStockProducts);
      }
    }
  };

  // 全选当前分类下的所有产品
  const handleSelectAll = () => {
    // 检查是否所有当前显示的产品都已被选中
    const allSelected = products.every((item) =>
      selectedProducts.has(item.product_id)
    );

    // 创建新的选择集合
    const newSelection = new Set(selectedProducts);

    if (allSelected) {
      // 如果全部选中，则取消所有选择
      products.forEach((item) => {
        newSelection.delete(item.product_id);
      });
    } else {
      // 如果未全部选中，则选择所有
      products.forEach((item) => {
        newSelection.add(item.product_id);
      });
    }

    setSelectedProducts(newSelection);
  };

  // 检查当前是否已全选
  const isAllSelected =
    products.length > 0 &&
    products.every((item) => selectedProducts.has(item.product_id));

  // 渲染分类项
  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item && styles.selectedCategoryItem,
        // 为特殊分类添加不同的样式
        item === SOLD_OUT_CATEGORY && styles.soldOutCategoryItem,
        item === LOW_STOCK_CATEGORY && styles.lowStockCategoryItem,
      ]}
      onPress={() => handleCategorySelect(item)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item && styles.selectedCategoryText,
          // 为特殊分类添加不同的文字样式
          item === SOLD_OUT_CATEGORY && styles.soldOutCategoryText,
          item === LOW_STOCK_CATEGORY && styles.lowStockCategoryText,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  // 渲染产品项
  const renderProductItem = ({ item }: { item: StockItem }) => (
    <TouchableOpacity
      style={[
        styles.productItem,
        selectedProducts.has(item.product_id) && styles.selectedProductItem,
      ]}
      onPress={() => toggleProductSelection(item.product_id)}
    >
      <Text
        style={[
          styles.productName,
          selectedProducts.has(item.product_id) && styles.selectedProductText,
        ]}
      >
        {item.name}
      </Text>
      <Text
        style={[
          styles.productQty,
          item.qty <= parseInt(lowStockThreshold) ? styles.lowStock : null,
          item.qty === 0 && styles.soldOutText,
          selectedProducts.has(item.product_id) && styles.selectedProductText,
        ]}
      >
        Stock: {item.qty}
      </Text>
    </TouchableOpacity>
  );

  // 列表为空时显示的内容
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No products</Text>
    </View>
  );

  // 首次加载数据
  useEffect(() => {
    loadStockData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />

      {/* 库存补充输入弹窗 */}
      <Modal
        visible={refillModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRefillModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Refill Stock</Text>
            <Text style={styles.modalSubtitle}>
              Please enter the stock quantity:
            </Text>
            <TextInput
              style={styles.modalInput}
              value={refillQuantity}
              onChangeText={setRefillQuantity}
              keyboardType="numeric"
              autoFocus={true}
              placeholder="Please enter the quantity"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setRefillModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={submitRefill}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock Management</Text>
        <View style={styles.thresholdContainer}>
          <Text style={styles.thresholdLabel}>Low Stock Threshold:</Text>
          <TextInput
            style={styles.thresholdInput}
            value={lowStockThreshold}
            onChangeText={handleThresholdChange}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>
        <Text style={styles.selectedCount}>
          Selected: {selectedProducts.size} items
        </Text>
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            selectedProducts.size === 0 && styles.disabledButton,
          ]}
          onPress={handleSoldOut}
          disabled={selectedProducts.size === 0}
        >
          <Text style={styles.actionButtonText}>Sold Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.refillButton,
            selectedProducts.size === 0 && styles.disabledButton,
          ]}
          onPress={handleRefill}
          disabled={selectedProducts.size === 0}
        >
          <Text style={styles.actionButtonText}>Refill Stock</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStockData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          {/* 左侧分类列表 */}
          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>Product Category</Text>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item}
              style={styles.categoryList}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* 右侧产品列表 */}
          <View style={styles.productsContainer}>
            {selectedCategory && (
              <View style={styles.productHeaderContainer}>
                <Text style={styles.sectionTitle}>
                  {selectedCategory} Products
                </Text>

                {/* 全选按钮 */}
                {products.length > 0 && (
                  <TouchableOpacity
                    style={styles.selectAllButton}
                    onPress={handleSelectAll}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isAllSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isAllSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.selectAllText}>Select All</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {loading ? (
              <ActivityIndicator
                style={styles.loader}
                size="large"
                color="#0066cc"
              />
            ) : (
              <FlatList
                data={products}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.product_id}
                style={styles.productList}
                ListEmptyComponent={renderEmptyList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  thresholdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  thresholdLabel: {
    fontSize: 14,
    marginRight: 5,
    color: "#555",
  },
  thresholdInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 50,
    textAlign: "center",
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 1,
    gap: 20,
  },
  actionButton: {
    backgroundColor: "#ec6161",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    minWidth: 90,
    alignItems: "center",
  },
  refillButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  categoriesContainer: {
    width: "30%",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  productsContainer: {
    width: "70%",
    padding: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  categoryList: {
    flex: 1,
  },
  categoryItem: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    elevation: 1,
  },
  selectedCategoryItem: {
    backgroundColor: "#0066cc",
  },
  soldOutCategoryItem: {
    borderLeftWidth: 3,
    borderLeftColor: "#f44336",
  },
  lowStockCategoryItem: {
    borderLeftWidth: 3,
    borderLeftColor: "#ff9800",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  selectedCategoryText: {
    color: "#fff",
    fontWeight: "bold",
  },
  soldOutCategoryText: {
    fontWeight: "bold",
  },
  lowStockCategoryText: {
    fontWeight: "bold",
  },
  productList: {
    flex: 1,
  },
  productItem: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1,
  },
  selectedProductItem: {
    backgroundColor: "#e3f2fd",
    borderWidth: 1,
    borderColor: "#2196f3",
  },
  productName: {
    fontSize: 20,
    fontWeight: "500",
    flex: 1,
  },
  selectedProductText: {
    color: "#0066cc",
    fontWeight: "bold",
  },
  productQty: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  lowStock: {
    color: "#e53935",
  },
  soldOutText: {
    color: "#f44336",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e53935",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#0066cc",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loader: {
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 15,
    color: "#666",
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    width: "100%",
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
  },
  productHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#0066cc",
    borderRadius: 3,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#0066cc",
  },
  checkmark: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  selectAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
});

export default StockManagementScreen;
