"use client";

import { useWidgetProps, useCallTool } from "@/app/hooks";
import { ProductDetailResponse } from "./ProductDetail.type";
import Link from "next/link";
import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { addToCart, getProductDetail } from "@/lib/api-service";

function ProductDetailContent() {
  const baseURL = process.env.NEXT_PUBLIC_NSC_API_BASE_URL;
  const searchParams = useSearchParams();
  const productNameParam = searchParams.get("productName");
  const backQuery = searchParams.get("backQuery");
  
  const responseFromProps = useWidgetProps<ProductDetailResponse>();
  const sessionId = searchParams.get("sessionId") || responseFromProps?.sessionId;
  const [manualProductResponse, setManualProductResponse] = useState<ProductDetailResponse | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const callTool = useCallTool();
  const router = useRouter();

  const response = productNameParam
    ? manualProductResponse
    : (responseFromProps?.product ? responseFromProps : null);
  const product = response?.product;

  useEffect(() => {
    const fetchProductManually = async () => {
      // If we have a productNameParam, we always fetch from API
      // We only skip if the manual response already contains the correct product
      if (productNameParam && !isFetching && manualProductResponse?.product?.displayName !== productNameParam) {
        setIsFetching(true);
        try {
          const data = await getProductDetail(productNameParam);
          setManualProductResponse(data);
        } catch (error) {
          console.error("Failed to fetch product manually:", error);
        } finally {
          setIsFetching(false);
        }
      }
    };

    fetchProductManually();
  }, [productNameParam, isFetching, manualProductResponse?.product?.displayName]);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const isLoading = !product && (isFetching || !!productNameParam);

  // Extract available options from facetFilters
  const facetFilters = product?.facetFilters || [];
  const variants = product?.variants || [];

  const sizeFilter = facetFilters.find(
    (filter) => filter.attribute === "Product Size",
  );
  const colorFilter = facetFilters.find(
    (filter) => filter.attribute === "Color",
  );
  const packageFilter = facetFilters.find(
    (filter) => filter.attribute === "Package Size",
  );

  // ... (rest of the logic remains same, just inside this function)

  // Create a mapping of full size names to short names from variants
  const sizeMapping = useMemo(() => {
    const mapping = new Map<string, string>();

    variants.forEach(variant => {
      const productSizeAttr = variant.attributes.find(attr => attr.name === "Product Size");
      if (productSizeAttr && productSizeAttr.values.length > 0) {
        const fullSizeName = productSizeAttr.values[0];
        const shortName = productSizeAttr.shortName;

        if (shortName && !mapping.has(fullSizeName)) {
          mapping.set(fullSizeName, shortName);
        }
      }
    });

    return mapping;
  }, [variants]);

  const availableSizes = useMemo(() => {
    if (!sizeFilter?.options[0]?.values) return [];

    return sizeFilter.options[0].values.map((size) => {
      // Use the mapping from variants, or fallback to the facetFilter shortName
      let shortName = sizeMapping.get(size) || sizeFilter.options[0].shortName;

      if (!shortName) {
        // Fallback: use the full name
        shortName = size;
      }

      // Additional mapping for specific size names
      if (shortName === "Medium") {
        shortName = "M";
      }

      return { label: shortName, value: size };
    });
  }, [sizeFilter, sizeMapping]);

  const availableColors = useMemo(() => {
    // Get all available colors from all variants with their configurations
    const colorMap = new Map<string, any>();

    variants.forEach(variant => {
      const colorAttr = variant.attributes.find(attr => attr.name === "Color");
      if (colorAttr?.values?.[0] && !colorMap.has(colorAttr.values[0])) {
        const color = colorAttr.values[0];
        const config = colorAttr.colorConfiguration?.[0];

        colorMap.set(color, {
          label: color,
          value: color,
          backgroundColor: config?.backgroundColor || "#FFFFFF",
          // Special handling for Tie-Dye color
          isTieDye: color === "Tie-Dye",
        });
      }
    });

    return Array.from(colorMap.values());
  }, [variants]);

  // Check if color facet exists and should be shown
  const showColorSection = colorFilter && availableColors.length > 0;

  const availablePackages = useMemo(() => {
    // Get ALL package sizes from ALL variants
    const allPackageSet = new Set<string>();

    variants.forEach(variant => {
      const packageAttr = variant.attributes.find(attr => attr.name === "Package Size");
      if (packageAttr?.values?.[0]) {
        allPackageSet.add(packageAttr.values[0]);
      }
    });

    return Array.from(allPackageSet).map((pkg) => {
      // Find the best variant for this package based on current selections
      let packageVariant = null;

      if (selectedSize && selectedColor) {
        // Find exact match for size + color + package
        packageVariant = variants.find((variant) => {
          const sizeMatch = variant.attributes.some(
            (attr) =>
              attr.name === "Product Size" &&
              attr.values.includes(selectedSize),
          );
          const colorMatch = variant.attributes.some(
            (attr) =>
              attr.name === "Color" &&
              attr.values.includes(selectedColor),
          );
          const packageMatch = variant.attributes.some(
            (attr) => attr.name === "Package Size" && attr.values.includes(pkg),
          );

          return sizeMatch && colorMatch && packageMatch;
        });
      } else if (selectedSize) {
        // Find any variant with this size and package (for pricing display)
        packageVariant = variants.find((variant) => {
          const sizeMatch = variant.attributes.some(
            (attr) =>
              attr.name === "Product Size" &&
              attr.values.includes(selectedSize),
          );
          const packageMatch = variant.attributes.some(
            (attr) => attr.name === "Package Size" && attr.values.includes(pkg),
          );

          return sizeMatch && packageMatch;
        });
      } else if (selectedColor && showColorSection) {
        // Find any variant with this color and package (when no size selected)
        packageVariant = variants.find((variant) => {
          const colorMatch = variant.attributes.some(
            (attr) =>
              attr.name === "Color" &&
              attr.values.includes(selectedColor),
          );
          const packageMatch = variant.attributes.some(
            (attr) => attr.name === "Package Size" && attr.values.includes(pkg),
          );

          return colorMatch && packageMatch;
        });
      } else {
        // No selections made, find any variant with this package for display
        packageVariant = variants.find((variant) => {
          const packageMatch = variant.attributes.some(
            (attr) => attr.name === "Package Size" && attr.values.includes(pkg),
          );
          return packageMatch;
        });
      }

      return {
        label: pkg,
        value: pkg,
        variant: packageVariant,
      };
    });
  }, [variants, selectedSize, selectedColor, showColorSection]);

  // Consolidated availability checker for better performance
  const getAvailabilityStatus = useMemo(() => {
    const status = {
      hasAnyColors: false,
      hasAnyPackages: false,
      colorAvailability: new Map<string, boolean>(),
      packageAvailability: new Map<string, boolean>()
    };

    // Create a lookup map for faster variant checking
    const variantLookup = new Map<string, Set<string>>();

    variants.forEach(variant => {
      const sizeAttr = variant.attributes.find(attr => attr.name === "Product Size");
      const colorAttr = variant.attributes.find(attr => attr.name === "Color");
      const packageAttr = variant.attributes.find(attr => attr.name === "Package Size");

      if (packageAttr?.values) {
        const pkg = packageAttr.values[0];

        if (showColorSection && colorAttr?.values) {
          if (sizeAttr?.values) {
            // With color section and size: use size|color key
            const size = sizeAttr.values[0];
            const color = colorAttr.values[0];
            const key = `${size}|${color}`;
            if (!variantLookup.has(key)) {
              variantLookup.set(key, new Set());
            }
            variantLookup.get(key)!.add(pkg);
          } else {
            // With color section but no size: use color-only key
            const color = colorAttr.values[0];
            const key = `NO_SIZE|${color}`;
            if (!variantLookup.has(key)) {
              variantLookup.set(key, new Set());
            }
            variantLookup.get(key)!.add(pkg);
          }
        } else {
          if (sizeAttr?.values) {
            // No color section: use size-only key
            const size = sizeAttr.values[0];
            const key = size;
            if (!variantLookup.has(key)) {
              variantLookup.set(key, new Set());
            }
            variantLookup.get(key)!.add(pkg);
          } else {
            // No color section and no size: use package-only key
            const key = "NO_SIZE";
            if (!variantLookup.has(key)) {
              variantLookup.set(key, new Set());
            }
            variantLookup.get(key)!.add(pkg);
          }
        }
      }
    });

    // Check color availability for selected size
    availableColors.forEach(color => {
      let isAvailable = false;

      if (selectedSize) {
        // Check if color is available for the selected size
        isAvailable = Array.from(variantLookup.keys()).some(key => {
          const [size] = key.split('|');
          return size === selectedSize && key.includes(color.value);
        });
      } else {
        // No size selected, check if color exists in any variant
        isAvailable = Array.from(variantLookup.keys()).some(key => {
          return key.includes(color.value) || key.startsWith('NO_SIZE|');
        });
      }

      status.colorAvailability.set(color.value, isAvailable);
      if (isAvailable) status.hasAnyColors = true;
    });

    // Check package availability based on current selections
    availablePackages.forEach(pkg => {
      let isAvailable = false;

      if (selectedSize && selectedColor && showColorSection) {
        // Check if package is available for specific size + color combination
        const key = `${selectedSize}|${selectedColor}`;
        const availablePackagesForCombination = variantLookup.get(key) || new Set();
        isAvailable = availablePackagesForCombination.has(pkg.value);
      } else if (selectedSize) {
        if (showColorSection) {
          // With color section: check if package is available for selected size with any color
          isAvailable = Array.from(variantLookup.keys()).some(key => {
            const [size] = key.split('|');
            const packages = variantLookup.get(key) || new Set();
            return size === selectedSize && packages.has(pkg.value);
          });
        } else {
          // No color section: check direct size key
          const availablePackagesForSize = variantLookup.get(selectedSize) || new Set();
          isAvailable = availablePackagesForSize.has(pkg.value);
        }
      } else if (selectedColor && showColorSection) {
        // No size selected but color selected: check color-only key
        const colorKey = `NO_SIZE|${selectedColor}`;
        const availablePackagesForColor = variantLookup.get(colorKey) || new Set();
        isAvailable = availablePackagesForColor.has(pkg.value);
      } else {
        // No size/color selected, check if this package exists in any variant
        if (showColorSection) {
          // Check both sized and no-size variants
          isAvailable = Array.from(variantLookup.values()).some(packages => packages.has(pkg.value));
        } else {
          // Check direct NO_SIZE key or any other key
          const noSizePackages = variantLookup.get("NO_SIZE") || new Set();
          isAvailable = noSizePackages.has(pkg.value) ||
                       Array.from(variantLookup.values()).some(packages => packages.has(pkg.value));
        }
      }

      status.packageAvailability.set(pkg.value, isAvailable);
      if (isAvailable) status.hasAnyPackages = true;
    });

    return status;
  }, [selectedSize, selectedColor, availableColors, availablePackages, variants, showColorSection]);

  // Simplified helper functions for button states
  const isColorButtonDisabled = useCallback((colorValue: string) => {
    return !getAvailabilityStatus.colorAvailability.get(colorValue);
  }, [getAvailabilityStatus.colorAvailability]);

  const isPackageButtonDisabled = useCallback((packageValue: string) => {
    return !getAvailabilityStatus.packageAvailability.get(packageValue);
  }, [getAvailabilityStatus.packageAvailability]);

  // Find selected variant based on selections
  const selectedVariant = useMemo(() => {
    if (!selectedPackage) return null;
    if (showColorSection && !selectedColor) return null;

    // Find the package variant for the selected package
    const packageVariant = availablePackages.find(
      (pkg) => pkg.value === selectedPackage,
    )?.variant;

    return packageVariant || null;
  }, [availablePackages, selectedPackage, showColorSection, selectedColor]);

  const handleDecrement = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  const handleIncrement = () => {
    const maxQty = selectedVariant?.maxQuantity || 99;
    setQuantity((q) => Math.min(maxQty, q + 1));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const maxQty = selectedVariant?.maxQuantity || 99;
    setQuantity(isNaN(val) || val < 1 ? 1 : Math.min(maxQty, val));
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    
    try {
        console.log(`nsc-adding-to-cart: variant ${selectedVariant.code}, qty ${quantity} for session ${sessionId}`);
        const res = await fetch(`/api/cart`, {
            method: "POST",
            body: JSON.stringify({ sessionId, variantCode: selectedVariant.code, quantity }),
        });
        const data = await res.json();
        if (!res.ok) {
            console.error("Failed to add to cart:", data);
            return;
        }
        console.log(`nsc-added-to-cart: ${JSON.stringify(data)}`);
        router.push(`/cart?forceFetch=true${sessionId ? `&sessionId=${sessionId}` : ""}`);
    } catch (error) {
        console.error("Failed to add to cart:", error);
        return;
    }
  };

  const isReady = !!selectedPackage && (showColorSection ? !!selectedColor : true);

  if (isLoading) {
    return (
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-5 gap-16">
        <main className="flex flex-col gap-8 row-start-2 items-center text-center">
          <p className="text-gray-500 animate-pulse">Loading product details...</p>
        </main>
      </div>
    );
  }

  if (!product || !product.displayName) {
    return (
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-5 gap-16">
        <main className="flex flex-col gap-8 row-start-2 items-center text-center">
          <p className="text-gray-500">Product not found.</p>
          <Link
            href="/products"
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            Back to products
          </Link>
        </main>
      </div>
    );
  }

  const productImageUrl = product?.imageUrl || variants[0]?.media?.mainImageUrl;

  const imageUrl = productImageUrl
    ? productImageUrl.startsWith("http")
      ? productImageUrl
      : `${baseURL}${productImageUrl}`
    : null;

  return (
    <div className="font-sans p-5 max-w-4xl mx-auto">
      <main className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Product Image */}
          <div className="w-full md:w-1/2 aspect-square bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product?.displayName}
                className="object-contain object-top w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No image available
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-4 md:w-1/2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {product.displayName}
              </h1>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {selectedVariant 
                  ? `${selectedVariant.price.currencySymbol}${selectedVariant.price.salePrice || selectedVariant.price.listPrice}`
                  : product?.specialPrice || product?.price || (variants[0] ? `${variants[0].price.currencySymbol}${variants[0].price.salePrice || variants[0].price.listPrice}` : "")
                }
              </span>
              {(selectedVariant ? selectedVariant.price.salePrice : product?.specialPrice) && (
                <span className="text-lg text-gray-400 line-through">
                  {selectedVariant ? `${selectedVariant.price.currencySymbol}${selectedVariant.price.listPrice}` : product?.price}
                </span>
              )}
            </div>

            {product.description && (
              <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                <p dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
            )}

            {product.tagStory && (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Why you'll love it
                </p>
                <p className="text-sm italic text-slate-700 dark:text-slate-300">
                  {product.tagStory}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-6">
              {/* Size Selection */}
              {availableSizes.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size.value}
                        onClick={() => {
                          setSelectedSize(size.value);
                          setSelectedColor(null);
                          setSelectedPackage(null);
                        }}
                        className={`min-w-[4rem] px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedSize === size.value
                            ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900"
                            : "bg-white border-slate-200 text-slate-900 hover:border-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:hover:border-slate-600"
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              {showColorSection && (
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color.value}
                        disabled={isColorButtonDisabled(color.value)}
                        onClick={() => {
                          setSelectedColor(color.value);
                          setSelectedPackage(null);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedColor === color.value
                            ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900"
                            : isColorButtonDisabled(color.value)
                            ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed dark:bg-slate-900/50 dark:border-slate-800/50 dark:text-slate-600"
                            : "bg-white border-slate-200 text-slate-900 hover:border-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:hover:border-slate-600"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border border-slate-200 ${
                            color.isTieDye ? "bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 via-orange-500 to-red-500" : ""
                          }`}
                          style={{ backgroundColor: color.isTieDye ? undefined : color.backgroundColor }}
                        />
                        {color.label}
                      </button>
                    ))}
                  </div>
                  {selectedSize && !getAvailabilityStatus.hasAnyColors && (
                    <p className="mt-2 text-xs text-red-500">
                      No colors available for this size.
                    </p>
                  )}
                </div>
              )}

              {/* Package Size Selection */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Package Size
                </label>
                <div className="flex flex-col gap-2">
                  {availablePackages.map((pkg) => (
                    <button
                      key={pkg.value}
                      disabled={isPackageButtonDisabled(pkg.value)}
                      onClick={() => setSelectedPackage(pkg.value)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        selectedPackage === pkg.value
                          ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900"
                          : isPackageButtonDisabled(pkg.value)
                          ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed dark:bg-slate-900/50 dark:border-slate-800/50 dark:text-slate-600"
                          : "bg-white border-slate-200 text-slate-900 hover:border-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:hover:border-slate-600"
                      }`}
                    >
                      <span>{pkg.label}</span>
                      {pkg.variant && (
                        <div className="text-right">
                          <span className={`${selectedPackage === pkg.value ? "text-white dark:text-slate-900" : "text-slate-900 dark:text-white"}`}>
                            {pkg.variant.price.currencySymbol}{pkg.variant.price.listPrice}
                          </span>
                          {pkg.variant.price.salePrice && pkg.variant.price.salePrice > 0 && (
                            <p className="text-xs text-green-500 font-semibold">
                              Save ${(pkg.variant.price.listPrice - pkg.variant.price.salePrice).toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedSize && !getAvailabilityStatus.hasAnyPackages && (
                  <p className="mt-2 text-xs text-red-500">
                    No packages available for these selections.
                  </p>
                )}
              </div>

              {/* Quantity and Add to Cart */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Quantity
                  </label>
                  <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-full bg-slate-50 dark:bg-slate-900 px-2 py-1">
                    <button
                      onClick={handleDecrement}
                      disabled={quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-30"
                    >
                      –
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={handleInputChange}
                      className="w-12 text-center bg-transparent border-none focus:ring-0 text-sm font-bold"
                    />
                    <button
                      onClick={handleIncrement}
                      disabled={quantity >= (selectedVariant?.maxQuantity || 99)}
                      className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>

                {selectedVariant && (
                  <p className="text-xs text-slate-500">
                    {selectedVariant.stockInformation} — Max: {selectedVariant.maxQuantity}
                  </p>
                )}

                <button
                  disabled={!isReady}
                  onClick={handleAddToCart}
                  className={`w-full rounded-full py-4 font-bold transition-all ${
                    isReady
                      ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
                  }`}
                >
                  {isReady ? "Add to Cart" : "Please complete all selections"}
              </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <Link
            href={backQuery ? `/products?query=${encodeURIComponent(backQuery)}` : "/products"}
            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to results
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense 
      fallback={
        <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-5 gap-16">
          <main className="flex flex-col gap-8 row-start-2 items-center text-center">
            <p className="text-gray-500 animate-pulse">Loading...</p>
          </main>
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}

