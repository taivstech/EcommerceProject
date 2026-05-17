import { addToCart } from "@/redux/features/cart/cartSlice";
import { StarIcon, TagIcon } from "lucide-react";
import { useRouter } from "@/utils/compat";
import { useEffect, useMemo, useState } from "react";
import { Image } from "@/utils/compat";
import Counter from "./ui/Counter";
import { useDispatch, useSelector } from "react-redux";
import { productService } from "@/services";
import NumberBadge from "./ui/NumberBadge";
import { useAuth } from "@/hooks/useAuth";

const ProductDetails = ({ product }) => {
    const productId = product.id;
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$';

    const cartItems = useSelector(state => state.cart.items);
    const dispatch = useDispatch();
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    // ─── Attributes & Variants ──────────────────────────────────────────
    const attributes = product.attributes || [];
    const variants = product.variants || [];

    // State: selected variant when no attributes
    const [selectedVariantId, setSelectedVariantId] = useState(() => {
        if (attributes.length === 0 && variants.length > 0) {
            return variants[0]?.id || null;
        }
        return null;
    });

    // State: selected option per attribute group
    const [selectedOptions, setSelectedOptions] = useState(() => {
        // Pre-select first option of each attribute group
        const init = {};
        attributes.forEach((attr, gi) => {
            if (attr.options?.length > 0) {
                init[gi] = attr.options[0].id;
            }
        });
        return init;
    });

    // Compute active variant based on selected options
    const activeVariant = useMemo(() => {
        if (variants.length === 0) return null;
        
        // If no attributes, use selectedVariantId or first variant
        if (attributes.length === 0) {
            if (selectedVariantId) {
                return variants.find(v => v.id === selectedVariantId) || variants[0];
            }
            return variants[0];
        }

        // If has attributes, compute based on selected options
        const selectedIds = Object.values(selectedOptions);
        if (selectedIds.length === 0) return variants[0];

        return variants.find(v => {
            const variantAttrIds = (v.detailAttributes || []).map(da => da.id);
            return selectedIds.every(id => variantAttrIds.includes(id));
        }) || variants[0];
    }, [selectedOptions, selectedVariantId, variants, attributes]);

    // Active price: variant price → product price → minPrice → maxPrice → 0
    const activePrice = activeVariant?.price || product.price || product.minPrice || product.maxPrice || 0;
    const activeStock = activeVariant?.stock ?? null;

    // Price range text for multi-variant products
    const priceRange = useMemo(() => {
        if (variants.length <= 1) return null;
        const prices = variants.map(v => v.price).filter(Boolean);
        if (prices.length === 0) return null;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? null : { min, max };
    }, [variants]);

    // ─── Images ─────────────────────────────────────────────────────────
    // Product main image (single representative image)
    const productMainImage = product.mainImage || product.main_image_url || 
        (product.images && product.images.length > 0 
            ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url)
            : null) || "/no-image.png";

    // Gallery images: product main image + variant images (if any)
    const variantImages = variants
        .map(v => v.imageUrl || v.image_url)
        .filter(Boolean);
    
    const galleryImages = [productMainImage, ...variantImages].filter(Boolean);

    // Active variant image: if variant has image, use it; otherwise use product main image
    const activeVariantImage = activeVariant?.imageUrl || activeVariant?.image_url || productMainImage;

    const [mainImage, setMainImage] = useState(activeVariantImage);

    // Update main image when variant changes
    useEffect(() => {
        if (activeVariant) {
            const variantImg = activeVariant.imageUrl || activeVariant.image_url;
            setMainImage(variantImg || productMainImage);
        } else {
            setMainImage(productMainImage);
        }
    }, [activeVariant, productMainImage]);

    // When tier-1 option changes and has an image, switch to it (for attribute-based selection)
    const handleSelectOption = (gi, optionId) => {
        setSelectedOptions(prev => ({ ...prev, [gi]: optionId }));
        // Image will update via useEffect when activeVariant changes
    };

    // Cart item for current variant
    const cartItem = cartItems.find(item =>
        item.product_variant_id === activeVariant?.id || item.product_id === productId
    );

    const addToCartHandler = () => {
        if (!isAuthenticated) return router.push('/login');
        const variantId = activeVariant?.id || productId;
        dispatch(addToCart({ product_variant_id: variantId, quantity: 1 }));
    };

    // Fetch real rating stats from API
    const [ratingStats, setRatingStats] = useState(null)
    useEffect(() => {
        if (!productId) return
        productService.getProductRatingStats(productId)
            .then(stats => setRatingStats(stats))
            .catch(() => {})
    }, [productId])

    const apiAvg = ratingStats?.average_rating ?? ratingStats?.averageRating;
    const apiCount = ratingStats?.total_reviews ?? ratingStats?.totalReviews;

    const averageRating = apiAvg ? apiAvg : (product?.averageRating ?? product?.avgRating ?? product?.avg_rating ?? 0);
    const totalReviews = apiCount ? apiCount : (product?.ratingCount ?? product?.rating_count ?? 0);

    return (
        <div className="flex max-lg:flex-col gap-12">
            {/* ── Images ─────────────────────────────────────────── */}
            <div className="flex max-sm:flex-col-reverse gap-3">
                <div className="flex sm:flex-col gap-3">
                    {galleryImages.map((imgUrl, index) => (
                        <div key={index} onClick={() => setMainImage(imgUrl)} className={`bg-slate-100 flex items-center justify-center size-26 rounded-lg group cursor-pointer border-2 ${mainImage === imgUrl ? 'border-indigo-400' : 'border-transparent'}`}>
                            <Image src={imgUrl} className="group-hover:scale-103 group-active:scale-95 transition" alt="" width={45} height={45} />
                        </div>
                    ))}
                </div>
                <div className="flex justify-center items-center h-100 sm:size-113 bg-slate-100 rounded-lg">
                    <Image src={mainImage} alt="" width={250} height={250} />
                </div>
            </div>

            {/* ── Details ────────────────────────────────────────── */}
            <div className="flex-1">
                <h1 className="text-3xl font-semibold text-slate-800">{product.name}</h1>

                {/* Brand */}
                {product.brand && (
                    <p className="text-sm text-slate-500 mt-1">
                        Brand: <span className="font-medium text-slate-700">{product.brand}</span>
                    </p>
                )}

                {/* Rating & Sold */}
                <div className='flex items-center mt-2 gap-3'>
                    <div className='flex items-center'>
                        {Array(5).fill('').map((_, index) => (
                            <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                        ))}
                        <p className="text-sm ml-2 text-slate-500">{totalReviews} Reviews</p>
                    </div>
                    {(product.totalSold > 0 || product.total_sold > 0) && (
                        <span className="text-sm text-slate-400">| Sold <NumberBadge value={product.totalSold || product.total_sold} variant="text" size="sm" className="text-slate-400" /></span>
                    )}
                </div>

                {/* Price — show active variant price when selected, range as subtitle */}
                <div className="my-6">
                    <div className="flex items-center gap-3">
                        <p className="text-2xl font-semibold text-slate-800 font-num">
                            {currency}{Number(activePrice).toFixed(2)}
                        </p>
                        {typeof product.mrp === "number" && (
                            <p className="text-xl text-slate-400 line-through">{currency}{product.mrp.toFixed(2)}</p>
                        )}
                    </div>
                    {priceRange && (
                        <p className="text-sm text-slate-400 mt-1">
                            Price range: {currency}{priceRange.min.toFixed(2)} – {currency}{priceRange.max.toFixed(2)}
                        </p>
                    )}
                    {/* Show min/max price from product if available and different */}
                    {!priceRange && product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice && (
                        <p className="text-sm text-slate-400 mt-1">
                            Price range: {currency}{product.minPrice.toFixed(2)} – {currency}{product.maxPrice.toFixed(2)}
                        </p>
                    )}
                </div>

                {/* Stock info */}
                {activeVariant && activeStock !== null && (
                    <p className="text-sm text-slate-500 mb-4">
                        Stock: <span className={activeStock > 0 ? 'text-green-600' : 'text-red-500'}>{activeStock > 0 ? `${activeStock} available` : 'Out of stock'}</span>
                        {activeVariant.sku && <span className="ml-3 text-slate-400">SKU: {activeVariant.sku}</span>}
                    </p>
                )}

                {/* ─── Variant list (when no attributes) ─────────── */}
                {variants.length > 0 && attributes.length === 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-medium text-slate-700 mb-2">Available Variants</p>
                        <div className="flex flex-wrap gap-2">
                            {variants.map((variant, idx) => {
                                const isSelected = activeVariant?.id === variant.id;
                                return (
                                    <button
                                        key={variant.id || idx}
                                        type="button"
                                        onClick={() => {
                                            // Select this variant directly when no attributes
                                            setSelectedVariantId(variant.id);
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded border text-sm transition
                                            ${isSelected
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                                            }`}
                                    >
                                        {variant.name || `Variant ${idx + 1}`}
                                        {variant.price && (
                                            <span className="text-slate-800 font-semibold ml-1">{currency}{Number(variant.price).toFixed(2)}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ─── Attribute selectors (Shopee-style) ─────────── */}
                {attributes.map((attr, gi) => (
                    <div key={gi} className="mb-4">
                        <p className="text-sm font-medium text-slate-700 mb-2">{attr.name}</p>
                        <div className="flex flex-wrap gap-2">
                            {(attr.options || []).map((opt) => {
                                const isSelected = selectedOptions[gi] === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => handleSelectOption(gi, opt.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded border text-sm transition
                                            ${isSelected
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                                            }`}
                                    >
                                        {opt.imageUrl && (
                                            <Image src={opt.imageUrl} alt={opt.name} width={24} height={24} className="rounded object-cover w-6 h-6" />
                                        )}
                                        {opt.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Selected variant label */}
                {activeVariant && (
                    <p className="text-sm text-slate-500 mb-4">
                        {activeVariant.name && attributes.length > 0 && (
                            <>
                                Selected: <span className="font-medium text-slate-700">{activeVariant.name}</span>
                                {activeVariant.price && (
                                    <span className="ml-2 text-slate-800 font-semibold">{currency}{Number(activeVariant.price).toFixed(2)}</span>
                                )}
                            </>
                        )}
                        {!attributes.length && variants.length > 0 && (
                            <>
                                Variant: <span className="font-medium text-slate-700">{activeVariant.name || 'Default'}</span>
                                {activeVariant.price && (
                                    <span className="ml-2 text-slate-800 font-semibold">{currency}{Number(activeVariant.price).toFixed(2)}</span>
                                )}
                            </>
                        )}
                    </p>
                )}

                {/* ─── Add to cart ────────────────────────────────── */}
                <div className="flex items-end gap-5 mt-6">
                    {cartItem && (
                        <div className="flex flex-col gap-3">
                            <p className="text-lg text-slate-800 font-semibold">Quantity</p>
                            <Counter cartItemId={cartItem.id} currentQuantity={cartItem.quantity} />
                        </div>
                    )}
                    <button
                        onClick={() => {
                            if (!isAuthenticated) return router.push('/login');
                            !cartItem ? addToCartHandler() : router.push('/cart');
                        }}
                        disabled={activeStock !== null && activeStock <= 0}
                        className="bg-slate-800 text-white px-10 py-3 text-sm font-medium rounded hover:bg-slate-900 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {activeStock !== null && activeStock <= 0 ? 'Out of Stock' : (!cartItem ? 'Add to Cart' : 'View Cart')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProductDetails
