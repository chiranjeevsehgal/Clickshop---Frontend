import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { Product } from '../../models/Product';

@Injectable({
  providedIn: 'root'
})
export class ProductServiceService {

  private apiUrl = 'http://localhost:8081';

  private token = localStorage.getItem('authToken');

  constructor(private http: HttpClient) { }

  getAllProducts(): Observable<Product[]> {
    // Get the token from localStorage

    // Create headers object with authorization if token exists
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();

    return this.http.get<Product[]>(`${this.apiUrl}/users/products`, {
      headers,
      withCredentials: true
    });
  }

  getCategories(): Observable<string[]> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();

    return this.http.get<string[]>(`${this.apiUrl}/product/categories`, { headers, withCredentials: true })
      
  }

  getPopularProducts(limit: number = 8): Observable<Product[]> {
    const params = new HttpParams().set('popular', 'true');
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();
    return this.http.get<Product[]>(`${this.apiUrl}/product`, { params, headers, withCredentials: true })
      
  }

  getProductById(id: number): Observable<Product> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();
    return this.http.get<Product>(`${this.apiUrl}/product/${id}`, { headers, withCredentials: true });
  }

  addToCart(product: Product, quantity: number = 1): Observable<any> {
    const headers = this.token
      ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
      : new HttpHeaders();
    return this.http.post(`${this.apiUrl}/cart/add`, {
      productId: product.id,
      quantity: quantity
    }, { headers, withCredentials: true, responseType: 'json' });
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/product/category/${category}`, { withCredentials: true });
  }

  searchProducts(term: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/product/search?term=${term}`, { withCredentials: true });
  }
}
