import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, authStore } from './api';
import { ProductResponse, productService } from './productService';

export interface CartItem {
  id: string; // ID của mục giỏ hàng (ở Backend) hoặc tự sinh ở local
  product_id: string;
  product_name: string;
  product_image?: string;
  variant_id?: string | null;
  variant_name?: string;
  price: number;
  quantity: number;
  product_info?: ProductResponse;
}

const LOCAL_CART_KEY = 'guest_cart';

// Các hàm phụ trợ đọc/ghi AsyncStorage bất đồng bộ
const getLocalCart = async (): Promise<CartItem[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(LOCAL_CART_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Lỗi đọc giỏ hàng local:', e);
    return [];
  }
};

const saveLocalCart = async (cart: CartItem[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(cart);
    await AsyncStorage.setItem(LOCAL_CART_KEY, jsonValue);
  } catch (e) {
    console.error('Lỗi ghi giỏ hàng local:', e);
  }
};

export const cartService = {
  // Lấy danh sách sản phẩm trong giỏ hàng
  getCartItems: async (): Promise<CartItem[]> => {
    const token = authStore.getToken();
    if (!token) {
      return await getLocalCart();
    }
    try {
      const res = await api.get<any[]>('/cart');
      const items = res.result || [];
      const cartItems: CartItem[] = [];
      
      for (const item of items) {
        // Fetch detailed product info to display name, image, price correctly
        const productId = item.product_id || item.productId;
        const productVariantId = item.product_variant_id || item.productVariantId;
        if (productId) {
          const product = await productService.getProductById(String(productId));
          if (product) {
            const variant = product.variants?.find((v: any) => v.id === productVariantId);
            cartItems.push({
              id: String(item.id),
              product_id: product.id,
              product_name: product.name,
              product_image: product.images?.find((img: any) => img.is_main)?.url || product.images?.[0]?.url || '',
              variant_id: productVariantId || null,
              variant_name: variant?.name || '',
              price: variant?.price || product.price || product.min_price || 0,
              quantity: item.quantity || 1,
              product_info: product
            });
          }
        }
      }
      return cartItems;
    } catch (err) {
      console.error('Không thể lấy giỏ hàng từ server, sử dụng giỏ hàng cục bộ:', err);
      return await getLocalCart();
    }
  },

  // Thêm vào giỏ hàng
  addToCart: async (product: ProductResponse, quantity = 1, variantId: string | null = null): Promise<void> => {
    const token = authStore.getToken();
    const price = product.price || product.min_price || 0;
    const variant = product.variants?.find(v => v.id === variantId) || product.variants?.[0];

    if (!token) {
      // Logic giỏ hàng local cho khách
      const localCart = await getLocalCart();
      const existingIndex = localCart.findIndex(
        item => item.product_id === product.id && item.variant_id === variantId
      );
      if (existingIndex > -1) {
        localCart[existingIndex].quantity += quantity;
      } else {
        localCart.push({
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          product_id: product.id,
          product_name: product.name,
          product_image: product.images?.find(img => img.is_main)?.url || product.images?.[0]?.url || '',
          variant_id: variantId || variant?.id || null,
          variant_name: variant?.name || '',
          price: variant?.price || price,
          quantity,
          product_info: product
        });
      }
      await saveLocalCart(localCart);
      return;
    }

    try {
      await api.post('/cart/items', {
        product_variant_id: variantId || (variant?.id) || null,
        quantity
      });
    } catch (err: any) {
      console.error(`Không thể đồng bộ giỏ hàng với server: ${err.message}`);
      // Fallback local
      const localCart = await getLocalCart();
      localCart.push({
        id: `local_${Date.now()}`,
        product_id: product.id,
        product_name: product.name,
        price,
        quantity,
        product_info: product
      });
      await saveLocalCart(localCart);
    }
  },

  // Cập nhật số lượng
  updateCartItem: async (itemId: string, quantity: number): Promise<void> => {
    const token = authStore.getToken();
    
    // Tìm và cập nhật local trước
    const localCart = await getLocalCart();
    const localIndex = localCart.findIndex(item => item.id === itemId);
    if (localIndex > -1) {
      localCart[localIndex].quantity = quantity;
      await saveLocalCart(localCart);
    }

    if (!token || itemId.startsWith('local_')) {
      return;
    }

    try {
      await api.put(`/cart/items/${itemId}`, { quantity });
    } catch (err) {
      console.error('Lỗi cập nhật giỏ hàng server:', err);
    }
  },

  // Xóa mục khỏi giỏ hàng
  removeCartItem: async (itemId: string): Promise<void> => {
    const token = authStore.getToken();
    
    let localCart = await getLocalCart();
    localCart = localCart.filter(item => item.id !== itemId);
    await saveLocalCart(localCart);

    if (!token || itemId.startsWith('local_')) {
      return;
    }

    try {
      await api.del(`/cart/items/${itemId}`);
    } catch (err) {
      console.error('Lỗi xóa mục khỏi giỏ hàng server:', err);
    }
  },

  // Làm sạch giỏ hàng
  clearCart: async (): Promise<void> => {
    const token = authStore.getToken();
    await saveLocalCart([]);

    if (!token) return;

    try {
      await api.del('/cart');
    } catch (err) {
      console.error('Lỗi xóa giỏ hàng server:', err);
    }
  },

  // Đồng bộ giỏ hàng local lên server khi đăng nhập thành công
  mergeCart: async (): Promise<void> => {
    const token = authStore.getToken();
    if (!token) return;
    try {
      const localCart = await getLocalCart();
      if (localCart.length > 0) {
        for (const item of localCart) {
          const vId = item.variant_id;
          if (vId) {
            await api.post('/cart/items', {
              product_variant_id: vId,
              quantity: item.quantity
            }).catch(err => console.error(`Lỗi merge mục ${item.product_name}:`, err.message));
          }
        }
        await saveLocalCart([]); // Làm sạch local cart sau khi hoàn thành merge
      }
    } catch (err: any) {
      console.error('Lỗi đồng bộ giỏ hàng:', err.message);
    }
  }
};
