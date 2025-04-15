import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminServiceService {
  private apiUrl = 'http://localhost:8081/admin';
  private apiUrl_Product = 'http://localhost:8081/product';

  constructor(private http: HttpClient) { }

  // Dashboard stats
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard-stats`, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error getting dashboard stats:', error);
        // Return empty stats in case of an array
        return of({
          userCount: 0,
          productCount: 0,
          orderCount: 0,
          totalRevenue: 0
        });
      })
    );
  }

  // Recent orders
  getRecentOrders(limit: number = 5): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/recent-orders`, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error getting recent orders:', error);
        // Return dummy for error handling
        return of([
          { id: 1, date: new Date(), total: 0, status: 'NA' },
        ]);
      })
    );
  }

  // User management
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/viewusers`, {
      withCredentials: true
    });
  }

  getAdminUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/viewadmins`, {
      withCredentials: true
    });
  }

  promoteToAdmin(userName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/promote`, {userName}, {
      withCredentials: true
    });
  }

  activateUser(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateUser(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/deactivate`, {});
  }

  demoteToUser(userName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/demote`, {userName}, {
      withCredentials: true
    });
  }

  // Product management
  getAllProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/viewproducts`, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error fetching products:', error);
        // Return empty array in case of error
        return of([]);
      })
    );
  }
  
  /**
   * Get a single product by ID
   */
  getProductById(productId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl_Product}/${productId}`, {
      withCredentials: true
    });
  }
  
  /**
   * Add a new product
   */
  addProduct(productData: any): Observable<any> {
    return this.http.post(`${this.apiUrl_Product}/add`, productData, {
      withCredentials: true,
      responseType: 'text'
    });
  }
  
  /**
   * Update an existing product
   */
  updateProduct(productId: number, productData: any): Observable<any> {
    return this.http.put(`${this.apiUrl_Product}/update/${productId}`, productData, {
      withCredentials: true,
      responseType: 'text'
    });
  }
  
  /**
   * Delete a product
   */
  deleteProduct(productId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl_Product}/delete/${productId}`, {
      withCredentials: true,
      responseType: 'text' 
    });
  }
  
  /**
   * Upload product image
   */
  uploadProductImage(productId: number, imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return this.http.post<any>(`${this.apiUrl_Product}/admin/products/${productId}/image`, formData, {
      withCredentials: true
    });
  }
  

  // Order management
  getAllOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/orders`, {
      withCredentials: true
    });
  }

  getOrderById(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/orders/${orderId}`, {
      withCredentials: true
    });
  }

  updateOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${orderId}/status`, { status }, {
      withCredentials: true
    });
  }

  // Reports
  getRevenueReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/revenue?startDate=${startDate}&endDate=${endDate}`, {
      withCredentials: true
    });
  }

  getProductsReport(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/products`, {
      withCredentials: true
    });
  }
}
