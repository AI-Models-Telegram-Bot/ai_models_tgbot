export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  priceRUB: number;
  priceStars: number;
  discountPercent: number;
  isPopular: boolean;
  sortOrder: number;
  description: string | null;
}

export interface TokenPackagesResponse {
  packages: TokenPackage[];
}
