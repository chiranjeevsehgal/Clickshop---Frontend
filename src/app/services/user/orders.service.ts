import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { OrderItem } from '../../models/OrderItem';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../authService/auth.service';
import { User } from '../../models/User';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiUrl = 'http://localhost:8081';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getOrderHistory(): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.apiUrl}/users/vieworders`, { withCredentials: true })
      .pipe(
        switchMap(orders => {
          if (!orders || orders.length === 0) {
            return of([]);
          }
          
          const userId = this.authService.getUserId();
          if (!userId) {
            return of(orders); 
          }
          
          return this.http.get<User>(`${this.apiUrl}/users/${userId}`, { withCredentials: true })
            .pipe(
              map(user => {
                return orders.map(order => ({
                  ...order,
                  userDetails: user
                }));
              }),
              catchError(error => {
                console.error('Error fetching user details:', error);
                return of(orders);
              })
            );
        })
      );
  }
}
