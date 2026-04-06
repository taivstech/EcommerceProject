import { Image } from "@/utils/compat";
import { Link } from "@/utils/compat";
import { DotIcon, StarIcon, CreditCardIcon } from "lucide-react";
import { useState } from "react";
import { orderService, productService, paymentService } from "@/services";
import toast from "react-hot-toast";

const STATUS_LABELS = {
    AWAITING_PAYMENT: 'Awaiting Payment',
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    SHIPPING: 'Shipping',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
}

const STATUS_COLORS = {
    AWAITING_PAYMENT: 'bg-amber-100 text-amber-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    SHIPPING: 'bg-indigo-100 text-indigo-700',
    DELIVERED: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-green-200 text-green-800',
    CANCELLED: 'bg-red-100 text-red-700',
}

const OrderItem = ({ order, onUpdate }) => {

    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$';
    const [confirming, setConfirming] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [reviewingItemId, setReviewingItemId] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewedItems, setReviewedItems] = useState({});

    const allItems = (order?.shop_groups || []).flatMap(g => g?.items || []);

    const handleSubmitReview = async (orderItemId) => {
        console.log('Submitting review for orderItemId:', orderItemId, 'type:', typeof orderItemId)
        console.log('Review data:', { orderItemId, rating: reviewRating, comment: reviewComment })
        
        if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
            toast.error('Please select a rating between 1 and 5')
            return
        }
        
        // Validate orderItemId - must be a valid UUID, not a fallback
        if (!orderItemId || orderItemId.trim() === '' || orderItemId.startsWith('item-') || orderItemId.includes('variant')) {
            console.error('Invalid orderItemId (cannot use fallback):', orderItemId)
            toast.error('Invalid order item. Please refresh the page and try again.')
            return
        }
        
        setSubmittingReview(true)
        try {
            // Ensure orderItemId is a valid string
            const cleanOrderItemId = String(orderItemId || '').trim()
            if (!cleanOrderItemId) {
                throw new Error('Order item ID is required')
            }
            
            const payload = {
                orderItemId: cleanOrderItemId,
                rating: reviewRating,
                comment: reviewComment?.trim() || undefined,
            }
            console.log('Sending review payload:', JSON.stringify(payload, null, 2))
            console.log('Payload orderItemId value:', payload.orderItemId, 'type:', typeof payload.orderItemId)
            const reviewResponse = await productService.createReview(payload)
            toast.success('Review submitted!')
            setReviewedItems(prev => ({ ...prev, [orderItemId]: true }))
            setReviewingItemId(null)
            setReviewRating(5)
            setReviewComment('')
            
            // Dispatch event to refresh reviews on product page
            const reviewedItem = allItems.find(item => item.id === orderItemId)
            if (reviewedItem?.product_id) {
                window.dispatchEvent(new CustomEvent('reviewSubmitted', { 
                    detail: { productId: reviewedItem.product_id }
                }))
            }
            
            if (onUpdate) onUpdate()
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Review failed'
            toast.error(errorMessage)
            console.error('Review submission error:', e)
        } finally {
            setSubmittingReview(false)
        }
    };

    const handleConfirmReceipt = async () => {
        setConfirming(true);
        try {
            await orderService.confirmReceipt(order.id);
            toast.success("Order received confirmed!");
            if (onUpdate) onUpdate();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Confirmation failed");
        } finally {
            setConfirming(false);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await orderService.cancelOrder(order.id);
            toast.success("Order cancelled");
            if (onUpdate) onUpdate();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Cancel failed");
        } finally {
            setCancelling(false);
        }
    };

    // Online payment: "Pay Now" for AWAITING_PAYMENT orders
    const [paying, setPaying] = useState(false);
    const handlePayNow = async () => {
        setPaying(true);
        try {
            const paymentMethod = order.payment || 'VNPAY'; // Default to VNPAY for backward compatibility
            const paymentUrl = await paymentService.createPaymentUrl(paymentMethod, order.id);
            if (paymentUrl) {
                window.location.href = paymentUrl;
            } else {
                toast.error("Could not create payment link");
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Payment failed");
        } finally {
            setPaying(false);
        }
    };

    const statusColor = STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600';

    return (
        <>
            <tr className="text-sm">
                <td className="text-left">
                    <div className="flex flex-col gap-4">
                        {allItems.map((item, index) => {
                            // Debug: log item structure for first item
                            if (index === 0) {
                                console.log('Sample order item (full object):', JSON.stringify(item, null, 2))
                                console.log('Item ID:', item.id, 'type:', typeof item.id)
                                console.log('Item keys:', Object.keys(item))
                            }
                            
                            // CRITICAL: item.id MUST exist - it's the order item ID from backend
                            // If it doesn't exist, we cannot create a review
                            if (!item.id) {
                                console.error('❌ CRITICAL: Order item missing ID!', {
                                    item,
                                    allKeys: Object.keys(item),
                                    itemString: JSON.stringify(item)
                                })
                                // Don't render review button if ID is missing
                                return null
                            }
                            
                            // Capture itemId in a const to ensure it's available in closures
                            const itemId = String(item.id).trim() // Ensure it's a string and trimmed
                            
                            return (
                                <div key={itemId}>
                                    <div className="flex items-center gap-4">
                                        {item.product_id ? (
                                            <Link href={`/product/${item.product_id}`} className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded-md overflow-hidden shrink-0 hover:opacity-80 transition">
                                                {item.product_image ? (
                                                    <Image src={item.product_image} alt={item.product_name || ''} width={64} height={64} className="object-cover w-full h-full" />
                                                ) : (
                                                    <div className="text-xs text-slate-400 px-1 text-center">No img</div>
                                                )}
                                            </Link>
                                        ) : (
                                            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded-md overflow-hidden shrink-0">
                                                {item.product_image ? (
                                                    <Image src={item.product_image} alt={item.product_name || ''} width={64} height={64} className="object-cover w-full h-full" />
                                                ) : (
                                                    <div className="text-xs text-slate-400 px-1 text-center">No img</div>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex flex-col justify-center text-sm min-w-0 flex-1">
                                            {item.product_id ? (
                                                <Link href={`/product/${item.product_id}`} className="font-medium text-slate-700 truncate hover:text-blue-600 transition">
                                                    {item.product_name || 'Product'}
                                                </Link>
                                            ) : (
                                                <p className="font-medium text-slate-700 truncate">{item.product_name || 'Product'}</p>
                                            )}
                                            {item.variant_name && (
                                                <p className="text-xs text-slate-400">Variant: {item.variant_name}</p>
                                            )}
                                            <p className="text-slate-800">{currency}{Number(item.price).toFixed(2)} × {item.quantity}</p>
                                        </div>
                                        {/* Review button for delivered/completed orders */}
                                        {(order.status === 'DELIVERED' || order.status === 'COMPLETED') && !item.has_review && !reviewedItems[itemId] && (
                                            <button
                                                onClick={() => { setReviewingItemId(itemId); setReviewRating(5); setReviewComment(''); }}
                                                className="text-xs bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600 transition shrink-0"
                                            >
                                                Review
                                            </button>
                                        )}
                                        {(item.has_review || reviewedItems[itemId]) && (
                                            item.product_id ? (
                                                <Link 
                                                    href={`/product/${item.product_id}`}
                                                    className="text-xs text-green-600 shrink-0 hover:text-green-700 hover:underline transition flex items-center gap-1"
                                                >
                                                    <span>✓</span>
                                                    <span>Reviewed</span>
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-green-600 shrink-0">✓ Reviewed</span>
                                            )
                                        )}
                                    </div>

                                    {/* Inline review form */}
                                    {reviewingItemId === itemId && (
                                        <div className="mt-3 ml-20 p-4 bg-slate-50 rounded-lg border border-slate-200 max-w-md">
                                            <p className="text-sm font-medium text-slate-700 mb-2">Rate this product</p>
                                            <div className="flex gap-1 mb-3">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button key={star} type="button" onClick={() => setReviewRating(star)}>
                                                        <StarIcon size={22} className="text-transparent transition" fill={reviewRating >= star ? "#FACC15" : "#D1D5DB"} />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                                placeholder="Share your experience (optional)..."
                                                rows={3}
                                                className="w-full border border-slate-200 rounded p-2 text-sm outline-none resize-none focus:ring-1 focus:ring-amber-300"
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        const currentItemId = itemId // Capture in closure
                                                        console.log('Button clicked - itemId:', currentItemId, 'type:', typeof currentItemId)
                                                        console.log('Current reviewingItemId:', reviewingItemId)
                                                        console.log('Item object:', item)
                                                        console.log('Item.id:', item.id)
                                                        if (!currentItemId) {
                                                            console.error('❌ itemId is empty/null!', { itemId, item, currentItemId })
                                                            toast.error('Invalid order item ID. Please refresh the page.')
                                                            return
                                                        }
                                                        handleSubmitReview(currentItemId)
                                                    }}
                                                    disabled={submittingReview}
                                                    className="text-xs bg-amber-500 text-white px-4 py-1.5 rounded hover:bg-amber-600 disabled:opacity-50 transition"
                                                >
                                                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                                                </button>
                                                <button
                                                    onClick={() => setReviewingItemId(null)}
                                                    className="text-xs text-slate-500 px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-100 transition"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </td>

                <td className="text-center max-md:hidden">{currency}{Number(order.total).toFixed(2)}</td>

                <td className="text-left max-md:hidden">
                    <p className="text-slate-700">{order?.shipping_address?.receiver_name}</p>
                    <p className="text-xs text-slate-500">{order?.shipping_address?.full_address}</p>
                    <p className="text-xs text-slate-400">{order?.shipping_address?.phone_number}</p>
                </td>

                <td className="text-left max-md:hidden">
                    {(() => {
                        const paymentMethod = order.payment || 'COD'
                        const isPaid = order.is_paid === true
                        
                        if (paymentMethod === 'COD') {
                            return (
                                <div className="flex flex-col gap-1">
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                                        isPaid 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {isPaid ? '✓ Paid' : 'Pay on delivery'}
                                    </span>
                                    <span className="text-xs text-gray-500">COD</span>
                                </div>
                            )
                        } else {
                            return (
                                <div className="flex flex-col gap-1">
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                                        isPaid 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {isPaid ? '✓ Paid' : 'Unpaid'}
                                    </span>
                                    <span className="text-xs text-gray-500">{paymentMethod}</span>
                                </div>
                            )
                        }
                    })()}
                </td>

                <td className="text-left space-y-2 text-sm max-md:hidden">
                    <div className={`flex items-center justify-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${statusColor}`}>
                        <DotIcon size={10} className="scale-250" />
                        {STATUS_LABELS[order.status] || String(order.status || "").replace(/_/g, ' ')}
                    </div>

                    {/* Action buttons — Shopee-like flow */}
                    <div className="flex flex-col gap-1 mt-2">
                        {/* AWAITING_PAYMENT + Online payment → "Pay Now" */}
                        {order.status === 'AWAITING_PAYMENT' && ['VNPAY', 'PAYPAL', 'MOMO'].includes(order.payment) && (
                            <button
                                onClick={handlePayNow}
                                disabled={paying}
                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                                <CreditCardIcon size={12} />
                                {paying ? 'Redirecting...' : 'Pay Now'}
                            </button>
                        )}

                        {/* DELIVERED → Buyer confirms receipt */}
                        {order.status === 'DELIVERED' && (
                            <button
                                onClick={handleConfirmReceipt}
                                disabled={confirming}
                                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {confirming ? 'Processing...' : 'Received'}
                            </button>
                        )}

                        {/* PENDING or AWAITING_PAYMENT → Buyer can cancel */}
                        {(order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT') && (
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition disabled:opacity-50"
                            >
                                {cancelling ? 'Cancelling...' : 'Cancel'}
                            </button>
                        )}
                    </div>
                </td>
            </tr>
            {/* Mobile */}
            <tr className="md:hidden">
                <td colSpan={5}>
                    <p>{order?.shipping_address?.receiver_name}</p>
                    <p className="text-xs">{order?.shipping_address?.full_address}</p>
                    <p className="text-xs">{order?.shipping_address?.phone_number}</p>
                    <br />
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        {(() => {
                            const paymentMethod = order.payment || 'COD'
                            const isPaid = order.is_paid === true
                            
                            if (paymentMethod === 'COD') {
                                return (
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                                        isPaid 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {isPaid ? '✓ Paid' : 'Pay on delivery'} (COD)
                                    </span>
                                )
                            } else {
                                return (
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                                        isPaid 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {isPaid ? '✓ Paid' : 'Unpaid'} ({paymentMethod})
                                    </span>
                                )
                            }
                        })()}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-center px-4 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {STATUS_LABELS[order.status] || String(order.status || "").replace(/_/g, ' ')}
                        </span>
                        {order.status === 'AWAITING_PAYMENT' && ['VNPAY', 'PAYPAL', 'MOMO'].includes(order.payment) && (
                            <button onClick={handlePayNow} disabled={paying}
                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50">
                                {paying ? '...' : 'Pay Now'}
                            </button>
                        )}
                        {order.status === 'DELIVERED' && (
                            <button onClick={handleConfirmReceipt} disabled={confirming}
                                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50">
                                {confirming ? '...' : 'Received'}
                            </button>
                        )}
                        {(order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT') && (
                            <button onClick={handleCancel} disabled={cancelling}
                                className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50">
                                {cancelling ? '...' : 'Cancel'}
                            </button>
                        )}
                    </div>
                </td>
            </tr>
            <tr>
                <td colSpan={5}>
                    <div className="border-b border-slate-300 w-6/7 mx-auto" />
                </td>
            </tr>
        </>
    )
}

export default OrderItem
