import { Component, OnInit } from '@angular/core';
import { ProductServiceService } from '../../../services/productService/product-service.service';
import { Product } from '../../../models/Product';
import { ActivatedRoute, Router } from '@angular/router';
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
  filteredProduct: Product[] = [];
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
    private toast: HotToastService,
    private route: ActivatedRoute,

  ) { }

  ngOnInit(): void {
    this.loadProducts();
    this.loadWishlist()

    // Check for category parameter in URL
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategory = params['category'];
        this.loadProductsByCategory(this.selectedCategory);
      } else {
        this.loadProducts();
      }

      if (params['search']) {
        this.searchTerm = params['search'];
        this.filteredProducts;
      }
    });
  }

  loadProductsByCategory(category: string): void {
    this.loading = true;
    this.selectedCategory = category;

    // Update URL with the selected category
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category !== 'All' ? category : null },
      queryParamsHandling: 'merge'
    });

    if (category === 'All') {
      this.loadProducts();
      return;
    }

    this.productService.getProductsByCategory(category).subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProduct = [...products];
        this.loading = false;
      },
      error: (error) => {
        console.error(`Error loading products for category ${category}:`, error);
        this.loading = false;
      }
    });
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
        console.log(this.products);

      },
      error: (error) => {
        console.error('Error fetching products:', error);
        this.loading = false;
      }
    });
  }

  filterProducts(): void {
    if (!this.searchTerm.trim()) {
      this.filteredProduct = [...this.products];
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredProduct = this.products.filter(product => 
      product.name.toLowerCase().includes(term) || 
      product.description.toLowerCase().includes(term)
    );
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