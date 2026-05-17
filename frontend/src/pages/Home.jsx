import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "@/utils/compat";

import { useAuth } from "@/hooks/useAuth";
import { productService } from "@/services";
import { normalizeProduct } from "@/redux/features/product/productSlice";

import ProductCard from "@/components/ProductCard";

// Home components
import HeroBanner from "@/components/home/HeroBanner";
import CategoryGrid from "@/components/home/CategoryGrid";
import BrandMall from "@/components/home/BrandMall";
import CategoryShowcase from "@/components/home/CategoryShowcase";
import NewArrivals from "@/components/home/NewArrivals";

export default function Home() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [bestSellers, setBestSellers] = useState([]);

    useEffect(() => {
        productService.getTopSellingProducts(0, 8)
            .then(data => setBestSellers((data?.content || []).map(normalizeProduct)))
            .catch(() => {});
    }, []);

    return (
        <div className="bg-slate-50 min-h-screen pb-16">
            {/* SEO */}
            <Helmet>
                <title>EcommerceWeb - Smart shopping, maximum savings</title>
                <meta name="description" content="Discover millions of authentic products at the best prices on EcommerceWeb. Fast shipping, easy returns, secure payments." />
                <meta property="og:title" content="EcommerceWeb - Smart Shopping" />
                <meta property="og:description" content="Discover millions of authentic products at the best prices. Fast shipping, easy returns." />
                <meta property="og:type" content="website" />
                <meta name="robots" content="index, follow" />
            </Helmet>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-4">

                {/* 1. Hero Banner Carousel */}
                <HeroBanner />

                {/* 2. Category Grid — ẩn nếu không có category */}
                <CategoryGrid />

                {/* 3. Amazon-style Category Showcase boxes */}
                <CategoryShowcase />

                {/* 4. Official Brand Mall — ẩn nếu không có shop có logo */}
                <BrandMall />

                {/* 5. Best Sellers */}
                {bestSellers.length > 0 && (
                    <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={20} className="text-orange-500" />
                                <h2 className="text-lg font-bold text-slate-900">Best Sellers</h2>
                            </div>
                            <Link
                                href="/shop?sortBy=best_selling"
                                className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors group"
                            >
                                View All <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {bestSellers.map(product => (
                                <ProductCard key={`best-${product.id}`} product={product} showSoldBadge />
                            ))}
                        </div>
                    </section>
                )}

                {/* 6. New Arrivals (replaces Daily Discovery / Discover Products) */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <NewArrivals />
                </section>

                {/* 7. Guest Login CTA — chỉ hiện khi chưa đăng nhập */}
                {!isAuthenticated && (
                    <section className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-white text-center sm:text-left">
                            <h3 className="text-xl font-bold mb-1">Sign in for a better experience</h3>
                            <p className="text-slate-400 text-sm">
                                Get personalized recommendations, track your orders, and shop faster.
                            </p>
                        </div>
                        <div className="flex gap-3 flex-shrink-0">
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-white text-slate-900 font-semibold px-6 py-2.5 rounded-lg hover:bg-slate-100 transition-colors text-sm"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="border border-white/30 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm"
                            >
                                Register
                            </button>
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
}
