import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { OrderItem } from '../../../models/OrderItem';
import { Order } from '../../../models/Order';
import { OrdersService } from '../../../services/user/orders.service';

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})

export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  expandedOrderId: number | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private orderService: OrdersService
  ) { }

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(): void {
    this.isLoading = true;
  
    this.orderService.getOrderHistory().subscribe({
      next: (orderItems) => {
        // Group items by orderId
        const ordersMap = orderItems.reduce((map, item) => {
          if (!map.has(item.orderId)) {
            map.set(item.orderId, {
              orderId: item.orderId,
              orderDate: item.orderDate,
              totalAmount: 0,
              status: item.status || 'Ordered', // Default to 'Ordered' if status is undefined
              paymentMethod: item.paymentMethod || 'Card', // Default payment method
              deliveryAddress: item.deliveryAddress || 'Not provided', // Default address
              items: []
            });
          }
  
          const order = map.get(item.orderId)!;
          // Extract product name from the product object if needed
          const productName = item.product?.name || 'Unknown Product';
          const price = item.product?.price || 0;
          
          order.items.push({
            ...item,
            productName: productName,
            price: price
          });
          
          // Calculate total amount carefully to avoid NaN
          order.totalAmount += (price * item.quantity) || 0;
          return map;
        }, new Map<number, Order>());
  
        this.orders = Array.from(ordersMap.values())
          .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        
        console.log('Processed orders:', this.orders);
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage = 'Failed to load orders';
        this.isLoading = false;
        if (error.status === 401 || error.status === 403) this.router.navigate(['/auth/login']);
      }
    });
  }

  toggleOrderDetails(orderId: number): void {
    if (this.expandedOrderId === orderId) {
      this.expandedOrderId = null;
    } else {
      this.expandedOrderId = orderId;
    }
  }

  getOrderStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getFormattedDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getFormattedPrice(price: number): string {
    if (isNaN(price) || price === null) return '0.00';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'INR' 
    }).format(price);
  }
}