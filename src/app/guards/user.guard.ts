// src/app/guards/user.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/authService/auth.service';

@Injectable({
  providedIn: 'root'
})
export class userGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const role = this.authService.getUserRole();

    if (
      this.authService.isLoggedIn() &&
      (role === 'USER' || role === null)
    ) {
      return true;
    }

    if (this.authService.isLoggedIn()) {
      // Logged in but not USER role (probably admin)
      this.router.navigate(['/admin/dashboard']);
    } else {
      // Not logged in
      this.router.navigate(['/login']);
    }

    return false;
  }
}
