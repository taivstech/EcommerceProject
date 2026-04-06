import { useEffect, useState, useRef } from "react"
import { Image } from "@/utils/compat"
import toast from "react-hot-toast"
import Loading from "@/components/ui/Loading"
import { shopService } from "@/services"
import { Camera } from "lucide-react"
import GhnAddressSelector from "@/components/GhnAddressSelector"
import { useRouter } from "@/utils/compat"

export default function StoreSettings() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [shop, setShop] = useState(null)
    const [logoFile, setLogoFile] = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)
    const fileInputRef = useRef(null)

    const [storeInfo, setStoreInfo] = useState({
        name: "",
        description: "",
        detail_address: "",
        // GHN address fields
        province: "",
        province_id: null,
        district: "",
        district_id: null,
        ward: "",
        ward_code: "",
    })

    const onChangeHandler = (e) => {
        setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value })
    }

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            setLogoFile(file)
            setLogoPreview(URL.createObjectURL(file))
        }
    }

    const fetchMyShop = async () => {
        try {
            const res = await shopService.getMyShop()
            if (res) {
                setShop(res)
                
                // Load existing shop data
                const address = res.shop_address || {}
                setStoreInfo({
                    name: res.name || "",
                    description: res.description || "",
                    detail_address: address.detail_address || "",
                    province: address.province || "",
                    province_id: address.province_id ? (typeof address.province_id === 'string' ? parseInt(address.province_id) : address.province_id) : null,
                    district: address.district || "",
                    district_id: address.district_id || null,
                    ward: address.ward || "",
                    ward_code: address.ward_code || "",
                })
                
                // Set existing logo preview
                if (res.logo) {
                    setLogoPreview(res.logo)
                }
            }
        } catch (e) {
            console.error('Failed to load shop:', e)
            toast.error('Failed to load shop information')
        } finally {
            setLoading(false)
        }
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        if (!storeInfo.name?.trim()) {
            toast.error("Store name is required")
            return
        }
        if (!storeInfo.province_id) {
            toast.error("Please select a Province/City")
            return
        }
        if (!storeInfo.district_id) {
            toast.error("Please select a District")
            return
        }
        if (!storeInfo.ward_code) {
            toast.error("Please select a Ward")
            return
        }

        // Build full_address from selected GHN data
        const fullAddress = [
            storeInfo.detail_address?.trim(),
            storeInfo.ward,
            storeInfo.district,
            storeInfo.province,
        ].filter(Boolean).join(", ")

        setSubmitting(true)
        try {
            await shopService.updateShop(
                {
                    name: storeInfo.name.trim(),
                    description: storeInfo.description?.trim() || null,
                    full_address: fullAddress || null,
                    province: storeInfo.province,
                    province_id: String(storeInfo.province_id),
                    district: storeInfo.district,
                    district_id: storeInfo.district_id,
                    ward: storeInfo.ward,
                    ward_code: storeInfo.ward_code,
                    detail_address: storeInfo.detail_address?.trim() || null,
                },
                logoFile || null
            )
            toast.success("Shop information updated successfully!")
            await fetchMyShop()
            router.refresh()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Update failed")
        } finally {
            setSubmitting(false)
        }
    }

    useEffect(() => {
        fetchMyShop()
    }, [])

    if (loading) return <Loading />

    if (!shop) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">No shop found. Please create a shop first.</p>
            </div>
        )
    }

    return (
        <div className="text-black mb-28 max-w-4xl">
            <h1 className="text-2xl font-semibold text-black mb-6">Shop Settings</h1>

            <form onSubmit={onSubmitHandler} className="bg-white border border-gray-200 rounded-sm p-6">
                {/* Logo Upload */}
                <p className="font-medium text-black mb-3">Store Logo</p>
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                        {logoPreview ? (
                            <Image src={logoPreview} alt="Logo preview" width={80} height={80} className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                No logo
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 bg-green-600 text-white p-1.5 rounded-full hover:bg-green-700 transition"
                        >
                            <Camera size={14} />
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} hidden />
                    </div>
                    {logoFile && <p className="text-xs text-green-600">New logo selected</p>}
                </div>

                <label className="flex flex-col gap-2 mb-6">
                    <span className="font-medium text-black">Store Name *</span>
                    <input 
                        name="name" 
                        onChange={onChangeHandler} 
                        value={storeInfo.name} 
                        type="text" 
                        placeholder="Enter your store name" 
                        className="border border-gray-200 outline-none w-full p-2 px-4 rounded focus:border-green-500" 
                        required
                    />
                </label>

                <label className="flex flex-col gap-2 mb-6">
                    <span className="font-medium text-black">Description</span>
                    <textarea 
                        name="description" 
                        onChange={onChangeHandler} 
                        value={storeInfo.description} 
                        rows={5} 
                        placeholder="Enter your store description" 
                        className="border border-gray-200 outline-none w-full p-2 px-4 rounded resize-none focus:border-green-500" 
                    />
                </label>

                {/* GHN Address Dropdowns: Province → District → Ward */}
                <p className="font-medium text-black mb-3">Store Address *</p>
                <div className="w-full mb-6">
                    <GhnAddressSelector
                        value={storeInfo}
                        onChange={(ghnData) => setStoreInfo(prev => ({ ...prev, ...ghnData }))}
                        required
                    />
                </div>

                <label className="flex flex-col gap-2 mb-6">
                    <span className="font-medium text-black">Detail Address (House number, street name...)</span>
                    <textarea 
                        name="detail_address" 
                        onChange={onChangeHandler} 
                        value={storeInfo.detail_address} 
                        rows={2} 
                        placeholder="e.g. 123 Main Street" 
                        className="border border-gray-200 outline-none w-full p-2 px-4 rounded resize-none focus:border-green-500" 
                    />
                </label>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                    <button 
                        type="submit"
                        disabled={submitting}
                        className="bg-green-600 text-white px-8 py-2.5 rounded hover:bg-green-700 transition disabled:opacity-50 font-medium"
                    >
                        {submitting ? "Updating..." : "Update Shop Information"}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-gray-200 text-black px-8 py-2.5 rounded hover:bg-gray-300 transition font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}
