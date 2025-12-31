import { Package, CreditCard, Truck } from "lucide-react";
import type { OrderConfirmationProps } from "./OrderConfirmation.type";

export default function OrderConfirmation({
  order,
}: OrderConfirmationProps) {
  if (!order) return null;

  const {
    orderNumber,
    orderDateFormatted,
    lineItems,
    subTotalFormatted,
    shippingTotalFormatted,
    taxTotalFormatted,
    discountTotalFormatted,
    totalFormatted,
    totalSavingsFormatted,
    shippingAddress,
    firstPaymentInformation,
    shippingMethodName,
    estimatedDeliveryDate,
  } = order;

  const hasSavings = totalSavingsFormatted !== "$0.00";

  return (
    <div className="flex flex-col gap-6 w-full py-6">
      {/* Success Message */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-full text-white">
            <Package size={24} />
          </div>
          <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
            Order Confirmation
          </h2>
        </div>
        <p className="text-blue-600 dark:text-blue-300">
          Your order # is <strong className="font-bold">{orderNumber}</strong>. You will receive a
          confirmation email with your order details and a link to track its
          progress.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Order Details */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          {/* Order Info */}
          <section className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Order Receipt</h2>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Order {orderNumber}</p>
                  <p className="text-sm text-slate-500"><strong>Order Date:</strong> {orderDateFormatted}</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 underline underline-offset-4 decoration-blue-600/30">
                Email Receipt
              </button>
            </div>
            
            <hr className="border-slate-100 dark:border-slate-900 mb-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Billing Address */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  Billing Address
                </h3>
                <address className="not-italic text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {shippingAddress.firstName} {shippingAddress.lastName}
                  </span>
                  <br />
                  {shippingAddress.line1}
                  {shippingAddress.line2 && <><br />{shippingAddress.line2}</>}
                  <br />
                  {shippingAddress.city}, {shippingAddress.regionCode} {shippingAddress.postalCode}
                  <br />
                  <span className="text-blue-600 dark:text-blue-400 mt-2 block">
                    {shippingAddress.email}
                  </span>
                </address>
              </div>

              {/* Delivery Address */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  Delivery Address
                </h3>
                <address className="not-italic text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {shippingAddress.firstName} {shippingAddress.lastName}
                  </span>
                  <br />
                  {shippingAddress.line1}
                  {shippingAddress.line2 && <><br />{shippingAddress.line2}</>}
                  <br />
                  {shippingAddress.city}, {shippingAddress.regionCode} {shippingAddress.postalCode}
                  <br />
                  <span className="mt-2 block font-medium">
                    {shippingAddress.daytimePhoneNumber}
                  </span>
                  {shippingAddress.deliveryNotes && (
                    <span className="mt-2 block italic text-slate-500 text-xs">
                      {shippingAddress.deliveryNotes}
                    </span>
                  )}
                </address>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {/* Payment Method */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CreditCard size={16} className="text-slate-400" />
                  Payment Method
                </h3>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p className="font-semibold text-slate-900 dark:text-white uppercase">{firstPaymentInformation.cardTypeDisplayName}</p>
                  <p className="mt-1">{firstPaymentInformation.cardNumber}</p>
                  {firstPaymentInformation.expirationDateFormatted && <p className="text-xs mt-1 text-slate-500">Exp: {firstPaymentInformation.expirationDateFormatted}</p>}
                </div>
              </div>

              {/* Delivery Method */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Truck size={16} className="text-slate-400" />
                  Delivery Method
                </h3>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p className="font-semibold text-slate-900 dark:text-white">{shippingMethodName}</p>
                  {estimatedDeliveryDate && (
                    <p className="text-xs italic text-slate-500 mt-1">
                      Estimated delivery date: {estimatedDeliveryDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Order Items */}
          <section className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Order Items</h2>
            <div className="flex flex-col gap-4">
              {lineItems?.map((item) => (
                <div key={item.variationCode} className="flex gap-4 p-4 border border-slate-100 dark:border-slate-900 rounded-xl bg-slate-50/30 dark:bg-slate-900/10">
                  <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex-shrink-0">
                    <img src={item.imageViewModel.imageUrl} alt={item.name} className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{item.name}</h4>
                    <p className="text-sm text-slate-500 mt-0.5">Qty: {item.quantity}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-400 line-through">{item.listPriceFormatted}</p>
                      {item.discountAmount && item.discountAmount > 0 && (
                        <p className="text-[10px] font-bold px-1.5 py-0.5 bg-green-50 text-green-600 rounded uppercase border border-green-100">
                          {item.discountAmountFormatted}: -${item.discountAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col justify-center">
                    <p className="font-bold text-slate-900 dark:text-white text-lg">{item.subTotalFormatted}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Totals */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <section className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Summary</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900 dark:text-white">{subTotalFormatted}</span>
              </div>
              {discountTotalFormatted !== "$0.00" && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Promotion Discount</span>
                  <span className="font-medium">- {discountTotalFormatted}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Shipping</span>
                <span className="font-medium text-slate-900 dark:text-white">{shippingTotalFormatted}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Tax</span>
                <span className="font-medium text-slate-900 dark:text-white">{taxTotalFormatted}</span>
              </div>
              <hr className="my-2 border-slate-100 dark:border-slate-900" />
              <div className="flex justify-between items-center py-2">
                <span className="font-bold text-slate-900 dark:text-white text-lg">Total</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{totalFormatted}</span>
              </div>
              {hasSavings && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    You saved {totalSavingsFormatted} on this order!
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
