import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Trash2 } from "lucide-react"
import { couponService } from "@/services"

export default function AdminCoupons() {

    const [coupons, setCoupons] = useState([])
    const [loading, setLoading] = useState(true)

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        description: '',
        discount_type: 'PERCENTAGE',
        discount_value: '',
        coupon_type: 'PLATFORM',
        min_order_amount: '',
        max_discount: '',
        max_usage: '',
        max_usage_per_user: '1',
        valid_from: '',
        valid_to: '',
    })

    const fetchCoupons = async () => {
        try {
            const data = await couponService.getAllCoupons()
            setCoupons(data)
        } catch (err) {
            console.error('Failed to load coupons:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddCoupon = async (e) => {
        e.preventDefault()
        const body = {
            code: newCoupon.code,
            description: newCoupon.description,
            discount_type: newCoupon.discount_type,
            discount_value: parseFloat(newCoupon.discount_value) || 0,
            coupon_type: newCoupon.coupon_type,
            min_order_amount: newCoupon.min_order_amount ? parseFloat(newCoupon.min_order_amount) : null,
            max_discount: newCoupon.max_discount ? parseFloat(newCoupon.max_discount) : null,
            max_usage: newCoupon.max_usage ? parseInt(newCoupon.max_usage) : null,
            max_usage_per_user: newCoupon.max_usage_per_user ? parseInt(newCoupon.max_usage_per_user) : 1,
            valid_from: newCoupon.valid_from ? newCoupon.valid_from + 'T00:00:00' : null,
            valid_to: newCoupon.valid_to ? newCoupon.valid_to + 'T23:59:59' : null,
        }
        await couponService.createCoupon(body)
        toast.success('Coupon created!')
        setNewCoupon({
            code: '', description: '', discount_type: 'PERCENTAGE', discount_value: '',
            coupon_type: 'PLATFORM', min_order_amount: '', max_discount: '', max_usage: '', max_usage_per_user: '1',
            valid_from: '', valid_to: '',
        })
        fetchCoupons()
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this coupon?')) return
        try {
            await couponService.deleteCoupon(id)
            toast.success('Coupon deleted')
            fetchCoupons()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Delete failed')
        }
    }

    const handleChange = (e) => {
        setNewCoupon({ ...newCoupon, [e.target.name]: e.target.value })
    }

    useEffect(() => {
        fetchCoupons()
    }, [])

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('en-US')
    }

    const formatCurrency = (val) => {
        if (!val && val !== 0) return '-'
        return Number(val).toFixed(2)
    }

    return (
        <div className="text-slate-500 mb-40">

            {/* Add Coupon */}
            <form onSubmit={(e) => toast.promise(handleAddCoupon(e), { loading: "Adding coupon..." })} className="max-w-lg text-sm">
                <h2 className="text-2xl">Add <span className="text-slate-800 font-medium">Coupon</span></h2>

                <div className="grid grid-cols-2 gap-3 mt-4">
                    <input type="text" placeholder="Coupon Code" className="p-2 border border-slate-200 outline-slate-400 rounded-md"
                        name="code" value={newCoupon.code} onChange={handleChange} required
                    />
                    <input type="number" placeholder="Discount Value" className="p-2 border border-slate-200 outline-slate-400 rounded-md"
                        name="discount_value" value={newCoupon.discount_value} onChange={handleChange} required step="any"
                    />
                </div>

                <input type="text" placeholder="Description" className="w-full mt-3 p-2 border border-slate-200 outline-slate-400 rounded-md"
                    name="description" value={newCoupon.description} onChange={handleChange}
                />

                <div className="grid grid-cols-2 gap-3 mt-3">
                    <select name="discount_type" value={newCoupon.discount_type} onChange={handleChange}
                        className="p-2 border border-slate-200 rounded-md outline-slate-400">
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED_AMOUNT">Fixed Amount (VND)</option>
                        <option value="FREE_SHIPPING">Free Shipping</option>
                    </select>
                    <select name="coupon_type" value={newCoupon.coupon_type} onChange={handleChange}
                        className="p-2 border border-slate-200 rounded-md outline-slate-400">
                        <option value="PLATFORM">Platform</option>
                        <option value="SHOP">Shop</option>
                    </select>
                </div>

                <div className="grid grid-cols-4 gap-3 mt-3">
                    <input type="number" placeholder="Min Order (VND)" className="p-2 border border-slate-200 outline-slate-400 rounded-md"
                        name="min_order_amount" value={newCoupon.min_order_amount} onChange={handleChange} step="any"
                    />
                    <input type="number" placeholder="Max Discount (VND)" className="p-2 border border-slate-200 outline-slate-400 rounded-md"
                        name="max_discount" value={newCoupon.max_discount} onChange={handleChange} step="any"
                    />
                    <input type="number" placeholder="Max Usage" className="p-2 border border-slate-200 outline-slate-400 rounded-md"
                        name="max_usage" value={newCoupon.max_usage} onChange={handleChange}
                    />
                    <input type="number" placeholder="Per User" min="1" className="p-2 border border-slate-200 outline-slate-400 rounded-md"
                        name="max_usage_per_user" value={newCoupon.max_usage_per_user} onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                    <label className="text-xs text-slate-500">
                        Valid From
                        <input type="date" className="w-full mt-1 p-2 border border-slate-200 outline-slate-400 rounded-md text-sm"
                            name="valid_from" value={newCoupon.valid_from} onChange={handleChange} required
                        />
                    </label>
                    <label className="text-xs text-slate-500">
                        Valid To
                        <input type="date" className="w-full mt-1 p-2 border border-slate-200 outline-slate-400 rounded-md text-sm"
                            name="valid_to" value={newCoupon.valid_to} onChange={handleChange} required
                        />
                    </label>
                </div>

                <button className="mt-4 p-2 px-10 rounded bg-slate-700 text-white active:scale-95 transition">Add Coupon</button>
            </form>

            {/* List Coupons */}
            <div className="mt-14">
                <h2 className="text-2xl">All <span className="text-slate-800 font-medium">Coupons</span></h2>
                {loading ? (
                    <div className="mt-4 text-slate-400">Loading...</div>
                ) : (
                    <div className="overflow-x-auto mt-4 rounded-lg border border-slate-200">
                        <table className="min-w-full bg-white text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="py-3 px-4 text-left font-semibold text-slate-600">Code</th>
                                    <th className="py-3 px-4 text-left font-semibold text-slate-600">Scope</th>
                                    <th className="py-3 px-4 text-left font-semibold text-slate-600">Discount</th>
                                    <th className="py-3 px-4 text-left font-semibold text-slate-600">Min Order</th>
                                    <th className="py-3 px-4 text-left font-semibold text-slate-600">Usage</th>
                                    <th className="py-3 px-4 text-left font-semibold text-slate-600">Valid</th>
                                    <th className="py-3 px-4 text-left font-semibold text-slate-600">Active</th>
                                    <th className="py-3 px-4 text-center font-semibold text-slate-600">Delete</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id || coupon.code} className="hover:bg-slate-50">
                                        <td className="py-3 px-4 font-medium text-slate-800 font-mono">{coupon.code}</td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs px-2 py-0.5 rounded ${coupon.coupon_type === 'PLATFORM' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {coupon.coupon_type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-800">
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 mr-1">{coupon.discount_type}</span>
                                            {coupon.discount_type === 'PERCENTAGE'
                                                ? `${coupon.discount_value}%`
                                                : '$' + formatCurrency(coupon.discount_value)}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">${formatCurrency(coupon.min_order_amount)}</td>
                                        <td className="py-3 px-4 text-slate-600">
                                            {coupon.current_usage || 0}/{coupon.max_usage || '∞'}
                                            <div className="text-[11px] text-slate-400">
                                                per user: {coupon.max_usage_per_user || 1}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-600 text-xs">
                                            {formatDate(coupon.valid_from)} - {formatDate(coupon.valid_to)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {coupon.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button onClick={() => handleDelete(coupon.id)}
                                                className="text-red-500 hover:bg-red-50 p-1.5 rounded transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {coupons.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-slate-400">No coupons yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
