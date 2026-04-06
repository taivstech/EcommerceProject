import React, { useMemo, useRef } from 'react'
import Title from './ui/Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const BestSelling = () => {

    const displayQuantity = 8
    const products = useSelector(state => state.product.list)
    const scrollerRef = useRef(null)

    const list = useMemo(() => {
        return (products || [])
            .slice()
            .sort((a, b) => {
                // Sort by total sold (descending)
                const aSold = a?.totalSold || a?.total_sold || 0
                const bSold = b?.totalSold || b?.total_sold || 0
                return bSold - aSold
            })
            .slice(0, displayQuantity)
    }, [products])

    const scrollByCards = (dir) => {
        const el = scrollerRef.current
        if (!el) return
        const amount = Math.max(320, Math.floor(el.clientWidth * 0.85))
        el.scrollBy({ left: dir * amount, behavior: 'smooth' })
    }

    return (
        <div className='px-6 my-16 max-w-7xl mx-auto'>
            <Title
                title='Best Selling'
                description={`Showing ${list.length} of ${(products || []).length} products`}
                href='/shop'
                actionLabel='Shop all products'
                rightSlot={
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            onClick={() => scrollByCards(-1)}
                            className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition"
                            aria-label="Previous best selling products"
                        >
                            <ChevronLeft size={18} className="text-slate-700" />
                        </button>
                        <button
                            onClick={() => scrollByCards(1)}
                            className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition"
                            aria-label="Next best selling products"
                        >
                            <ChevronRight size={18} className="text-slate-700" />
                        </button>
                    </div>
                }
            />

            <div className='mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6'>
                {list.map((product, index) => (
                    <ProductCard key={product.id || index} product={product} />
                ))}
            </div>
        </div>
    )
}

export default BestSelling