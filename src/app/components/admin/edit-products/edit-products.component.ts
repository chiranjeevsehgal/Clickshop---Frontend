import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminServiceService } from '../../../services/admin/admin-service.service';

@Component({
  selector: 'app-edit-products',
  standalone: false,
  templateUrl: './edit-products.component.html',
  styleUrl: './edit-products.component.css'
})
export class EditProductsComponent {
  productId: number = 0;
  isNewProduct: boolean = true;
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  productForm: FormGroup;
  categories: string[] = ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports', 'Toys', 'Beauty', 'Health'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminServiceService
  ) {
    // Initialize form with empty values and validators
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      imageUrl: ['']
    });
  }

  ngOnInit(): void {
    // Check if we're editing an existing product or creating a new one
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.productId = +params['id'];
        this.isNewProduct = false;
        this.loadProduct();
      } else {
        this.isNewProduct = true;
      }
    });

    // Load available categories (optional, could come from API)
    this.loadCategories();
  }

  loadProduct(): void {
    this.isLoading = true;
    this.adminService.getProductById(this.productId).subscribe({
      next: (product) => {
        // Populate form with existing product data
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.category,
          imageUrl: product.imageUrl
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.errorMessage = 'Failed to load product. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadCategories(): void {
    // This could fetch categories from the backend
    // For now, we're using a static list
    // If you want to fetch from API, uncomment and adjust the following:
    /*
    this.adminService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
    */
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.productForm.controls).forEach(key => {
        this.productForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const productData = this.productForm.value;

    if (this.isNewProduct) {
      // Create new product
      this.adminService.addProduct(productData).subscribe({
        next: (response) => {
          this.successMessage = 'Product added successfully!';
          this.isSubmitting = false;
          
          // Navigate to product list after a short delay
          setTimeout(() => {
            this.router.navigate(['/admin/viewproducts']);
          }, 1500);
        },
        error: (error) => {
          console.error('Error adding product:', error);
          this.errorMessage = error.error || 'Failed to add product. Please try again.';
          this.isSubmitting = false;
        }
      });
    } else {
      // Update existing product
      this.adminService.updateProduct(this.productId, productData).subscribe({
        next: (response) => {
          this.successMessage = 'Product updated successfully!';
          this.isSubmitting = false;
          
          // Optionally navigate back to product list after a short delay
          setTimeout(() => {
            this.router.navigate(['/admin/viewproducts']);
          }, 1500);
        },
        error: (error) => {
          console.error('Error updating product:', error);
          this.errorMessage = error.error || 'Failed to update product. Please try again.';
          this.isSubmitting = false;
        }
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  goBack(): void {
    this.router.navigate(['/admin/viewproducts']);
  }
}
