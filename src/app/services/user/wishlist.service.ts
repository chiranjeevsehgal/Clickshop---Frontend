import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = 'http://localhost:8081/wishlist';

  constructor(private http: HttpClient) { }

  // Get all wishlist items for the logged-in user
  getWishlist(): Observable<any> {
    return this.http.get(`${this.apiUrl}`, {
      withCredentials: true
    });
  }

  // Add a product to wishlist
  addToWishlist(productId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/add/${productId}`, {}, {
      withCredentials: true
    });
  }

  // Remove a product from wishlist
  removeFromWishlist(productId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove/${productId}`, {
      withCredentials: true
    });
  }

  // Check if a product is in the user's wishlist
  isProductInWishlist(productId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/check/${productId}`, {
      withCredentials: true
    });
  }

  clearWishlist(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/clear`, {
      withCredentials: true
    });
  }

}
