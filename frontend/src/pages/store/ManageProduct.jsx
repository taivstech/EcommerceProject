import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { Image } from "@/utils/compat"
import { Link } from "@/utils/compat"
import Loading from "@/components/ui/Loading"
import { productService } from "@/services"
import { Trash2Icon, PencilIcon } from "lucide-react"
import NumberBadge from "@/components/ui/NumberBadge"

export default function StoreManageProducts() {

    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])

    const fetchProducts = async () => {
        try {
            const page = await productService.getSellerProducts()
            setProducts(page.content || [])
        } catch (err) {
            console.error('Failed to load seller products:', err)
            toast.error('Failed to load products')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return
        try {
            await productService.deleteProduct(productId)
            toast.success('Product deleted')
            fetchProducts()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Delete failed')
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    if (loading) return <Loading />

    const computeTotalSold = (product) => {
        if (!product.variants || product.variants.length === 0) return product.total_sold || 0
        return product.variants.reduce((sum, v) => sum + (v.sold_count || v.soldCount || 0), 0) || product.total_sold || 0
    }

    const computeTotalStock = (product) => {
        if (!product.variants || product.variants.length === 0) return 0
        return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    }

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h1 className="text-2xl text-slate-500">Manage <span className="text-slate-800 font-medium">Products</span></h1>
                <Link href="/store/add-product" className="bg-slate-800 text-white px-4 py-2 text-sm rounded hover:bg-slate-900 transition">
                    + Add Product
                </Link>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full max-w-5xl text-left text-sm">
                    <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider text-xs">
                        <tr>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3 hidden md:table-cell">Base Price</th>
                            <th className="px-4 py-3">Variants</th>
                            <th className="px-4 py-3 hidden lg:table-cell">Stock</th>
                            <th className="px-4 py-3 hidden lg:table-cell">Sold</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700 divide-y divide-slate-100">
                        {products.map((product) => {
                            const mainImage = product.images?.find(i => i.is_main)?.url || product.images?.[0]?.url
                            const isDeleted = !!product.deleted_at
                            const totalSold = computeTotalSold(product)
                            const totalStock = computeTotalStock(product)

                            return (
                                <tr key={product.id} className={`hover:bg-gray-50 ${isDeleted ? 'opacity-50' : ''}`}>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-3 items-center">
                                            {mainImage ? (
                                                <Image width={40} height={40} className='w-10 h-10 object-cover shadow rounded' src={mainImage} alt="" />
                                            ) : (
                                                <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400">No img</div>
                                            )}
                                            <span className="line-clamp-2 max-w-[200px]">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell text-slate-800 font-medium font-num">
                                        {product.price ? `${currency}${Number(product.price).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-4 py-3">{product.variants?.length || 0} variants</td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        <NumberBadge 
                                            value={totalStock} 
                                            variant="text" 
                                            size="sm" 
                                            className={totalStock > 0 ? 'text-green-600' : 'text-red-500'} 
                                        />
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        <NumberBadge value={totalSold} variant="text" size="sm" className="text-slate-500" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDeleted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {isDeleted ? 'Deleted' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            {!isDeleted && (
                                                <>
                                                    <Link href={`/store/add-product?edit=${product.id}`}
                                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition" title="Edit">
                                                        <PencilIcon size={16} />
                                                    </Link>
                                                    <button onClick={() => handleDelete(product.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition" title="Delete">
                                                        <Trash2Icon size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-400">No products yet. Add your first product!</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    )
}
