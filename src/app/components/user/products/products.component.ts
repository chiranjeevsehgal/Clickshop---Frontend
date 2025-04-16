import { Component, OnInit } from '@angular/core';
import { ProductServiceService } from '../../../services/productService/product-service.service';
import { Product } from '../../../models/Product';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart/get-cart.service';
import { HotToastService } from '@ngxpert/hot-toast';
import { catchError, of } from 'rxjs';
import { WishlistService } from '../../../services/user/wishlist.service';

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
  wishlistProductIds: Set<number> = new Set();

  
  constructor(
    private productService: ProductServiceService,
    private cartService: CartService,
    private wishlistService: WishlistService,
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

  loadWishlist(): void {
    this.wishlistService.getWishlist().subscribe(
      wishlistItems => {
        // Clear the set first
        this.wishlistProductIds.clear();
        
        // Add product IDs to the set
        wishlistItems.forEach((item: { product: { id: number } }) => {
          this.wishlistProductIds.add(item.product.id);
        });
      },
      error => {
        console.error('Error fetching wishlist:', error);
      }
    );
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistProductIds.has(productId);
  }

  toggleWishlist(event: Event, product: any): void {
    event.stopPropagation(); // Prevent event bubbling


    if (this.isInWishlist(product.id)) {
      this.removeFromWishlist(product.id);
    } else {
      this.addToWishlist(product.id);
    }
  }

  addToWishlist(productId: number): void {
    this.wishlistService.addToWishlist(productId).subscribe(
      () => {
        this.wishlistProductIds.add(productId);
        this.toast.success('Product added to wishlist');
      },
      error => {
        console.error('Error adding to wishlist:', error);
        this.toast.error('Failed to add product to wishlist');
      }
    );
  }

  removeFromWishlist(productId: number): void {
    this.wishlistService.removeFromWishlist(productId).subscribe(
      () => {
        this.wishlistProductIds.delete(productId);
        this.toast.success('Product removed from wishlist');
      },
      error => {
        console.error('Error removing from wishlist:', error);
        this.toast.error('Failed to remove product from wishlist');
      }
    );
  }


  placeholderProduct: string = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5YNRPU4910yPsW1yobc1J7of1kMM-pww1Qf5lkpKePvG1-3GeRFJPh0U9w0FLoeojueyp4HtPxcqWkGJOudVgEv3tpEnJQM9-Ia-eemENMJTFpTFm6WeZiiB2nBRDIwl9PeRGvsjEJTI/s1600/placeholder-image.jpg'

  viewProductDetails(productId: number): void {
    this.router.navigate(['/product', productId]);
  }
}