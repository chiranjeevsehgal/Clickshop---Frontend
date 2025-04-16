import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

declare var Razorpay: any;

@Injectable({
  providedIn: 'root'
})
export class RazorpayService {
  // private apiUrl = environment.apiUrl || 'http://localhost:8081';
  private apiUrl = 'http://localhost:8081/payments';

  constructor(private http: HttpClient) { }
  
  createOrder(orderData: any): Observable<any> {
    console.log(orderData);
    return this.http.post(`${this.apiUrl}/create-order`, orderData, { 
      withCredentials: true 
    });
  }

  verifyPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-payment`, paymentData, { 
      withCredentials: true 
    });
  }

  initPayment(options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        reject(response.error);
      });
      
      rzp.open();
      resolve(rzp);
    });
  }

}
