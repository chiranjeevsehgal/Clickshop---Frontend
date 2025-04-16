import { Component, OnInit } from '@angular/core';
import { CartItem } from '../../../models/CartItems';
import { Router } from '@angular/router';
import { CartService } from '../../../services/cart/get-cart.service';
import { RazorpayService } from '../../../services/user/razorpay.service';
import { HotToastService } from '@ngxpert/hot-toast';

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
  customerInfo: any = {};


  placeholderProduct: string = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5YNRPU4910yPsW1yobc1J7of1kMM-pww1Qf5lkpKePvG1-3GeRFJPh0U9w0FLoeojueyp4HtPxcqWkGJOudVgEv3tpEnJQM9-Ia-eemENMJTFpTFm6WeZiiB2nBRDIwl9PeRGvsjEJTI/s1600/placeholder-image.jpg'

  constructor(
    private cartService: CartService,
    private router: Router,
    private razorpayService: RazorpayService,
    private toast: HotToastService,

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
    if (this.cartItems.length === 0) {
      this.toast.error('Your cart is empty');
      return;
    }

    this.processingOrder = true;

    const orderData = {
      items: this.cartItems,
      subtotal: this.cartTotal,
      shipping: this.shippingCost,
      discount: this.discountAmount,
      total: this.cartTotal + this.shippingCost - this.discountAmount
    };

    // Create an order in the backend first
    this.cartService.createOrder(orderData).subscribe({
      next: (orderResponse) => {
        console.log("Initiate payment");
        console.log(orderResponse);
        this.initiatePayment(orderResponse);
        
        
      },
      error: (err) => {
        console.error('Error creating order:', err);
        this.processingOrder = false;
        this.toast.error('Unable to process your order. Please try again.');
      }
    });
  }

  initiatePayment(orderData: any): void {
    
    const options = {
      key: 'rzp_test_nszEMOVRLAZUFz',
      amount: Math.round(orderData.total), // Amount in paisa
      currency: 'INR',
      name: 'ClickShop',
      description: 'Purchase from ClickShop',
      order_id: orderData.razorpayOrderId,
      prefill: {
        name: orderData.user.name,
        email: orderData.user.email,
        contact: orderData.user.phone
      },
      notes: {
        address: 'Chiranjeev Sehgal'
      },
      theme: {
        color: '#4f46e5'
      },
      handler: (response: any) => {
        this.handlePaymentSuccess(response, orderData);
      }
    };

    // Load and open Razorpay
    this.loadRazorpayScript().then(() => {
      this.razorpayService.initPayment(options)
        .catch((error) => {
          console.error('Payment failed:', error);
          this.processingOrder = false;
          this.toast.error('Payment failed. Please try again.');
        });
    });
  }
  

  handlePaymentSuccess(response: any, orderData: any): void {
    // To verify payment
    
    const paymentData = {
      razorpayPaymentId: response.razorpay_payment_id,
      razorpayOrderId: response.razorpay_order_id,
      razorpaySignature: response.razorpay_signature,
      orderId: orderData.orderId
    };
    

    this.razorpayService.verifyPayment(paymentData).subscribe({
      next: (verificationResponse) => {
        
        this.cartService.saveOrder({
          ...orderData,
          paymentId: response.razorpay_payment_id,
          paymentStatus: 'COMPLETED'
        }).subscribe({
          next: (finalOrderResponse) => {
            this.cartService.clearCart().subscribe(() => {
              this.processingOrder = false;
              this.toast.success('Payment successful! Order placed.');
              this.router.navigate(['/orders'], {
                state: { orderDetails: finalOrderResponse }
              });
            });
          },
          error: (err) => {
            console.error('Error saving order after payment:', err);
            this.processingOrder = false;
            this.toast.error('Your payment was successful but we had trouble saving your order. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          }
        });
      },
      error: (err) => {
        console.error('Payment verification failed:', err);
        this.processingOrder = false;
        this.toast.error('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
      }
    });
  }

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => {
        this.toast.error('Failed to load payment gateway. Please try again.');
        this.processingOrder = false;
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }
  getFormattedPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(price);
  }

}
