import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { productService } from '@/services';
import { normalizeProduct } from '@/redux/features/product/productSlice';

/**
 * CategoryShowcase — Amazon-style mini sections.
 * Hiển thị 4 boxes: mỗi box là 1 category cụ thể với top products của category đó.
 * Chỉ hiện category nào có sản phẩm thực.
 */

const SHOWCASE_CATEGORIES = [
  {
    key: 'Electronics',
    label: 'Top in Electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&h=250&auto=format&fit=crop',
  },
  {
    key: 'Fashion',
    label: 'Fashion Picks',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=400&h=250&auto=format&fit=crop',
  },
  {
    key: 'Home & Garden',
    label: 'Home & Living',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400&h=250&auto=format&fit=crop',
  },
  {
    key: 'Sports',
    label: 'Sports & Fitness',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&h=250&auto=format&fit=crop',
  },
];

function CategoryBox({ categoryName, label, defaultImage, categoryId }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }
    productService.getTopSellingByCategory(categoryId, 0, 4)
      .then((data) => {
        const items = (data?.content || []).map(normalizeProduct);
        setProducts(items.slice(0, 4));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categoryId]);

  const hasProducts = products.length > 0;

  if (!loading && !hasProducts) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      {/* Category header image */}
      <div
        className="relative h-36 bg-slate-100 cursor-pointer overflow-hidden"
        onClick={() => categoryId && navigate(`/shop?categoryId=${categoryId}`)}
      >
        <img
          src={defaultImage}
          alt={label}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3 text-white">
          <h3 className="font-bold text-base leading-tight">{label}</h3>
        </div>
      </div>

      {/* Product mini-grid */}
      <div className="flex-1 p-3">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-slate-100 rounded-lg mb-1" />
                <div className="h-2 bg-slate-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : hasProducts ? (
          <div className="grid grid-cols-2 gap-2">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/product/${p.id}`)}
                className="group text-left focus:outline-none"
              >
                <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden mb-1 group-hover:shadow-sm transition-shadow">
                  <img
                    src={p.images?.[0]?.url || p.thumbnail || `https://picsum.photos/seed/${p.id}/200/200`}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-tight">{p.name}</p>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Footer link */}
      {categoryId && (
        <button
          onClick={() => navigate(`/shop?categoryId=${categoryId}`)}
          className="px-3 pb-3 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors text-left"
        >
          See all in {label} →
        </button>
      )}
    </div>
  );
}

export default function CategoryShowcase() {
  const categories = useSelector((state) => state.category.list || []);

  // Map showcase configs to real category IDs
  const showcaseItems = SHOWCASE_CATEGORIES.map((config) => {
    const matched = categories.find(
      (c) => c.name?.toLowerCase() === config.key.toLowerCase()
    );
    return { ...config, categoryId: matched?.id || null };
  });

  // Only show boxes where we have a matching category
  const visible = showcaseItems.filter((item) => item.categoryId !== null);

  if (visible.length === 0) return null;

  return (
    <div>
      <div className={`grid gap-4 ${
        visible.length === 4 ? 'grid-cols-2 lg:grid-cols-4' :
        visible.length === 3 ? 'grid-cols-2 lg:grid-cols-3' :
        visible.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
      }`}>
        {visible.map((item) => (
          <CategoryBox
            key={item.key}
            categoryName={item.key}
            label={item.label}
            defaultImage={item.image}
            categoryId={item.categoryId}
          />
        ))}
      </div>
    </div>
  );
}
