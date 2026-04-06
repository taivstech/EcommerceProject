import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import ProductCard from "@/components/ProductCard";
import Loading from "@/components/ui/Loading";
import { useParams } from "@/utils/compat";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { normalizeProduct } from "@/redux/features/product/productSlice";
import { productService } from "@/services";

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

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">

                {/* Breadcrumbs */}
                <div className="text-gray-600 text-sm mt-8 mb-5">
                    Home / Products / {categories?.find(c => c.id === product?.categoryId)?.name || '—'}
                </div>

                {/* Product Details */}
                {product && (<ProductDetails product={product} />)}

                {/* Description & Reviews */}
                {product && (<ProductDescription product={product} />)}

                {/* Frequently Bought Together */}
                {boughtTogether.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-xl font-semibold text-slate-800 mb-6">Frequently Bought Together</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                            {boughtTogether.map(p => (
                                <ProductCard key={p.id} product={p} showSoldBadge />
                            ))}
                        </div>
                    </div>
                )}

                {/* Similar Products */}
                {similarProducts.length > 0 && (
                    <div className="mt-12 mb-16">
                        <h2 className="text-xl font-semibold text-slate-800 mb-6">Similar Products</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                            {similarProducts.map(p => (
                                <ProductCard key={p.id} product={p} showSoldBadge />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
