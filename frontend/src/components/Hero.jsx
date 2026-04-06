import { useMemo } from 'react'
import { ArrowRightIcon, ChevronRightIcon, ShoppingBag, Shield, Truck, RefreshCw, TicketPercent } from 'lucide-react'
import { Link } from "@/utils/compat"
import { useRouter } from "@/utils/compat"
import { useSelector } from 'react-redux'

const Hero = () => {
    const router = useRouter()
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$'
    const categories = useSelector((state) => state.category.list || [])

    // Top categories for shortcuts (max 6)
    const topCategories = useMemo(() => {
        return categories.slice(0, 6)
    }, [categories])

    return (
        <div className='mx-6'>
            <div className='flex max-xl:flex-col gap-6 max-w-7xl mx-auto my-10'>
                {/* ── Main Hero Banner (Marketplace-style) ── */}
                <div 
                    onClick={() => router.push('/shop')}
                    className='relative flex-1 flex flex-col bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow'
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, #16a34a 1px, transparent 0)',
                            backgroundSize: '40px 40px'
                        }} />
                    </div>

                    <div className='relative p-6 sm:p-12 lg:p-16 flex flex-col justify-between min-h-[400px] sm:min-h-[480px]'>
                        {/* Middle: Headline + Category Shortcuts */}
                        <div className='flex-1 flex flex-col justify-center'>
                            <h2 className='text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight font-semibold text-slate-800 mb-4 max-w-2xl'>
                                Everything you need.
                                <span className='block text-green-600 mt-2'>All in one place.</span>
                            </h2>
                            <p className='text-base sm:text-lg text-slate-600 mb-6 max-w-xl'>
                                Shop fashion, electronics, home essentials, and more from trusted sellers.
                            </p>

                            {/* Category Shortcuts (Pills) */}
                            {topCategories.length > 0 && (
                                <div className='flex flex-wrap gap-2 mb-6'>
                                    {topCategories.map(cat => (
                                        <Link
                                            key={cat.id}
                                            href={`/shop?categoryId=${encodeURIComponent(cat.id)}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className='px-4 py-2 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 text-sm font-medium rounded-full shadow-sm hover:shadow-md transition border border-slate-100'
                                        >
                                            {cat.name}
                                        </Link>
                                    ))}
                                    <Link
                                        href='/shop'
                                        onClick={(e) => e.stopPropagation()}
                                        className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-full shadow-sm hover:shadow-md transition'
                                    >
                                        View All Categories →
                                    </Link>
                                </div>
                            )}

                            {/* Trust Signals */}
                            <div className='flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600 mb-6'>
                                <div className='flex items-center gap-1.5'>
                                    <Shield size={14} className="text-green-600" />
                                    <span>Verified Sellers</span>
                                </div>
                                <div className='flex items-center gap-1.5'>
                                    <Truck size={14} className="text-green-600" />
                                    <span>Fast Delivery</span>
                                </div>
                                <div className='flex items-center gap-1.5'>
                                    <RefreshCw size={14} className="text-green-600" />
                                    <span>Easy Returns</span>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <Link
                                href='/shop'
                                onClick={(e) => e.stopPropagation()}
                                className='inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-sm sm:text-base font-semibold py-3 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-xl group-hover:scale-105 active:scale-95 transition w-fit'
                            >
                                Start Shopping
                                <ChevronRightIcon className='group-hover:translate-x-1 transition' size={18} />
                            </Link>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-80 sm:h-80 opacity-10 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-tl from-green-400 to-emerald-300 rounded-full blur-3xl" />
                    </div>
                </div>

                {/* ── Side Banners ── */}
                <div className='flex flex-col gap-5 w-full xl:max-w-sm'>
                    {/* Shopping Banner */}
                    <Link 
                        href='/shop' 
                        className='flex-1 flex items-center justify-between bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-6 sm:p-8 group hover:shadow-lg transition-shadow border border-orange-100'
                    >
                        <div className='flex-1'>
                            <div className='inline-flex items-center gap-2 bg-orange-200/80 px-3 py-1 rounded-full mb-3'>
                                <ShoppingBag size={12} className="text-orange-600" />
                                <span className='text-xs font-semibold text-orange-700'>Shopping</span>
                            </div>
                            <p className='text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-orange-600 bg-clip-text text-transparent mb-2'>
                                Browse Products
                            </p>
                            <p className='text-sm text-slate-600 mb-4'>Discover thousands of items</p>
                            <p className='flex items-center gap-1 text-sm font-medium text-slate-700 group-hover:text-orange-600 transition'>
                                Shop now <ArrowRightIcon className='group-hover:translate-x-1 transition' size={16} />
                            </p>
                        </div>
                        <div className='w-24 h-24 sm:w-32 sm:h-32 bg-white/50 rounded-2xl flex items-center justify-center shrink-0'>
                            <ShoppingBag size={40} className="text-orange-400 opacity-60" />
                        </div>
                    </Link>

                    {/* Coupon Banner */}
                    <Link 
                        href='/shop?sort=discount' 
                        className='flex-1 flex items-center justify-between bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 sm:p-8 group hover:shadow-lg transition-shadow border border-blue-100'
                    >
                        <div className='flex-1'>
                            <div className='inline-flex items-center gap-2 bg-blue-200/80 px-3 py-1 rounded-full mb-3'>
                                <TicketPercent size={12} className="text-blue-600" />
                                <span className='text-xs font-semibold text-blue-700'>Coupon</span>
                            </div>
                            <p className='text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent mb-2'>
                                Up to 50% Off
                            </p>
                            <p className='text-sm text-slate-600 mb-4'>Limited time deals</p>
                            <p className='flex items-center gap-1 text-sm font-medium text-slate-700 group-hover:text-blue-600 transition'>
                                View deals <ArrowRightIcon className='group-hover:translate-x-1 transition' size={16} />
                            </p>
                        </div>
                        <div className='w-24 h-24 sm:w-32 sm:h-32 bg-white/50 rounded-2xl flex items-center justify-center shrink-0'>
                            <TicketPercent size={40} className="text-blue-400 opacity-60" />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Hero
