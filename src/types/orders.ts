export type OrderItem = {
  id?: string;
  name?: string;
  quantity?: number;
  price?: number;
  total?: number;
  sku?: string;
  notes?: string;
  [key: string]: unknown;
};

export type OrderRecord = {
  businessId: string;
  orderId: string;
  createdAt: string;
  createdAtOrderId: string;
  expiresAt: number;
  status: string;
  customerEmail: string;
  customerName?: string;
  items: OrderItem[];
  total: number;
  currency: string;
  fulfillment?: 'pickup' | 'delivery';
  deliveryAddress?: string;
  delivery?: {
    enabled?: boolean;
    type?: 'flat' | 'uber' | 'doordash';
    mode?: 'pickup' | 'delivery' | 'both';
    fulfillment?: 'pickup' | 'delivery';
    address?: string;
    addressConfirmed?: boolean;
    flatFeeCents?: number;
  };
  taxes?: {
    enabled?: boolean;
    ratePercent?: number;
    taxShipping?: boolean;
    defaultProductTaxable?: boolean;
    subtotalCents?: number;
    taxCents?: number;
    totalCents?: number;
  };
  notes?: string;
  [key: string]: unknown;
};
