import { useEffect, useState } from 'react'
import { useRouter } from "@/utils/compat"
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '@/hooks/useAuth'
import { fetchAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/redux/features/address/addressSlice'
import GhnAddressSelector from '@/components/GhnAddressSelector'
import Navbar from '@/components/layout/Navbar'
import toast from 'react-hot-toast'
import { MapPin, Plus, Pencil, Trash2, Star, XIcon, ChevronLeft } from 'lucide-react'
import { Link } from "@/utils/compat"

const emptyAddress = {
    receiver_name: '',
    phone_number: '',
    full_address: '',
    detail_address: '',
    ward: '',
    ward_code: '',
    district: '',
    district_id: undefined,
    province: '',
    province_id: '',
    default_address: false,
}

export default function AddressesPage() {
    const router = useRouter()
    const dispatch = useDispatch()
    const { user, isAuthenticated, loading: authLoading } = useAuth()
    const { list: addresses, loading } = useSelector(state => state.address)

    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({ ...emptyAddress })
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState(null)

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login')
            return
        }
        if (isAuthenticated) {
            dispatch(fetchAddresses())
        }
    }, [isAuthenticated, authLoading, dispatch, router])

    const openAdd = () => {
        setEditingId(null)
        setForm({ ...emptyAddress })
        setShowModal(true)
    }

    const openEdit = (addr) => {
        setEditingId(addr.id)
        setForm({
            receiver_name: addr.receiver_name || '',
            phone_number: addr.phone_number || '',
            full_address: addr.full_address || '',
            detail_address: addr.detail_address || '',
            ward: addr.ward || '',
            ward_code: addr.ward_code || '',
            district: addr.district || '',
            district_id: addr.district_id || undefined,
            province: addr.province || '',
            province_id: addr.province_id || '',
            default_address: !!addr.default_address,
        })
        setShowModal(true)
    }

    const handleFormChange = (e) => {
        const { name, value, type } = e.target
        setForm(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            if (editingId) {
                await dispatch(updateAddress({ id: editingId, data: form })).unwrap()
                toast.success('Address updated')
            } else {
                await dispatch(createAddress(form)).unwrap()
                toast.success('Address added')
            }
            setShowModal(false)
            setEditingId(null)
            setForm({ ...emptyAddress })
        } catch (err) {
            toast.error(err?.message || 'Failed to save address')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this address?')) return
        setDeletingId(id)
        try {
            await dispatch(deleteAddress(id)).unwrap()
            toast.success('Address deleted')
        } catch (err) {
            toast.error('Failed to delete address')
        } finally {
            setDeletingId(null)
        }
    }

    const handleSetDefault = async (id) => {
        try {
            await dispatch(setDefaultAddress(id)).unwrap()
            toast.success('Default address updated')
        } catch (err) {
            toast.error('Failed to set default address')
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-32 bg-slate-200 rounded"></div>
                        <div className="h-32 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Link href="/profile" className="p-2 rounded-lg hover:bg-slate-200 transition text-slate-500">
                            <ChevronLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">My Addresses</h1>
                            <p className="text-sm text-slate-500 mt-1">Manage your shipping addresses</p>
                        </div>
                    </div>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition active:scale-95"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Add New Address</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>

                {/* Address List */}
                {loading && addresses.length === 0 ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-2xl p-6">
                                <div className="h-5 bg-slate-200 rounded w-1/3 mb-3"></div>
                                <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
                                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                        <MapPin size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">No addresses yet</h3>
                        <p className="text-slate-500 mb-6">Add a shipping address to speed up your checkout.</p>
                        <button
                            onClick={openAdd}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium transition"
                        >
                            Add Your First Address
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {addresses.map(addr => (
                            <div
                                key={addr.id}
                                className={`bg-white border rounded-2xl p-5 transition hover:shadow-sm ${
                                    addr.default_address ? 'border-green-300 ring-1 ring-green-100' : 'border-slate-200'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-slate-800 truncate">{addr.receiver_name}</h3>
                                            <span className="text-slate-400">|</span>
                                            <span className="text-sm text-slate-500">{addr.phone_number}</span>
                                            {addr.default_address && (
                                                <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Star size={10} fill="currentColor" /> Default
                                                </span>
                                            )}
                                        </div>
                                        {addr.detail_address && (
                                            <p className="text-sm text-slate-600 mb-1">{addr.detail_address}</p>
                                        )}
                                        <p className="text-sm text-slate-500">
                                            {[addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                                        </p>
                                        {addr.full_address && addr.full_address !== [addr.ward, addr.district, addr.province].filter(Boolean).join(', ') && (
                                            <p className="text-xs text-slate-400 mt-1">{addr.full_address}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => openEdit(addr)}
                                            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(addr.id)}
                                            disabled={deletingId === addr.id || addr.default_address}
                                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                            title={addr.default_address ? 'Cannot delete default address' : 'Delete'}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {!addr.default_address && (
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <button
                                            onClick={() => handleSetDefault(addr.id)}
                                            className="text-sm text-green-600 hover:text-green-700 font-medium transition"
                                        >
                                            Set as Default
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editingId ? 'Edit Address' : 'Add New Address'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => { setShowModal(false); setEditingId(null) }}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                            >
                                <XIcon size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Receiver Name <span className="text-red-500">*</span></label>
                                    <input
                                        name="receiver_name"
                                        value={form.receiver_name}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
                                        placeholder="Full name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                                    <input
                                        name="phone_number"
                                        value={form.phone_number}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
                                        placeholder="Phone number"
                                        required
                                    />
                                </div>
                            </div>

                            {/* GHN Address Selector */}
                            <GhnAddressSelector
                                value={form}
                                onChange={(ghnData) => {
                                    setForm(prev => {
                                        const updated = { ...prev, ...ghnData }
                                        const parts = [ghnData.ward || updated.ward, ghnData.district || updated.district, ghnData.province || updated.province].filter(Boolean)
                                        if (parts.length > 0) updated.full_address = parts.join(', ')
                                        return updated
                                    })
                                }}
                                required
                            />

                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1.5">Street / House Number / Building</label>
                                <textarea
                                    name="detail_address"
                                    value={form.detail_address}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition resize-none"
                                    rows={2}
                                    placeholder="e.g. 123 Main St, Apt 4B"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1.5">Full Address</label>
                                <input
                                    name="full_address"
                                    value={form.full_address}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none bg-slate-50 text-slate-500"
                                    placeholder="Auto-generated from selections above"
                                    readOnly
                                />
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer py-2">
                                <input
                                    type="checkbox"
                                    checked={!!form.default_address}
                                    onChange={(e) => setForm(prev => ({ ...prev, default_address: e.target.checked }))}
                                    className="w-4 h-4 accent-green-600 rounded"
                                />
                                <span className="text-sm text-slate-700">Set as default shipping address</span>
                            </label>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 sticky bottom-0 bg-white rounded-b-2xl">
                            <button
                                type="button"
                                onClick={() => { setShowModal(false); setEditingId(null) }}
                                className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition font-medium disabled:opacity-60 active:scale-95"
                            >
                                {saving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
