import Counter from '@/components/ui/Counter'
import PageTitle from '@/components/ui/PageTitle'
import { removeCartItem, fetchCartItems } from '@/redux/features/cart/cartSlice'
import { normalizeProduct } from '@/redux/features/product/productSlice'
import { productService } from '@/services'
import { Trash2Icon, ShoppingBagIcon } from 'lucide-react'
import { Image } from "@/utils/compat"
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from "@/utils/compat"
import { authService } from '@/utils/auth'

export default function Cart() {
  return <CartContent />
}

function CartContent() {
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '$'
  const router = useRouter()
  const dispatch = useDispatch()

  const cartItems = useSelector(state => state.cart.items)
  const products = useSelector(state => state.product.list)
  const [selectedShopId, setSelectedShopId] = useState(null)
  const [fetchedProducts, setFetchedProducts] = useState([])

  useEffect(() => {
    if (!cartItems.length) return
    const fetchMissingProducts = async () => {
      const productIds = cartItems.map(item => item.product_id)
      const missingIds = productIds.filter(id => !products.find(p => p.id === id))
      if (missingIds.length === 0) {
        setFetchedProducts([])
        return
      }
      try {
        const productPromises = missingIds.map(id => productService.getProductById(id).catch(() => null))
        const fetched = (await Promise.all(productPromises)).filter(Boolean).map(normalizeProduct)
        setFetchedProducts(fetched)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      }
    }
    fetchMissingProducts()
  }, [cartItems, products])

  const enrichedCartItems = useMemo(() => {
    if (!cartItems.length) return []
    const allProducts = [...products, ...fetchedProducts]
    return cartItems.map(item => {
      const product = allProducts.find(p => p.id === item.product_id)
      if (!product) {
        return {
          ...item,
          productName: 'Loading...',
          productImage: '',
          productPrice: 0,
          variantName: null,
          shopId: item.shop_id,
          shopName: 'Unknown Shop',
        }
      }
      const variant = product.variants?.find(v => v.id === item.product_variant_id)
      return {
        ...item,
        productName: product.name || 'Unknown Product',
        productImage: product.images?.[0]?.url || (typeof product.images?.[0] === 'string' ? product.images[0] : ''),
        productPrice: variant?.price ?? product.price ?? 0,
        variantName: variant?.name ?? null,
        shopId: item.shop_id || product.shopId,
        shopName: product.shopName || 'Unknown Shop',
      }
    }).filter(Boolean)
  }, [cartItems, products, fetchedProducts])

  const itemsByShop = useMemo(() => {
    const grouped = {}
    enrichedCartItems.forEach(item => {
      if (!grouped[item.shopId]) {
        grouped[item.shopId] = { shopId: item.shopId, shopName: item.shopName, items: [] }
      }
      grouped[item.shopId].items.push(item)
    })
    return Object.values(grouped)
  }, [enrichedCartItems])

  useEffect(() => {
    dispatch(fetchCartItems())
  }, [dispatch])

  const handleDeleteItem = id => {
    dispatch(removeCartItem(id))
  }

  const handleCheckout = () => {
    if (!selectedShopId) return
    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('returnUrl', '/cart')
      router.push('/login')
      return
    }
    router.push(`/checkout?shopId=${selectedShopId}`)
  }

  if (!enrichedCartItems.length) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-slate-400">
        <h1 className="text-2xl sm:text-4xl font-semibold">Your cart is empty</h1>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 py-8 text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <PageTitle heading="My Cart" text="Review your items" />

        {/* Header Table */}
        <div className="hidden md:grid grid-cols-12 bg-white p-4 mb-4 rounded-sm shadow-sm text-sm text-gray-500 font-medium">
          <div className="col-span-6">Product</div>
          <div className="col-span-2 text-center">Unit Price</div>
          <div className="col-span-2 text-center">Quantity</div>
          <div className="col-span-1 text-center">Amount</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>

        <div className="space-y-4">
          {itemsByShop.map(shop => {
            const isSelected = selectedShopId === shop.shopId
            const shopTotal = shop.items.reduce((sum, i) => sum + i.productPrice * i.quantity, 0)

            return (
              <div key={shop.shopId} className="bg-white rounded-sm shadow-sm overflow-hidden">
                {/* Shop Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                  <input
                    type="radio"
                    checked={isSelected}
                    onChange={() => setSelectedShopId(shop.shopId)}
                    className="w-5 h-5 accent-green-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <ShoppingBagIcon size={16} className="text-gray-700" />
                    <span className="font-bold text-sm uppercase tracking-tight text-gray-800">
                      {shop.shopName}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-gray-50">
                  {shop.items.map(item => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 items-center p-4 gap-4">
                      {/* Product Info */}
                      <div className="col-span-1 md:col-span-6 flex gap-4 items-center">
                        <div className="size-20 bg-gray-50 border border-gray-100 rounded-sm shrink-0">
                          {item.productImage && (
                            <Image
                              src={item.productImage}
                              alt=""
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-normal text-gray-800 text-sm line-clamp-2 mb-1">
                            {item.productName}
                          </p>
                          {item.variantName && (
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-sm">
                              Variant: {item.variantName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="col-span-1 md:col-span-2 text-center text-sm text-green-600 font-medium">
                        <span className="md:hidden text-gray-400 mr-2">Unit Price:</span>
                        {currency}{item.productPrice.toLocaleString('en-US')}
                      </div>

                      {/* Quantity */}
                      <div className="col-span-1 md:col-span-2 flex justify-center">
                        <Counter
                          cartItemId={item.id}
                          currentQuantity={item.quantity}
                        />
                      </div>

                      {/* Subtotal */}
                      <div className={`col-span-1 md:col-span-1 text-center text-sm font-medium ${isSelected ? 'text-green-600' : 'text-gray-700'}`}>
                        <span className="md:hidden text-gray-400 mr-2">Subtotal:</span>
                        {currency}{(item.productPrice * item.quantity).toLocaleString('en-US')}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 md:col-span-1 text-center">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-gray-500 hover:text-red-500 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shop Footer */}
                <div className="bg-green-50/30 p-4 border-t border-dashed border-gray-200 flex flex-col md:flex-row justify-end items-center gap-6">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Total ({shop.items.length} items):
                    </span>
                    <span className={`text-xl font-semibold ${isSelected ? 'text-green-600' : 'text-gray-700'}`}>
                      {currency}{shopTotal.toLocaleString('en-US')}
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={!isSelected}
                    className={`px-12 py-2.5 rounded-sm font-medium text-white transition-all ${
                      isSelected
                        ? 'bg-green-600 hover:bg-green-700 shadow-md'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Checkout
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}