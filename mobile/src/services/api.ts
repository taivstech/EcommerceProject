import { Platform } from 'react-native';

// Địa chỉ API của Backend
// - localhost:8088 cho trình mô phỏng iOS và Web
// - 10.0.2.2:8088 cho trình mô phỏng Android
// - Cấu hình Cloudflare tunnel dự phòng giống trên web
const getApiBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8088/api';
  }
  // Thử dùng địa chỉ Cloudflare tunnel nếu local không phản hồi (phù hợp kiểm thử thực tế)
  return 'http://localhost:8088/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const CLOUDFLARE_BACKUP_URL = 'https://ecommerce.pro.vn/api';

// Lưu trữ token trong bộ nhớ tạm thời của ứng dụng
let accessToken: string | null = null;
let currentUser: any | null = null;

export const authStore = {
  setToken: (token: string | null) => {
    accessToken = token;
  },
  getToken: () => {
    return accessToken;
  },
  setUser: (user: any) => {
    currentUser = user;
  },
  getUser: () => {
    return currentUser;
  },
  clear: () => {
    accessToken = null;
    currentUser = null;
  }
};

export interface ApiEnvelope<T> {
  code?: number;
  message?: string;
  result?: T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiEnvelope<T>> {
  // Thử gọi local trước, nếu lỗi kết nối sẽ tự động fallback về Cloudflare tunnel
  let url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Đính kèm token nếu có
  const token = authStore.getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Tiêu đề tránh cảnh báo ngrok/cloudflare
  headers.set('ngrok-skip-browser-warning', 'true');

  try {
    const res = await fetch(url, { ...options, headers });
    
    // Nếu lỗi kết nối cục bộ 404/500 và có Cloudflare backup, hãy thử gọi Cloudflare
    if (!res.ok && res.status >= 500) {
      throw new Error(`Server error: ${res.status}`);
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const msg = (data && data.message) || res.statusText || 'Yêu cầu thất bại';
      throw new Error(msg);
    }

    return (data || {}) as ApiEnvelope<T>;
  } catch (err: any) {
    // Fallback sang Cloudflare URL khi gặp lỗi kết nối
    if (err.message?.includes('Failed to fetch') || err.message?.includes('Network request failed')) {
      const fallbackUrl = `${CLOUDFLARE_BACKUP_URL}${path.startsWith('/') ? path : `/${path}`}`;
      console.log(`Lỗi kết nối local, thử kết nối tới Cloudflare: ${fallbackUrl}`);
      try {
        const res = await fetch(fallbackUrl, { ...options, headers });
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!res.ok) throw new Error((data && data.message) || 'Yêu cầu thất bại');
        return (data || {}) as ApiEnvelope<T>;
      } catch (fallbackErr: any) {
        throw new Error(`Lỗi kết nối mạng: Không thể kết nối tới máy chủ API.`);
      }
    }
    throw err;
  }
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: any, options?: RequestInit) => 
    request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: any, options?: RequestInit) => 
    request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  del: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'DELETE' }),
};
