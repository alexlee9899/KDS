export interface OrderSearchResponse {
  max_page: number;
  orders: string[];
  status_code: number;
}

export interface OrderDetailResponse {
  status_code: number;
  order_id: string;
  pick_method: string;
  pick_time: string;
  products: string[];  // 产品 ID 数组
  qtys: number[];     // 对应的数量数组
}

export interface OrderSearchParams {
  query: {
    time: [string, string];
  };
}

export interface OrderDetailParams {
  token: string;
  order_id: string;
}

export interface ProductDetailResponse {
  name: string;
  product_id: string;
  status_code: number;
  // 其他字段...
}

export interface FormattedOrder {
  id: string;
  pickupMethod: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  pickupTime: string;
} 