import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Banner configs: linked to real category names in the DB
// fallbackLink is used when no matching category is found
const BANNER_CONFIGS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop',
    title: 'Super Tech Week',
    subtitle: 'Up to 50% off on Electronics',
    categoryName: 'Electronics',
    fallbackLink: '/shop',
    tag: 'Electronics',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop',
    title: 'Fashion Mega Sale',
    subtitle: 'New styles every day',
    categoryName: 'Fashion',
    fallbackLink: '/shop',
    tag: 'Fashion',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070&auto=format&fit=crop',
    title: 'Home & Living',
    subtitle: 'Upgrade your space',
    categoryName: 'Home & Garden',
    fallbackLink: '/shop',
    tag: 'Garden',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop',
    title: 'Sports & Fitness',
    subtitle: 'Gear up for your best performance',
    categoryName: 'Sports',
    fallbackLink: '/shop',
    tag: 'Fitness',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?q=80&w=2070&auto=format&fit=crop',
    title: 'Beauty & Skincare',
    subtitle: 'Discover your glow',
    categoryName: 'Beauty',
    fallbackLink: '/shop',
    tag: 'Beauty',
  },
];

export default function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const categories = useSelector((state) => state.category.list || []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % BANNER_CONFIGS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + BANNER_CONFIGS.length) % BANNER_CONFIGS.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const handleBannerClick = (banner) => {
    // Try to find matching category from Redux store using partial match
    const tagLower = banner.tag.toLowerCase();
    const matchedCat = categories.find(
      (c) => c.name?.toLowerCase().includes(tagLower) || c.name?.toLowerCase() === banner.categoryName?.toLowerCase()
    );
    if (matchedCat) {
      navigate(`/shop?categoryId=${encodeURIComponent(matchedCat.id)}`);
    } else {
      navigate(banner.fallbackLink);
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-slate-900 rounded-xl group"
      style={{ aspectRatio: '21/7' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {BANNER_CONFIGS.map((banner) => (
          <div
            key={banner.id}
            className="min-w-full h-full relative cursor-pointer"
            onClick={() => handleBannerClick(banner)}
          >
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />
            {/* Text content */}
            <div className="absolute inset-0 flex items-center">
              <div className="px-8 sm:px-14 text-white max-w-lg">
                <span className="inline-block text-xs font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-3">
                  {banner.tag}
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold mb-2 drop-shadow-md leading-tight">
                  {banner.title}
                </h2>
                <p className="text-sm sm:text-lg text-slate-200 drop-shadow">
                  {banner.subtitle}
                </p>
                <span className="mt-5 inline-block bg-white text-slate-900 font-semibold text-sm px-5 py-2 rounded-full hover:bg-slate-100 transition-colors shadow">
                  Shop Now →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 z-10"
        aria-label="Previous banner"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 z-10"
        aria-label="Next banner"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {BANNER_CONFIGS.map((_, index) => (
          <button
            key={index}
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex ? 'bg-white w-6' : 'bg-white/50 w-1.5 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
