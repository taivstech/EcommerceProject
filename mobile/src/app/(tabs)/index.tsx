import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Dimensions, 
  RefreshControl,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import ProductCard from '../../components/ui/productCard';
import { productService, categoryService, ProductResponse, CategoryResponse } from '../../services/productService';
import { cartService } from '../../services/cartService';
import { authStore } from '../../services/api';

const { width } = Dimensions.get('window');

// Dữ liệu mẫu (Mock data) chất lượng cao phòng khi Backend chưa khởi chạy hoặc mất kết nối
const MOCK_CATEGORIES: CategoryResponse[] = [
  { id: '1', name: 'Electronics', description: 'Điện tử' },
  { id: '2', name: 'Fashion', description: 'Thời trang' },
  { id: '3', name: 'Home & Kitchen', description: 'Nhà cửa & Bếp' },
  { id: '4', name: 'Beauty', description: 'Làm đẹp' },
  { id: '5', name: 'Sports', description: 'Thể thao' },
];

const MOCK_PRODUCTS: ProductResponse[] = [
  {
    id: 'mock-1',
    name: 'Wireless Noise Cancelling Headphones',
    price: 199.99,
    total_sold: 1450,
    avg_rating: 4.8,
    isNew: true,
    images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60' }]
  },
  {
    id: 'mock-2',
    name: 'Minimalist Leather Watch',
    price: 120.00,
    min_price: 120.00,
    max_price: 150.00,
    total_sold: 840,
    avg_rating: 4.6,
    images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60' }]
  },
  {
    id: 'mock-3',
    name: 'Premium Canvas Backpack',
    price: 59.99,
    total_sold: 210,
    avg_rating: 4.4,
    images: [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60' }]
  },
  {
    id: 'mock-4',
    name: 'Smart Fitness Tracker',
    price: 49.99,
    total_sold: 3400,
    avg_rating: 4.7,
    isNew: true,
    images: [{ url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&auto=format&fit=crop&q=60' }]
  }
];

export default function HomeScreen() {
  const [categories, setCategories] = useState<CategoryResponse[]>(MOCK_CATEGORIES);
  const [bestSellers, setBestSellers] = useState<ProductResponse[]>(MOCK_PRODUCTS);
  const [recommended, setRecommended] = useState<ProductResponse[]>(MOCK_PRODUCTS);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0); // Số lượng sản phẩm trong giỏ

  // State phục vụ Modal chi tiết sản phẩm
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [detailVariant, setDetailVariant] = useState<string | null>(null);
  const [boughtTogether, setBoughtTogether] = useState<ProductResponse[]>([]);
  const [similarProducts, setSimilarProducts] = useState<ProductResponse[]>([]);

  const loadData = async () => {
    try {
      // Gọi các API độc lập để tránh lỗi 1 API làm hỏng toàn bộ
      const cats = await categoryService.getAllCategories().catch(() => []);
      if (cats && cats.length > 0) setCategories(cats);

      const tops = await productService.getTopSellingProducts(0, 6).catch(() => []);
      if (tops && tops.length > 0) setBestSellers(tops);

      // Nếu có token đăng nhập thì lấy Recommendations For You, ngược lại lấy Newest Products làm gợi ý
      let recs: ProductResponse[] = [];
      const token = authStore.getToken();
      if (token) {
        recs = await productService.getRecommendationsForYou(8).catch(() => []);
      } else {
        recs = await productService.getNewestProducts(8).catch(() => []);
      }
      
      // Cập nhật gợi ý cho bạn
      if (recs && recs.length > 0) {
        setRecommended(recs);
      } else if (tops && tops.length > 0) {
        setRecommended(tops);
      }

      const cartItems = await cartService.getCartItems().catch(() => []);
      if (cartItems) {
        setCartItemCount(cartItems.reduce((sum, item) => sum + item.quantity, 0));
      }
    } catch (err) {
      console.warn('Lỗi loadData trang chủ:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tải lại số lượng sản phẩm mỗi khi quay về trang chủ
  useFocusEffect(
    useCallback(() => {
      cartService.getCartItems().then(items => {
        setCartItemCount(items.reduce((sum, item) => sum + item.quantity, 0));
      });
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearchSubmit = () => {
    if (searchKeyword.trim()) {
      router.push({
        pathname: '/explore',
        params: { keyword: searchKeyword.trim() }
      });
    }
  };

  // Xử lý mở Modal xem chi tiết sản phẩm
  const openProductDetails = async (product: ProductResponse) => {
    setSelectedProduct(product);
    setDetailQuantity(1);
    setDetailLoading(true);
    setDetailVariant(null);
    
    try {
      // Gọi chi tiết sản phẩm đầy đủ để lấy danh sách phân loại (variants) thật từ DB
      const fullProduct = await productService.getProductById(product.id);
      const activeProduct = fullProduct || product;
      setSelectedProduct(activeProduct);
      
      if (activeProduct.variants && activeProduct.variants.length > 0) {
        setDetailVariant(activeProduct.variants[0].id);
      }
      
      const [together, similar] = await Promise.all([
        productService.getBoughtTogether(product.id, 4).catch(() => []),
        productService.getSimilarProducts(product.id, 4).catch(() => [])
      ]);
      setBoughtTogether(together && together.length > 0 ? together : MOCK_PRODUCTS.filter(p => p.id !== product.id));
      setSimilarProducts(similar && similar.length > 0 ? similar : MOCK_PRODUCTS.filter(p => p.id !== product.id));
    } catch (err) {
      console.warn('Lỗi lấy chi tiết gợi ý sản phẩm:', err);
      setBoughtTogether(MOCK_PRODUCTS.filter(p => p.id !== product.id));
      setSimilarProducts(MOCK_PRODUCTS.filter(p => p.id !== product.id));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddToCartFromDetail = async () => {
    if (!selectedProduct) return;
    
    if (!detailVariant) {
      alert('Sản phẩm này bị lỗi dữ liệu (không có phân loại). Không thể thêm vào giỏ hàng!');
      return;
    }

    try {
      await cartService.addToCart(selectedProduct, detailQuantity, detailVariant);
      alert(`Đã thêm ${detailQuantity} sản phẩm vào giỏ hàng!`);
      setSelectedProduct(null);
      // Tải lại số lượng badge giỏ hàng
      const items = await cartService.getCartItems();
      setCartItemCount(items.reduce((sum, item) => sum + item.quantity, 0));
    } catch {
      alert('Thao tác lỗi, xin vui lòng thử lại.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header & Thanh Tìm kiếm */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>Ecommerce<Text style={styles.brandAccent}>Web</Text></Text>
          
          <View style={styles.headerRightActions}>
            {/* THÊM LOGO GIỎ HÀNG PHÍA TRÊN */}
            <TouchableOpacity style={styles.headerCartBtn} onPress={() => router.push('/cart')}>
              <Ionicons name="cart" size={24} color="#1e293b" />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.bellBtn} onPress={() => alert('Chức năng thông báo đang được phát triển!')}>
              <Ionicons name="notifications" size={22} color="#1e293b" />
              <View style={styles.bellBadge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Thanh tìm kiếm mô phỏng Web */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            placeholder="Tìm sản phẩm, thương hiệu..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchKeyword.length > 0 && (
            <TouchableOpacity onPress={() => setSearchKeyword('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : (
          <View style={styles.content}>
            {/* Banner nổi bật */}
            <View style={styles.heroBanner}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=60' }}
                style={styles.bannerImage}
                contentFit="cover"
              />
              <View style={styles.bannerOverlay}>
                <Text style={styles.bannerTitle}>Siêu Hội Mua Sắm</Text>
                <Text style={styles.bannerSubtitle}>Giảm giá lên đến 50% cho tất cả thiết bị điện tử</Text>
                <TouchableOpacity style={styles.bannerBtn} onPress={() => router.push('/explore')}>
                  <Text style={styles.bannerBtnText}>Mua Ngay</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Danh mục (Category grid ngang) */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
              <TouchableOpacity onPress={() => router.push('/explore')}>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={styles.categoryItem}
                  onPress={() => router.push({ pathname: '/explore', params: { categoryId: cat.id } })}
                >
                  <View style={styles.categoryIconCircle}>
                    <Ionicons name="apps" size={24} color="#10b981" />
                  </View>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Best Sellers */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bán Chạy Nhất 🔥</Text>
              <TouchableOpacity onPress={() => router.push('/explore')}>
                <Text style={styles.viewAllText}>Xem thêm</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.bestSellerScroll}
            >
              {bestSellers.map((product) => (
                <View key={'best-' + product.id} style={{ marginRight: 12 }}>
                  <ProductCard product={product} onPress={() => openProductDetails(product)} />
                </View>
              ))}
            </ScrollView>

            {/* Recommendations / Gợi ý cho bạn */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gợi Ý Cho Bạn ✨</Text>
            </View>
            <View style={styles.recommendationGrid}>
              {recommended.map((product) => (
                <ProductCard key={'rec-' + product.id} product={product} onPress={() => openProductDetails(product)} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL CHI TIẾT SẢN PHẨM SANG TRỌNG (SLIDE UP) */}
      {selectedProduct && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setSelectedProduct(null)}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedProduct(null)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {selectedProduct.name}
              </Text>
              <View style={{ width: 36 }} />
            </View>

            {detailLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#10b981" />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                {/* Ảnh sản phẩm chi tiết */}
                <View style={styles.modalImgContainer}>
                  <Image 
                    source={{ 
                      uri: selectedProduct.images?.find(i => i.is_main)?.url || 
                           selectedProduct.images?.[0]?.url || 
                           'https://placehold.co/400x400?text=' + encodeURIComponent(selectedProduct.name)
                    }} 
                    style={styles.modalImg} 
                    contentFit="contain" 
                  />
                </View>

                {/* Khối thông tin chi tiết */}
                <View style={styles.modalInfoBlock}>
                  <Text style={styles.modalPrice}>
                    ${(selectedProduct.price || selectedProduct.min_price || 0).toFixed(2)}
                  </Text>
                  
                  <Text style={styles.modalTitle}>{selectedProduct.name}</Text>

                  {/* Đánh giá */}
                  <View style={styles.modalRatingRow}>
                    <View style={styles.modalRatingBadge}>
                      <Ionicons name="star" size={12} color="#f59e0b" />
                      <Text style={styles.modalRatingText}>
                        {(selectedProduct.avg_rating || 4.5).toFixed(1)}
                      </Text>
                    </View>
                    <Text style={styles.modalSoldText}>
                      Đã bán {selectedProduct.total_sold || 45} sản phẩm
                    </Text>
                  </View>

                  <Text style={styles.modalSecTitle}>Mô tả</Text>
                  <Text style={styles.modalDesc}>
                    {selectedProduct.description || 'Sản phẩm chính hãng chất lượng cao cung cấp bởi EcommerceWeb. Bảo hành uy tín, hỗ trợ giao hàng siêu tốc trong ngày.'}
                  </Text>

                  {/* Chọn biến thể */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <View style={styles.modalVariantsBlock}>
                      <Text style={styles.modalSecTitle}>Chọn phân loại</Text>
                      <View style={styles.modalVariantsRow}>
                        {selectedProduct.variants.map((v) => {
                          const isSel = detailVariant === v.id;
                          return (
                            <TouchableOpacity
                              key={v.id}
                              style={[styles.modalVarChip, isSel && styles.modalVarChipSelected]}
                              onPress={() => setDetailVariant(v.id)}
                            >
                              <Text style={[styles.modalVarChipText, isSel && styles.modalVarChipTextSelected]}>
                                {v.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Chọn số lượng */}
                  <View style={styles.modalQtyBlock}>
                    <Text style={styles.modalSecTitle}>Số lượng</Text>
                    <View style={styles.qtyBox}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => setDetailQuantity(p => Math.max(1, p - 1))}>
                        <Ionicons name="remove" size={16} color="#1e293b" />
                      </TouchableOpacity>
                      <Text style={styles.qtyVal}>{detailQuantity}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => setDetailQuantity(p => p + 1)}>
                        <Ionicons name="add" size={16} color="#1e293b" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Thường mua kèm */}
                  {boughtTogether.length > 0 && (
                    <View style={styles.modalBoughtBlock}>
                      <Text style={styles.modalSecTitle}>Thường mua cùng nhau 📦</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
                        {boughtTogether.map((bt) => (
                          <View key={'bt-' + bt.id} style={{ marginRight: 10 }}>
                            <ProductCard product={bt} onPress={() => openProductDetails(bt)} />
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Sản phẩm tương tự */}
                  {similarProducts.length > 0 && (
                    <View style={styles.modalBoughtBlock}>
                      <Text style={styles.modalSecTitle}>Sản phẩm tương tự 🔍</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
                        {similarProducts.map((sp) => (
                          <View key={'similar-' + sp.id} style={{ marginRight: 10 }}>
                            <ProductCard product={sp} onPress={() => openProductDetails(sp)} />
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}

            {/* Bottom Bar Action */}
            <View style={styles.modalBottomBar}>
              <TouchableOpacity style={styles.modalAddBtn} onPress={handleAddToCartFromDetail}>
                <Ionicons name="cart" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.modalAddBtnText}>Thêm Vào Giỏ Hàng</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#10b981',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerCartBtn: {
    position: 'relative',
    padding: 4,
    marginRight: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  bellBtn: {
    position: 'relative',
    padding: 4,
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    height: '100%',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  heroBanner: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 24,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 16,
    justifyContent: 'center',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
    maxWidth: '80%',
  },
  bannerBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  viewAllText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
  categoryScroll: {
    paddingBottom: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 70,
  },
  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  bestSellerScroll: {
    paddingBottom: 16,
  },
  recommendationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: width * 0.6,
  },
  modalScroll: {
    paddingBottom: 40,
  },
  modalImgContainer: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImg: {
    width: '85%',
    height: '85%',
  },
  modalInfoBlock: {
    padding: 20,
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 22,
    marginBottom: 12,
  },
  modalRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
    marginRight: 10,
  },
  modalRatingText: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: '700',
  },
  modalSoldText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  modalSecTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 14,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  modalVariantsBlock: {
    marginTop: 6,
  },
  modalVariantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalVarChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalVarChipSelected: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  modalVarChipText: {
    fontSize: 11,
    color: '#475569',
  },
  modalVarChipTextSelected: {
    color: '#10b981',
    fontWeight: '700',
  },
  modalQtyBlock: {
    marginTop: 6,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyVal: {
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  modalBoughtBlock: {
    marginTop: 16,
  },
  modalBottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  modalAddBtn: {
    backgroundColor: '#10b981',
    height: 46,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAddBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
