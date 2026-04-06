import React, { useMemo } from 'react'
import { Link } from "@/utils/compat"
import { Image } from "@/utils/compat"
import Title from './ui/Title'
import { useSelector } from 'react-redux'

const CategorySection = () => {
  const categories = useSelector((state) => state.category.list)
  const products = useSelector((state) => state.product.list)

  const items = useMemo(() => {
    // pick representative image by categoryId from loaded products
    // and calculate total sold count for each category
    return (categories || []).map((c) => {
      const categoryProducts = (products || []).filter((x) => x.categoryId === c.id)
      const p = categoryProducts.find((x) => x.images?.[0]?.url) || categoryProducts[0]
      const rawImg = p?.images?.[0] || (products?.[0]?.images?.[0] ?? null)
      
      // Calculate total sold for this category
      const totalSold = categoryProducts.reduce((sum, product) => {
        const sold = product?.totalSold || product?.total_sold || 0
        return sum + sold
      }, 0)
      
      return {
        id: c.id,
        name: c.name,
        image: typeof rawImg === 'string' ? rawImg : rawImg?.url || null,
        href: `/shop?categoryId=${encodeURIComponent(c.id)}`,
        totalSold: totalSold,
      }
    }).sort((a, b) => b.totalSold - a.totalSold) // Sort by total sold (descending)
  }, [categories, products])

  return (
    <div className="px-6 mt-12 max-w-7xl mx-auto">
      <Title
        title="Categories"
        description="Browse by category"
        href="/shop"
        actionLabel="Shop all products"
      />

      {/* Grid layout: 5 columns, 2 rows (5 trên, 5 dưới) */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {items.slice(0, 10).map((c) => (
          <Link
            key={c.id}
            href={c.href}
            className="group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="bg-[#F5F5F5] h-32 sm:h-40 rounded-xl flex items-center justify-center">
              {c.image ? (
                <Image
                  width={200}
                  height={200}
                  className="max-h-22 sm:max-h-26 w-auto group-hover:scale-110 transition duration-300"
                  src={c.image}
                  alt={c.name}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-200" />
              )}
            </div>
            <p className="mt-3 text-sm text-slate-700 text-center line-clamp-2">{c.name}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default CategorySection

