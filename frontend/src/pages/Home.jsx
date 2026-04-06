import Hero from "@/components/Hero";
import Newsletter from "@/components/ui/Newsletter";
import OurSpecs from "@/components/ui/OurSpec";
import MoreProducts from "@/components/MoreProducts";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/hooks/useAuth";
import { productService } from "@/services";
import { normalizeProduct } from "@/redux/features/product/productSlice";
import { useEffect, useState } from "react";

export default function Home() {
    const { isAuthenticated } = useAuth();
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        if (!isAuthenticated) return;
        productService.getRecommendationsForYou(20)
            .then(data => setRecommendations((data || []).map(normalizeProduct)))
            .catch(() => {});
    }, [isAuthenticated]);

    return (
        <div>
            <Hero />

            {/* Recommended For You */}
            {recommendations.length > 0 && (
                <div className="px-6 my-16 max-w-7xl mx-auto">
                    <h2 className="text-2xl font-semibold text-slate-800 mb-2">Recommended For You</h2>
                    <p className="text-sm text-slate-500 mb-8">Based on your browsing and purchase history</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        {recommendations.map(product => (
                            <ProductCard key={product.id} product={product} showSoldBadge />
                        ))}
                    </div>
                </div>
            )}

            <MoreProducts />
            <OurSpecs />
            <Newsletter />
        </div>
    );
}
