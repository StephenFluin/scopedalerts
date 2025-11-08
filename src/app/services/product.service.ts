import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private products = signal<Product[]>([]);
  private isLoading = signal(false);

  readonly allProducts = this.products.asReadonly();
  readonly loading = this.isLoading.asReadonly();

  constructor() {
    // TODO: Initialize Firebase Realtime Database connection
    this.loadMockData();
  }

  async loadProducts(): Promise<Product[]> {
    this.isLoading.set(true);
    try {
      // TODO: Implement Firebase database query
      // For now, return mock data
      const mockProducts = this.getMockProducts();
      this.products.set(mockProducts);
      return mockProducts;
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      // TODO: Query Firebase by slug
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

  private loadMockData(): void {
    const mockProducts = this.getMockProducts();
    this.products.set(mockProducts);
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
