// product-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductServiceService } from '../../../services/productService/product-service.service';
import { Product } from '../../../models/Product';
import { CartService } from '../../../services/cart/get-cart.service';
import { catchError, of } from 'rxjs';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading: boolean = true;
  error: string | null = null;
  quantity: number = 1;

  
  placeholderProduct: string = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5YNRPU4910yPsW1yobc1J7of1kMM-pww1Qf5lkpKePvG1-3GeRFJPh0U9w0FLoeojueyp4HtPxcqWkGJOudVgEv3tpEnJQM9-Ia-eemENMJTFpTFm6WeZiiB2nBRDIwl9PeRGvsjEJTI/s1600/placeholder-image.jpg'
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private productService: ProductServiceService,
    private toast:HotToastService
  ) { }
  relatedProducts: Product[] = [];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = +params['id'];
      this.loadProductDetails(productId);
    });

    this.productService.getAllProducts().subscribe(products => {
      this.relatedProducts = products.filter(p => 
        p.category === this.product?.category && p.id !== this.product.id
      ).slice(0, 4); // Limit to 4 products
    });
  }

  viewProductDetails(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  loadProductDetails(productId: number): void {
    this.loading = true;
    this.productService.getProductById(productId).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
        console.log(product);
        
      },
      error: (err) => {
        console.error('Error loading product details:', err);
        this.error = 'Unable to load product details. Please try again later.';
        this.loading = false;
      }
    });
  }

  incrementQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.product) {
      
      this.productService.addToCart(this.product, this.quantity).pipe(
        catchError((error) => {
          console.error('Error adding to cart:', error);
          
          if (error.status === 401 && error.error && error.error.message === 'Please login to add items to cart') {
            this.toast.info(error.error.message || 'Please login to add items to cart');
            return of({ _handled: true, originalError: error });
          }
          
          this.toast.error('Failed to add product to cart. Please try again.');
          return of({ _handled: true, originalError: error });
        })
      ).subscribe({
        next: (res) => {
          if (res && res._handled) {
            return;
          }
          
          // Success case
          if (res.message) {
            this.toast.success(res.message);
          }
          this.cartService.refreshCartCount();
        },
        error: () => {} // Should never get here because of catchError
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}