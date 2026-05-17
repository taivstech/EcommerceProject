import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '@/services';
import { normalizeProduct } from '@/redux/features/product/productSlice';
import ProductCard from '@/components/ProductCard';
import { Loader2 } from 'lucide-react';

/**
 * NewArrivals — thay cho "Daily Discovery / Discover Products"
 * Hiển thị sản phẩm mới nhất, load more khi bấm.
 */
export default function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  const fetchProducts = async (pageToFetch) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await productService.getPublicProducts(pageToFetch, 10);
      const normalized = (data?.content || []).map(normalizeProduct);
      if (pageToFetch === 0) {
        setProducts(normalized);
      } else {
        setProducts((prev) => [...prev, ...normalized]);
      }
      setHasMore(data.totalPages > pageToFetch + 1);
    } catch (e) {
      console.error('Error fetching new arrivals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(0);
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">New Arrivals</h2>
        <button
          onClick={() => navigate('/shop?sortBy=newest')}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => {
              const next = page + 1;
              setPage(next);
              fetchProducts(next);
            }}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 bg-white border border-slate-300 hover:border-slate-500 text-slate-700 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <p className="mt-6 text-center text-slate-400 text-xs">
          You've seen all products
        </p>
      )}
    </section>
  );
}
