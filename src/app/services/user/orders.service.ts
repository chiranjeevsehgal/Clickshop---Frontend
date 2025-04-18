import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { OrderItem } from '../../models/OrderItem';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../authService/auth.service';
import { User } from '../../models/User';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiUrl = 'http://localhost:8081';

  private token = localStorage.getItem('authToken');

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getOrderHistory(): Observable<OrderItem[]> {
    
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();

    return this.http.get<OrderItem[]>(`${this.apiUrl}/users/vieworders`, { headers,withCredentials: true })
      .pipe(
        switchMap(orders => {
          if (!orders || orders.length === 0) {
            return of([]);
          }
          
          const userId = this.authService.getUserId();
          if (!userId) {
            return of(orders); 
          }
          
          return this.http.get<User>(`${this.apiUrl}/users/${userId}`, { headers, withCredentials: true })
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
