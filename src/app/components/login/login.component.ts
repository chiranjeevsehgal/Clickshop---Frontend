import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/authService/auth.service';


@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  showPassword = false;
  returnUrl: string = '/products';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // Get return url from route parameters or default to '/products'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/products';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const username = this.loginForm.get('username')?.value;
    const password = this.loginForm.get('password')?.value;

    this.authService.login(username, password).subscribe({
      next: (response: any) => {
        // Handle successful login
        console.log('Login success:', response);
        
        // Store user info if needed
        if (response.userId) {
          localStorage.setItem('userId', response.userId);
        }
        
        if (response.role) {
          localStorage.setItem('role', response.role);
        }
        
        // Navigate to the return URL or dashboard
        
        if (response.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          // Navigate to the return URL or products page for regular users
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
}