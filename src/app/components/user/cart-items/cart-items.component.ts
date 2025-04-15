import { Component, OnInit } from '@angular/core';
import { CartItem } from '../../../models/CartItems';
import { Router } from '@angular/router';
import { CartService } from '../../../services/cart/get-cart.service';

@Component({
  selector: 'app-cart-items',
  standalone: false,
  templateUrl: './cart-items.component.html',
  styleUrl: './cart-items.component.css'
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  
  isLoading: boolean = true;
  cartTotal: number = 0;
  shippingCost: number = 99;
  discountCode: string = '';
  discountApplied: boolean = false;
  discountAmount: number = 0;
  processingOrder: boolean = false;

  placeholderProduct: string = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5YNRPU4910yPsW1yobc1J7of1kMM-pww1Qf5lkpKePvG1-3GeRFJPh0U9w0FLoeojueyp4HtPxcqWkGJOudVgEv3tpEnJQM9-Ia-eemENMJTFpTFm6WeZiiB2nBRDIwl9PeRGvsjEJTI/s1600/placeholder-image.jpg'

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchCartItems();
  }

  fetchCartItems(): void {
    this.isLoading = true;
    this.cartService.getCartItems().subscribe({
      next: (items) => {
        this.cartItems = items.map(item => ({
          ...item,
          subtotal: item.totalPrice,
          price: item.totalPrice/item.quantity
        }));
        this.calculateTotal();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch cart items:', err);
        this.isLoading = false;
      }
    });
  }

  calculateTotal(): void {
    this.cartTotal = this.cartItems.reduce((total, item) => total + (item.subtotal || 0), 0);
  }

  updateQuantity(item: CartItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return;

    this.cartService.updateQuantity(item.cartId, newQuantity).subscribe({
      next: () => {
        item.quantity = newQuantity;
        item.subtotal = item.price * newQuantity;
        this.cartService.refreshCartCount()
        this.calculateTotal();
      },
      error: (err) => console.error('Error updating quantity:', err)
    });
  }

  removeItem(cartId: number): void {
    
    this.cartService.removeItem(cartId).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(item => item.cartId !== cartId);
        this.cartService.refreshCartCount()
        this.calculateTotal();

        alert('Item removed from cart!')
      },
      error: (err) => console.error('Error removing item:', err)
      

    });
  }

  applyDiscount(): void {
    if (!this.discountCode) return;

    if (this.discountCode === 'SAVE10') {
      this.discountAmount = this.cartTotal * 0.1;
      this.discountApplied = true;
    } else {
      alert('Invalid discount code');
    }
  }

  processCheckout(): void {
    if (this.cartItems.length === 0) return;

    this.processingOrder = true;

    const order = {
      items: this.cartItems,
      subtotal: this.cartTotal,
      shipping: this.shippingCost,
      discount: this.discountAmount,
      total: this.cartTotal + this.shippingCost - this.discountAmount
    };

    this.cartService.placeOrder(order).subscribe({
      next: (response) => {
        this.cartService.clearCart().subscribe(() => {
          this.processingOrder = false;
          this.router.navigate(['/checkout/success'], {
            state: { orderDetails: response }
          });
        });
      },
      error: (err) => {
        console.error('Error processing order:', err);
        this.processingOrder = false;
        alert('Unable to process your order. Please try again.');
      }
    });
  }

  getFormattedPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(price);
  }
}
