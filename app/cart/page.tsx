"use client";

import { useWidgetProps } from "@/app/hooks";
import { CartResponse } from "./Cart.type";
import { useState, Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Cart from "./Cart";
import OrderConfirmation from "../check-out/OrderConfirmation";
import { OrderConfirmationProps } from "../check-out/OrderConfirmation.type";

function CartPageContent() {
  const searchParams = useSearchParams();
  const forceFetch = searchParams.get("forceFetch") === "true";
  const sessionId = searchParams.get("sessionId");

  const responseFromProps = useWidgetProps<CartResponse>();
  const [manualCartResponse, setManualCartResponse] = useState<CartResponse | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmationProps | null>(null);
  const hasFetchedOnce = useRef(false);

  useEffect(() => {
    const fetchCartManually = async () => {
      // If forceFetch is true and we have a sessionId, fetch on client
      if (forceFetch && sessionId && !hasFetchedOnce.current && !isFetching) {
        setIsFetching(true);
        hasFetchedOnce.current = true;
        try {
          const res = await fetch(`/api/cart?sessionId=${sessionId}`);
          if (!res.ok) throw new Error("Failed to fetch cart");
          const data = await res.json();
          console.log(`nsc-fetched-cart: ${JSON.stringify(data)}`);
          setManualCartResponse(data);
        } catch (error) {
          console.error("Failed to fetch cart manually:", error);
        } finally {
          setIsFetching(false);
        }
      }
    };

    fetchCartManually();
  }, [forceFetch, sessionId, isFetching]);

  const response = (forceFetch && manualCartResponse) ? manualCartResponse : (responseFromProps?.items ? responseFromProps : manualCartResponse);
  const effectiveSessionId = sessionId || response?.sessionId as string;

  const handleSubmitOrder = async () => {
    if (!effectiveSessionId) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/check-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: effectiveSessionId }),
      });

      if (!res.ok) throw new Error("Failed to submit order");
      const data = await res.json();
      setOrderConfirmation(data as OrderConfirmationProps);
    } catch (error) {
      console.error("Failed to submit order:", error);
      alert("Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderConfirmation) {
    return (
      <div className="font-sans p-5 max-w-4xl mx-auto">
        <OrderConfirmation {...orderConfirmation} />
      </div>
    );
  }

  const isLoading = !response && (isFetching || forceFetch || responseFromProps === null || responseFromProps === undefined);

  if (isLoading) {
    return (
      <div className="font-sans p-5 max-w-6xl mx-auto">
        <main>
          <div className="text-center py-12">
            <p className="text-gray-500 animate-pulse">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!response || !response.items || !response.summary) {
    return (
      <div className="font-sans p-5 max-w-6xl mx-auto">
        <main>
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-500">Your cart data is incomplete or you need to log in.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans p-5 max-w-6xl mx-auto">
      <main className="flex flex-col gap-6">
        <Cart 
          {...response} 
          onSubmitOrder={handleSubmitOrder} 
          isSubmitting={isSubmitting} 
        />
      </main>
    </div>
  );
}

export default function CartPage() {
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
      <CartPageContent />
    </Suspense>
  );
}
