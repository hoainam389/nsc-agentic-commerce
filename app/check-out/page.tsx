"use client";

import { useWidgetProps } from "@/app/hooks";
import { OrderConfirmationProps } from "./OrderConfirmation.type";
import OrderConfirmation from "./OrderConfirmation";
import { Suspense } from "react";

function CheckoutPageContent() {
  const response = useWidgetProps<OrderConfirmationProps>();
  const isLoading = response === null || response === undefined;

  if (isLoading) {
    return (
      <div className="font-sans p-5 max-w-4xl mx-auto">
        <main>
          <div className="text-center py-12">
            <p className="text-gray-500 animate-pulse">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!response || !response.order) {
    return (
      <div className="font-sans p-5 max-w-4xl mx-auto">
        <main>
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-500">No order confirmation found.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans p-5 max-w-4xl mx-auto">
      <OrderConfirmation {...response} />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="font-sans p-5 max-w-4xl mx-auto">
          <main>
            <div className="text-center py-12">
              <p className="text-gray-500 animate-pulse">Loading...</p>
            </div>
          </main>
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}

