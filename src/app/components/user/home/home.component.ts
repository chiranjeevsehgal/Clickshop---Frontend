import { Component, OnInit } from '@angular/core';
import { Product } from '../../../models/Product';
import { ProductServiceService } from '../../../services/productService/product-service.service';
import { WishlistService } from '../../../services/user/wishlist.service';
import { CartService } from '../../../services/cart/get-cart.service';
import { NavigationStart, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { HotToastService } from '@ngxpert/hot-toast';
import { AuthService } from '../../../services/authService/auth.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  categories: string[] = [];
  products: Product[] = [];
  recentProducts: Product[] = [];
  isLoading: boolean = true;
  wishlistProductIds: Set<number> = new Set();
  isProductsLoading: boolean = false;
  errorMessage: string = '';
  selectedCategory: string = '';
  placeholderImage: string = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5YNRPU4910yPsW1yobc1J7of1kMM-pww1Qf5lkpKePvG1-3GeRFJPh0U9w0FLoeojueyp4HtPxcqWkGJOudVgEv3tpEnJQM9-Ia-eemENMJTFpTFm6WeZiiB2nBRDIwl9PeRGvsjEJTI/s1600/placeholder-image.jpg'

  constructor(
    private productService: ProductServiceService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private toast: HotToastService,
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        window.scrollTo(0, 0);
      }
    });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadWishlist();
    }
    this.loadCategories();
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

  loadCategories(): void {
    this.isLoading = true;
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loadFeaturedProducts();
        this.loadRecentProducts();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.errorMessage = 'Failed to load categories. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  loadFeaturedProducts(): void {
    this.isProductsLoading = true;
    this.productService.getPopularProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.isProductsLoading = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isProductsLoading = false;
        this.isLoading = false;
      }
    });
  }

  loadRecentProducts(): void {
    this.isLoading = true;

    this.productService.getRecentProducts().subscribe({
      next: (products) => {
        console.log(this.products);
        this.recentProducts = products;
        this.isLoading = false;
        console.log(this.recentProducts);

      },
      error: (error) => {
        console.error('Error loading recent products:', error);
        this.errorMessage = 'Failed to load recent products. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  viewProductDetails(productId: number): void {
    this.router.navigate(['/product', productId]).then(() => {
      window.scrollTo(0, 0);
    });
    ;
  }

  selectCategory(category: string): void {
    this.router.navigate(['/products'], { queryParams: { category: category } });
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistProductIds.has(productId);
  }

  addToWishlist(productId: number): void {
    if (!this.authService.isLoggedIn()) {
      this.toast.info("Please login to add items to wishlist!")
      return
    }

    this.wishlistService.addToWishlist(productId).subscribe(
      () => {
        this.wishlistProductIds.add(productId);
        this.toast.success('Product added to wishlist');
      },
      error => {
        console.error('Error adding to wishlist:', error);

        // Check if the error contains a login required message
        if (error.status === 401 || (error.error && error.error.message === 'Please login to add items to wishlist')) {
          this.toast.info('Please login to add items to wishlist');
        } else {
          this.toast.error('Failed to add product to wishlist');
        }
      }
    );
  }

  removeFromWishlist(productId: number): void {
    if (!this.authService.isLoggedIn()) {
      this.toast.info("Please login to add items to wishlist!")
      return
    }

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

  toggleWishlist(event: Event, product: any): void {
    event.stopPropagation(); // Prevent event bubbling
    if (!this.authService.isLoggedIn()) {
      this.toast.info("Please login to use wishlist features!")
      return
    }

    if (this.isInWishlist(product.id)) {
      this.removeFromWishlist(product.id);
    } else {
      this.addToWishlist(product.id);
    }
  }

  addToCart(product: Product): void {
    if (!this.authService.isLoggedIn()) {
      this.toast.info("Please login to add items to cart!")
      return
    }

    this.productService.addToCart(product).pipe(
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
      error: () => { }
    });
  }

}
