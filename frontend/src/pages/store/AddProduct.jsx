import { assets } from "@/assets/assets"
import { Image } from "@/utils/compat"
import { useEffect, useMemo, useState } from "react"
import { toast } from "react-hot-toast"
import { productService, categoryService } from "@/services"
import { useRouter, useSearchParams } from "@/utils/compat"
import { PlusIcon, TrashIcon, ImageIcon } from "lucide-react"

function cartesian(...arrays) {
    return arrays.reduce((a, b) =>
        a.flatMap(d => b.map(e => [...d, e]))
        , [[]])
}

export default function StoreAddProduct() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editProductId = searchParams.get('edit')
    const isEditMode = !!editProductId

    const [categories, setCategories] = useState([])
    const [galleryImages, setGalleryImages] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [existingImageUrls, setExistingImageUrls] = useState([])
    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        weight: "",
        length: "",
        width: "",
        height: "",
    })
    const [loading, setLoading] = useState(false)
    const [loadingProduct, setLoadingProduct] = useState(false)
    const [attributes, setAttributes] = useState([])
    const [variants, setVariants] = useState([])

    useEffect(() => {
        categoryService.getAllCategories().then(setCategories).catch(() => { })
    }, [])

    useEffect(() => {
        if (isEditMode && editProductId) {
            setLoadingProduct(true)
            productService.getProductById(editProductId)
                .then(product => {
                    if (product) {

                        setProductInfo({
                            name: product.name || "",
                            description: product.description || "",
                            price: product.price?.toString() || product.min_price?.toString() || "",
                            categoryId: product.category_id || "",
                            weight: product.weight?.toString() || "",
                            length: product.length?.toString() || "",
                            width: product.width?.toString() || "",
                            height: product.height?.toString() || "",
                        })


                        const images = product.images || []
                        const imageMap = {}
                        const urls = []
                        images.forEach((img, idx) => {
                            const key = (idx + 1).toString()
                            const url = typeof img === 'string' ? img : img?.url
                            if (url) {
                                urls.push(url)
                                imageMap[key] = null 
                            }
                        })
                        setGalleryImages(imageMap)
                        setExistingImageUrls(urls)


                        if (product.attributes && product.attributes.length > 0) {
                            const loadedAttributes = product.attributes.map(attr => ({
                                name: attr.name || "",
                                options: (attr.options || []).map(opt => ({
                                    name: opt.name || "",
                                    imageUrl: opt.image_url || opt.imageUrl || null,
                                    imageFile: null
                                }))
                            }))
                            setAttributes(loadedAttributes)
                        }

                        if (product.variants && product.variants.length > 0) {
                            const loadedVariants = product.variants.map(v => ({
                                id: v.id,
                                name: v.name || "Default",
                                price: v.price?.toString() || "",
                                stock: v.stock?.toString() || "",
                                sku: v.sku || "",
                                imageUrl: v.image_url || v.imageUrl || null,
                                optionNames: (v.detail_attributes || v.detailAttributes || []).map(da => da.name || da.id),
                            }))
                            setVariants(loadedVariants)
                        } else {

                            setVariants([{
                                _default: true,
                                name: "Default",
                                optionNames: [],
                                price: product.price?.toString() || product.min_price?.toString() || "",
                                stock: "0",
                                sku: ""
                            }])
                        }
                    }
                })
                .catch(err => {
                    console.error('Failed to load product:', err)
                    toast.error('Failed to load product')
                })
                .finally(() => {
                    setLoadingProduct(false)

                    setTimeout(() => setInitialLoadDone(true), 100)
                })
        }
    }, [isEditMode, editProductId])

    const [initialLoadDone, setInitialLoadDone] = useState(!isEditMode)
    const attributeOptionNames = useMemo(() =>
        attributes.map(a => a.options.map(o => o.name).filter(Boolean)),
        [attributes]
    )

    useEffect(() => {
        if (attributes.length === 0 && variants.length === 1 && variants[0]._default) {
            const basePrice = productInfo.price || ""
            if (basePrice) {
                setVariants([{ ...variants[0], price: basePrice }])
            }
        }
    }, [productInfo.price, attributes.length])

    useEffect(() => {
        if (!initialLoadDone) return

        if (isEditMode && variants.length > 0 && !variants.some(v => v._default)) {
            return
        }

        if (attributes.length === 0) {
            setVariants(prev => {
                if (prev.length === 1 && prev[0]._default) {
                    return prev
                }
                return [{ _default: true, name: "Default", optionNames: [], price: productInfo.price || "", stock: "", sku: "" }]
            })
            return
        }

        const validGroups = attributeOptionNames.filter(g => g.length > 0)
        if (validGroups.length === 0) {
            setVariants([{ _default: true, name: "Default", optionNames: [], price: "", stock: "", sku: "" }])
            return
        }

        const combos = cartesian(...validGroups)
        setVariants(prev => {
            return combos.map(combo => {
                const name = combo.join(", ")
                const existing = prev.find(v => v.name === name)
                return existing ? { ...existing, optionNames: combo } : { name, optionNames: combo, price: "", stock: "", sku: "" }
            })
        })
    }, [attributeOptionNames, initialLoadDone])

    const addAttributeGroup = () => {
        if (attributes.length >= 2) {
            toast.error("Maximum 2 attribute groups (Shopee standard)")
            return
        }
        setAttributes([...attributes, { name: "", options: [{ name: "", imageUrl: null, imageFile: null }] }])
    }

    const removeAttributeGroup = (gi) => {
        setAttributes(attributes.filter((_, i) => i !== gi))
    }

    const updateAttributeGroupName = (gi, name) => {
        const updated = [...attributes]
        updated[gi] = { ...updated[gi], name }
        setAttributes(updated)
    }

    const addOption = (gi) => {
        const updated = [...attributes]
        updated[gi] = { ...updated[gi], options: [...updated[gi].options, { name: "", imageUrl: null, imageFile: null }] }
        setAttributes(updated)
    }

    const removeOption = (gi, oi) => {
        const updated = [...attributes]
        updated[gi] = { ...updated[gi], options: updated[gi].options.filter((_, i) => i !== oi) }
        setAttributes(updated)
    }

    const updateOptionName = (gi, oi, name) => {
        const updated = [...attributes]
        updated[gi] = {
            ...updated[gi],
            options: updated[gi].options.map((o, i) => i === oi ? { ...o, name } : o)
        }
        setAttributes(updated)
    }

    const setOptionImage = (gi, oi, file) => {
        const updated = [...attributes]
        updated[gi] = {
            ...updated[gi],
            options: updated[gi].options.map((o, i) =>
                i === oi ? { ...o, imageFile: file, imageUrl: file ? URL.createObjectURL(file) : null } : o
            )
        }
        setAttributes(updated)
    }

    const updateVariant = (idx, field, value) => {
        const updated = [...variants]
        updated[idx] = { ...updated[idx], [field]: value }
        setVariants(updated)
    }

    const setVariantImage = (idx, file) => {
        const updated = [...variants]
        updated[idx] = {
            ...updated[idx],
            imageFile: file,
            imageUrl: file ? URL.createObjectURL(file) : (updated[idx].imageUrl || null)
        }
        setVariants(updated)
    }

    const applyPriceToAll = () => {
        if (variants.length === 0) return
        const first = variants[0].price
        setVariants(variants.map(v => ({ ...v, price: first })))
    }

    const applyStockToAll = () => {
        if (variants.length === 0) return
        const first = variants[0].stock
        setVariants(variants.map(v => ({ ...v, stock: first })))
    }
    const onSubmitHandler = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!productInfo.categoryId) {
                toast.error("Please select a category for the product")
                setLoading(false)
                return
            }


            const galleryFiles = Object.values(galleryImages).filter(Boolean)
            const hasImages = galleryFiles.length > 0 || existingImageUrls.length > 0
            if (!hasImages) {
                toast.error("Please select at least 1 product image")
                setLoading(false)
                return
            }


            let validVariants = variants.filter(v => v.price && Number(v.price) > 0)
            if (validVariants.length === 0) {

                const basePrice = Number(productInfo.price) || 0
                if (basePrice > 0) {
                    validVariants = [{
                        name: "Default",
                        price: basePrice,
                        stock: 0,
                        sku: "",
                        optionNames: [],
                        imageUrl: null
                    }]
                } else {
                    toast.error("Please enter a price for at least 1 variant or base price")
                    setLoading(false)
                    return
                }
            }

            const processedAttributes = []
            for (const attr of attributes) {
                const processedOptions = []
                for (const opt of attr.options) {
                    let imageUrl = null
                    if (opt.imageFile) {
  
                        const formData = new FormData()
                        formData.append("file", opt.imageFile)
                        formData.append("folder", "/products/options")
                        try {
                            const res = await fetch(`${import.meta.env.VITE_API_URL}/media/upload`, {
                                method: "POST",
                                headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` },
                                body: formData,
                            })
                            const json = await res.json()
                            imageUrl = json?.result?.url || null
                        } catch { /* ignore upload failures */ }
                    }
                    processedOptions.push({ name: opt.name, image_url: imageUrl })
                }
                processedAttributes.push({ name: attr.name, options: processedOptions })
            }

            const processedVariants = []
            for (const variant of validVariants) {
                let variantImageUrl = variant.imageUrl || null
                if (variant.imageFile) {
                    const formData = new FormData()
                    formData.append("file", variant.imageFile)
                    formData.append("folder", "/products/variants")
                    try {
                        const res = await fetch(`${import.meta.env.VITE_API_URL}/media/upload`, {
                            method: "POST",
                            headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` },
                            body: formData,
                        })
                        const json = await res.json()
                        variantImageUrl = json?.result?.url || null
                    } catch { /* ignore upload failures */ }
                }
                processedVariants.push({
                    ...variant,
                    imageUrl: variantImageUrl
                })
            }

            const payload = {
                name: productInfo.name,
                description: productInfo.description,
                price: Number(productInfo.price) || 0,
                category_id: productInfo.categoryId || null,
                weight: productInfo.weight ? Number(productInfo.weight) : null,
                length: productInfo.length ? Number(productInfo.length) : null,
                width: productInfo.width ? Number(productInfo.width) : null,
                height: productInfo.height ? Number(productInfo.height) : null,
                attributes: processedAttributes.length > 0 ? processedAttributes : undefined,
                variants: processedVariants.map(v => ({
                    id: v.id || undefined, 
                    name: v.name || undefined,
                    sku: v.sku || undefined,
                    price: Number(v.price),
                    stock: Number(v.stock) || 0,
                    status: "ACTIVE",
                    image_url: v.imageUrl || undefined,
                    option_names: v.optionNames && v.optionNames.length > 0 ? v.optionNames : undefined,
                })),
            }

            if (isEditMode && editProductId) {
                await productService.updateProduct(editProductId, payload, galleryFiles)
                toast.success("Product updated successfully!")
            } else {
                await productService.createProduct(payload, galleryFiles)
                toast.success("Product created successfully!")
            }
            router.push("/store/manage-product")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create product")
        } finally {
            setLoading(false)
        }
    }

    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
    }

    if (loadingProduct) {
        return <div className="min-h-screen flex items-center justify-center"><div className="text-lg">Loading product...</div></div>
    }

    return (
        <form onSubmit={onSubmitHandler} className="text-slate-500 mb-28 max-w-4xl">
            <h1 className="text-2xl font-semibold text-slate-800">{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>

            {/* ── Gallery Images ─────────────────────────────────── */}
            <p className="mt-7 font-medium text-slate-700">Product Images (gallery)</p>
            <div className="flex gap-3 mt-3">
                {Object.keys(galleryImages).map((key, idx) => {
                    const existingUrl = existingImageUrls[idx]
                    const file = galleryImages[key]
                    const imageSrc = file ? URL.createObjectURL(file) : (existingUrl || assets.upload_area)
                    return (
                        <label key={key} htmlFor={`gallery${key}`} className="cursor-pointer">
                            <Image width={300} height={300} className='h-16 w-auto border border-slate-200 rounded' src={imageSrc} alt="" />
                            <input type="file" accept='image/*' id={`gallery${key}`} onChange={e => setGalleryImages({ ...galleryImages, [key]: e.target.files[0] })} hidden />
                        </label>
                    )
                })}
            </div>

            {/* ── Basic Info ─────────────────────────────────────── */}
            <label className="flex flex-col gap-2 my-6">
                <span className="font-medium text-slate-700">Product Name</span>
                <input type="text" name="name" onChange={onChangeHandler} value={productInfo.name} placeholder="Enter product name" className="w-full max-w-lg p-2 px-4 outline-none border border-slate-200 rounded" required />
            </label>
            <label className="flex flex-col gap-2 my-6">
                <span className="font-medium text-slate-700">Description</span>
                <textarea name="description" onChange={onChangeHandler} value={productInfo.description} placeholder="Enter product description" rows={5} className="w-full max-w-lg p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
            </label>

            <div className="flex gap-5">
                <label className="flex flex-col gap-2">
                    <span className="font-medium text-slate-700">Base Price</span>
                    <input type="number" step="0.01" name="price" onChange={onChangeHandler} value={productInfo.price} placeholder="0.00" className="w-40 p-2 px-4 outline-none border border-slate-200 rounded [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" required />
                </label>
            </div>

            <select onChange={e => setProductInfo({ ...productInfo, categoryId: e.target.value })} value={productInfo.categoryId} className="w-full max-w-lg p-2 px-4 my-6 outline-none border border-slate-200 rounded" required>
                <option value="">Select category</option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>

            {/* ── Dimensions ─────────────────────────────────────── */}
            <p className="mt-4 mb-2 font-medium text-slate-700">Dimensions & Weight (optional)</p>
            <div className="flex gap-3 flex-wrap">
                <label className="flex flex-col gap-1"> Weight (g)
                    <input type="number" name="weight" onChange={onChangeHandler} value={productInfo.weight} placeholder="0" className="w-28 p-2 px-3 outline-none border border-slate-200 rounded [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" />
                </label>
                <label className="flex flex-col gap-1"> Length (cm)
                    <input type="number" name="length" onChange={onChangeHandler} value={productInfo.length} placeholder="0" className="w-28 p-2 px-3 outline-none border border-slate-200 rounded [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" />
                </label>
                <label className="flex flex-col gap-1"> Width (cm)
                    <input type="number" name="width" onChange={onChangeHandler} value={productInfo.width} placeholder="0" className="w-28 p-2 px-3 outline-none border border-slate-200 rounded [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" />
                </label>
                <label className="flex flex-col gap-1"> Height (cm)
                    <input type="number" name="height" onChange={onChangeHandler} value={productInfo.height} placeholder="0" className="w-28 p-2 px-3 outline-none border border-slate-200 rounded [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" />
                </label>
            </div>

            {/*
                 PRODUCT VARIANTS (Shopee-style Attributes) */}
            <div className="mt-8 border border-slate-200 rounded-lg p-5 bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-800">Product Variants</h2>
                    <button type="button" onClick={addAttributeGroup}
                        className="flex items-center gap-1 text-sm text-indigo-600 hover:underline disabled:opacity-40"
                        disabled={attributes.length >= 2}>
                        <PlusIcon size={16} /> Add Attribute Group
                    </button>
                </div>

                {attributes.length === 0 && (
                    <p className="text-sm text-slate-400 italic">No variants — product will have 1 default version.</p>
                )}

                {attributes.map((attr, gi) => (
                    <div key={gi} className="border border-slate-100 rounded-lg p-4 mb-4 bg-slate-50">
                        <div className="flex items-center gap-3 mb-3">
                            <input
                                type="text"
                                value={attr.name}
                                onChange={e => updateAttributeGroupName(gi, e.target.value)}
                                placeholder={gi === 0 ? "Group 1, e.g. Color" : "Group 2, e.g. Size"}
                                className="flex-1 p-2 px-3 border border-slate-200 rounded outline-none font-medium"
                            />
                            <button type="button" onClick={() => removeAttributeGroup(gi)} className="text-red-400 hover:text-red-600">
                                <TrashIcon size={18} />
                            </button>
                        </div>

                        <p className="text-xs text-slate-400 mb-2">Options {gi === 0 && "(can add images)"}:</p>
                        {attr.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2 mb-2">
                                {/* Option image (tier-1 only) */}
                                {gi === 0 && (
                                    <label className="cursor-pointer shrink-0 w-10 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center bg-white overflow-hidden">
                                        {opt.imageUrl
                                            ? <Image src={opt.imageUrl} alt="" width={40} height={40} className="object-cover w-full h-full" />
                                            : <ImageIcon size={16} className="text-slate-300" />
                                        }
                                        <input type="file" accept="image/*" hidden onChange={e => setOptionImage(gi, oi, e.target.files?.[0] || null)} />
                                    </label>
                                )}
                                <input
                                    type="text"
                                    value={opt.name}
                                    onChange={e => updateOptionName(gi, oi, e.target.value)}
                                    placeholder={`Option ${oi + 1}`}
                                    className="flex-1 p-2 px-3 border border-slate-200 rounded outline-none text-sm"
                                />
                                {attr.options.length > 1 && (
                                    <button type="button" onClick={() => removeOption(gi, oi)} className="text-red-300 hover:text-red-500">
                                        <TrashIcon size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => addOption(gi)} className="text-sm text-indigo-500 hover:underline mt-1">
                            + Add Option
                        </button>
                    </div>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════
                 VARIANT TABLE
                ══════════════════════════════════════════════════════ */}
            <div className="mt-6 border border-slate-200 rounded-lg p-5 bg-white">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                    Variant List ({variants.length})
                </h2>

                {variants.length > 1 && (
                    <div className="flex gap-3 mb-3">
                        <button type="button" onClick={applyPriceToAll} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded">
                            Apply row 1 price to all
                        </button>
                        <button type="button" onClick={applyStockToAll} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded">
                            Apply row 1 stock to all
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 text-left text-slate-600">
                                <th className="py-2 pr-3 w-20">Image</th>
                                <th className="py-2 pr-3">Variant</th>
                                <th className="py-2 pr-3 w-32">Price</th>
                                <th className="py-2 pr-3 w-28">Stock</th>
                                <th className="py-2 pr-3 w-32">SKU</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variants.map((v, idx) => (
                                <tr key={idx} className="border-b border-slate-50">
                                    <td className="py-2 pr-3">
                                        <label className="cursor-pointer block w-12 h-12 border border-dashed border-slate-300 rounded flex items-center justify-center bg-white overflow-hidden">
                                            {v.imageUrl
                                                ? <Image src={v.imageUrl} alt="" width={48} height={48} className="object-cover w-full h-full" />
                                                : <ImageIcon size={16} className="text-slate-300" />
                                            }
                                            <input type="file" accept="image/*" hidden onChange={e => setVariantImage(idx, e.target.files?.[0] || null)} />
                                        </label>
                                    </td>
                                    <td className="py-2 pr-3 font-medium text-slate-700">{v.name || "—"}</td>
                                    <td className="py-2 pr-3">
                                        <input type="number" step="0.01" value={v.price} onChange={e => updateVariant(idx, "price", e.target.value)}
                                            placeholder="0.00" className="w-full p-1.5 border border-slate-200 rounded outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" />
                                    </td>
                                    <td className="py-2 pr-3">
                                        <input type="number" value={v.stock} onChange={e => updateVariant(idx, "stock", e.target.value)}
                                            placeholder="0" className="w-full p-1.5 border border-slate-200 rounded outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" />
                                    </td>
                                    <td className="py-2 pr-3">
                                        <input type="text" value={v.sku || ""} onChange={e => updateVariant(idx, "sku", e.target.value)}
                                            placeholder="Auto" className="w-full p-1.5 border border-slate-200 rounded outline-none" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Submit ─────────────────────────────────────────── */}
            <button disabled={loading} className="bg-slate-800 text-white px-8 mt-8 py-2.5 hover:bg-slate-900 rounded transition disabled:opacity-50 font-medium">
                {loading ? (isEditMode ? "Updating product..." : "Uploading & creating product...") : (isEditMode ? "Update Product" : "Add Product")}
            </button>
        </form>
    )
}
