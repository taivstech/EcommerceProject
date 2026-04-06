

export interface ApiResponse<T> {
  code: number
  message?: string
  result?: T
}

export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  number?: number
  size?: number
  first?: boolean
  last?: boolean
  empty?: boolean
}


export interface RoleResponse {
  name: string
  description?: string
  permissions?: PermissionResponse[]
}

export interface RoleRequest {
  id?: string
  description?: string
}

export interface PermissionResponse {
  name: string
  description?: string
}

export interface UserResponse {
  id: string
  username: string
  email: string
  full_name: string
  dob?: string
  profile_picture?: string
  roles: RoleResponse[]
}

export interface AuthenticationResponse {
  access_token: string
  authenticated: boolean
}

export interface AuthenticationRequest {
  username?: string // Deprecated: use email_or_phone instead
  email_or_phone?: string // Email or phone number for login (snake_case to match backend)
  password: string
}

export interface UserCreationRequest {
  username: string
  password: string
  confirm_password: string
  full_name: string
  email: string
  phone?: string
  dob?: string
}

export interface IntrospectRequest {
  token: string
}

export interface IntrospectResponse {
  valid: boolean
  user_id?: string
}

export interface RefreshRequest {
  access_token?: string
}

export interface UpgradeSellerRequest {
  shop_id?: string
  shop_name?: string
}

export interface OutboundOAuthStateResponse {
  state: string
  state_signature: string
  expires_in_seconds: number
}

export interface ExchangeTokenRequest {
  code: string
  state: string
  state_signature: string
  code_verifier: string
  redirect_uri: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
}

export interface UserAddressResponse {
  id: string
  receiver_name: string
  phone_number: string
  full_address?: string
  detail_address?: string
  ward?: string
  ward_code?: string
  district?: string
  district_id?: number
  province?: string
  province_id?: string
  default_address: boolean
}

export interface UserAddressRequest {
  receiver_name: string
  phone_number: string
  full_address?: string
  detail_address?: string
  ward?: string
  ward_code?: string
  district?: string
  district_id?: number
  province?: string
  province_id?: string
  default_address?: boolean
}

export interface UserCouponResponse {
  userId: string
  couponId: string
}


export interface ProductImageResponse {
  id: string
  url: string
  is_main: boolean
}

export interface DetailAttributeResponse {
  id: string
  name: string
  image_url?: string
  sort_order?: number
}

export interface ProductVariantResponse {
  id: string
  name?: string
  sku?: string
  price: number
  stock: number
  sold_count?: number
  status: string
  detail_attributes: DetailAttributeResponse[]
}

export interface ProductAttributeResponse {
  id: string
  name: string
  sort_order?: number
  options: DetailAttributeResponse[]
}

export interface ProductResponse {
  id: string
  name: string
  description?: string
  price?: number
  min_price?: number
  max_price?: number
  weight?: number
  length?: number
  width?: number
  height?: number
  shop_id: string
  shop_name?: string
  category_id: string
  created_at: string
  total_sold?: number
  images: ProductImageResponse[]
  variants: ProductVariantResponse[]
  attributes: ProductAttributeResponse[]
}

export interface DetailAttributeOptionRequest {
  name: string
  image_url?: string
}

export interface ProductAttributeRequest {
  name: string
  options: DetailAttributeOptionRequest[]
}

export interface ProductCreateRequest {
  name: string
  description?: string
  price: number
  category_id: string
  weight?: number
  length?: number
  width?: number
  height?: number
  attributes?: ProductAttributeRequest[]
  variants?: ProductVariantRequest[]
}

export interface ProductVariantRequest {
  name?: string
  sku?: string
  price: number
  stock: number
  status?: string
  option_names?: string[]
  detail_attribute_ids?: string[]
}

export interface ProductUpdateRequest {
  name: string
  description?: string
  price: number
  category_id?: string
  weight?: number
  length?: number
  width?: number
  height?: number
  attributes?: ProductAttributeRequest[]
  variants?: ProductVariantRequest[]
}

export interface ProductSearchRequest {
  keyword?: string
  category_id?: string
  shop_id?: string
  min_price?: number
  max_price?: number
  sortBy?: string
  sortDir?: string
  page?: number
  size?: number
}

/** Elasticsearch product search result */
export interface ProductSearchResult {
  id: string
  name: string
  description?: string
  min_price?: number
  max_price?: number
  shop_id?: string
  shop_name?: string
  category_id?: string
  category_name?: string
  total_sold?: number
  main_image_url?: string
  image_urls?: string[]
  variant_count?: number
  total_stock?: number
  score?: number
}

export interface ElasticSearchRequest {
  q?: string
  categoryId?: string
  shopId?: string
  province?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  sortDir?: string
  page?: number
  size?: number
}

export interface ShopSuggestion {
  id: string
  name: string
  logo?: string
}

export interface ProductSuggestion {
  id: string
  name: string
  min_price?: number
  main_image_url?: string
  total_sold?: number
}

export interface SuggestResponse {
  keywords: string[]
  shops: ShopSuggestion[]
  products: ProductSuggestion[]
}

export interface CustomerReviewResponse {
  id: string
  rating: number
  comment?: string
  product_variant_id: string
  variant_name?: string
  user_id: string
  user_name: string
  user_avatar?: string
  created_at: string
}

export interface CreateReviewRequest {
  orderItemId: string
  rating: number
  comment?: string
}

export interface ProductRatingStats {
  average_rating: number
  total_reviews: number
  rating_distribution: { [key: number]: number }
}

export interface WishlistResponse {
  id: string
  product_id: string
  product_name: string
  product_image?: string
  product_price: number
  added_at: string
}


export interface CategoryResponse {
  id: string
  name: string
  description?: string
  imageUrl?: string
}

export interface CategoryRequest {
  name: string
  description?: string
  imageUrl?: string
}


export interface CartItemResponse {
  id: string
  quantity: number
  added_at: string
  product_variant_id: string
  product_id: string
  shop_id: string
}

export interface AddToCartRequest {
  product_variant_id: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}


export interface ShippingAddressResponse {
  receiver_name: string
  phone_number: string
  full_address?: string
  detail_address?: string
  ward?: string
  ward_code?: string
  district?: string
  province?: string
  district_id?: number
  province_id?: string
}

export interface OrderItemResponse {
  id: string
  quantity: number
  price: number
  product_variant_id: string
  product_id?: string
  product_name?: string
  product_image?: string
  variant_name?: string
  variant_sku?: string
  has_review?: boolean
}

export interface OrderShopGroupResponse {
  id: string
  shop_id: string
  items: OrderItemResponse[]
  subtotal: number
  shipping_fee: number
  total_discount: number
  total: number
  shipment?: string
  warehouse_id?: string
  warehouse_name?: string
}

export interface OrderResponse {
  id: string
  status: string
  payment: string
  is_paid?: boolean
  note?: string
  subtotal: number
  shipping_fee: number
  total_discount: number
  total: number
  created_at: string
  shipping_address: ShippingAddressResponse
  shop_groups: OrderShopGroupResponse[]
}

export interface CheckoutRequest {
  receiver_name: string
  phone_number: string
  full_address?: string
  detail_address?: string
  ward?: string
  ward_code?: string
  district?: string
  district_id?: number
  province?: string
  province_id?: string
  payment?: string
  coupon_code?: string
  shop_coupon_code?: string
  note?: string
  shop_id?: string
}

export interface UpdateOrderStatusRequest {
  status: string
  cancel_reason?: string
}

export interface CouponResponse {
  id: string
  code: string
  coupon_type: string
  discount_type: string
  discount_value: number
  max_discount?: number
  min_order_amount?: number
  max_usage?: number
  max_usage_per_user?: number
  current_usage?: number
  current_user_usage_count?: number
  valid_from: string
  valid_to: string
  is_active: boolean
  description?: string
  shop_id?: string
  used_by_current_user?: boolean
}

export interface CreateCouponRequest {
  code: string
  coupon_type: string
  discount_type: string
  discount_value: number
  max_discount?: number
  min_order_amount?: number
  max_usage?: number
  max_usage_per_user?: number
  valid_from: string
  valid_to: string
  description?: string
  shop_id?: string
}

export interface ApplyCouponRequest {
  code: string
}

export interface ShopAddressResponse {
  id: string
  phone_number?: string
  latitude?: number
  longitude?: number
  full_address?: string
  detail_address?: string
  ward?: string
  ward_code?: string
  district?: string
  district_id?: number
  province?: string
  province_id?: string
}

export interface ShopResponse {
  id: string
  name: string
  description?: string
  logo?: string
  address?: string
  status: string
  rejection_reason?: string
  approved_at?: string
  approved_by?: string
  created_at: string
  user_id: string
  shop_address?: ShopAddressResponse
}

export interface ShopCreateRequest {
  name: string
  description?: string
  full_address?: string
  province?: string
  province_id?: string
  district?: string
  district_id?: number
  ward?: string
  ward_code?: string
  detail_address?: string
}

export interface ShopUpdateRequest {
  name?: string
  description?: string
  full_address?: string
  province?: string
  province_id?: string
  district?: string
  district_id?: number
  ward?: string
  ward_code?: string
  detail_address?: string
}

export interface ShopModerationRequest {
  reason?: string
}

export interface ShopFollowerResponse {
  id: string
  shop_id: string
  shop_name: string
  followed_at: string
}

export interface NotificationResponse {
  id: string
  title: string
  user_id: string
  type: string
  message?: string
  status?: string
  created_at: string
  read_at?: string
  referenceId?: string
  referenceType?: string
}

export interface MessageResponse {
  room_id: string
  message_id: string
  content: string
  type?: string
  sender_id?: string
  sender_name?: string
  sent_at: string
}

export interface RoomResponse {
  room_id: string
  name: string
  created_at: string
  last_message_at?: string
}

export interface PrivateChatResponse {
  room_id: string
  other_user_id: string
  other_user_name: string
  other_shop_name?: string
  created_at?: string
  last_message_at?: string
}

export interface SendMessageRequest {
  content: string
}

export interface SendRoomMessageRequest {
  content: string
  type?: string
}

export interface CreatePrivateChatRequest {
  other_user_id: string
}

export interface ShippingFeeRequest {
  shopId?: string
  serviceTypeId?: number
  fromDistrictId?: number
  fromWardCode?: string
  toDistrictId?: number
  toWardCode?: string
  weight?: number
  length?: number
  width?: number
  height?: number
  insuranceValue?: number
  coupon?: string
  items?: ShippingFeeItem[]
}

export interface ShippingFeeItem {
  name?: string
  quantity?: number
  length?: number
  width?: number
  height?: number
  weight?: number
}

export interface DashboardStats {
  total_users: number
  total_shops: number
  total_products: number
  total_orders: number
  total_revenue: number
  pending_shops: number
  pending_products: number
  pending_orders: number
  active_users: number
  approved_shops: number
  approved_products: number
}
