import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import { productService } from '@/services';
import { normalizeProduct } from '@/redux/features/product/productSlice';
import { Loader2 } from 'lucide-react';

const DiscoverFeed = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = async (pageToFetch) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await productService.getPublicProducts(pageToFetch, 10);
      const normalized = (data?.content || []).map(normalizeProduct);
      
      if (pageToFetch === 0) {
        setProducts(normalized);
      } else {
        setProducts(prev => [...prev, ...normalized]);
      }
      
      setHasMore(data.totalPages > pageToFetch + 1);
    } catch (error) {
      console.error('Error fetching discovery products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(0);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage);
  };

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Discover Products</h2>
          <div className="h-px flex-1 bg-slate-100 ml-4"></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mb-12">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="flex items-center gap-2 px-10 py-3 bg-white border-2 border-slate-200 hover:border-green-500 hover:text-green-600 text-slate-700 font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Loading...
                </>
              ) : (
                'Load More Products'
              )}
            </button>
          </div>
        )}

        {!hasMore && products.length > 0 && (
          <p className="text-center text-slate-400 text-sm font-medium">
            You've reached the end of the catalog
          </p>
        )}
      </div>
    </section>
  );
};

export default DiscoverFeed;
