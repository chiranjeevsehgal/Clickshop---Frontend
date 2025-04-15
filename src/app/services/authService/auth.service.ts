import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081';
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');
    
    if (userId && role) {
      this.userSubject.next({ userId, role });
    }

  }

  login(username: string, password: string): Observable<any> {
    const loginData = { username, password };
    
    return this.http.post(`${this.apiUrl}/auth/login`, loginData, {
      withCredentials: true
    }).pipe(
      tap((response: any) => {
        if (response && response.userId) {
          this.userSubject.next({
            userId: response.userId,
            role: response.role
          });
        }
      })
    );
  }

  isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  getUserRole(): string | null {
    return this.userSubject.value?.role || null;
  }

  getUserId(): string | null {
    return this.userSubject.value?.userId || null;
  }

  logout(): Observable<any> {
    // Call the backend logout endpoint to invalidate the session
    return this.http.get(`${this.apiUrl}/auth/logout`, {
      withCredentials: true,
      responseType: 'text'
    }).pipe(
      tap(() => {
        // Clear any local storage or state if needed
        this.userSubject.next(null);
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        // You can clear other items as needed
      })
    );
  }

  // Add other auth methods as needed
  register(registerData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, registerData, {
      withCredentials: true
    });
  }

  checkAuth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/check-role`, {
      withCredentials: true,
      responseType: 'text'  
    });
  }
}

