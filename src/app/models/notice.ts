export interface Notice {
  id: string;
  title: string;
  description: string;
  datetime: string; // ISO string in UTC
  slug: string;
  affectedProducts: string[]; // Array of product IDs
  createdAt: Date;
  updatedAt: Date;
}
