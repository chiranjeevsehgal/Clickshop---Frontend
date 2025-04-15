// models/product.model.ts
export interface CartItem {
    id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
  subtotal?: number;
  totalPrice:number;
  cartId:number;
  }