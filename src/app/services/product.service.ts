import { Injectable, signal, PLATFORM_ID, inject, PendingTasks } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product } from '../models/product';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private products = signal<Product[]>([]);
  private isLoading = signal(false);
  private platformId = inject(PLATFORM_ID);
  private firebaseService = inject(FirebaseService);
  private pendingTasks = inject(PendingTasks);

  readonly allProducts = this.products.asReadonly();
  readonly loading = this.isLoading.asReadonly();

  constructor() {
    this.loadProducts();
  }

  async loadProducts(): Promise<Product[]> {
    // Add a pending task to ensure SSR waits for this operation
    const taskCleanup = this.pendingTasks.add();
    this.isLoading.set(true);

    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const databaseMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && databaseMethods) {
        const { ref, get } = databaseMethods;
        const productsRef = ref(firebaseDatabase, 'products');
        const snapshot = await get(productsRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const products = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          this.products.set(products);
          return products;
        }
      }
    } catch (error) {
    } finally {
      this.isLoading.set(false);
      taskCleanup();
    }
    return [];
  }
  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const databaseMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && databaseMethods) {
        const { ref, query, orderByChild, equalTo, get } = databaseMethods;
        const productsRef = ref(firebaseDatabase, 'products');
        const queryRef = query(productsRef, orderByChild('slug'), equalTo(slug));
        const snapshot = await get(queryRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const key = Object.keys(data)[0];
          return { id: key, ...data[key] };
        }
        return null;
      }

      const products = this.products();
      return products.find((p) => p.slug === slug) || null;
    } catch (error) {
      console.error('Error getting product by slug:', error);
      return null;
    }
  }

  getProductsByIds(ids: string[]): Product[] {
    const products = this.products();
    return products.filter((product) => ids.includes(product.id));
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const databaseMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && databaseMethods) {
        const { ref, push } = databaseMethods;
        const productsRef = ref(firebaseDatabase, 'products');
        const result = await push(productsRef, product);
        const newProduct = { id: result.key!, ...product };

        // Update local state
        this.products.update((products) => [...products, newProduct]);
        return newProduct;
      }

      const newProduct: Product = {
        ...product,
        id: Math.random().toString(36).substr(2, 9),
      };

      this.products.update((products) => [...products, newProduct]);
      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const databaseMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && databaseMethods) {
        const { ref, update, get } = databaseMethods;
        const productRef = ref(firebaseDatabase, `products/${id}`);
        const snapshot = await get(productRef);

        if (!snapshot.exists()) {
          throw new Error('Product not found');
        }

        await update(productRef, updates);
        const updatedSnapshot = await get(productRef);
        const updatedProduct = { id, ...updatedSnapshot.val() };

        // Update local state
        this.products.update((products) => {
          const index = products.findIndex((p) => p.id === id);
          if (index !== -1) {
            const newProducts = [...products];
            newProducts[index] = updatedProduct;
            return newProducts;
          }
          return products;
        });

        return updatedProduct;
      }

      const products = this.products();
      const index = products.findIndex((p) => p.id === id);

      if (index === -1) {
        return null;
      }

      const updatedProduct: Product = {
        ...products[index],
        ...updates,
      };

      this.products.update((products) => {
        const newProducts = [...products];
        newProducts[index] = updatedProduct;
        return newProducts;
      });

      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const databaseMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && databaseMethods) {
        const { ref, remove } = databaseMethods;
        const productRef = ref(firebaseDatabase, `products/${id}`);
        await remove(productRef);

        // Update local state
        this.products.update((products) => products.filter((p) => p.id !== id));
        return true;
      }

      this.products.update((products) => products.filter((p) => p.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }
}
