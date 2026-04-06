import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react"
import ProductCard from "@/components/ProductCard"
import { MoveLeftIcon, Package, Store, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, StarIcon, MapPin } from "lucide-react"
import { useRouter, useSearchParams } from "@/utils/compat"
import { useSelector } from "react-redux"
import { shopService, productService, searchService } from "@/services"
import { normalizeProduct } from "@/redux/features/product/productSlice"
import { useAuth } from "@/hooks/useAuth"
import { Link } from "@/utils/compat"

const PAGE_SIZE = 40

function ShopContent() {

    const searchParams = useSearchParams()
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const tab = searchParams.get('tab')
    const router = useRouter()

    const [activeTab, setActiveTab] = useState(tab === 'stores' ? 'stores' : 'products')
    const [stores, setStores] = useState([])
    const [storesLoading, setStoresLoading] = useState(false)
    const storesFetched = useRef(false)

    const [products, setProducts] = useState([])
    const [productsLoading, setProductsLoading] = useState(false)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [currentPage, setCurrentPage] = useState(0)

    const [sortBy, setSortBy] = useState('relevance')
    const [priceMin, setPriceMin] = useState('')
    const [priceMax, setPriceMax] = useState('')
    const [ratingFilter, setRatingFilter] = useState(0)

    const [expandedCategories, setExpandedCategories] = useState(false)
    const [expandedRating, setExpandedRating] = useState(true)

    const [locationFilter, setLocationFilter] = useState('')
    const [provinces, setProvinces] = useState([])
    const [expandedLocation, setExpandedLocation] = useState(true)

    const [priceDropdownOpen, setPriceDropdownOpen] = useState(false)
    const priceDropdownRef = useRef(null)

    const categories = useSelector(state => state.category.list)
    const { isAuthenticated } = useAuth()

    // Load provinces for location filter
    useEffect(() => {
        searchService.getProvinces().then(setProvinces).catch(() => {})
    }, [])

    useEffect(() => {
        const handleClick = (e) => {
            if (priceDropdownRef.current && !priceDropdownRef.current.contains(e.target)) {
                setPriceDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    useEffect(() => {
        setCurrentPage(0)
    }, [search, categoryId, sortBy, ratingFilter, locationFilter])

    useEffect(() => {
        setActiveTab(tab === 'stores' ? 'stores' : 'products')
    }, [tab])

    const loadProducts = useCallback(async () => {
        if (activeTab !== 'products') return
        setProductsLoading(true)
        try {
            let sortField = undefined
            let sortDir = undefined
            if (sortBy === 'price_asc') { sortField = 'minPrice'; sortDir = 'asc' }
            else if (sortBy === 'price_desc') { sortField = 'minPrice'; sortDir = 'desc' }
            else if (sortBy === 'newest') { sortField = 'createdAt'; sortDir = 'desc' }
            else if (sortBy === 'best_selling') { sortField = 'totalSold'; sortDir = 'desc' }

            if (search || categoryId || locationFilter) {
                const result = await searchService.searchProducts({
                    q: search || undefined,
                    categoryId: categoryId || undefined,
                    province: locationFilter || undefined,
                    minPrice: priceMin ? Number(priceMin) : undefined,
                    maxPrice: priceMax ? Number(priceMax) : undefined,
                    sortBy: sortField,
                    sortDir,
                    page: currentPage,
                    size: PAGE_SIZE,
                })

                const items = (result.content || []).map(item => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    minPrice: item.min_price != null ? Number(item.min_price) : null,
                    maxPrice: item.max_price != null ? Number(item.max_price) : null,
                    shopId: item.shop_id,
                    shopName: item.shop_name,
                    categoryId: item.category_id,
                    totalSold: item.total_sold || 0,
                    mainImage: item.main_image_url,
                    images: (item.image_urls || []).map(url => ({ url })),
                }))
                setProducts(items)
                setTotalPages(result.totalPages || 0)
                setTotalElements(result.totalElements || 0)

                if (isAuthenticated && search && search.trim()) {
                    searchService.saveSearchHistory(search.trim()).catch(() => {})
                }
            } else {
                const result = await productService.getPublicProducts(currentPage, PAGE_SIZE)
                const items = (result.content || []).map(normalizeProduct)
                setProducts(items)
                setTotalPages(result.totalPages || 0)
                setTotalElements(result.totalElements || 0)
            }
        } catch (error) {
            console.error('Failed to load products:', error)
            setProducts([])
            setTotalPages(0)
            setTotalElements(0)
        } finally {
            setProductsLoading(false)
        }
    }, [activeTab, search, categoryId, sortBy, priceMin, priceMax, currentPage, isAuthenticated, locationFilter])

    useEffect(() => {
        loadProducts()
    }, [loadProducts])

    const applyPriceFilter = () => {
        const min = Number(priceMin), max = Number(priceMax)
        if (priceMin && priceMax && min > max) return
        if (priceMin && min < 0) return
        if (priceMax && max < 0) return
        setCurrentPage(0)
        loadProducts()
    }

    const filteredProducts = ratingFilter > 0
        ? products.filter(p => (p.averageRating || p.rating || 0) >= ratingFilter)
        : products

    useEffect(() => {
        if (activeTab === 'stores' && !storesFetched.current) {
            storesFetched.current = true
            setStoresLoading(true)
            shopService.getPublicShops()
                .then(data => setStores(Array.isArray(data) ? data : []))
                .catch(() => setStores([]))
                .finally(() => setStoresLoading(false))
        }
    }, [activeTab])

    const filteredStores = useMemo(() => {
        const keyword = (search || '').trim().toLowerCase()
        if (!keyword) return stores
        return stores.filter(store => {
            const name = (store.name || '').toLowerCase()
            const desc = (store.description || '').toLowerCase()
            const addr = (store.address || '').toLowerCase()
            return name.includes(keyword) || desc.includes(keyword) || addr.includes(keyword)
        })
    }, [stores, search])

    const currentCategory = categoryId
        ? (categories || []).find(c => c.id === categoryId)
        : null

    const displayCategories = expandedCategories ? (categories || []) : (categories || []).slice(0, 5)

    const handleCategoryClick = (catId) => {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (catId) params.set('categoryId', catId)
        router.push(`/shop${params.toString() ? '?' + params.toString() : ''}`)
    }

    const handleSortClick = (value) => {
        if (value === 'price') {
            setPriceDropdownOpen(v => !v)
        } else {
            setSortBy(value)
            setPriceDropdownOpen(false)
        }
    }

    const sortLabel = sortBy === 'price_asc' ? 'Price' : sortBy === 'price_desc' ? 'Price' : null

    const goToPage = (page) => {
        if (page < 0 || page >= totalPages) return
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const paginationRange = () => {
        const range = []
        const maxVisible = 5
        let start = Math.max(0, currentPage - Math.floor(maxVisible / 2))
        let end = Math.min(totalPages, start + maxVisible)
        if (end - start < maxVisible) {
            start = Math.max(0, end - maxVisible)
        }
        for (let i = start; i < end; i++) range.push(i)
        return range
    }

    return (
        <div className="min-h-[70vh] mx-6">
            <div className="max-w-7xl mx-auto">

                <div className="flex items-center justify-between my-6">
                    <h1 onClick={() => router.push('/shop')} className="text-2xl text-slate-500 flex items-center gap-2 cursor-pointer">
                        {(search || categoryId) && <MoveLeftIcon size={20} />}
                        {currentCategory ? (
                            <>Category: <span className="text-slate-700 font-medium">{currentCategory.name}</span></>
                        ) : search ? (
                            <>Results for: <span className="text-slate-700 font-medium">"{search}"</span></>
                        ) : (
                            <>All <span className="text-slate-700 font-medium">Products</span></>
                        )}
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition ${
                                activeTab === 'products'
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Package size={16} />
                            Products
                        </button>
                        <button
                            onClick={() => setActiveTab('stores')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition ${
                                activeTab === 'stores'
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Store size={16} />
                            Stores
                        </button>
                    </div>
                </div>

                {activeTab === 'products' && (
                    <div className="flex gap-6">
                        {/* ═══ LEFT SIDEBAR — FILTERS ═══ */}
                        <aside className="hidden lg:block w-56 shrink-0">
                            <div className="sticky top-6 space-y-6">

                                {/* Location Filter */}
                                {provinces.length > 0 && (
                                    <div>
                                        <button
                                            onClick={() => setExpandedLocation(v => !v)}
                                            className="flex items-center justify-between w-full text-sm font-semibold text-slate-800 mb-3"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <MapPin size={14} />
                                                Location
                                            </span>
                                            {expandedLocation ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                        </button>
                                        {expandedLocation && (
                                            <div className="space-y-1">
                                                <label
                                                    className="flex items-center gap-2.5 py-1.5 cursor-pointer group"
                                                    onClick={() => setLocationFilter('')}
                                                >
                                                    <input
                                                        type="radio"
                                                        checked={!locationFilter}
                                                        readOnly
                                                        className="w-4 h-4 text-green-600 border-slate-300 focus:ring-green-500 cursor-pointer"
                                                    />
                                                    <span className={`text-sm ${!locationFilter ? 'text-slate-900 font-medium' : 'text-slate-600 group-hover:text-slate-800'}`}>
                                                        All Locations
                                                    </span>
                                                </label>
                                                {provinces.map(prov => (
                                                    <label
                                                        key={prov}
                                                        className="flex items-center gap-2.5 py-1.5 cursor-pointer group"
                                                        onClick={() => setLocationFilter(locationFilter === prov ? '' : prov)}
                                                    >
                                                        <input
                                                            type="radio"
                                                            checked={locationFilter === prov}
                                                            readOnly
                                                            className="w-4 h-4 text-green-600 border-slate-300 focus:ring-green-500 cursor-pointer"
                                                        />
                                                        <span className={`text-sm ${locationFilter === prov ? 'text-slate-900 font-medium' : 'text-slate-600 group-hover:text-slate-800'}`}>
                                                            {prov}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        <hr className="border-slate-200 mt-6" />
                                    </div>
                                )}

                                {/* Category Filter */}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800 mb-3">By Category</h3>
                                    <div className="space-y-1">
                                        {displayCategories.map(cat => (
                                            <label
                                                key={cat.id}
                                                className="flex items-center gap-2.5 py-1.5 cursor-pointer group"
                                                onClick={() => handleCategoryClick(categoryId === cat.id ? null : cat.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={categoryId === cat.id}
                                                    readOnly
                                                    className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                                />
                                                <span className={`text-sm ${categoryId === cat.id ? 'text-slate-900 font-medium' : 'text-slate-600 group-hover:text-slate-800'}`}>
                                                    {cat.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    {(categories || []).length > 5 && (
                                        <button
                                            onClick={() => setExpandedCategories(v => !v)}
                                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mt-2 font-medium"
                                        >
                                            {expandedCategories ? 'Show Less' : 'More'}
                                            {expandedCategories ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                        </button>
                                    )}
                                </div>

                                <hr className="border-slate-200" />

                                {/* Price Range Filter */}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800 mb-3">Price Range</h3>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={priceMin}
                                            onChange={e => setPriceMin(e.target.value)}
                                            placeholder="Min"
                                            className="w-full px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-green-400 font-num [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="text-slate-400 text-sm shrink-0">—</span>
                                        <input
                                            type="number"
                                            value={priceMax}
                                            onChange={e => setPriceMax(e.target.value)}
                                            placeholder="Max"
                                            className="w-full px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-green-400 font-num [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                    <button
                                        onClick={applyPriceFilter}
                                        className="w-full mt-2.5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition"
                                    >
                                        Apply
                                    </button>
                                </div>

                                <hr className="border-slate-200" />

                                {/* Rating Filter */}
                                <div>
                                    <button
                                        onClick={() => setExpandedRating(v => !v)}
                                        className="flex items-center justify-between w-full text-sm font-semibold text-slate-800 mb-3"
                                    >
                                        Rating
                                        {expandedRating ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                    </button>
                                    {expandedRating && (
                                        <div className="space-y-1.5">
                                            {[5, 4, 3, 0].map(r => (
                                                <label
                                                    key={r}
                                                    className="flex items-center gap-2.5 py-1 cursor-pointer group"
                                                    onClick={() => setRatingFilter(ratingFilter === r ? 0 : r)}
                                                >
                                                    <input
                                                        type="radio"
                                                        checked={ratingFilter === r}
                                                        readOnly
                                                        className="w-4 h-4 text-green-600 border-slate-300 focus:ring-green-500 cursor-pointer"
                                                    />
                                                    {r === 0 ? (
                                                        <span className="text-sm text-slate-600">All</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1">
                                                            {Array(5).fill(0).map((_, i) => (
                                                                <StarIcon key={i} size={13} className="text-transparent" fill={i < r ? "#FBBF24" : "#D1D5DB"} />
                                                            ))}
                                                            <span className="text-xs text-slate-500 ml-0.5">& Up</span>
                                                        </span>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>

                        {/* ═══ RIGHT — PRODUCTS AREA ═══ */}
                        <div className="flex-1 min-w-0">

                            {/* Sort Bar */}
                            <div className="flex items-center gap-1 mb-5 bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100">
                                <span className="text-sm text-slate-500 mr-2 shrink-0">Sort by</span>
                                {[
                                    { value: 'relevance', label: 'Relevance' },
                                    { value: 'newest', label: 'Newest' },
                                    { value: 'best_selling', label: 'Best Selling' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleSortClick(opt.value)}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                                            sortBy === opt.value
                                                ? 'bg-green-600 text-white'
                                                : 'text-slate-600 hover:bg-white hover:shadow-sm'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}

                                {/* Price Dropdown */}
                                <div className="relative" ref={priceDropdownRef}>
                                    <button
                                        onClick={() => handleSortClick('price')}
                                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition ${
                                            sortBy === 'price_asc' || sortBy === 'price_desc'
                                                ? 'bg-green-600 text-white'
                                                : 'text-slate-600 hover:bg-white hover:shadow-sm'
                                        }`}
                                    >
                                        Price
                                        <ChevronDown size={14} />
                                    </button>
                                    {priceDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[180px] overflow-hidden">
                                            <button
                                                onClick={() => { setSortBy('price_asc'); setPriceDropdownOpen(false) }}
                                                className={`w-full text-left px-4 py-2.5 text-sm transition ${
                                                    sortBy === 'price_asc' ? 'bg-green-50 text-green-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                Price: Low to High
                                            </button>
                                            <button
                                                onClick={() => { setSortBy('price_desc'); setPriceDropdownOpen(false) }}
                                                className={`w-full text-left px-4 py-2.5 text-sm transition ${
                                                    sortBy === 'price_desc' ? 'bg-green-50 text-green-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                Price: High to Low
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <span className="text-xs text-slate-400 ml-auto font-num shrink-0">
                                    {totalElements.toLocaleString()} product{totalElements !== 1 ? 's' : ''}
                                </span>

                                {/* Page indicator in sort bar */}
                                {totalPages > 1 && (
                                    <div className="flex items-center gap-1.5 ml-3 shrink-0">
                                        <span className="text-sm font-num text-slate-700 font-medium">
                                            {currentPage + 1}<span className="text-slate-400">/{totalPages}</span>
                                        </span>
                                        <button
                                            onClick={() => goToPage(currentPage - 1)}
                                            disabled={currentPage === 0}
                                            className="p-1 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            onClick={() => goToPage(currentPage + 1)}
                                            disabled={currentPage >= totalPages - 1}
                                            className="p-1 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Product Grid */}
                            {productsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                    <Package size={48} className="mb-3 opacity-30 animate-pulse" />
                                    <p>Loading products...</p>
                                </div>
                            ) : filteredProducts.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredProducts.map(product => (
                                        <ProductCard key={product.id} product={product} showSoldBadge={sortBy === 'best_selling'} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                    <Package size={48} className="mb-3 opacity-30" />
                                    <p>No products found</p>
                                    {(search || categoryId || priceMin || priceMax || locationFilter) && (
                                        <button
                                            onClick={() => router.push('/shop')}
                                            className="mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
                                        >
                                            Clear all filters
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Bottom Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-1 mt-10 mb-20">
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 0}
                                        className="px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    {paginationRange().map(page => (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            className={`w-9 h-9 rounded-lg text-sm font-medium font-num transition ${
                                                page === currentPage
                                                    ? 'bg-green-600 text-white'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {page + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage >= totalPages - 1}
                                        className="px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Stores Tab */}
                {activeTab === 'stores' && (
                    <div className="mb-32">
                        {storesLoading ? (
                            <div className="flex items-center justify-center py-20 text-slate-400">Loading stores...</div>
                        ) : filteredStores.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredStores.map(store => (
                                    <Link
                                        key={store.id}
                                        href={`/shop/${store.id}`}
                                        className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition bg-white group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xl font-bold flex-shrink-0 group-hover:bg-green-200 transition">
                                                {store.name?.charAt(0).toUpperCase() || 'S'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-800 truncate">{store.name}</h3>
                                                {store.address && (
                                                    <p className="text-xs text-slate-500 truncate mt-1">{store.address}</p>
                                                )}
                                            </div>
                                        </div>
                                        {store.description && (
                                            <p className="text-sm text-slate-500 mt-3 line-clamp-2">{store.description}</p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Store size={48} className="mb-3 opacity-30" />
                                <p>No stores found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function Shop() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]">Loading shop...</div>}>
            <ShopContent />
        </Suspense>
    )
}
