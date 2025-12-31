"use client";

import { useWidgetProps } from "@/app/hooks";
import { OrderConfirmationProps } from "./OrderConfirmation.type";
import OrderConfirmation from "./OrderConfirmation";
import { Suspense } from "react";

function CheckoutPageContent() {
  const response = useWidgetProps<OrderConfirmationProps>();

  if (!response || !response.order) {
    return (
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-5 gap-16">
        <main className="flex flex-col gap-8 row-start-2 items-center text-center">
          <p className="text-gray-500">No order confirmation found.</p>
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
        <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-5 gap-16">
          <main className="flex flex-col gap-8 row-start-2 items-center text-center">
            <p className="text-gray-500 animate-pulse">Loading order confirmation...</p>
          </main>
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}

