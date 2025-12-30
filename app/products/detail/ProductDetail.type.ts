import { Product as BaseProduct } from "../Product.type";

export interface ProductVariant {
  code: string;
  stockInformation: string;
  maxQuantity: number;
  attributes: ProductAttribute[];
  price: ProductPrice;
  media?: {
    mainImageUrl: string;
    mainImageAltText: string;
  };
}

export interface ProductAttribute {
  name: string;
  values: string[];
  colorConfiguration?: ColorConfiguration[];
  shortName: string | null;
}

export interface ColorConfiguration {
  colorCode: string;
  backgroundColor: string;
}

export interface ProductPrice {
  currencySymbol: string;
  listPrice: number;
  salePrice: number | null;
}

export interface FacetFilter {
  displayName: string;
  attribute: string;
  attributeLevel: string;
  selectorControlType: string;
  options: ProductAttribute[];
  dependOnAttributes: string[];
}

export interface ProductDetail extends BaseProduct {
  variants: ProductVariant[];
  facetFilters: FacetFilter[];
}

export interface ProductDetailResponse extends Record<string, unknown> {
  product: ProductDetail;
}

