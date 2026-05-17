import { PlusIcon, SquarePenIcon, XIcon, TagIcon, TicketIcon, TruckIcon, LoaderCircle, Package } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import AddressModal from './AddressModal';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from "@/utils/compat";
import { orderService, couponService, paymentService, shopService, ghnService, warehouseService } from '@/services';

const OrderSummary = ({ totalPrice, items, shopId, isHorizontal = false, showPlaceOrderButton = false }) => {

    const currency = '$';

    const router = useRouter();

    const addressList = useSelector(state => state.address.list);

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [note, setNote] = useState('');

    // Auto-select default address on mount
    useEffect(() => {
        if (addressList && addressList.length > 0 && !selectedAddress) {
            const defaultAddr = addressList.find(addr => addr.default_address === true) || addressList[0];
            setSelectedAddress(defaultAddr);
        }
    }, [addressList]);

    // ─── Shipping fee state ─────────────────────────────────
    const [shippingFee, setShippingFee] = useState(0);
    const [loadingShipping, setLoadingShipping] = useState(false);

    // ─── Shipping method state ───────────────────────────────
    const [availableServices, setAvailableServices] = useState([]);
    const [selectedServiceType, setSelectedServiceType] = useState(2); // Default: Standard

    // ─── Coupon state ─────────────────────────────────────────
    const [showCouponModal, setShowCouponModal] = useState(null); // null | 'platform' | 'shop'
    const [platformCoupons, setPlatformCoupons] = useState([]);
    const [shopCoupons, setShopCoupons] = useState([]);
    const [selectedPlatformCoupon, setSelectedPlatformCoupon] = useState(null);
    const [selectedShopCoupon, setSelectedShopCoupon] = useState(null);
    const [loadingCoupons, setLoadingCoupons] = useState(false);

    // Get unique shop IDs from cart items (or use provided shopId)
    const shopIds = useMemo(() => {
        const ids = new Set()
        if (shopId) ids.add(shopId)
        else if (items) {
            items.forEach(item => {
                const itemShopId = item.shop_id || item.product?.shop_id || item.shopId
                if (itemShopId) ids.add(itemShopId)
            })
        }
        return Array.from(ids).sort()
    }, [items, shopId])

    // Create a stable string representation for dependencies
    const shopIdsKey = shopIds.join(',')

    // ─── Calculate shipping fee via GHN API when address changes ──────────
    const calculateShippingFee = useCallback(async () => {
        if (!selectedAddress?.district_id || !selectedAddress?.ward_code || shopIds.length === 0) {
            setShippingFee(0);
            return;
        }

        setLoadingShipping(true);
        try {
            // 1. Fetch all shop addresses for shops in the cart
            const shopAddresses = await shopService.getShopAddresses(shopIds);
            const shopAddrMap = {};
            shopAddresses.forEach(sa => { shopAddrMap[sa.id] = sa; });

            // 1.5 Fetch available shipping services (using first shop's district)
            const firstShopAddr = shopAddresses[0];
            const firstFromDistrict = firstShopAddr?.district_id || firstShopAddr?.districtId;
            if (firstFromDistrict && selectedAddress.district_id) {
                try {
                    const services = await ghnService.getAvailableServices(
                        firstFromDistrict,
                        selectedAddress.district_id
                    );
                    setAvailableServices(services);
                    // If current selection not available, fallback to first available (default: standard/2)
                    if (services.length > 0 && !services.some(s => s.service_type_id === selectedServiceType)) {
                        setSelectedServiceType(services[0].service_type_id);
                    }
                } catch (e) {
                    console.error('GHN available services failed:', e);
                    setAvailableServices([]);
                }
            }

            // 2. Group items by shop to calculate per-shop weight
            const weightByShop = {};
            items.forEach(item => {
                const itemShopId = item.shop_id || item.product?.shop_id || item.shopId;
                if (!itemShopId) return;
                const weight = (item.product?.weight || 0.3) * 1000; // kg → grams, default 300g
                const qty = item.quantity || 1;
                weightByShop[itemShopId] = (weightByShop[itemShopId] || 0) + (weight * qty);
            });

            // 3. Calculate shipping fee per shop via GHN API
            let totalFee = 0;
            for (const sId of shopIds) {
                const shopAddr = shopAddrMap[sId];
                const fromDistrictId = shopAddr?.district_id || shopAddr?.districtId;
                const fromWardCode = shopAddr?.ward_code || shopAddr?.wardCode || '';

                if (!fromDistrictId) {
                    console.warn(`Shop ${sId} has no district_id configured, using fallback`);
                    totalFee += 2.50;
                    continue;
                }

                try {
                    const feeVnd = await ghnService.calculateFee({
                        service_type_id: selectedServiceType,
                        from_district_id: fromDistrictId,
                        from_ward_code: fromWardCode,
                        to_district_id: selectedAddress.district_id,
                        to_ward_code: selectedAddress.ward_code,
                        weight: Math.max(1, Math.round(weightByShop[sId] || 300)),
                    });
                    // GHN returns fee in VND — convert to USD (approx 1 USD = 25,000 VND)
                    const feeUsd = feeVnd ? feeVnd / 25000 : 2.50;
                    totalFee += Math.round(feeUsd * 100) / 100; // round to 2 decimals
                } catch (err) {
                    console.warn(`GHN fee failed for shop ${sId}, using fallback`, err);
                    totalFee += 2.50; // fallback per shop
                }
            }

            setShippingFee(Math.round(totalFee * 100) / 100);
        } catch (err) {
            console.error('Failed to calculate shipping fee:', err);
            // Fallback: flat fee per shop
            setShippingFee(2.50 * Math.max(1, shopIds.length));
        } finally {
            setLoadingShipping(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAddress?.district_id, selectedAddress?.ward_code, shopIdsKey, items, selectedServiceType]);

    useEffect(() => {
        if (!selectedAddress || !selectedAddress.district_id || !selectedAddress.ward_code) {
            setShippingFee(0);
            return;
        }
        calculateShippingFee();
    }, [selectedAddress?.district_id, selectedAddress?.ward_code, calculateShippingFee]);


    // Fetch platform coupons
    const fetchPlatformCoupons = async () => {
        setLoadingCoupons(true)
        try {
            const data = await couponService.getPlatformCoupons()
            setPlatformCoupons(data.filter(c => c.is_active))
        } catch (err) {
            console.error('Failed to load platform coupons:', err)
        } finally {
            setLoadingCoupons(false)
        }
    }

    // Fetch shop coupons (merge from all shops in cart)
    const fetchShopCoupons = async () => {
        setLoadingCoupons(true)
        try {
            const allShopCoupons = []
            for (const shopId of shopIds) {
                const data = await couponService.getShopCoupons(shopId)
                allShopCoupons.push(...data.filter(c => c.is_active))
            }
            setShopCoupons(allShopCoupons)
        } catch (err) {
            console.error('Failed to load shop coupons:', err)
        } finally {
            setLoadingCoupons(false)
        }
    }

    // Calculate discount amount for display
    const platformDiscount = useMemo(() => {
        if (!selectedPlatformCoupon) return 0
        const c = selectedPlatformCoupon
        if (c.min_order_amount && totalPrice < c.min_order_amount) return 0
        if (c.discount_type === 'FREE_SHIPPING') {
            let discount = shippingFee
            if (c.discount_value && c.discount_value > 0) discount = Math.min(discount, c.discount_value)
            if (c.max_discount && c.max_discount > 0) discount = Math.min(discount, c.max_discount)
            return Math.max(0, discount)
        }
        if (c.discount_type === 'PERCENTAGE') {
            let discount = (totalPrice * (c.discount_value || 0)) / 100
            if (c.max_discount && discount > c.max_discount) discount = c.max_discount
            return discount
        }
        if (c.discount_type === 'FIXED_AMOUNT') return c.discount_value || 0
        return 0
    }, [selectedPlatformCoupon, totalPrice, shippingFee])

    const shopDiscount = useMemo(() => {
        if (!selectedShopCoupon) return 0
        const c = selectedShopCoupon
        if (c.min_order_amount && totalPrice < c.min_order_amount) return 0
        if (c.discount_type === 'FREE_SHIPPING') {
            const remainingShipping = Math.max(0, shippingFee - platformDiscount)
            let discount = remainingShipping
            if (c.discount_value && c.discount_value > 0) discount = Math.min(discount, c.discount_value)
            if (c.max_discount && c.max_discount > 0) discount = Math.min(discount, c.max_discount)
            return Math.max(0, discount)
        }
        if (c.discount_type === 'PERCENTAGE') {
            let discount = (totalPrice * (c.discount_value || 0)) / 100
            if (c.max_discount && discount > c.max_discount) discount = c.max_discount
            return discount
        }
        if (c.discount_type === 'FIXED_AMOUNT') return c.discount_value || 0
        return 0
    }, [selectedShopCoupon, totalPrice, shippingFee, platformDiscount])

    const totalDiscount = platformDiscount + shopDiscount
    const finalTotal = Math.max(0, totalPrice + shippingFee - totalDiscount)

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (!selectedAddress) {
            toast.error("Please select a shipping address")
            return
        }
        if (!selectedAddress.district_id || !selectedAddress.ward_code) {
            toast.error("Address missing district/ward info (required for shipping calculation)")
            return
        }

        const orderResult = await orderService.checkout({
            receiver_name: selectedAddress.receiver_name,
            phone_number: selectedAddress.phone_number,
            full_address: selectedAddress.full_address,
            detail_address: selectedAddress.detail_address,
            ward: selectedAddress.ward,
            ward_code: selectedAddress.ward_code,
            district: selectedAddress.district,
            district_id: selectedAddress.district_id,
            province: selectedAddress.province,
            province_id: selectedAddress.province_id,
            payment: paymentMethod,
            coupon_code: selectedPlatformCoupon?.code || undefined,
            shop_coupon_code: selectedShopCoupon?.code || undefined,
            note: note.trim() || undefined,
            shop_id: shopId || undefined,
        })

        // Online payment flow: redirect to payment gateway
        if (['VNPAY', 'PAYPAL', 'MOMO'].includes(paymentMethod) && orderResult?.id) {
            try {
                const paymentUrl = await paymentService.createPaymentUrl(paymentMethod, orderResult.id)
                if (paymentUrl) {
                    window.location.href = paymentUrl
                    return
                }
            } catch (err) {
                toast.error(`Could not create ${paymentMethod} payment link. Please pay later in Orders.`)
            }
        }

        router.push('/orders')
    }

    const formatDiscount = (coupon) => {
        if (coupon.discount_type === 'PERCENTAGE') {
            return `${coupon.discount_value}% off${coupon.max_discount ? ` (max ${currency}${Number(coupon.max_discount).toFixed(2)})` : ''}`
        }
        if (coupon.discount_type === 'FIXED_AMOUNT') {
            return `${currency}${Number(coupon.discount_value).toFixed(2)} off`
        }
        if (coupon.discount_type === 'FREE_SHIPPING') {
            const cap = coupon.discount_value || coupon.max_discount
            return cap ? `Free shipping (up to ${currency}${Number(cap).toFixed(2)})` : 'Free shipping'
        }
        return ''
    }

    const isApplicable = (coupon, scope) => {
        // Per-user usage limit
        if (coupon.max_usage_per_user != null && coupon.current_user_usage_count != null
            && coupon.current_user_usage_count >= coupon.max_usage_per_user) return false
        // Backward-compatible field for old API payloads
        if (coupon.used_by_current_user && (coupon.max_usage_per_user == null || coupon.max_usage_per_user <= 1)) return false
        // Out of total usage limit (in case backend still returned it)
        if (coupon.max_usage != null && coupon.current_usage != null && coupon.current_usage >= coupon.max_usage) return false
        // Order total less than minimum order amount
        if (coupon.min_order_amount && totalPrice < coupon.min_order_amount) return false
        // Backend does not allow stacking two FREE_SHIPPING coupons
        if (coupon.discount_type === 'FREE_SHIPPING') {
            if (scope === 'platform' && selectedShopCoupon?.discount_type === 'FREE_SHIPPING') return false
            if (scope === 'shop' && selectedPlatformCoupon?.discount_type === 'FREE_SHIPPING') return false
        }
        return true
    }

    // Vertical layout for scrollable sections (Shopee-style)
    if (isHorizontal) {
        return (
            <div className='w-full space-y-6'>
                {/* Payment Method Section */}
                <div className='bg-white border border-slate-200 rounded-xl p-6'>
                    <h3 className='text-lg font-semibold text-slate-800 mb-4'>Payment method</h3>
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                        <label htmlFor="COD-h" className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition ${paymentMethod === 'COD' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                            <input type="radio" id="COD-h" name='payment-h' onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className='accent-green-600' />
                            <span className='w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600'>COD</span>
                            <span className='text-sm text-slate-700 font-medium text-center'>Cash on Delivery</span>
                        </label>
                        <label htmlFor="VNPAY-h" className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition ${paymentMethod === 'VNPAY' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                            <input type="radio" id="VNPAY-h" name='payment-h' onChange={() => setPaymentMethod('VNPAY')} checked={paymentMethod === 'VNPAY'} className='accent-green-600' />
                            <div className='w-16 h-16 flex items-center justify-center'>
                                <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-VNPAY-QR.png" alt="VNPay" className='w-full h-full object-contain' />
                            </div>
                            <span className='text-sm text-slate-700 font-medium'>VNPay</span>
                        </label>
                        <label htmlFor="PAYPAL-h" className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition ${paymentMethod === 'PAYPAL' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                            <input type="radio" id="PAYPAL-h" name='payment-h' onChange={() => setPaymentMethod('PAYPAL')} checked={paymentMethod === 'PAYPAL'} className='accent-green-600' />
                            <div className='w-16 h-16 flex items-center justify-center'>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className='w-full h-full object-contain' />
                            </div>
                            <span className='text-sm text-slate-700 font-medium'>PayPal</span>
                        </label>
                        <label htmlFor="MOMO-h" className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition ${paymentMethod === 'MOMO' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                            <input type="radio" id="MOMO-h" name='payment-h' onChange={() => setPaymentMethod('MOMO')} checked={paymentMethod === 'MOMO'} className='accent-green-600' />
                            <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Circle.png" alt="MoMo" className='w-16 h-16 object-contain' onError={e => { e.target.style.display='none' }} />
                            <span className='text-sm text-slate-700 font-medium'>MoMo</span>
                        </label>
                    </div>
                </div>

                {/* Address Section */}
                <div className='bg-white border border-slate-200 rounded-xl p-6'>
                    <h3 className='text-lg font-semibold text-slate-800 mb-4'>Shipping Address</h3>
                    {selectedAddress ? (
                        <div className='flex items-start justify-between gap-4 bg-slate-50 border border-slate-200 rounded-lg p-5'>
                            <div className='flex-1'>
                                <p className='text-base font-medium text-slate-800 mb-1'>{selectedAddress.receiver_name}</p>
                                <p className='text-sm text-slate-600'>{selectedAddress.full_address || ''}</p>
                                <p className='text-sm text-slate-500 mt-1'>{selectedAddress.phone_number || ''}</p>
                            </div>
                            <button 
                                onClick={() => setShowAddressModal(true)}
                                className='flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg px-4 py-2 hover:bg-white transition shrink-0'
                            >
                                <SquarePenIcon size={16} />
                                <span>Change</span>
                            </button>
                        </div>
                    ) : (
                        <button 
                            className='w-full flex items-center justify-center gap-3 text-base text-slate-600 hover:text-slate-800 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg px-6 py-5 hover:bg-slate-100 transition' 
                            onClick={() => setShowAddressModal(true)}
                        >
                            <PlusIcon size={20} /> 
                            <span>Add shipping address</span>
                        </button>
                    )}
                </div>

                {/* Warehouse Info Section */}
                <WarehouseInfoSection shopId={shopId} selectedAddress={selectedAddress} items={items} />

                {/* Coupons Section */}
                <div className='bg-white border border-slate-200 rounded-xl p-6'>
                    <h3 className='text-lg font-semibold text-slate-800 mb-4'>Discount Codes</h3>
                    <div className='space-y-3'>
                        {/* Platform Coupon */}
                        <div>
                            {selectedPlatformCoupon ? (
                                <div className='flex items-center justify-between bg-red-50 border-2 border-red-200 rounded-lg p-4'>
                                    <div className='flex items-center gap-3'>
                                        <TagIcon size={20} className='text-red-500' />
                                        <div>
                                            <p className='text-base font-semibold text-red-600'>{selectedPlatformCoupon.code}</p>
                                            <p className='text-sm text-red-500'>{formatDiscount(selectedPlatformCoupon)}</p>
                                        </div>
                                    </div>
                                    <XIcon size={18} onClick={() => setSelectedPlatformCoupon(null)} className='cursor-pointer text-red-400 hover:text-red-600' />
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setShowCouponModal('platform'); fetchPlatformCoupons(); }}
                                    className='w-full flex items-center justify-between border-2 border-dashed border-red-300 rounded-lg px-5 py-4 hover:bg-red-50 transition text-left'
                                >
                                    <div className='flex items-center gap-3'>
                                        <TagIcon size={20} className='text-red-500' />
                                        <span className='text-base font-medium text-red-600'>Select GoCart coupon</span>
                                    </div>
                                    <span className='text-xl text-red-400'>›</span>
                                </button>
                            )}
                        </div>
                        {/* Shop Coupon */}
                        <div>
                            {selectedShopCoupon ? (
                                <div className='flex items-center justify-between bg-orange-50 border-2 border-orange-200 rounded-lg p-4'>
                                    <div className='flex items-center gap-3'>
                                        <TicketIcon size={20} className='text-orange-500' />
                                        <div>
                                            <p className='text-base font-semibold text-orange-600'>{selectedShopCoupon.code}</p>
                                            <p className='text-sm text-orange-500'>{formatDiscount(selectedShopCoupon)}</p>
                                        </div>
                                    </div>
                                    <XIcon size={18} onClick={() => setSelectedShopCoupon(null)} className='cursor-pointer text-orange-400 hover:text-orange-600' />
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setShowCouponModal('shop'); fetchShopCoupons(); }}
                                    className='w-full flex items-center justify-between border-2 border-dashed border-orange-300 rounded-lg px-5 py-4 hover:bg-orange-50 transition text-left'
                                >
                                    <div className='flex items-center gap-3'>
                                        <TicketIcon size={20} className='text-orange-500' />
                                        <span className='text-base font-medium text-orange-600'>Select Shop coupon</span>
                                    </div>
                                    <span className='text-xl text-orange-400'>›</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Note Section */}
                <div className='bg-white border border-slate-200 rounded-xl p-6'>
                    <h3 className='text-lg font-semibold text-slate-800 mb-4'>Note to shop owner (optional)</h3>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add a note for the shop owner..."
                        maxLength={500}
                        rows={4}
                        className='w-full border-2 border-slate-300 rounded-lg px-4 py-3 text-base text-slate-700 outline-none focus:border-slate-500 resize-none'
                    />
                    <p className='text-sm text-slate-400 mt-2 text-right'>{note.length}/500</p>
                </div>

                {/* Price Summary Section */}
                <div className='bg-white border border-slate-200 rounded-xl p-6'>
                    <h3 className='text-lg font-semibold text-slate-800 mb-4'>Order Summary</h3>
                    <div className='space-y-3'>
                        <div className='flex justify-between items-center text-base'>
                            <span className='text-slate-600'>Subtotal:</span>
                            <span className='text-green-600 font-semibold'>{currency}{totalPrice.toFixed(2)}</span>
                        </div>
                        <div className='flex justify-between items-center text-base'>
                            <div className='flex items-center gap-2 text-slate-600'>
                                <TruckIcon size={16} />
                                <span>Shipping:</span>
                                <span className="ml-1 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded" title="GHN Express">GHN</span>
                            </div>
                            {!selectedAddress
                                ? <span className='text-slate-400 text-sm'>Select address</span>
                                : loadingShipping
                                    ? <span className='text-slate-400 flex items-center gap-1 text-sm'><LoaderCircle size={14} className='animate-spin' /> Calculating...</span>
                                    : shippingFee > 0
                                        ? <span className="text-green-600 font-semibold">{currency}{shippingFee.toFixed(2)}</span>
                                        : <span className='text-green-600 font-semibold'>Free</span>}
                        </div>

                        {/* Shipping Method Selector */}
                        {availableServices.length > 1 && selectedAddress && (
                            <div className="flex items-center gap-2 pl-6">
                                <span className="text-xs text-slate-500 shrink-0">Method:</span>
                                <select
                                    value={selectedServiceType}
                                    onChange={(e) => setSelectedServiceType(Number(e.target.value))}
                                    className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded-md outline-none focus:border-green-400 bg-white"
                                >
                                    {availableServices.map(svc => (
                                        <option key={svc.service_type_id} value={svc.service_type_id}>
                                            {svc.short_name || (svc.service_type_id === 1 ? 'Express' : svc.service_type_id === 2 ? 'Standard' : svc.service_type_id === 5 ? 'Same Day' : `Service ${svc.service_type_id}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {platformDiscount > 0 && (
                            <div className='flex justify-between items-center text-base'>
                                <span className='text-slate-600'>GoCart coupon:</span>
                                <span className='text-red-500 font-semibold'>-{currency}{platformDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        {shopDiscount > 0 && (
                            <div className='flex justify-between items-center text-base'>
                                <span className='text-slate-600'>Shop coupon:</span>
                                <span className='text-orange-500 font-semibold'>-{currency}{shopDiscount.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                    <div className='border-t-2 border-slate-200 pt-4 mt-4'>
                        <div className='flex justify-between items-center'>
                            <span className='text-lg font-semibold text-slate-700'>Total:</span>
                            <span className='font-bold text-2xl text-green-600'>{currency}{finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Sticky Place Order Button - Bottom Right Corner */}
                {showPlaceOrderButton && (
                    <div className='fixed bottom-6 right-6 z-50'>
                        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4 min-w-[280px]">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm text-slate-600">Total:</span>
                                <span className="font-bold text-xl text-green-600">{currency}{finalTotal.toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={e => toast.promise(handlePlaceOrder(e), { 
                                    loading: ['VNPAY', 'PAYPAL', 'MOMO'].includes(paymentMethod) 
                                        ? `Redirecting to ${paymentMethod}...` 
                                        : 'Placing order...' 
                                })} 
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold text-base transition active:scale-95 shadow-lg"
                            >
                                {['VNPAY', 'PAYPAL', 'MOMO'].includes(paymentMethod) ? `Pay with ${paymentMethod}` : 'Place Order'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Modals */}
                {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} onAddressSelected={setSelectedAddress} />}
                {showCouponModal && (
                    <div className='fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center' onClick={() => setShowCouponModal(null)}>
                        <div className='bg-white rounded-2xl w-full max-w-md mx-4 max-h-[70vh] flex flex-col' onClick={e => e.stopPropagation()}>
                            <div className='flex items-center justify-between p-5 border-b border-slate-200'>
                                <h3 className='font-semibold text-slate-800'>
                                    {showCouponModal === 'platform' ? 'GoCart Coupons' : 'Shop Coupons'}
                                </h3>
                                <XIcon size={20} onClick={() => setShowCouponModal(null)} className='cursor-pointer text-slate-400 hover:text-slate-600' />
                            </div>
                            <div className='flex-1 overflow-y-auto p-4'>
                                {loadingCoupons ? (
                                    <p className='text-center text-slate-400 py-8'>Loading...</p>
                                ) : (showCouponModal === 'platform' ? platformCoupons : shopCoupons).length === 0 ? (
                                    <p className='text-center text-slate-400 py-8'>No coupons available</p>
                                ) : (
                                    <div className='flex flex-col gap-3'>
                                        {(showCouponModal === 'platform' ? platformCoupons : shopCoupons).map(coupon => {
                                            const applicable = isApplicable(coupon, showCouponModal)
                                            const isSelected = showCouponModal === 'platform'
                                                ? selectedPlatformCoupon?.id === coupon.id
                                                : selectedShopCoupon?.id === coupon.id

                                            return (
                                                <div key={coupon.id || coupon.code}
                                                    className={`border rounded-xl p-4 transition ${applicable
                                                        ? isSelected
                                                            ? 'border-red-400 bg-red-50'
                                                            : 'border-slate-200 hover:border-red-300 cursor-pointer'
                                                        : 'border-slate-100 bg-slate-50 opacity-50'}`}
                                                    onClick={() => {
                                                        if (!applicable) return
                                                        if (showCouponModal === 'platform') {
                                                            setSelectedPlatformCoupon(isSelected ? null : coupon)
                                                        } else {
                                                            setSelectedShopCoupon(isSelected ? null : coupon)
                                                        }
                                                        setShowCouponModal(null)
                                                    }}
                                                >
                                                    <div className='flex items-center gap-3'>
                                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${showCouponModal === 'platform' ? 'bg-red-100' : 'bg-orange-100'}`}>
                                                            {showCouponModal === 'platform'
                                                                ? <TagIcon size={20} className='text-red-500' />
                                                                : <TicketIcon size={20} className='text-orange-500' />
                                                            }
                                                        </div>
                                                        <div className='flex-1 min-w-0'>
                                                            <p className='font-semibold text-slate-800 text-sm'>{formatDiscount(coupon)}</p>
                                                            <p className='text-xs text-slate-400 mt-0.5'>
                                                                Code: <span className='font-mono font-medium'>{coupon.code}</span>
                                                            </p>
                                                            {coupon.min_order_amount > 0 && (
                                                                <p className='text-xs text-slate-400'>
                                                                    Min order: {currency}{Number(coupon.min_order_amount).toFixed(2)}
                                                                </p>
                                                            )}
                                                            {!applicable && (
                                                                <p className='text-xs text-red-400 mt-1'>
                                                                    {coupon.max_usage_per_user != null && coupon.current_user_usage_count != null
                                                                        && coupon.current_user_usage_count >= coupon.max_usage_per_user
                                                                        ? 'You reached per-user usage limit for this coupon'
                                                                        : coupon.used_by_current_user
                                                                            ? 'You have already used this coupon'
                                                                        : coupon.max_usage != null && coupon.current_usage != null && coupon.current_usage >= coupon.max_usage
                                                                            ? 'Coupon usage limit reached'
                                                                            : coupon.discount_type === 'FREE_SHIPPING'
                                                                                && ((showCouponModal === 'platform' && selectedShopCoupon?.discount_type === 'FREE_SHIPPING')
                                                                                    || (showCouponModal === 'shop' && selectedPlatformCoupon?.discount_type === 'FREE_SHIPPING'))
                                                                                ? 'Cannot stack two free-shipping coupons'
                                                                            : 'Minimum order amount not met'}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {isSelected && (
                                                            <div className='text-red-500 text-sm font-semibold'>✓</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Vertical layout (original)
    return (
        <div className='w-full max-w-lg lg:max-w-[380px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7'>
            <h2 className='text-xl font-medium text-slate-600'>Checkout</h2>

            {/* Payment Method */}
            <p className='text-slate-400 text-xs my-4'>Payment method</p>
            <div className='space-y-2'>
                <label htmlFor="COD" className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${paymentMethod === 'COD' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" id="COD" name='payment' onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className='accent-green-600' />
                    <div className='flex items-center gap-2 flex-1'>
                        <span className='w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600'>COD</span>
                        <span className='text-sm text-slate-700'>Cash on Delivery</span>
                    </div>
                </label>
                <label htmlFor="VNPAY" className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${paymentMethod === 'VNPAY' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" id="VNPAY" name='payment' onChange={() => setPaymentMethod('VNPAY')} checked={paymentMethod === 'VNPAY'} className='accent-green-600' />
                    <div className='flex items-center gap-2 flex-1'>
                        <div className='w-8 h-8 flex items-center justify-center'>
                            <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-VNPAY-QR.png" alt="VNPay" className='w-full h-full object-contain rounded' />
                        </div>
                        <span className='text-sm text-slate-700'>VNPay</span>
                    </div>
                </label>
                <label htmlFor="PAYPAL" className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${paymentMethod === 'PAYPAL' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" id="PAYPAL" name='payment' onChange={() => setPaymentMethod('PAYPAL')} checked={paymentMethod === 'PAYPAL'} className='accent-green-600' />
                    <div className='flex items-center gap-2 flex-1'>
                        <div className='w-8 h-8 flex items-center justify-center'>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className='w-full h-full object-contain rounded' />
                        </div>
                        <span className='text-sm text-slate-700'>PayPal</span>
                    </div>
                </label>
                <label htmlFor="MOMO" className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${paymentMethod === 'MOMO' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" id="MOMO" name='payment' onChange={() => setPaymentMethod('MOMO')} checked={paymentMethod === 'MOMO'} className='accent-green-600' />
                    <div className='flex items-center gap-2 flex-1'>
                        <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Circle.png" alt="MoMo" className='w-8 h-8 object-contain rounded' onError={e => { e.target.style.display='none' }} />
                        <span className='text-sm text-slate-700'>MoMo</span>
                    </div>
                </label>
            </div>

            {/* Shipping partner badge */}
            <div className='mt-3 flex items-center gap-2 text-xs text-slate-400'>
                <TruckIcon size={13} /> Shipped via
                <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/05/Logo-GHN-Orange.png" alt="GHN" className='h-4 object-contain' onError={e => { e.target.style.display='none' }} />
                <span className='text-slate-500 font-medium'>GHN Express</span>
            </div>

            {/* Shipping Method Selector (horizontal layout) */}
            {availableServices.length > 1 && selectedAddress && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-slate-500 shrink-0">Delivery:</span>
                    <select
                        value={selectedServiceType}
                        onChange={(e) => setSelectedServiceType(Number(e.target.value))}
                        className="text-xs px-2 py-1 border border-slate-200 rounded-md outline-none focus:border-green-400 bg-white"
                    >
                        {availableServices.map(svc => (
                            <option key={svc.service_type_id} value={svc.service_type_id}>
                                {svc.short_name || (svc.service_type_id === 1 ? 'Express' : svc.service_type_id === 2 ? 'Standard' : svc.service_type_id === 5 ? 'Same Day' : `Service ${svc.service_type_id}`)}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Address */}
            <div className='my-4 py-4 border-y border-slate-200 text-slate-400'>
                <p>Address</p>
                {
                    selectedAddress ? (
                        <div className='flex gap-2 items-center'>
                            <p>{selectedAddress.receiver_name}, {selectedAddress.full_address || ''}</p>
                            <SquarePenIcon onClick={() => setSelectedAddress(null)} className='cursor-pointer' size={18} />
                        </div>
                    ) : (
                        <div>
                            {
                                addressList.length > 0 && (
                                    <select className='border border-slate-400 p-2 w-full my-3 outline-none rounded' onChange={(e) => setSelectedAddress(addressList[e.target.value])} >
                                        <option value="">Select address</option>
                                        {
                                            addressList.map((address, index) => (
                                                <option key={index} value={index}>{address.receiver_name}, {address.full_address || ''}</option>
                                            ))
                                        }
                                    </select>
                                )
                            }
                            <button className='flex items-center gap-1 text-slate-600 mt-1' onClick={() => setShowAddressModal(true)} >Add address <PlusIcon size={18} /></button>
                        </div>
                    )
                }
            </div>

            {/* ─── Coupon Selection (Shopee-style) ─────────────────────── */}
            <div className='pb-4 border-b border-slate-200'>
                <p className='text-slate-400 text-xs mb-3'>Discount codes</p>

                {/* Platform Coupon */}
                <div className='mb-2'>
                    {selectedPlatformCoupon ? (
                        <div className='flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2'>
                            <div className='flex items-center gap-2'>
                                <TagIcon size={14} className='text-red-500' />
                                <div>
                                    <p className='text-xs font-semibold text-red-600'>{selectedPlatformCoupon.code}</p>
                                    <p className='text-xs text-red-500'>{formatDiscount(selectedPlatformCoupon)}</p>
                                </div>
                            </div>
                            <XIcon size={16} onClick={() => setSelectedPlatformCoupon(null)} className='cursor-pointer text-red-400 hover:text-red-600' />
                        </div>
                    ) : (
                        <button
                            onClick={() => { setShowCouponModal('platform'); fetchPlatformCoupons(); }}
                            className='w-full flex items-center justify-between border border-dashed border-red-300 rounded-lg px-3 py-2.5 hover:bg-red-50 transition text-red-500'
                        >
                            <span className='flex items-center gap-2 text-xs'>
                                <TagIcon size={14} />
                                Select GoCart coupon
                            </span>
                            <span className='text-xs'>›</span>
                        </button>
                    )}
                </div>

                {/* Shop Coupon */}
                <div>
                    {selectedShopCoupon ? (
                        <div className='flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-2'>
                            <div className='flex items-center gap-2'>
                                <TicketIcon size={14} className='text-orange-500' />
                                <div>
                                    <p className='text-xs font-semibold text-orange-600'>{selectedShopCoupon.code}</p>
                                    <p className='text-xs text-orange-500'>{formatDiscount(selectedShopCoupon)}</p>
                                </div>
                            </div>
                            <XIcon size={16} onClick={() => setSelectedShopCoupon(null)} className='cursor-pointer text-orange-400 hover:text-orange-600' />
                        </div>
                    ) : (
                        <button
                            onClick={() => { setShowCouponModal('shop'); fetchShopCoupons(); }}
                            className='w-full flex items-center justify-between border border-dashed border-orange-300 rounded-lg px-3 py-2.5 hover:bg-orange-50 transition text-orange-500'
                        >
                            <span className='flex items-center gap-2 text-xs'>
                                <TicketIcon size={14} />
                                Select Shop coupon
                            </span>
                            <span className='text-xs'>›</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Note to Shop Owner */}
            <div className='py-4 border-b border-slate-200'>
                <p className='text-slate-400 text-xs mb-2'>Note to shop owner (optional)</p>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note for the shop owner..."
                    maxLength={500}
                    rows={3}
                    className='w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500 resize-none'
                />
                <p className='text-xs text-slate-400 mt-1 text-right'>{note.length}/500</p>
            </div>

            {/* Price Summary */}
            <div className='py-4 border-b border-slate-200'>
                <div className='flex justify-between'>
                    <div className='flex flex-col gap-1 text-slate-400'>
                        <p>Subtotal:</p>
                        <p className='flex items-center gap-1'>
                            <TruckIcon size={13} /> Shipping:
                            <span className="ml-1 px-1.5 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded" title="GHN Express">GHN</span>
                        </p>
                        {platformDiscount > 0 && <p>GoCart coupon:</p>}
                        {shopDiscount > 0 && <p>Shop coupon:</p>}
                    </div>
                    <div className='flex flex-col gap-1 font-medium text-right'>
                        <p className='text-slate-800'>{currency}{totalPrice.toFixed(2)}</p>
                        <p className={shippingFee > 0 ? 'text-slate-700' : 'text-green-600'}>
                            {!selectedAddress
                                ? <span className='text-xs text-slate-400'>Select address</span>
                                : loadingShipping
                                    ? <span className='text-xs text-slate-400 flex items-center gap-1'><LoaderCircle size={12} className='animate-spin' /> Calculating...</span>
                                    : shippingFee > 0
                                        ? <span className="text-slate-800">{currency}{shippingFee.toFixed(2)}</span>
                                        : 'Free'}
                        </p>
                        {platformDiscount > 0 && <p className='text-red-500'>-{currency}{platformDiscount.toFixed(2)}</p>}
                        {shopDiscount > 0 && <p className='text-orange-500'>-{currency}{shopDiscount.toFixed(2)}</p>}
                    </div>
                </div>
            </div>

            <div className='flex justify-between py-4'>
                <p className='font-medium text-slate-700'>Total:</p>
                <p className='font-semibold text-lg text-slate-800'>{currency}{finalTotal.toFixed(2)}</p>
            </div>

            <button onClick={e => toast.promise(handlePlaceOrder(e), { loading: ['VNPAY', 'PAYPAL', 'MOMO'].includes(paymentMethod) ? `Redirecting to ${paymentMethod}...` : 'Placing order...' })} className='w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all'>
                {['VNPAY', 'PAYPAL', 'MOMO'].includes(paymentMethod) ? `Pay with ${paymentMethod}` : 'Place Order'}
            </button>

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}

            {/* ─── Coupon Selection Modal ─────────────────────────────── */}
            {showCouponModal && (
                <div className='fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center' onClick={() => setShowCouponModal(null)}>
                    <div className='bg-white rounded-2xl w-full max-w-md mx-4 max-h-[70vh] flex flex-col' onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className='flex items-center justify-between p-5 border-b border-slate-200'>
                            <h3 className='font-semibold text-slate-800'>
                                {showCouponModal === 'platform' ? 'GoCart Coupons' : 'Shop Coupons'}
                            </h3>
                            <XIcon size={20} onClick={() => setShowCouponModal(null)} className='cursor-pointer text-slate-400 hover:text-slate-600' />
                        </div>

                        {/* Coupon List */}
                        <div className='flex-1 overflow-y-auto p-4'>
                            {loadingCoupons ? (
                                <p className='text-center text-slate-400 py-8'>Loading...</p>
                            ) : (showCouponModal === 'platform' ? platformCoupons : shopCoupons).length === 0 ? (
                                <p className='text-center text-slate-400 py-8'>No coupons available</p>
                            ) : (
                                <div className='flex flex-col gap-3'>
                                    {(showCouponModal === 'platform' ? platformCoupons : shopCoupons).map(coupon => {
                                        const applicable = isApplicable(coupon, showCouponModal)
                                        const isSelected = showCouponModal === 'platform'
                                            ? selectedPlatformCoupon?.id === coupon.id
                                            : selectedShopCoupon?.id === coupon.id

                                        return (
                                            <div key={coupon.id || coupon.code}
                                                className={`border rounded-xl p-4 transition ${applicable
                                                    ? isSelected
                                                        ? 'border-red-400 bg-red-50'
                                                        : 'border-slate-200 hover:border-red-300 cursor-pointer'
                                                    : 'border-slate-100 bg-slate-50 opacity-50'}`}
                                                onClick={() => {
                                                    if (!applicable) return
                                                    if (showCouponModal === 'platform') {
                                                        setSelectedPlatformCoupon(isSelected ? null : coupon)
                                                    } else {
                                                        setSelectedShopCoupon(isSelected ? null : coupon)
                                                    }
                                                    setShowCouponModal(null)
                                                }}
                                            >
                                                <div className='flex items-center gap-3'>
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${showCouponModal === 'platform' ? 'bg-red-100' : 'bg-orange-100'}`}>
                                                        {showCouponModal === 'platform'
                                                            ? <TagIcon size={20} className='text-red-500' />
                                                            : <TicketIcon size={20} className='text-orange-500' />
                                                        }
                                                    </div>
                                                    <div className='flex-1 min-w-0'>
                                                        <p className='font-semibold text-slate-800 text-sm'>{formatDiscount(coupon)}</p>
                                                        <p className='text-xs text-slate-400 mt-0.5'>
                                                            Code: <span className='font-mono font-medium'>{coupon.code}</span>
                                                        </p>
                                                        {coupon.min_order_amount > 0 && (
                                                            <p className='text-xs text-slate-400'>
                                                                Min order: {currency}{Number(coupon.min_order_amount).toFixed(2)}
                                                            </p>
                                                        )}
                                                        {coupon.description && (
                                                            <p className='text-xs text-slate-500 mt-1'>{coupon.description}</p>
                                                        )}
                                                        {!applicable && (
                                                            <p className='text-xs text-red-400 mt-1'>
                                                                {coupon.max_usage_per_user != null && coupon.current_user_usage_count != null
                                                                    && coupon.current_user_usage_count >= coupon.max_usage_per_user
                                                                    ? 'You reached per-user usage limit for this coupon'
                                                                    : coupon.used_by_current_user
                                                                        ? 'You have already used this coupon'
                                                                    : coupon.max_usage != null && coupon.current_usage != null && coupon.current_usage >= coupon.max_usage
                                                                        ? 'Coupon usage limit reached'
                                                                        : coupon.discount_type === 'FREE_SHIPPING'
                                                                            && ((showCouponModal === 'platform' && selectedShopCoupon?.discount_type === 'FREE_SHIPPING')
                                                                                || (showCouponModal === 'shop' && selectedPlatformCoupon?.discount_type === 'FREE_SHIPPING'))
                                                                            ? 'Cannot stack two free-shipping coupons'
                                                                        : 'Minimum order amount not met'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {isSelected && (
                                                        <div className='text-red-500 text-sm font-semibold'>✓</div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Warehouse Info Section Component
function WarehouseInfoSection({ shopId, selectedAddress, items }) {
    const [warehouses, setWarehouses] = useState([])
    const [selectedWarehouse, setSelectedWarehouse] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!shopId) return

        const fetchWarehouses = async () => {
            try {
                setLoading(true)
                const shopWarehouses = await warehouseService.getShopWarehouses(shopId)
                setWarehouses(shopWarehouses || [])
                
                // Auto-select default warehouse or first warehouse
                if (shopWarehouses && shopWarehouses.length > 0) {
                    const defaultWh = shopWarehouses.find(w => w.isDefault) || shopWarehouses[0]
                    setSelectedWarehouse(defaultWh)
                }
            } catch (err) {
                console.error('Failed to load warehouses:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchWarehouses()
    }, [shopId])

    if (!shopId || warehouses.length === 0) return null

    return (
        <div className='bg-white border border-slate-200 rounded-xl p-6'>
            <h3 className='text-lg font-semibold text-slate-800 mb-4'>Shipping from Warehouse</h3>
            {loading ? (
                <div className="flex items-center gap-2 text-slate-400">
                    <LoaderCircle size={16} className="animate-spin" />
                    <span className="text-sm">Loading warehouse info...</span>
                </div>
            ) : selectedWarehouse ? (
                <div className='bg-green-50 border-2 border-green-200 rounded-lg p-4'>
                    <div className='flex items-start gap-3'>
                        <Package size={20} className='text-green-600 mt-0.5 shrink-0' />
                        <div className='flex-1'>
                            <p className='text-base font-semibold text-green-800 mb-1'>{selectedWarehouse.name}</p>
                            {selectedWarehouse.fullAddress && (
                                <p className='text-sm text-green-700'>{selectedWarehouse.fullAddress}</p>
                            )}
                            <p className='text-xs text-green-600 mt-2'>
                                Your order will be fulfilled from this warehouse
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className='bg-slate-50 border border-slate-200 rounded-lg p-4'>
                    <p className='text-sm text-slate-500'>Warehouse will be selected automatically based on your shipping address</p>
                </div>
            )}
        </div>
    )
}

export default OrderSummary
