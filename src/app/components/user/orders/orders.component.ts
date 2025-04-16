import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { OrderItem } from '../../../models/OrderItem';
import { Order } from '../../../models/Order';
import { OrdersService } from '../../../services/user/orders.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
        const ordersMap = orderItems.reduce((map, item) => {
          console.log(orderItems);
          if (!map.has(item.id)) {
            map.set(item.id, {
              orderId: item.id,
              orderDate: item.orderDate,
              totalAmount: 0,
              status: item.orderStatus || 'Ordered',
              paymentMethod: item.paymentMethod || 'Razorpay',
              deliveryAddress: item?.userDetails?.address || 'Not provided', 
              items: []
            });
          }
          
          const order = map.get(item.id)!;
          const productName = item.product?.name || 'Unknown Product';
          const price = item.product?.price || 0;
          
          order.items.push({
            ...item,
            productName: productName,
            price: price
          });
          
          order.totalAmount += (price * item.quantity) || 0;
          return map;
        }, new Map<number, Order>());
  
        this.orders = Array.from(ordersMap.values())
          .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        
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
  
  getInvoiceFormattedPrice(price: number): string {
    if (isNaN(price) || price === null) return '₹0.00';
  return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  downloadInvoice(order: Order): void {
    // Creating a new empty PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 255);
    doc.text('ClickShop', 105, 15, { align: 'center' });
    
    // Add invoice title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 105, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Invoice #: INV-${order.orderId}`, 15, 40);
    doc.text(`Order Date: ${this.getFormattedDate(order.orderDate)}`, 15, 45);
    doc.text(`Payment Method: ${order.paymentMethod}`, 15, 55);
    
    // Customer info
    doc.text('Bill To:', 140, 40);
    doc.text(`Customer Name: ${order.items[0]?.userDetails?.name || 'N/A'}`, 140, 45);
    doc.text(`Customer Contact: ${order.items[0]?.userDetails?.contact || 'N/A'}`, 140, 50);
    doc.text(`Customer Email: ${order.items[0]?.userDetails?.email || 'N/A'}`, 140, 55);
    doc.text(`Address: ${order.deliveryAddress}`, 140, 60);
    
    // Creating table for order items
    const tableColumn = ["Item", "Price", "Quantity", "Total"];
    const tableRows: any[] = [];
    
    // Adding order items to the table
    order.items.forEach(item => {
      const itemData = [
        item.productName,
        this.getInvoiceFormattedPrice(item.price),
        item.quantity,
        this.getInvoiceFormattedPrice(item.price * item.quantity)
      ];
      tableRows.push(itemData);
    });
    
    // Integrating the table to the PDF
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 153] }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Amount: ${this.getInvoiceFormattedPrice(order.totalAmount)}`, 120, finalY);
    
    // Footer
    doc.setFontSize(8);
    doc.text('Thank you for shopping with ClickShop!', 105, finalY + 20, { align: 'center' });
    doc.text('For any questions, please contact chiranjeevsehgal@gmail.com', 105, finalY + 25, { align: 'center' });
    
    // Saving the PDF
    doc.save(`Invoice-${order.orderId}.pdf`);
  }
}