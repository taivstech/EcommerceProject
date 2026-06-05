import { api, authStore } from './api';

// Định nghĩa giao diện phản hồi
export interface ProductImage {
  id?: string;
  url: string;
  is_main?: boolean;
}

export interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface ProductResponse {
  id: string;
  name: string;
  description?: string;
  price?: number;
  min_price?: number;
  max_price?: number;
  total_sold?: number;
  avg_rating?: number;
  images?: ProductImage[];
  variants?: Variant[];
  category_id?: string;
  shop_id?: string;
  shop_name?: string;
  isNew?: boolean;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
}

export interface CategoryResponse {
  id: string;
  name: string;
  image_url?: string;
  description?: string;
}

export interface UserResponse {
  id: string;
  username: string;
  full_name?: string;
  email?: string;
  phone?: string;
  roles?: string[];
}

export const productService = {
  // Lấy danh sách sản phẩm bán chạy nhất
  getTopSellingProducts: async (page = 0, size = 10): Promise<ProductResponse[]> => {
    try {
      const res = await api.get<any>(`/products/top-selling?page=${page}&size=${size}`);
      return res.result?.content || [];
    } catch {
      return [];
    }
  },

  // Lấy sản phẩm mới nhất
  getNewestProducts: async (limit = 10): Promise<ProductResponse[]> => {
    try {
      const res = await api.get<ProductResponse[]>(`/products/newest?limit=${limit}`);
      return res.result || [];
    } catch {
      return [];
    }
  },

  // Tìm kiếm sản phẩm
  searchProducts: async (keyword: string, categoryId?: string, page = 0, size = 20): Promise<ProductResponse[]> => {
    try {
      let url = `/products/search?page=${page}&size=${size}`;
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
      if (categoryId) url += `&categoryId=${encodeURIComponent(categoryId)}`;
      const res = await api.get<any>(url);
      return res.result?.content || [];
    } catch {
      return [];
    }
  },

  // Lấy chi tiết sản phẩm theo ID
  getProductById: async (id: string): Promise<ProductResponse | null> => {
    try {
      const res = await api.get<ProductResponse>(`/products/${id}`);
      return res.result || null;
    } catch {
      return null;
    }
  },

  // Hệ thống đề xuất: Gợi ý cho bạn
  getRecommendationsForYou: async (limit = 10): Promise<ProductResponse[]> => {
    try {
      const res = await api.get<ProductResponse[]>(`/products/recommendations/for-you?limit=${limit}`);
      return res.result || [];
    } catch {
      return [];
    }
  },

  // Hệ thống đề xuất: Sản phẩm tương tự
  getSimilarProducts: async (productId: string, limit = 5): Promise<ProductResponse[]> => {
    try {
      const res = await api.get<ProductResponse[]>(`/products/${productId}/recommendations/similar?limit=${limit}`);
      return res.result || [];
    } catch {
      return [];
    }
  },

  // Hệ thống đề xuất: Thường được mua cùng nhau
  getBoughtTogether: async (productId: string, limit = 5): Promise<ProductResponse[]> => {
    try {
      const res = await api.get<ProductResponse[]>(`/products/${productId}/recommendations/bought-together?limit=${limit}`);
      return res.result || [];
    } catch {
      return [];
    }
  }
};

export const categoryService = {
  // Lấy toàn bộ danh mục sản phẩm
  getAllCategories: async (): Promise<CategoryResponse[]> => {
    try {
      const res = await api.get<CategoryResponse[]>('/categories');
      return res.result || [];
    } catch {
      return [];
    }
  }
};

export const authService = {
  // Đăng nhập
  login: async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post<any>('/auth/token', { email_or_phone: username, password });
      if (res.result && res.result.access_token) {
        authStore.setToken(res.result.access_token);
        // Đồng bộ giỏ hàng local lên server
        const { cartService } = require('./cartService');
        await cartService.mergeCart().catch((err: any) => console.error('Lỗi merge cart:', err.message));
        // Lấy thông tin user hiện tại (thử nghiệm)
        try {
          const userRes = await api.get<UserResponse>('/users/me');
          if (userRes.result) {
            authStore.setUser(userRes.result);
          }
        } catch (meErr: any) {
          console.log('Cảnh báo: Lỗi lấy thông tin /users/me:', meErr.message);
          // Vẫn cho phép đăng nhập thành công vì token đã lấy được
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Đăng nhập thất bại:', err);
      throw err;
    }
  },

  // Đăng ký tài khoản mới
  register: async (data: any): Promise<boolean> => {
    try {
      const res = await api.post<any>('/users/registration', data);
      return !!res.result;
    } catch (err) {
      console.error('Đăng ký thất bại:', err);
      throw err;
    }
  },

  // Lấy thông tin người dùng hiện tại
  getCurrentUser: async (): Promise<UserResponse | null> => {
    try {
      const res = await api.get<UserResponse>('/users/me');
      if (res.result) {
        authStore.setUser(res.result);
        return res.result;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Đăng xuất
  logout: async (): Promise<void> => {
    try {
      await api.post<void>('/auth/logout', {});
    } catch {}
    authStore.clear();
  }
};
