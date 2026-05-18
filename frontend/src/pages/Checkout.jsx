import OrderSummary from "@/components/OrderSummary";
import RequireAuth from "@/components/RequireAuth";
import { fetchCartItems } from "@/redux/features/cart/cartSlice";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "@/utils/compat";
import { Link } from "@/utils/compat";
import { productService } from "@/services";
import { normalizeProduct } from "@/redux/features/product/productSlice";

export default function Checkout() {
    return (
        <RequireAuth>
            <CheckoutContent />
        </RequireAuth>
    )
}

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const shopId = searchParams.get('shopId');

    const cartItems = useSelector(state => state.cart.items);
    const products = useSelector(state => state.product.list);
    const dispatch = useDispatch();

    const [fetchedProducts, setFetchedProducts] = useState([]);

    // Hide navbar for clean checkout experience
    useEffect(() => {
        const navbar = document.querySelector('nav');
        const footer = document.querySelector('footer');
        if (navbar) navbar.style.display = 'none';
        if (footer) footer.style.display = 'none';
        
        return () => {
            if (navbar) navbar.style.display = '';
            if (footer) footer.style.display = '';
        };
    }, []);

    useEffect(() => {
        dispatch(fetchCartItems());
    }, [dispatch]);

    useEffect(() => {
        if (!shopId) {
            router.push('/cart');
        }
    }, [shopId, router]);

    useEffect(() => {
        if (!cartItems.length) return;
        const fetchMissingProducts = async () => {
            const productIds = cartItems.map(item => item.product_id);
            const missingIds = productIds.filter(id => !products.find(p => p.id === id));
            if (missingIds.length === 0) {
                setFetchedProducts([]);
                return;
            }
            try {
                const productPromises = missingIds.map(id => productService.getProductById(id).catch(() => null));
                const fetched = (await Promise.all(productPromises)).filter(Boolean).map(normalizeProduct);
                setFetchedProducts(fetched);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            }
        };
        fetchMissingProducts();
    }, [cartItems, products]);

    const enrichedCartItems = useMemo(() => {
        if (!shopId) return [];
        const allProducts = [...products, ...fetchedProducts];
        return cartItems
            .map(item => {
                const product = allProducts.find(p => p.id === item.product_id);
                if (!product) return null;

                const variant = (product.variants || []).find(v => v.id === item.product_variant_id);
                const variantPrice = variant?.price ?? product.price ?? 0;
                const variantName = variant?.name || null;
                const productImage = product.images?.[0]?.url || (typeof product.images?.[0] === 'string' ? product.images[0] : '');
                const itemShopId = item.shop_id || product.shop_id || product.shop?.id;

                if (itemShopId !== shopId) return null;

                return {
                    ...item,
                    product: product,
                    productName: product.name || 'Unknown Product',
                    productImage,
                    productPrice: variantPrice,
                    variantName,
                    shopId: itemShopId,
                    shopName: product.shopName || 'Unknown Shop',
                };
            })
            .filter(item => item !== null);
    }, [cartItems, products, fetchedProducts, shopId]);

    const totalPrice = useMemo(() => {
        return enrichedCartItems.reduce((sum, item) => {
            return sum + (item.productPrice * item.quantity)
        }, 0)
    }, [enrichedCartItems]);

    if (!shopId) {
        return null;
    }

    if (enrichedCartItems.length === 0) {
        return (
            <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
                <h1 className="text-2xl sm:text-4xl font-semibold">No items found for selected shop</h1>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full overflow-x-hidden text-slate-800 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header with Logo and Payment Logos */}
                <div className="pt-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <Link href="/" className="relative text-3xl font-semibold text-slate-700">
                            <span className="text-green-600">go</span>cart<span className="text-green-600 text-4xl leading-0">.</span>
                            <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                                plus
                            </p>
                        </Link>
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Checkout</h1>
                        <p className="text-slate-500 mt-1">Review your order</p>
                    </div>
                </div>

                {/* Order Items - List Layout (Shopee-style) */}
                <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Order Items</h3>
                    <div className="space-y-6">
                        {enrichedCartItems.map((item, index) => (
                            <div key={item.id || index} className="flex items-start gap-4 pb-6 border-b border-slate-200 last:border-b-0 last:pb-0">
                                {/* Product Image */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                    {item.productImage && (
                                        <img src={item.productImage} className="w-full h-full rounded-lg object-contain p-2" alt={item.productName} />
                                    )}
                                </div>
                                
                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-800 text-base mb-1">{item.productName}</p>
                                    {item.variantName && (
                                        <p className="text-sm text-slate-500 mb-2">Variant: {item.variantName}</p>
                                    )}
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Unit Price</p>
                                                <p className="font-semibold text-green-600 text-base">
                                                    ${item.productPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Quantity</p>
                                                <p className="font-semibold text-slate-800 text-base">{item.quantity}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 mb-1">Total</p>
                                            <p className="font-bold text-green-600 text-lg">
                                                ${(item.productPrice * item.quantity).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scrollable Checkout Summary Section */}
            <div className="bg-white border-t border-slate-200 shadow-lg mt-8">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <OrderSummary 
                        totalPrice={totalPrice} 
                        items={enrichedCartItems} 
                        shopId={shopId} 
                        isHorizontal={true}
                        showPlaceOrderButton={true}
                    />
                </div>
            </div>
        </div>
    )
}
