// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './services/authService/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.checkAuth().pipe(
      map(response => {
        // If we get here, the user is authenticated
        return true;
      }),
      catchError(error => {
        // If error 401/403, redirect to login
        if (error.status === 401 || error.status === 403) {
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: state.url }
          });
        }
        return of(false);
      })
    );
  }
}