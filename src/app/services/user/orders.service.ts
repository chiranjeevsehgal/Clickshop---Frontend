import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderItem } from '../../models/OrderItem';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiUrl = 'http://localhost:8081';

  constructor(private http: HttpClient) { }

  getOrderHistory(): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.apiUrl}/users/vieworders`, { withCredentials: true });
  }
}
