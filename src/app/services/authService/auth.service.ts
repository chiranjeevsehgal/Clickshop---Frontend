import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredUser();
  }

  private loadStoredUser() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        this.currentUserSubject.next(JSON.parse(user));
      } catch (e) {
        console.error('Error parsing stored user', e);
        this.logout();
      }
    }
  }

  sendOtp(email: string, name: string): Observable<any> {
    
    return this.http.post(`${this.apiUrl}/auth/send-otp`, { 
      email,
      name: name
    });

  }

  verifyOtp(email: string, otp: string): Observable<any> {
    
    return this.http.post(`${this.apiUrl}/auth/verify-otp`, { email, otp });
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }
  getUserId(): string | null {
    const user = this.currentUserSubject.value;
    return user?.id || null;
  }

  getUserRole(): string | null {
    const user = this.currentUserValue;
    if (user && user.role) {
      return user.role;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        return userData.role || null;
      } catch (e) {
        console.error('Error parsing stored user data', e);
      }
    }

    return null;
  }

  login(loginData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, loginData).pipe(
      tap((response: any) => {
        if (response && response.token) {
          localStorage.setItem('authToken', response.token);
          console.log(response);

          const userData = {
            id: response.userId,
            role: response.role,
            isAdmin: response.isAdmin
          };

          localStorage.setItem('user', JSON.stringify(userData));
          this.currentUserSubject.next(userData);
        }
      })
    );
  }

  getGoogleAuthUrl(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/oauth2/authorization/google`, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error getting Google auth URL:', error);
        return throwError(() => error);
      })
    );
  }

  register(registerData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, registerData).pipe(
      tap((response: any) => {
        if (response && response.token) {
          
          if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
        }
      })
    );
  }

  checkAuth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/validate-token`, {
      responseType: 'json'
    }).pipe(
      catchError(error => {
        console.error('Auth check failed:', error);
        this.logout();
        throw error;
      })
    );
  }

  logout(): Observable<any> {
    localStorage.removeItem('authToken');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userId');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
    return of(true);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  get currentUserValue() {
    return this.currentUserSubject.value;
  }
}