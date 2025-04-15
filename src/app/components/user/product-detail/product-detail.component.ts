// product-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductServiceService } from '../../../services/productService/product-service.service';
import { Product } from '../../../models/Product';
import { CartService } from '../../../services/cart/get-cart.service';

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
    private productService: ProductServiceService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = +params['id'];
      this.loadProductDetails(productId);
    });
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
      this.productService.addToCart(this.product, this.quantity).subscribe({
        next: (res) => {
          alert(res.message); 
          this.cartService.refreshCartCount();
        },
        error: (err) => {
          console.error('Error adding to cart:', err);
          alert('Failed to add product to cart.');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}