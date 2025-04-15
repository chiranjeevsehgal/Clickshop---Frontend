// src/app/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './services/authService/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(): boolean {
    // Check if user is logged in and has admin role
    if (this.authService.isLoggedIn() && this.authService.getUserRole() === 'ADMIN') {
      return true;
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}