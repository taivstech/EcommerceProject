import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * CategoryGrid — Hiển thị categories bằng ảnh thực tế, không dùng icon AI.
 * - Nếu không có categories từ DB → ẩn hoàn toàn section này
 * - Mỗi category dẫn đến /shop?categoryId=<id>
 */

// Valid, non-expiring Unsplash IDs for categories
const CATEGORY_IMAGES = {
  'Industrial & Scientific': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400&h=300&auto=format&fit=crop',
  'Patio & Garden': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=400&h=300&auto=format&fit=crop',
  'Toys & Games': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=400&h=300&auto=format&fit=crop',
  'Beauty': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=400&h=300&auto=format&fit=crop',
  'Movies & TV': 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=400&h=300&auto=format&fit=crop',
  'Tools & Home Improvement': 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=400&h=300&auto=format&fit=crop',
  'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&h=300&auto=format&fit=crop',
  'Office Products': 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=400&h=300&auto=format&fit=crop',
  'Fashion': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=400&h=300&auto=format&fit=crop',
  'Video Games': 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=400&h=300&auto=format&fit=crop',
  'Health & Personal Care': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=400&h=300&auto=format&fit=crop',
  'Pet Supplies': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=400&h=300&auto=format&fit=crop',
  'Sports & Outdoors': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&h=300&auto=format&fit=crop',
  'Home & Kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=400&h=300&auto=format&fit=crop',
  'Musical Instruments': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=400&h=300&auto=format&fit=crop',
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=400&h=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=400&h=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400&h=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400&h=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1524289286702-f07229da36f5?q=80&w=400&h=300&auto=format&fit=crop'
];

function getCategoryImage(cat) {
  // Ignore DB imagekit image per user request
  const name = cat.name;
  if (!name) return FALLBACK_IMAGES[0];

  // Exact match first
  if (CATEGORY_IMAGES[name]) return CATEGORY_IMAGES[name];
  
  // Partial match
  const lower = name.toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return url;
    }
  }

  // Fallback hashing
  const charCode = (cat.id || name).toString().charCodeAt(0) || 0;
  return FALLBACK_IMAGES[charCode % FALLBACK_IMAGES.length];
}

const CategoryGrid = () => {
  const categories = useSelector((state) => state.category.list || []);
  const navigate = useNavigate();

  const displayCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return categories.slice(0, 10);
  }, [categories]);

  // Hide if no real categories exist
  if (displayCategories.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Shop by Category</h2>
        <button
          onClick={() => navigate('/shop')}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-5 gap-3">
        {displayCategories.map((cat) => {
          const imgSrc = getCategoryImage(cat);
          return (
            <button
              key={cat.id}
              onClick={() => navigate(`/shop?categoryId=${encodeURIComponent(cat.id)}`)}
              className="group flex flex-col items-center gap-2 focus:outline-none"
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 group-hover:shadow-md transition-shadow duration-200">
                <img
                  src={imgSrc}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 text-center leading-tight">
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryGrid;
