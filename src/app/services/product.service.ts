import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private products = signal<Product[]>([]);
  private isLoading = signal(false);
  private platformId = inject(PLATFORM_ID);
  private firebaseDatabase: any = null;

  readonly allProducts = this.products.asReadonly();
  readonly loading = this.isLoading.asReadonly();

  constructor() {
    this.initializeFirebase().then(() => {
      this.loadProducts();
    });
  }

  private async initializeFirebase(): Promise<void> {
    try {
      if (isPlatformBrowser(this.platformId)) {
        const { initializeApp } = await import('firebase/app');
        const { getDatabase } = await import('firebase/database');
        const { firebaseConfig } = await import('../config/firebase.config');

        const app = initializeApp(firebaseConfig);
        this.firebaseDatabase = getDatabase(app);
      }
    } catch (error) {
      console.warn('Firebase Database not available, using mock data:', error);
    }
  }

  async loadProducts(): Promise<Product[]> {
    this.isLoading.set(true);
    try {
      if (this.firebaseDatabase) {
        const { ref, get } = await import('firebase/database');
        const productsRef = ref(this.firebaseDatabase, 'products');
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

      const mockProducts = this.getMockProducts();
      this.products.set(mockProducts);
      return mockProducts;
    } catch (error) {
      console.error('Error loading products:', error);
      const mockProducts = this.getMockProducts();
      this.products.set(mockProducts);
      return mockProducts;
    } finally {
      this.isLoading.set(false);
    }
  }
  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      if (this.firebaseDatabase) {
        const { ref, query, orderByChild, equalTo, get } = await import('firebase/database');
        const productsRef = ref(this.firebaseDatabase, 'products');
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
      if (this.firebaseDatabase) {
        const { ref, push } = await import('firebase/database');
        const productsRef = ref(this.firebaseDatabase, 'products');
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
      if (this.firebaseDatabase) {
        const { ref, update, get } = await import('firebase/database');
        const productRef = ref(this.firebaseDatabase, `products/${id}`);
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
      if (this.firebaseDatabase) {
        const { ref, remove } = await import('firebase/database');
        const productRef = ref(this.firebaseDatabase, `products/${id}`);
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
  private getMockProducts(): Product[] {
    return [
      {
        id: 'blanket-eol',
        name: 'Blanket EOL',
        description: 'End-of-life management system for blanket products',
        slug: 'blanket-eol',
      },
      {
        id: 'eolds',
        name: 'EOLDs',
        description: 'Enterprise Operations and Logistics Data System',
        slug: 'eolds',
      },
      {
        id: 'portal',
        name: 'Portal',
        description: 'Main customer portal and dashboard system',
        slug: 'portal',
      },
    ];
  }
}
