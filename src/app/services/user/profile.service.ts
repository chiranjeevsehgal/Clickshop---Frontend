import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../models/User';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:8081/users';

  constructor(private http: HttpClient) {}

  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`, { withCredentials: true });
  }

  updateProfile(userData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/updateprofile`, userData, {
      withCredentials: true
    });
  }
  

  changePassword(oldPassword: string, newPassword: string): Observable<string> {
    let params = new HttpParams()
      .set('oldPassword', oldPassword)
      .set('newPassword', newPassword);
    
    return this.http.put<string>(`${this.apiUrl}/changepassword`, null, { params, withCredentials: true 
    });
  }
}
