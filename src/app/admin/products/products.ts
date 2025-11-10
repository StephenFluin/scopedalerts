import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
  linkedSignal,
  computed,
  effect,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  form,
  required,
  minLength,
  maxLength,
  submit,
  Field,
  schema,
} from '@angular/forms/signals';
import { ProductService } from '../../services/product.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { Product } from '../../models/product';
import { ValidationErrorsComponent } from '../../components/validation-errors';
import { validateSlugPattern, generateSlug } from '../../utils';

// Interfaces for Signal Forms
interface ProductFormData {
  name: string;
  slug: string;
  description: string;
}

// Product form schema
const productSchema = schema<ProductFormData>((path) => {
  required(path.name, { message: 'Product name is required' });
  minLength(path.name, 2, { message: 'Product name must be at least 2 characters' });
  maxLength(path.name, 100, { message: 'Product name must be no more than 100 characters' });

  required(path.slug, { message: 'URL slug is required' });
  minLength(path.slug, 2, { message: 'URL slug must be at least 2 characters' });
  maxLength(path.slug, 50, { message: 'URL slug must be no more than 50 characters' });
  validateSlugPattern(path.slug);

  required(path.description, { message: 'Description is required' });
  minLength(path.description, 10, { message: 'Description must be at least 10 characters' });
  maxLength(path.description, 500, { message: 'Description must be no more than 500 characters' });
});

@Component({
  selector: 'app-admin-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products.html',
  styles: `
    // Component-specific styles only
    .product-form {
      display: grid;
      gap: var(--spacing-xl);
    }
  `,
  imports: [RouterLink, Field, ValidationErrorsComponent],
})
export class AdminProductsComponent implements OnInit {
  protected readonly productService = inject(ProductService);
  protected readonly userService = inject(UserService);
  protected readonly toastService = inject(ToastService);

  protected readonly isSubmitting = signal(false);
  protected readonly editingProduct = signal<Product | null>(null);
  protected readonly showDeleteConfirm = signal(false);
  protected readonly productToDelete = signal<Product | null>(null);

  // Signal Forms setup
  protected addProductData = linkedSignal<ProductFormData>(() => ({
    name: '',
    slug: '',
    description: '',
  }));

  protected editProductData = linkedSignal<ProductFormData>(() => ({
    name: '',
    slug: '',
    description: '',
  }));

  protected addProductForm = form(this.addProductData, productSchema);
  protected editProductForm = form(this.editProductData, productSchema);

  constructor() {
    // Auto-generate slug from name for add form
    effect(() => {
      const name = this.addProductForm.name().value();
      if (name) {
        const slug = generateSlug(name);
        const currentSlug = this.addProductData().slug;
        // Only update if the slug is actually different to prevent infinite loops
        if (slug !== currentSlug) {
          this.addProductData.update((data: ProductFormData) => ({ ...data, slug }));
        }
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.userService.ensureAuthInitialized();

    if (this.userService.isAdmin()) {
      this.loadProducts();
    }
  }

  private async loadProducts(): Promise<void> {
    try {
      await this.productService.loadProducts();
    } catch (error) {
      console.error('Error loading products:', error);
      this.toastService.error('Failed to load products');
    }
  }

  protected async addProduct(event: Event): Promise<void> {
    event.preventDefault();

    this.isSubmitting.set(true);

    submit(this.addProductForm, async (form) => {
      try {
        const formValue = form().value();

        // Check if slug is unique
        const existingProduct = await this.productService.getProductBySlug(formValue.slug);
        if (existingProduct) {
          this.isSubmitting.set(false);
          return {
            kind: 'duplicate_slug',
            message: 'This URL slug is already in use',
          };
        }

        await this.productService.createProduct({
          name: formValue.name,
          slug: formValue.slug,
          description: formValue.description,
        });

        // Reset form
        this.addProductData.update(() => ({
          name: '',
          slug: '',
          description: '',
        }));

        this.toastService.success('Product created successfully');
        return null; // No error
      } catch (error) {
        console.error('Error creating product:', error);
        this.toastService.error('Failed to create product');
        return {
          kind: 'processing_error',
          message: 'Failed to create product. Please try again.',
        };
      } finally {
        this.isSubmitting.set(false);
      }
    });
  }

  protected startEdit(product: Product): void {
    this.editingProduct.set(product);
    this.editProductData.update(() => ({
      name: product.name,
      slug: product.slug,
      description: product.description,
    }));
  }

  protected cancelEdit(): void {
    this.editingProduct.set(null);
    this.editProductData.update(() => ({
      name: '',
      slug: '',
      description: '',
    }));
  }

  protected async saveEdit(event: Event): Promise<void> {
    event.preventDefault();
    const product = this.editingProduct();
    if (!product) return;

    this.isSubmitting.set(true);

    submit(this.editProductForm, async (form) => {
      try {
        const formValue = form().value();

        // Check if slug is unique (excluding current product)
        if (formValue.slug !== product.slug) {
          const existingProduct = await this.productService.getProductBySlug(formValue.slug);
          if (existingProduct && existingProduct.id !== product.id) {
            this.isSubmitting.set(false);
            return {
              kind: 'duplicate_slug',
              message: 'This URL slug is already in use',
            };
          }
        }

        await this.productService.updateProduct(product.id, {
          name: formValue.name,
          slug: formValue.slug,
          description: formValue.description,
        });

        this.cancelEdit();
        this.toastService.success('Product updated successfully');
        return null; // No error
      } catch (error) {
        console.error('Error updating product:', error);
        this.toastService.error('Failed to update product');
        return {
          kind: 'processing_error',
          message: 'Failed to update product. Please try again.',
        };
      } finally {
        this.isSubmitting.set(false);
      }
    });
  }

  protected confirmDelete(product: Product): void {
    this.productToDelete.set(product);
    this.showDeleteConfirm.set(true);
  }

  protected cancelDelete(): void {
    this.productToDelete.set(null);
    this.showDeleteConfirm.set(false);
  }

  protected async deleteProduct(): Promise<void> {
    const product = this.productToDelete();
    if (!product) return;

    this.isSubmitting.set(true);

    try {
      const success = await this.productService.deleteProduct(product.id);
      if (success) {
        this.toastService.success('Product deleted successfully');
      } else {
        this.toastService.error('Failed to delete product');
      }
      this.cancelDelete();
    } catch (error) {
      console.error('Error deleting product:', error);
      this.toastService.error('Failed to delete product');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
