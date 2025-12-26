"use client";

import { useWidgetProps } from "@/app/hooks";
import { OrderHistoryItem, OrderHistoryProps } from "@/app/order-history/OrderHistory.type";

export default function OrderHistoryPage() {
  const orderHistory = useWidgetProps<OrderHistoryProps & { sessionId: string }>();
  const orders = orderHistory?.orders;
  
  console.log("nsc-order-history", orderHistory);
  console.log("nsc-session-id", orderHistory?.sessionId);

  const isLoading = orderHistory === null || orderHistory === undefined;

  return (
    <div className="font-sans p-4 sm:p-8 max-w-4xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Order History</h1>
      </header>

      <main>
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 animate-pulse">Loading...</p>
          </div>
        ) : (!orders || orders.length === 0) ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-500">No orders found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order: OrderHistoryItem) => (
              <div 
                key={order.orderNumber}
                className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-950"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Number</span>
                    <p className="font-mono font-bold">{order.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      order.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-700' : 
                      order.status.toLowerCase() === 'processing' ? 'bg-blue-100 text-blue-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase">Date</span>
                    <p className="text-sm">{order.orderDateFormatted}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase">Total</span>
                    <p className="text-sm font-semibold">{order.totalFormatted}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-gray-500 uppercase">Tracking</span>
                    <p className="text-sm truncate" title={order.trackingNumbers}>
                      {order.trackingNumbers || "N/A"}
                    </p>
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
