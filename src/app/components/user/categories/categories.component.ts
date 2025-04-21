import { Component, OnInit } from '@angular/core';
import { Product } from '../../../models/Product';
import { ProductServiceService } from '../../../services/productService/product-service.service';
import { WishlistService } from '../../../services/user/wishlist.service';
import { CartService } from '../../../services/cart/get-cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-categories',
  standalone: false,
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit{
  categories: string[] = [];
  products: Product[] = [];
  isLoading: boolean = true;
  isProductsLoading: boolean = false;
  errorMessage: string = '';
  selectedCategory: string = '';
  placeholderImage: string = 'assets/images/placeholder-product.jpg';
  
  // Category images mapping
  categoryImages: { [key: string]: string } = {
    'Beauty': 'https://plus.unsplash.com/premium_photo-1661546624213-3419edd32f7b?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Electronics': 'https://plus.unsplash.com/premium_photo-1726754457459-d2dfa2e3a434?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Fashion': 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Kitchen': 'https://plus.unsplash.com/premium_photo-1680382578857-c331ead9ed51?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Books': 'https://images.unsplash.com/photo-1638443436690-db587cc66f12?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Stationery': 'https://images.unsplash.com/photo-1568871391149-449702439177?q=80&w=2116&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Home': 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Furniture': 'https://plus.unsplash.com/premium_photo-1681487364294-7da48881288f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Footwear': 'https://plus.unsplash.com/premium_photo-1665664652418-91f260a84842?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    // 'Toys': 'assets/images/categories/toys.jpg',
  };

  constructor(
    private productService: ProductServiceService,
    private wishlistService: WishlistService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * Load all available product categories
   */
  loadCategories(): void {
    this.isLoading = true;
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loadFeaturedProducts();
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

  /**
   * Get image for a specific category
   */
  getCategoryImage(category: string): string {
    return this.categoryImages[category] || 'assets/images/categories/default.jpg';
  }

  /**
   * Handle category selection
   */
  selectCategory(category: string): void {
    this.router.navigate(['/products'], { queryParams: { category: category } });
  }

  /**
   * Check if product is in wishlist
   */
  isInWishlist(productId: number): boolean {
    return true
  }

  /**
   * Toggle product in wishlist
   */
  toggleWishlist(event: Event, product: Product): void {
    
  }

  /**
   * Add product to cart
   */
  addToCart(event: Event, product: Product): void {
    event.stopPropagation();
    this.productService.addToCart(product);
  }

}
