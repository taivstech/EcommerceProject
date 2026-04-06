import { XIcon, ChevronLeftIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { createAddress, fetchAddresses } from "@/redux/features/address/addressSlice"
import GhnAddressSelector from "./GhnAddressSelector"

const AddressModal = ({ setShowAddressModal, onAddressSelected }) => {

    const [showForm, setShowForm] = useState(false)
    const [address, setAddress] = useState({
        receiver_name: "",
        phone_number: "",
        full_address: "",
        detail_address: "",
        ward: "",
        ward_code: "",
        district: "",
        district_id: undefined,
        province: "",
        province_id: "",
        default_address: false,
    })

    const addressList = useSelector(state => state.address.list || [])
    const dispatch = useDispatch()

    const handleAddressChange = (e) => {
        const { name, value, type } = e.target
        setAddress({
            ...address,
            [name]: type === "number" ? (value === "" ? undefined : Number(value)) : value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        await dispatch(createAddress(address))
        await dispatch(fetchAddresses())
        setShowForm(false)
        setAddress({
            receiver_name: "",
            phone_number: "",
            full_address: "",
            detail_address: "",
            ward: "",
            ward_code: "",
            district: "",
            district_id: undefined,
            province: "",
            province_id: "",
            default_address: false,
        })
    }

    const handleSelectExisting = (addr) => {
        if (onAddressSelected) {
            onAddressSelected(addr)
        }
        setShowAddressModal(false)
    }

    return (
        <div className="fixed inset-0 z-50 bg-white flex items-start justify-center overflow-y-auto pt-6">
            <div className="flex flex-col w-full max-w-2xl mx-4 mb-8">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6 sticky top-6 bg-white pb-4">
                    {showForm ? (
                        <button
                            onClick={() => setShowForm(false)}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
                        >
                            <ChevronLeftIcon size={24} />
                            <span className="text-lg font-semibold">Back</span>
                        </button>
                    ) : (
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">My Addresses</h1>
                            <p className="text-sm text-slate-500">Manage your shipping addresses</p>
                        </div>
                    )}
                    <button
                        onClick={() => setShowAddressModal(false)}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        <XIcon size={24} />
                    </button>
                </div>

                {!showForm ? (
                    // LIST VIEW
                    <div className="space-y-4">
                        {/* Add New Button */}
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition mb-4"
                        >
                            <PlusIcon size={20} />
                            <span>Add New Address</span>
                        </button>

                        {/* Address List */}
                        {addressList.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-500 mb-2">No addresses yet</p>
                                <p className="text-sm text-slate-400">Add your first shipping address above</p>
                            </div>
                        ) : (
                            addressList.map(addr => (
                                <button
                                    key={addr.id}
                                    onClick={() => handleSelectExisting(addr)}
                                    className={`w-full text-left p-5 border-2 rounded-lg transition ${
                                        addr.default_address
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-slate-200 hover:border-green-300 hover:bg-green-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-slate-800">{addr.receiver_name || 'Unknown'}</p>
                                                <span className="text-sm text-slate-500">|</span>
                                                <p className="text-sm text-slate-600">{addr.phone_number || 'No phone'}</p>
                                                {addr.default_address && (
                                                    <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Default</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 mt-2">{addr.full_address || 'No address'}</p>
                                            {addr.detail_address && (
                                                <p className="text-xs text-slate-500 mt-1">{addr.detail_address}</p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    // FORM VIEW
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Receiver Name *</label>
                            <input
                                name="receiver_name"
                                onChange={handleAddressChange}
                                value={address.receiver_name}
                                className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                type="text"
                                placeholder="e.g., Tai Vo"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                            <input
                                name="phone_number"
                                onChange={handleAddressChange}
                                value={address.phone_number}
                                className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                type="text"
                                placeholder="e.g., 0972310166"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Location *</label>
                            <GhnAddressSelector
                                value={address}
                                onChange={(ghnData) => {
                                    setAddress(prev => {
                                        const updated = { ...prev, ...ghnData }
                                        const parts = [ghnData.ward || updated.ward, ghnData.district || updated.district, ghnData.province || updated.province].filter(Boolean)
                                        if (parts.length > 0) updated.full_address = parts.join(', ')
                                        return updated
                                    })
                                }}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Detail Address</label>
                            <textarea
                                name="detail_address"
                                onChange={handleAddressChange}
                                value={address.detail_address}
                                className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none"
                                rows={2}
                                placeholder="Street, house number, building..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Auto-generated Full Address</label>
                            <textarea
                                name="full_address"
                                onChange={handleAddressChange}
                                value={address.full_address}
                                className="w-full p-3 border border-slate-300 rounded-lg bg-slate-50 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none"
                                rows={2}
                                disabled
                            />
                        </div>

                        <label className="flex items-center gap-3 p-3 border border-slate-300 rounded-lg hover:bg-green-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!address.default_address}
                                onChange={(e) => setAddress((prev) => ({ ...prev, default_address: e.target.checked }))}
                                className="accent-green-600 w-5 h-5"
                            />
                            <span className="text-sm font-medium text-slate-700">Set as default address</span>
                        </label>

                        <button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition mt-6"
                        >
                            SAVE ADDRESS
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

export default AddressModal