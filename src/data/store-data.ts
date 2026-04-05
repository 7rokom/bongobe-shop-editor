export interface VariationPrice {
  variationType: 'color' | 'size' | 'weight';
  variationName: string;
  price?: number;
}

export interface ProductReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  images?: string[];
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  originalPrice?: number;
  buyPrice?: number;
  resellerPrice?: number;
  images: string[];
  featuredImage?: string;
  featuredVideo?: string;
  category: string;
  colors?: string[];
  sizes?: string[];
  weights?: string[];
  variationPrices?: VariationPrice[];
  variations?: { name: string; options: string[] }[];
  metaDescription?: string;
  metaKeywords?: string;
  stockType?: 'self' | 'vendor';
  stockProductName?: string;
  status?: 'published' | 'draft';
  inStock: boolean;
  rating: number;
  reviewCount: number;
  reviews?: ProductReview[];
  freeDelivery?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  productCount: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  galleryImages?: string[];
  date: string;
  author: string;
  category: string;
  type: 'post' | 'page';
  status: 'published' | 'draft';
  metaDescription?: string;
  metaKeywords?: string;
}
