import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminServiceService } from '../../../services/admin/admin-service.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../../../models/Order';

@Component({
  selector: 'app-order-detail',
  standalone: false,
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit {
  orderId: number = 0;
  order: any = null;
  orderItems: any[] = [];
  user: any = [];
  orderTimeline: any[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';

  // Status update modal
  showStatusModal: boolean = false;
  newStatus: string | null = null; // Changed to null to handle the default option correctly
  statusNotes: string = ''; // Added for optional notes
  isUpdating: boolean = false;

  // Cancel order modal
  showCancelModal: boolean = false;
  isCancelling: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: AdminServiceService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.orderId = +params['id'];
        this.loadOrderDetails();
      } else {
        this.router.navigate(['/admin/orders']);
      }
    });
  }

  loadOrderDetails(): void {
    this.isLoading = true;
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (data) => {
        this.order = data;
        this.user = data.customer;
        this.orderItems = [data.order];
        console.log(this.order);

        // Create a simple timeline from the order status
        this.createOrderTimeline();

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading order details:', error);
        this.errorMessage = 'Failed to load order details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  createOrderTimeline(): void {
    this.orderTimeline = [];

    if (Array.isArray(this.order.orderStatus) && this.order.orderStatus.length > 0) {
      this.orderTimeline = this.order.orderStatus.map((entry: any) => ({
        status: entry.status,
        date: new Date(entry.date),
        notes: entry.notes || '' // Added support for notes in the timeline
      }));
    } else {
      // Fallback if orderStatus is not a timeline
      this.orderTimeline.push({
        status: this.order.order.orderStatus || 'Unknown',
        date: this.order.order.updatedAt || this.order.order.orderDate || new Date(),
        notes: ''
      });
    }
  }

  getSubtotal(): number {
    return this.orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  openStatusModal(): void {
    this.showStatusModal = true;
    this.newStatus = null; // Set to null so no option is preselected
    this.statusNotes = '';
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.newStatus = null;
    this.statusNotes = '';
  }

  updateOrderStatus(): void {
    if (!this.newStatus) return;

    this.isUpdating = true;

    // Modified to include notes if your API supports it
    // If your API doesn't accept notes, you can modify this part
    const statusUpdate = this.statusNotes
      ? { status: this.newStatus, notes: this.statusNotes }
      : this.newStatus;

    this.orderService.updateOrderStatus(this.orderId, this.newStatus).subscribe({
      next: (response) => {
        // Update the order data with the response if available
        if (response && typeof response === 'object') {
          this.order = response;
        } else {
          // If the API doesn't return updated order, update locally
          if (this.order.order) {
            this.order.order.orderStatus = this.newStatus;
          } else if (this.order.orderStatus) {
            // If order status is a string
            this.order.orderStatus = this.newStatus;
          }

          // Add to timeline if we're maintaining it locally
          if (Array.isArray(this.order.orderStatus)) {
            this.order.orderStatus.push({
              status: this.newStatus,
              date: new Date(),
              notes: this.statusNotes
            });
          }
        }

        // Recreate the timeline
        this.createOrderTimeline();

        this.successMessage = `Order status updated to ${this.newStatus}`;
        this.isUpdating = false;
        this.closeStatusModal();

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        this.errorMessage = error.error?.message || 'Failed to update order status. Please try again.';
        this.isUpdating = false;

        // Clear error message after 3 seconds
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }

  confirmCancel(): void {
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
  }

  cancelOrder(): void {
    this.isCancelling = true;

    this.orderService.cancelOrder(this.orderId).subscribe({
      next: (response) => {
        // Update the order data with the response if available
        if (response && typeof response === 'object') {
          this.order = response;
        } else {
          // If the API doesn't return updated order, update locally
          if (this.order.order) {
            this.order.order.orderStatus = 'CANCELLED';
          } else if (this.order.orderStatus) {
            // If order status is a string
            this.order.orderStatus = 'CANCELLED';
          }

          // Add to timeline if we're maintaining it locally
          if (Array.isArray(this.order.orderStatus)) {
            this.order.orderStatus.push({
              status: 'CANCELLED',
              date: new Date(),
              notes: 'Order cancelled by admin'
            });
          }
        }

        // Recreate the timeline
        this.createOrderTimeline();

        this.successMessage = 'Order has been cancelled';
        this.isCancelling = false;
        this.closeCancelModal();

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error cancelling order:', error);
        this.errorMessage = error.error?.message || 'Failed to cancel order. Please try again.';
        this.isCancelling = false;
        this.closeCancelModal();

        // Clear error message after 3 seconds
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }

  // Helper method to determine if a status change is allowed
  isStatusChangeAllowed(currentStatus: string, newStatus: string): boolean {
    // Define the valid status transitions
    const validTransitions: Record<string, string[]> = {
      'PROCESSING': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED', 'CANCELLED'],
      'DELIVERED': [], // No transitions from DELIVERED
      'CANCELLED': [] // No transitions from CANCELLED
    };

    // Check if the transition is valid
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  // Get current order status in a standardized format
  getCurrentStatus(): string {
    if (this.order?.order?.orderStatus) {
      return this.order.order.orderStatus;
    } else if (this.order?.orderStatus && typeof this.order.orderStatus === 'string') {
      return this.order.orderStatus;
    } else if (Array.isArray(this.order?.orderStatus) && this.order.orderStatus.length > 0) {
      // Get the latest status from the array
      return this.order.orderStatus[this.order.orderStatus.length - 1].status;
    }
    return 'PROCESSING'; // Default status
  }


  goBack(): void {
    this.router.navigate(['/admin/vieworders']);
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

  getInvoiceFormattedPrice(price: number): string {
    if (isNaN(price) || price === null) return '₹0.00';
    return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  downloadInvoice(): void {
    // Creating a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set document properties
    doc.setProperties({
      title: `ClickShop Invoice #${this.order.order.id}`,
      subject: 'Order Invoice',
      author: 'ClickShop',
      keywords: 'invoice, order, ecommerce',
      creator: 'ClickShop Invoice System'
    });
    
    // Define colors
    const primaryColor = [79, 70, 229]; // Indigo
    const secondaryColor = [55, 65, 81]; // Gray
    const accentColor = [16, 185, 129]; // Green
    
    // Add brand logo/header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('CLICKSHOP', 20, 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Premium Shopping Experience', 20, 22);
    
    // Add "INVOICE" text with a stylish badge
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(140, 10, 50, 15, 2, 2, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('INVOICE', 165, 20, { align: 'center' });
    
    // Add invoice details section
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(15, 40, 195, 40);
    
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('INVOICE DETAILS', 15, 45);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Invoice Number:`, 15, 52);
    doc.text(`Order Date:`, 15, 58);
    doc.text(`Payment Status:`, 15, 64);
    doc.text(`Payment Method:`, 15, 70);
    doc.text(`Order ID:`, 15, 76);
    
    // Add invoice values
    doc.setFont('helvetica', 'bold');
    doc.text(`INV-${this.order.order.id}`, 60, 52);
    doc.text(`${this.getFormattedDate(this.order.order.orderDate)}`, 60, 58);
    
    // Payment status with color coding
    const paymentStatus = this.order.order.paymentStatus || 'COMPLETED';
    if (paymentStatus === 'COMPLETED') {
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    } else if (paymentStatus === 'FAILED') {
      doc.setTextColor(220, 38, 38); // Red
    } else {
      doc.setTextColor(234, 179, 8); // Yellow
    }
    doc.text(`${paymentStatus}`, 60, 64);
    
    // Reset color
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Razorpay`, 60, 70);
    doc.text(`${this.order.order.id}`, 60, 76);
    
    // Add order status section - visual indicator
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(105, 45, 105, 76);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ORDER STATUS', 115, 45);
    
    // Order status tracker
    const statusOptions = ['ORDERED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const orderStatus = this.order.order.orderStatus || 'ORDERED';
    const statusIndex = statusOptions.indexOf(orderStatus);
    
    // Draw status circles
    const startY = 55;
    const circleSpacing = 8;
    
    statusOptions.forEach((status, index) => {
      const x = 120;
      const y = startY + (index * circleSpacing);
      
      // Draw connector line
      if (index > 0) {
        if (index <= statusIndex) {
          doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
        } else {
          doc.setDrawColor(220, 220, 220);
        }
        doc.setLineWidth(0.5);
        doc.line(x, y - circleSpacing + 1.5, x, y - 1.5);
      }
      
      // Draw circle
      if (index <= statusIndex) {
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      } else {
        doc.setFillColor(220, 220, 220);
      }
      doc.circle(x, y, 1.5, 'F');
      
      // Add status text
      doc.setFont('helvetica', index <= statusIndex ? 'bold' : 'normal');
      doc.setFontSize(8);
      if (index <= statusIndex) {
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      } else {
        doc.setTextColor(150, 150, 150);
      }
      doc.text(status, 125, y + 0.5);
    });
    
    // Add billing information
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(15, 85, 195, 85);
    
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BILL TO', 15, 92);
    
    const customerName = this.order.customer.name || 'N/A';
    const customerContact = this.order.customer.contact || 'N/A';
    const customerEmail = this.order.customer.email || 'N/A';
    const customerAddress = this.order.customer.address || 'N/A';
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(customerName, 15, 99);
    doc.text(customerEmail, 15, 105);
    doc.text(customerContact, 15, 111);
    doc.text(customerAddress, 15, 117, { maxWidth: 80 });
    
    // Add shipping information
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('SHIP TO', 115, 92);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(customerName, 115, 99);
    doc.text(customerAddress, 115, 105, { maxWidth: 80 });
    
    // Estimated delivery info
    const orderDate = new Date(this.order.order.orderDate);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Estimated Delivery:', 115, 117);
    doc.setFont('helvetica', 'normal');
    doc.text(deliveryDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }), 160, 117);
    
    // Creating table for order items
    const tableColumn = [
      { header: 'Item', dataKey: 'item' },
      { header: 'Unit Price', dataKey: 'price' },
      { header: 'Quantity', dataKey: 'quantity' },
      { header: 'Total', dataKey: 'total' }
    ];
    
    const tableRows: any[] = [];
    
    // Adding product to the table
    const product = this.order.order.product;
    const quantity = this.order.order.quantity || 1;
    
    if (product) {
      const itemData = {
        item: product.name,
        price: this.getInvoiceFormattedPrice(product.price),
        quantity: quantity,
        total: this.getInvoiceFormattedPrice(product.price * quantity)
      };
      tableRows.push(itemData);
    }
    
    // Integrating the table to the PDF
    autoTable(doc, {
      columns: tableColumn,
      body: tableRows,
      startY: 125,
      theme: 'grid',
      headStyles: { 
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 15, right: 15 },
      styles: {
        font: 'helvetica',
        fontSize: 9
      },
      didDrawPage: function(data) {
        // Add page number if multiple pages
        if (doc.getNumberOfPages() > 1) {
          doc.setFontSize(8);
          doc.text(`Page ${doc.getNumberOfPages()}`, 195, 285, { align: 'right' });
        }
      }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Add summary section
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    
    // Calculate amounts
    const subtotal = this.order.order.subtotal || product? product.price * quantity : 0;
    const shipping = this.order.order.shipping || 0;
    const discount = this.order.order.discount || 0;
    const total = subtotal + shipping - discount;
    
    // Summary box
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(110, finalY, 80, 40, 2, 2, 'F');
    
    // Summary details
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    doc.text('Subtotal:', 120, finalY + 8);
    doc.text(this.getInvoiceFormattedPrice(subtotal), 180, finalY + 8, { align: 'right' });
    
    doc.text('Shipping:', 120, finalY + 16);
    doc.text(this.getInvoiceFormattedPrice(shipping), 180, finalY + 16, { align: 'right' });
    
    if (discount > 0) {
      doc.text('Discount:', 120, finalY + 24);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text(`-${this.getInvoiceFormattedPrice(discount)}`, 180, finalY + 24, { align: 'right' });
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    }
    
    // Add line before total
    doc.setDrawColor(220, 220, 220);
    doc.line(120, finalY + 28, 180, finalY + 28);
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL:', 120, finalY + 35);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(this.getInvoiceFormattedPrice(total), 180, finalY + 35, { align: 'right' });
    
    // Add thank you note
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Thank you for shopping with us!', 15, finalY + 20);
    
    // Add footer
    const footerY = 270;
    doc.setFillColor(249, 250, 251);
    doc.rect(0, footerY, 210, 27, 'F');
    
    doc.setDrawColor(220, 220, 220);
    doc.line(15, footerY + 1, 195, footerY + 1);
    
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ClickShop', 15, footerY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Premium Online Shopping Experience', 15, footerY + 13);
    doc.text('Email: chiranjeevsehgal@gmail.com | Phone: +91 9898989898 | Website: www.clickshop.com', 15, footerY + 18);
    
    // Saving the PDF
    doc.save(`ClickShop_Invoice_${this.order.order.id}.pdf`);
  }
}
