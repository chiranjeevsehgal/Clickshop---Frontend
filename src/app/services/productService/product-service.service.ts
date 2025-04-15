import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../models/Product';

@Injectable({
  providedIn: 'root'
})
export class ProductServiceService {

  private apiUrl = 'http://localhost:8081';

  constructor(private http: HttpClient) { }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/users/products`, { withCredentials: true });
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/product/${id}`, { withCredentials: true });
  }

  addToCart(product: Product, quantity: number = 1): Observable<any> {
    return this.http.post(`${this.apiUrl}/cart/add`, {
      productId: product.id,
      quantity: quantity
    }, { withCredentials: true, responseType: 'json'  });
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/product/category/${category}`, { withCredentials: true });
  }

  searchProducts(term: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/product/search?term=${term}`, { withCredentials: true });
  }
}
