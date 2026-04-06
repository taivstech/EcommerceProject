import React, { useMemo, useRef } from 'react'
import Title from './ui/Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const LatestProducts = () => {

    const displayQuantity = 8
    const products = useSelector(state => state.product.list)
    const scrollerRef = useRef(null)

    const list = useMemo(() => {
        return (products || [])
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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
                title='Latest Products'
                description={`Showing ${list.length} of ${(products || []).length} products`}
                href='/shop'
                actionLabel='Shop all products'
                rightSlot={
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            onClick={() => scrollByCards(-1)}
                            className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition"
                            aria-label="Previous latest products"
                        >
                            <ChevronLeft size={18} className="text-slate-700" />
                        </button>
                        <button
                            onClick={() => scrollByCards(1)}
                            className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition"
                            aria-label="Next latest products"
                        >
                            <ChevronRight size={18} className="text-slate-700" />
                        </button>
                    </div>
                }
            />

            <div ref={scrollerRef} className='mt-10 flex gap-5 overflow-x-auto pb-2 no-scrollbar'>
                {list.map((product, index) => (
                    <div key={index} className='min-w-[260px] sm:min-w-[290px]'>
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default LatestProducts