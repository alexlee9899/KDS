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
    active: "处理中",
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
    
    // 准备时间更新相关
    updatePrepTime: "更新准备时间",
    enterPrepTime: "输入准备时间",
    enterValidPrepTime: "请输入有效的准备时间",
    prepTimeUpdated: "准备时间已更新",
    updatePrepTimeFailed: "更新准备时间失败",
    
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
    selectColor: "选择颜色",
    categoryColors: "分类颜色",
    resetColors: "重置颜色",
    
    // 准备时间相关
    totalPrepareTime: "总准备时间",
    seconds: "秒",
    prepTime: "准备时间",
    remaining: "剩余时间",
    
    // 分类颜色名称
    default: "默认白色",
    category1: "金色",
    category2: "碧绿色",
    category3: "粉红色",
    category4: "紫色",
    category5: "海洋绿",
    
    // 颜色设置
    colorSettings: "颜色设置",
    defaultColor: "默认颜色",
    
    // KDS Master/Slave 相关翻译
    kdsRole: "KDS角色",
    masterKDS: "主厨显示屏",
    subKDS: "辅助显示屏", 
    localIPAddress: "本机IP地址",
    tcpPort: "TCP端口",
    masterKDSIPAddress: "主机IP地址",
    subKDSManagement: "副屏管理",
    addSubKDS: "添加副屏设备",
    enterSubKDSIPAddress: "输入副屏IP地址",
    noSubKDS: "暂无副屏设备",
    saveSettings: "保存设置",
    
    // 品类显示
    drinks: "饮料",
    hotFood: "热食",
    coldFood: "冷食",
    dessert: "甜点", 
    all: "全部",
    
    // 设置相关提示
    settingsSavedRestart: "设置已保存，重启应用以应用更改",
    saveSettingsFailed: "保存设置失败",
    pleaseEnterIPAddress: "请输入IP地址",
    ipAlreadyAdded: "此IP已添加",
    recallOrder: "重新召回",
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
    active: "active",
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
    
    // Prep time update related
    updatePrepTime: "Update Prep Time",
    enterPrepTime: "Enter preparation time",
    enterValidPrepTime: "Please enter a valid preparation time",
    prepTimeUpdated: "Preparation time updated",
    updatePrepTimeFailed: "Failed to update preparation time",
    
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
    selectColor: "Select Color",
    categoryColors: "Category Colors",
    resetColors: "Reset Colors",
    
    // KDS Master/Slave related translations
    kdsRole: "KDS Role",
    masterKDS: "Master KDS",
    subKDS: "Slave KDS",
    localIPAddress: "Local IP Address",
    tcpPort: "TCP Port",
    masterKDSIPAddress: "Master KDS IP Address",
    subKDSManagement: "Slave KDS Management",
    addSubKDS: "Add Slave KDS",
    enterSubKDSIPAddress: "Enter Slave KDS IP Address",
    noSubKDS: "No Slave KDS",
    saveSettings: "Save Settings",
    
    // Category display
    drinks: "Drinks",
    hotFood: "Hot Food",
    coldFood: "Cold Food",
    dessert: "Dessert",
    all: "All",
    
    // Settings related prompts
    settingsSavedRestart: "Settings saved, restart app to apply changes",
    saveSettingsFailed: "Failed to save settings",
    pleaseEnterIPAddress: "Please enter IP address",
    ipAlreadyAdded: "This IP is already added",
    recallOrder: "Recall Order",
    
    // 准备时间相关
    totalPrepareTime: "Total Prepare Time",
    seconds: "Seconds",
    prepTime: "Prep Time",
    remaining: "Remaining Time",
  }
};

// 支持的语言类型
export type SupportedLanguage = "en" | "zh";

// 获取默认语言
export const getDefaultLanguage = (): SupportedLanguage => {
  // 始终返回英文作为默认语言
  return "en";
}; 