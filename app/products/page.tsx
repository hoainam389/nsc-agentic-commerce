"use client";

import { useWidgetProps } from "@/app/hooks";
import { Product, ProductListProps } from "./Product.type";

export default function ProductsPage() {
  const baseURL = process.env.NEXT_PUBLIC_NSC_API_BASE_URL;
  const searchResult = useWidgetProps<ProductListProps>();
  const products = searchResult?.items?.slice(0, 6);
  const query = searchResult?.query;
  const isLoading = searchResult === null || searchResult === undefined;
  return (
    <div className="font-sans p-8 pb-20 sm:p-20 max-w-6xl mx-auto">
      <main>
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 animate-pulse">Loading...</p>
          </div>
        ) : !products || products.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-500">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
            {products.map((product: Product, index: number) => (
              <div
                key={`${product.displayName}-${index}`}
                className="flex flex-col border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-950"
              >
                <div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-900">
                  {product.imageUrl ? (
                    <img
                      src={
                        product.imageUrl.startsWith("http")
                          ? product.imageUrl
                          : `${baseURL}${product.imageUrl}`
                      }
                      alt={product.displayName}
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] mb-2">
                    {product.displayName}
                  </h3>
                  {product.tagLine && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 line-clamp-1">
                      {product.tagLine}
                    </p>
                  )}
                  <div className="mt-auto pt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold">
                      {product.specialPrice || product.price}
                    </span>
                    {product.specialPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {product.price}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

