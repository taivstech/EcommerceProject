import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import ProductCard from "@/components/ProductCard";
import Loading from "@/components/ui/Loading";
import { useParams, Link } from "@/utils/compat";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { normalizeProduct } from "@/redux/features/product/productSlice";
import { productService } from "@/services";
import { behaviorService } from "@/services/behaviorService";
import { Helmet } from "react-helmet-async";
import { Layers, ShoppingBag } from "lucide-react";

export default function Product() {

    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [boughtTogether, setBoughtTogether] = useState([]);
    const products = useSelector(state => state.product.list);
    const categories = useSelector(state => state.category.list);

    useEffect(() => {
        const found = products.find((p) => p.id === productId);
        if (found) {
            setProduct(found);
            setLoading(false);
        } else {
            // Fetch from API directly (e.g., direct URL navigation)
            productService.getProductById(productId)
                .then(raw => {
                    if (raw) setProduct(normalizeProduct(raw));
                })
                .catch(() => {})
                .finally(() => setLoading(false));
        }
        scrollTo(0, 0);

        // Track VIEW behavior for recommendation training
        behaviorService.track({ eventType: "VIEW", productId, pageContext: "product_page" });
    }, [productId, products]);

    useEffect(() => {
        if (!productId) return;
        productService.getSimilarProducts(productId, 10)
            .then(data => setSimilarProducts((data || []).map(normalizeProduct)))
            .catch(() => {});
        productService.getBoughtTogether(productId, 10)
            .then(data => setBoughtTogether((data || []).map(normalizeProduct)))
            .catch(() => {});
    }, [productId]);

    if (loading) return <Loading />;

    // SEO: Build structured data for Google Product schema
    const productJsonLd = product ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description?.slice(0, 300) || product.name,
        image: product.images?.[0]?.url || product.imageUrl,
        brand: { "@type": "Brand", name: product.brand || product.shopName },
        offers: {
            "@type": "Offer",
            price: product.minPrice,
            priceCurrency: "VND",
            availability: product.totalSold > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            seller: { "@type": "Organization", name: product.shopName },
        },
        aggregateRating: product.avgRating ? {
            "@type": "AggregateRating",
            ratingValue: product.avgRating,
            ratingCount: product.ratingCount || 1,
            bestRating: 5,
            worstRating: 1,
        } : undefined,
    }) : null;

    const pageTitle = product ? `${product.name} | EcommerceWeb` : "Product | EcommerceWeb";
    const pageDescription = product
        ? (product.description?.slice(0, 155) || `Buy ${product.name} at the best price on EcommerceWeb.`)
        : "Discover quality products on EcommerceWeb.";
    const ogImage = product?.images?.[0]?.url || product?.imageUrl || "";

    return (
        <div className="mx-6 pb-16">
            {/* SEO Helmet */}
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:type" content="product" />
                <link rel="canonical" href={`${window.location.origin}/product/${productId}`} />
                {productJsonLd && (
                    <script type="application/ld+json">{productJsonLd}</script>
                )}
            </Helmet>
            <div className="max-w-7xl mx-auto">

                {/* Breadcrumbs */}
                <div className="text-gray-600 text-sm mt-8 mb-5 flex items-center gap-2">
                    <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
                    <span className="text-gray-400">/</span>
                    <Link href="/shop" className="hover:text-green-600 transition-colors">Products</Link>
                    <span className="text-gray-400">/</span>
                    <span className="font-medium text-gray-800">{categories?.find(c => c.id === product?.categoryId)?.name || '—'}</span>
                </div>

                {/* Product Details */}
                {product && (<ProductDetails product={product} />)}

                {/* Description & Reviews */}
                {product && (<ProductDescription product={product} />)}

                {/* Recommendations Section */}
                <div className="mt-20 space-y-20">
                    {/* Frequently Bought Together */}
                    {boughtTogether.length > 0 && (
                        <section className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Frequently Bought Together</h2>
                                    <p className="text-sm text-slate-500 mt-1">Customers who bought this product also bought these products</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                                {boughtTogether.map(p => (
                                    <ProductCard key={p.id} product={p} showSoldBadge />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Similar Products */}
                    {similarProducts.length > 0 && (
                        <section>
                            <div className="flex items-center gap-3 mb-8 px-2">
                                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shadow-inner">
                                    <Layers size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Similar Products</h2>
                                    <p className="text-sm text-slate-500 mt-1">You might also like these products from the same category</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                                {similarProducts.map(p => (
                                    <ProductCard key={p.id} product={p} showSoldBadge />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
