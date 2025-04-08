// 中英文翻译资源
export const translations = {
  zh: {
    // 导航
    newOrders: "新订单",
    orderHistory: "订单历史",
    stockManagement: "库存管理",
    settings: "设置",
    
    // 订单相关
    order: "订单",
    orderId: "订单号",
    pickupMethod: "取餐方式",
    pickupTime: "取餐时间",
    tableNumber: "桌号",
    quantity: "数量",
    
    // 订单状态
    action: "处理中",
    urgent: "紧急",
    delayed: "延迟",
    
    // 操作按钮
    complete: "完成",
    cancel: "取消",
    print: "打印",
    confirmComplete: "确认完成",
    confirmCancel: "确认取消",
    
    // 订单来源
    kiosk: "自助点单",
    online: "线上订单",
    web: "网页订单",
    vend: "自动售货",
    temp: "临时订单",
    unknown: "未知来源",
    
    // 设置界面
    language: "语言",
    chinese: "中文",
    english: "英文",
    resetSettings: "重置设置",
    systemInfo: "系统信息",
    systemVersion: "系统版本",
    copyright: "© 2023 Pospal Australia Pty Ltd",
    confirm: "确认",
    confirmReset: "确定要重置所有设置吗？",
    
    // 库存管理
    stockList: "库存列表",
    productName: "产品名称",
    currentStock: "当前库存",
    lowStock: "限制库存",
    outOfStock: "缺货",
    addStock: "添加库存",
    reduceStock: "减少库存",
    updateStock: "更新库存",
    addNewProduct: "添加新产品",
    deleteProduct: "删除产品",
    confirmDelete: "确认删除",
    stockHistory: "库存历史",
    noProducts: "没有产品",
    enterValidStock: "请输入有效的库存数量",
    stockUpdatedTo: "产品库存已更新为",
    markedAsSoldOut: "已将选中商品标记为售罄",
    markSoldOutFailed: "标记售罄失败",
    refillStockFailed: "补充库存失败",
    updateStockFailed: "更新库存失败",
    enterStockQuantity: "输入库存数量",
    
    // 其他
    noOrders: "暂无订单...",
    todayOrderHistory: "今日订单历史",
    save: "保存",
    edit: "编辑",
    delete: "删除",
    add: "添加",
    update: "更新",
    search: "搜索",
    filter: "筛选",
    notConnected: "未连接",
    printerNotConnected: "打印机未连接",
    success: "成功",
    orderPrinted: "订单已打印",
    failed: "失败",
    printOrderFailed: "打印订单失败",
    error: "错误",
    printingError: "打印错误",
  },
  
  en: {
    // Navigation
    newOrders: "New Orders",
    orderHistory: "Order History",
    stockManagement: "Stock Management",
    settings: "Settings",
    
    // Order related
    order: "Order",
    orderId: "Order ID",
    pickupMethod: "Pickup Method",
    pickupTime: "Pickup Time",
    tableNumber: "Table Number",
    quantity: "Quantity",
    
    // Order status
    action: "Action",
    urgent: "Urgent",
    delayed: "Delayed",
    
    // Action buttons
    complete: "Complete",
    cancel: "Cancel", 
    print: "Print",
    confirmComplete: "Confirm Complete",
    confirmCancel: "Confirm Cancel",
    
    // Order sources
    kiosk: "Kiosk",
    online: "Online",
    web: "Web",
    vend: "Vending",
    temp: "Temp",
    unknown: "Unknown",
    
    // Settings screen
    language: "Language",
    chinese: "Chinese",
    english: "English",
    resetSettings: "Reset Settings",
    systemInfo: "System Information",
    systemVersion: "System Version",
    copyright: "© 2023 Pospal Australia Pty Ltd",
    confirm: "Confirm",
    confirmReset: "Are you sure you want to reset all settings?",
    
    // Stock management
    stockList: "Stock List",
    productName: "Product Name",
    currentStock: "Current Stock",
    lowStock: "Low Stock",
    outOfStock: "Out of Stock",
    addStock: "Add Stock",
    reduceStock: "Reduce Stock",
    updateStock: "Update Stock",
    addNewProduct: "Add New Product",
    deleteProduct: "Delete Product",
    confirmDelete: "Confirm Delete",
    stockHistory: "Stock History",
    noProducts: "No Products",
    enterValidStock: "Please enter a valid stock quantity",
    stockUpdatedTo: "Products stock is updated to",
    markedAsSoldOut: "Selected products marked as sold out",
    markSoldOutFailed: "Failed to mark as sold out",
    refillStockFailed: "Failed to refill stock",
    updateStockFailed: "Failed to update stock",
    enterStockQuantity: "Enter stock quantity",
    
    // Others
    noOrders: "No Orders...",
    todayOrderHistory: "Today's Order History",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    add: "Add",
    update: "Update",
    search: "Search",
    filter: "Filter",
    notConnected: "Not Connected",
    printerNotConnected: "Printer not connected",
    success: "Success",
    orderPrinted: "Order printed",
    failed: "Failed",
    printOrderFailed: "Failed to print order",
    error: "Error",
    printingError: "Printing error",
  }
};

// 支持的语言类型
export type SupportedLanguage = "en" | "zh";

// 获取默认语言
export const getDefaultLanguage = (): SupportedLanguage => {
  // 始终返回英文作为默认语言
  return "en";
}; 