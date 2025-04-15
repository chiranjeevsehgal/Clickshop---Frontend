import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CartItem } from '../../models/CartItems';
import { BehaviorSubject, Observable } from 'rxjs';

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
    return this.http.delete(`${this.apiUrl}/api/cart/clear`, { withCredentials: true });
  }

  placeOrder(order: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/orders`, order, { withCredentials: true });
  }
}
