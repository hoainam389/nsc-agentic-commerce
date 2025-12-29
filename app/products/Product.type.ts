export interface Product {
  displayName: string;
  url: string;
  imageUrl: string | null;
  price: string;
  specialPrice: string;
  description: string | null;
  tagLine: string | null;
  tagStory: string | null;
}

export interface ProductListProps extends Record<string, unknown> {
  query: string;
  totalCount: number;
  items: Product[];
}
