export type Locale = "sr" | "en";

export interface Treatment {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  benefits: string[];
  duration: string;
  process: string;
  icon: string;
  relatedSlugs: string[];
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
}

export interface Testimonial {
  name: string;
  role: string;
  content: string;
  image?: string;
}

export interface Author {
  _id: string;
  name: string;
  role?: string;
  image?: string;
  bio?: string;
}

export interface BlogCategory {
  _id: string;
  title: string;
  slug: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  body?: unknown[];
  mainImage?: string;
  publishedAt: string;
  readingTime: number;
  language: string;
  author?: Author;
  categories?: BlogCategory[];
  relatedPosts?: BlogPost[];
}

export interface ProductCategory {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  price: number;
  compareAtPrice?: number;
  category?: ProductCategory;
  stock: number;
  featured: boolean;
  active: boolean;
  type?: "physical" | "pdf";
  oftenBoughtWith?: string[];
}

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  shippingCost: number;
  customer: CustomerInfo;
  paymentMethod: "card" | "cod";
  raiAcceptOrderId?: string;
  status: string;
  createdAt: string;
}
