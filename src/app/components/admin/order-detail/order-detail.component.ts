import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminServiceService } from '../../../services/admin/admin-service.service';


@Component({
  selector: 'app-order-detail',
  standalone: false,
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit{
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

  printOrder(): void {
    window.print();
  }
  
  goBack(): void {
    this.router.navigate(['/admin/vieworders']);
  }
  
}
