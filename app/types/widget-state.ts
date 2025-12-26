export interface UserInfo {
  email: string;
  fullName: string;
  phoneNumber: string;
  shippingAddress: string;
  billingAddress: string;
}

export interface WidgetState extends Record<string, unknown> {
  authToken?: string;
  customerId?: string;
  userInfo?: UserInfo;
}

