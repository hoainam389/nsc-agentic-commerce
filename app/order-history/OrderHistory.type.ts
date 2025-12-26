export interface OrderHistoryItem {
  orderNumber: string;
  orderDate: string;
  orderDateFormatted: string;
  status: string;
  total: Number;
  totalFormatted: string;
  trackingNumbers: string;
  variantCodes: string[];
}

export interface OrderHistoryProps extends Record<string, unknown> {
  totalCount: Number;
  orders: OrderHistoryItem[];
}
