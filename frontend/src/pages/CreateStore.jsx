import { useEffect, useState, useRef } from "react"
import { Image } from "@/utils/compat"
import toast from "react-hot-toast"
import Loading from "@/components/ui/Loading"
import RequireAuth from "@/components/RequireAuth"
import { shopService } from "@/services"
import { Camera } from "lucide-react"
import GhnAddressSelector from "@/components/GhnAddressSelector"

export default function CreateStore() {
    return (
        <RequireAuth>
            <CreateStoreContent />
        </RequireAuth>
    )
}

function CreateStoreContent() {

    const [loading, setLoading] = useState(true)
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
            setShop(res)
        } catch (e) {
            setShop(null)
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

        try {
            await shopService.createShop(
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
                logoFile
            )
            toast.success("Submitted! Please wait for admin approval.")
            await fetchMyShop()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Submit failed")
        }
    }

    useEffect(() => {
        fetchMyShop()
    }, [])

    if (loading) return <Loading />

    if (shop) {
        const status = String(shop.status || "").toUpperCase()
        const pending = status === "PENDING"
        const approved = status === "APPROVED"
        const rejected = status === "REJECTED"

        return (
            <div className="mx-6 min-h-[70vh] my-16">
                <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 text-slate-600">
                    <div className="flex items-center gap-4 mb-4">
                        {shop.logo ? (
                            <Image src={shop.logo} alt="" width={60} height={60} className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-200" />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold">
                                {shop.name?.charAt(0)?.toUpperCase() || "S"}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl text-slate-800 font-semibold">{shop.name}</h1>
                            <p>
                                Status:{" "}
                                <span className={`font-semibold ${approved ? "text-green-700" : pending ? "text-amber-600" : "text-red-600"}`}>
                                    {status}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                        {shop.address ? <p><span className="text-slate-500">Address:</span> {shop.address}</p> : null}
                        {shop.rejection_reason ? (
                            <p className="text-red-600"><span className="text-slate-500">Reason:</span> {shop.rejection_reason}</p>
                        ) : null}
                    </div>

                    {pending && (
                        <p className="mt-6 text-slate-500">
                            Your seller registration is submitted. Please wait for admin approval.
                        </p>
                    )}

                    {approved && (
                        <button
                            onClick={() => window.location.href = "/store"}
                            className="mt-6 bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 transition"
                        >
                            Go to Seller Dashboard
                        </button>
                    )}

                    {rejected && (
                        <p className="mt-6 text-slate-500">
                            Your store was rejected. Update details (coming soon) or contact support.
                        </p>
                    )}
                </div>
            </div>
        )
    }

    return (
        <>
                <div className="mx-6 min-h-[70vh] my-16">
                <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Submitting..." })} className="max-w-3xl mx-auto flex flex-col items-start gap-3 text-slate-500">
                        <div>
                        <h1 className="text-3xl">Register <span className="text-slate-800 font-medium">My Store</span></h1>
                        <p className="max-w-lg">
                            Submit your store details. Admin will review and approve your seller account.
                        </p>
                        </div>

                    {/* Logo Upload */}
                    <p className="mt-8 font-medium text-slate-700">Store Logo</p>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            {logoPreview ? (
                                <Image src={logoPreview} alt="Logo preview" width={80} height={80} className="w-20 h-20 rounded-full object-cover ring-2 ring-slate-200" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-sm">
                                    No logo
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 bg-slate-800 text-white p-1.5 rounded-full hover:bg-slate-900 transition"
                            >
                                <Camera size={14} />
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} hidden />
                        </div>
                        {logoFile && <p className="text-xs text-green-600">Logo selected</p>}
                    </div>

                    <p className="mt-4">Store Name *</p>
                    <input name="name" onChange={onChangeHandler} value={storeInfo.name} type="text" placeholder="Enter your store name" className="border border-slate-300 outline-slate-400 w-full p-2 rounded" />

                        <p>Description</p>
                    <textarea name="description" onChange={onChangeHandler} value={storeInfo.description} rows={5} placeholder="Enter your store description" className="border border-slate-300 outline-slate-400 w-full p-2 rounded resize-none" />

                    {/* GHN Address Dropdowns: Province → District → Ward */}
                    <p className="mt-2 font-medium text-slate-700">Store Address *</p>
                    <div className="w-full">
                        <GhnAddressSelector
                            value={storeInfo}
                            onChange={(ghnData) => setStoreInfo(prev => ({ ...prev, ...ghnData }))}
                            required
                        />
                    </div>

                    <p className="mt-2">Detail Address (House number, street name...)</p>
                    <textarea name="detail_address" onChange={onChangeHandler} value={storeInfo.detail_address} rows={2} placeholder="e.g. 123 Main Street" className="border border-slate-300 outline-slate-400 w-full p-2 rounded resize-none" />

                    <button className="bg-slate-800 text-white px-12 py-2 rounded mt-6 active:scale-95 hover:bg-slate-900 transition ">
                        Submit for Approval
                    </button>
                    </form>
                </div>
        </>
    )
}
