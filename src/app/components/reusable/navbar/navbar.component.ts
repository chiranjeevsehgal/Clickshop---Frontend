import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../services/cart/get-cart.service';
import { AuthService } from '../../../services/authService/auth.service';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  cartCount: number = 0;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private toast: HotToastService
  ) { }

  ngOnInit(): void {
    // Only refresh cart count if user is logged in
    if (this.isLoggedIn()) {
      this.cartService.refreshCartCount();
    }
    
    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.toast.success('Logged out successfully');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if there's an error, navigate to login page
        this.router.navigate(['/login']);
      }
    });
  }

  handleCartClick(event: Event): void {
    event.preventDefault();
    
    if (this.isLoggedIn()) {
      // User is logged in, navigate to cart
      this.router.navigate(['/cart']);
    } else {
      // User is not logged in, show toast and navigate to login
      this.toast.info('Please login to access your cart');
      this.router.navigate(['/login']);
    }
  }

  handleWishlistClick(event: Event): void {
    event.preventDefault();
    
    if (this.isLoggedIn()) {
      // User is logged in, navigate to wishlist
      this.router.navigate(['/wishlist']);
    } else {
      // User is not logged in, show toast and navigate to login
      this.toast.info('Please login to access your wishlist');
      this.router.navigate(['/login']);
    }
  }
}