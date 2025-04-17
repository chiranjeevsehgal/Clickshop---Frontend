import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CartItem } from '../../models/CartItems';
import { BehaviorSubject, catchError, map, Observable, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();


  private apiUrl = 'http://localhost:8081';

  constructor(private http: HttpClient) {}

  refreshCartCount(): void {
    this.getCartItems().subscribe(items => {
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      this.cartCountSubject.next(totalQuantity);
    });
  }

  getCartItems(): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(`${this.apiUrl}/users/cartitems`, { withCredentials: true });
  }

  updateQuantity(itemId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/cart/update/${itemId}`, { quantity }, { withCredentials: true });
  }

  removeItem(itemId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cart/remove/${itemId}`, { withCredentials: true });
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cart/clear`, { withCredentials: true });
  }

  placeOrder(order: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/orders`, order, { withCredentials: true });
  }
  createOrder(orderData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/payments/create-order`, orderData, { 
      withCredentials: true 
    }).pipe(
      switchMap(orderResponse => {
        const userId = orderResponse.userId;
  
        return this.http.get<any>(`${this.apiUrl}/users/${userId}`).pipe(
          map(user => {
            return {
              ...orderResponse,
              user
            };
          })
        );
      })
    );
  }
  

  // Save completed order after successful payment
  saveOrder(orderData: any, originalData: any): Observable<any> {
  
    return this.http.post(`${this.apiUrl}/orders/save`, orderData, { 
      withCredentials: true 
    }).pipe(
      tap((orderResponse: any) => {
        // After order is saved successfully, send email notifications
        
        if (orderResponse && orderResponse.orderId) {
          
          const emailPayload = {
            ...orderResponse,    
            ...orderData,        
            ...originalData,     
            orderId: orderResponse.orderId 
          };
          
          // Send customer email notification
          this.http.post(`${this.apiUrl}/email/send-customer-confirmation`, emailPayload, {
            withCredentials: true
          }).subscribe({
            next: (emailResponse) => console.log('Customer email notification sent successfully', emailResponse),
            error: (error) => console.error('Failed to send customer email notification', error)
          });
          
          // Send admin email notification
          this.http.post(`${this.apiUrl}/email/send-admin-notification`, emailPayload, {
            withCredentials: true
          }).subscribe({
            next: (emailResponse) => console.log('Admin email notification sent successfully', emailResponse),
            error: (error) => console.error('Failed to send admin email notification', error)
          });
        }
      }),
      catchError(error => {
        console.error('Error saving order:', error);
        throw error;
      })
    );
  }
}
