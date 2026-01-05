"use client";

import { useWidgetProps } from "@/app/hooks";
import { Product, ProductListProps } from "./Product.type";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { searchProducts } from "@/lib/api-service";

function ProductsListContent() {
  const baseURL = process.env.NEXT_PUBLIC_NSC_API_BASE_URL;
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("query");

  const responseFromProps = useWidgetProps<ProductListProps>();
  const sessionId = responseFromProps?.sessionId;
  const [manualSearchResponse, setManualSearchResponse] = useState<ProductListProps | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const fetchProductsManually = async () => {
      // If we have a queryParam, we always fetch from API
      // We only skip if the manual response already contains data for the correct query
      if (queryParam && !isFetching && manualSearchResponse?.query !== queryParam) {
        setIsFetching(true);
        try {
          const data = await searchProducts(queryParam);
          setManualSearchResponse(data);
        } catch (error) {
          console.error("Failed to fetch products manually:", error);
        } finally {
          setIsFetching(false);
        }
      }
    };

    fetchProductsManually();
  }, [queryParam, isFetching, manualSearchResponse?.query]);

  const searchResult = queryParam ? manualSearchResponse : (responseFromProps?.items ? responseFromProps : null);
  const products = searchResult?.items?.slice(0, 6);
  const isLoading = !searchResult && (isFetching || !!queryParam || responseFromProps === null || responseFromProps === undefined);

  return (
    <div className="font-sans p-5 max-w-6xl mx-auto">
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
                className="flex flex-col border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-950 group"
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
                      className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                    {product.displayName}
                  </h3>
                  {product.tagLine && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 line-clamp-1">
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
                  <Link
                    href={`/products/detail?productName=${encodeURIComponent(product.displayName)}${sessionId ? `&sessionId=${sessionId}` : ""}${queryParam ? `&backQuery=${encodeURIComponent(queryParam)}` : ""}`}
                    prefetch={false}
                    className="mt-2 w-full rounded-full border border-slate-200 dark:border-slate-800 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense 
      fallback={
        <div className="font-sans p-5 max-w-6xl mx-auto">
          <main>
            <div className="text-center py-12">
              <p className="text-gray-500 animate-pulse">Loading...</p>
            </div>
          </main>
        </div>
      }
    >
      <ProductsListContent />
    </Suspense>
  );
}

