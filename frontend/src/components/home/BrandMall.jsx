import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { shopService } from '@/services';

/**
 * BrandMall — hiển thị danh sách shop/brand có trên nền tảng.
 * - "See All" dẫn đến /shop?view=mall (trang shop lọc theo mall)
 * - Click từng brand → /shop/:username (trang cửa hàng đó)
 * - Dùng data thực từ API, fallback sang logo placeholder nếu không có ảnh
 */
const PREMIUM_BRANDS = [
  { id: 'b1', name: 'Nike', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'b2', name: 'Apple', image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'b3', name: 'Samsung', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'b4', name: 'Adidas', image: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'b5', name: 'Sony', image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'b6', name: "L'Oreal", image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'b7', name: 'Asus', image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'b8', name: 'Zara', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'b9', name: 'Lego', image: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'b10', name: 'Disney', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'b11', name: 'Xiaomi', image: 'https://images.unsplash.com/photo-1505156868547-9b49f4df4e04?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'b12', name: 'H&M', image: 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?q=80&w=200&h=200&auto=format&fit=crop' },
];

export default function BrandMall() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {/* Simple red store badge — no AI-looking icon */}
          <div className="w-6 h-6 bg-rose-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Official Mall</h2>
        </div>
        <button
          onClick={() => navigate('/shop?view=mall')}
          className="text-rose-600 hover:text-rose-700 text-sm font-medium flex items-center gap-0.5 transition-colors"
        >
          See All <ChevronRight size={14} />
        </button>
      </div>

      {/* Brand grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {PREMIUM_BRANDS.map((brand) => {
            return (
              <button
                key={brand.id}
                onClick={() => navigate(`/shop?brand=${encodeURIComponent(brand.name)}`)}
                className="group flex flex-col items-center gap-2 focus:outline-none"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-slate-200 group-hover:border-rose-400 transition-all duration-200 shadow-sm group-hover:shadow-md bg-white">
                  <img
                    src={brand.image}
                    alt={brand.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-xs font-medium text-slate-600 group-hover:text-rose-600 transition-colors text-center leading-tight line-clamp-2 w-full">
                  {brand.name}
                </span>
              </button>
            );
          })}
        </div>
    </div>
  );
}
