import { Package, MapPin, CreditCard, Truck } from "lucide-react";
import { CartResponse } from "./Cart.type";

interface CartProps extends CartResponse {
  onSubmitOrder: () => void;
  isSubmitting: boolean;
}

export default function Cart({
  items,
  summary,
  shippingAddress,
  paymentMethod,
  shippingMethod,
  onSubmitOrder,
  isSubmitting,
}: CartProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Items and Addresses */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          {/* Order Items */}
          <section className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Order Items</h2>
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-slate-900">
              {items.map((item) => {
                const hasDiscount = !!item.discountAmount && item.discountAmount > 0;
                return (
                  <li key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.imageAlt}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">{item.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">Qty: {item.quantity}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-slate-900 dark:text-white">{item.finalPrice}</span>
                        {hasDiscount && (
                          <>
                            <span className="text-sm text-slate-400 line-through">{item.originalPrice}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-50 text-red-600 rounded uppercase tracking-wider border border-red-100">
                              {item.discountLabel}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping Address */}
            {shippingAddress && (
              <section className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-slate-500" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Shipping Address</h2>
                </div>
                <address className="not-italic text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {shippingAddress.firstName} {shippingAddress.lastName}
                  </span>
                  <br />
                  {shippingAddress.address1}
                  {shippingAddress.address2 && <><br />{shippingAddress.address2}</>}
                  <br />
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
                  <br />
                  <span className="mt-2 block">
                    {shippingAddress.phone && <>Phone: {shippingAddress.phone}<br /></>}
                    {shippingAddress.email && <>Email: {shippingAddress.email}</>}
                  </span>
                </address>
              </section>
            )}

            {/* Payment Method */}
            {paymentMethod && (
              <section className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-slate-500" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment Method</h2>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p className="uppercase font-semibold text-slate-900 dark:text-white">{paymentMethod.type}</p>
                  <p className="mt-1">{paymentMethod.cardNumber}</p>
                  {paymentMethod.expiration && <p className="mt-1 text-xs">Exp: {paymentMethod.expiration}</p>}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Right Column: Summary and Delivery */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          {/* Order Summary */}
          <section className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Order Summary</h2>

            <div className="flex flex-col gap-3">
              {summary?.promotions && summary?.promotions?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Promotions</p>
                  {summary?.promotions?.map((promo: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start gap-4 mb-1">
                      <span className="text-sm text-green-600 dark:text-green-400 flex-1">{promo.name.split(" - ").pop()}</span>
                      {!promo.isShipping && <span className="text-sm font-medium text-green-600">-{promo.savedAmount}</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>{summary?.subtotal}</span>
              </div>

              {summary?.hasSavings && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span>-{summary?.discountTotal}</span>
                </div>
              )}

              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Shipping</span>
                <span>{summary?.isFreeShipping ? "Free" : summary?.shipping}</span>
              </div>

              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Tax</span>
                <span>{summary?.tax}</span>
              </div>

              <hr className="my-2 border-slate-100 dark:border-slate-900" />

              <div className="flex justify-between items-center py-2">
                <span className="font-bold text-slate-900 dark:text-white">Total</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{summary?.total}</span>
              </div>

              {summary?.hasSavings && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    You saved {summary?.totalSavings}!
                  </p>
                </div>
              )}

              <button
                onClick={onSubmitOrder}
                disabled={isSubmitting}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
              >
                {isSubmitting ? "Submitting..." : "Submit Order"}
              </button>
            </div>
          </section>

          {/* Delivery Status */}
          {shippingMethod && (
            <section className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">Delivery</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full uppercase">
                      {shippingMethod.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{shippingMethod.name}</p>
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    Est. {shippingMethod.estimatedDeliveryDate}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

