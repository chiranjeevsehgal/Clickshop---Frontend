import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../services/cart/get-cart.service';
import { AuthService } from '../../../services/authService/auth.service';


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
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cartService.refreshCartCount();
    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Redirect to login page after successful logout
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if there's an error, navigate to login page
        this.router.navigate(['/login']);
      }
    });
  }
}