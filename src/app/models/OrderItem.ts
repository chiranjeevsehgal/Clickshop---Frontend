import { Product } from "./Product";

export interface OrderItem {
  orderId: number;
  orderDate: string;
  quantity: number;
  price: number;
  productName?: string;
  status?: string;
  paymentMethod?: string;
  deliveryAddress?: string;
  product?: Product;
  formattedDate?: string | null;
  totalPrice?: number;
  }