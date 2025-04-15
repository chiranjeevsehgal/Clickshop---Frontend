import { Component, OnInit } from '@angular/core';
import { ProductServiceService } from '../../../services/productService/product-service.service';
import { Product } from '../../../models/Product';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart/get-cart.service';
import { HotToastService } from '@ngxpert/hot-toast';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: false,
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  loading: boolean = true;
  searchTerm: string = '';
  categories: string[] = [];
  selectedCategory: string = 'All';
  
  constructor(
    private productService: ProductServiceService,
    private cartService: CartService,
    private router: Router,
    private toast:HotToastService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAllProducts().subscribe({
      next: (data) => {
        this.products = data;
        // Extract unique categories
        const uniqueCategories = new Set<string>();
        this.products.forEach(product => {
          if (product.category) {
            uniqueCategories.add(product.category);
          }
        });
        this.categories = Array.from(uniqueCategories);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching products:', error);
        this.loading = false;
      }
    });
  }

  get filteredProducts(): Product[] {
    return this.products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
                           product.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = this.selectedCategory === 'All' || product.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  addToCart(product: Product): void {
    this.productService.addToCart(product).pipe(
      this.toast.observe({
        loading: 'Adding to cart...',
        success: (res) => res.message || 'Product added to cart successfully!',
        error: 'Failed to add product to cart. Please try again.'
      }),
      catchError((error) => {
        console.error('Error adding to cart:', error);
        return of(error);
      })
    ).subscribe({
      next: (res) => {
        this.cartService.refreshCartCount();
      },
      
      error: () => {} // Empty error handler since toast handles it
    });
  }

  placeholderProduct: string = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5YNRPU4910yPsW1yobc1J7of1kMM-pww1Qf5lkpKePvG1-3GeRFJPh0U9w0FLoeojueyp4HtPxcqWkGJOudVgEv3tpEnJQM9-Ia-eemENMJTFpTFm6WeZiiB2nBRDIwl9PeRGvsjEJTI/s1600/placeholder-image.jpg'

  viewProductDetails(productId: number): void {
    this.router.navigate(['/product', productId]);
  }
}