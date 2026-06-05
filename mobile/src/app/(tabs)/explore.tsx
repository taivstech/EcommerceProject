import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Modal
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../../components/ui/productCard';
import { productService, categoryService, ProductResponse, CategoryResponse } from '../../services/productService';
import { cartService } from '../../services/cartService';

const { width, height } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = (width - 36) / 2; // Tính toán chiều rộng cho 2 cột

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ keyword?: string; categoryId?: string }>();
  const [keyword, setKeyword] = useState(params.keyword || '');
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(params.categoryId || null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Trạng thái mở rộng danh mục

  // State phục vụ Modal chi tiết sản phẩm
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [detailVariant, setDetailVariant] = useState<string | null>(null);
  const [boughtTogether, setBoughtTogether] = useState<ProductResponse[]>([]);
  const [similarProducts, setSimilarProducts] = useState<ProductResponse[]>([]);

  // Load danh mục
  useEffect(() => {
    categoryService.getAllCategories().then(cats => {
      const allCat = { id: 'all', name: 'Tất cả' };
      if (cats && cats.length > 0) {
        setCategories([allCat, ...cats]);
      } else {
        setCategories([
          allCat,
          { id: '1', name: 'Electronics', description: 'Điện tử' },
          { id: '2', name: 'Fashion', description: 'Thời trang' },
          { id: '3', name: 'Home & Kitchen', description: 'Gia dụng' },
          { id: '4', name: 'Beauty', description: 'Làm đẹp' },
          { id: '5', name: 'Sports', description: 'Thể thao' }
        ]);
      }
    });
  }, []);

  // Lấy sản phẩm khi keyword hoặc category thay đổi
  const fetchProducts = async () => {
    setSearching(true);
    try {
      const catId = selectedCategory === 'all' ? undefined : (selectedCategory || undefined);
      const results = await productService.searchProducts(keyword, catId, 0, 30);
      if (results && results.length > 0) {
        setProducts(results);
      } else {
        // Fallback mockup nếu API lỗi
        setProducts(MOCK_PRODUCTS);
      }
    } catch {
      setProducts(MOCK_PRODUCTS);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, params.keyword]);

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
    } catch {
      alert('Thao tác lỗi, xin vui lòng thử lại.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            placeholder="Tìm sản phẩm trên EcommerceWeb..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={fetchProducts}
            returnKeyType="search"
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => { setKeyword(''); setSelectedCategory('all'); }}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Navbar trên đầu kèm nút Mũi tên mở rộng */}
      <View style={styles.categoryNavbarContainer}>
        {!isExpanded ? (
          // Dạng hàng ngang cuộn trượt
          <View style={styles.rowNavbar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowNavbarScroll}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id || (cat.id === 'all' && selectedCategory === null);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                    onPress={() => setSelectedCategory(cat.id === 'all' ? null : cat.id)}
                  >
                    <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            {/* Nút mũi tên chỉ xuống */}
            <TouchableOpacity style={styles.expandArrowBtn} onPress={() => setIsExpanded(true)}>
              <Ionicons name="chevron-down" size={18} color="#10b981" />
            </TouchableOpacity>
          </View>
        ) : (
          // Dạng Grid lưới mở rộng toàn bộ danh mục
          <View style={styles.expandedGridBlock}>
            <View style={styles.expandedGridHeader}>
              <Text style={styles.expandedGridTitle}>Tất cả danh mục</Text>
              {/* Nút mũi tên chỉ lên */}
              <TouchableOpacity style={styles.expandArrowBtnActive} onPress={() => setIsExpanded(false)}>
                <Ionicons name="chevron-up" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id || (cat.id === 'all' && selectedCategory === null);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryGridChip, isSelected && styles.categoryGridChipSelected]}
                    onPress={() => {
                      setSelectedCategory(cat.id === 'all' ? null : cat.id);
                      setIsExpanded(false); // Đóng lại sau khi chọn
                    }}
                  >
                    <Text style={[styles.categoryGridChipText, isSelected && styles.categoryGridChipTextSelected]} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Lưới sản phẩm (2 CỘT) chiếm trọn chiều rộng */}
      <View style={styles.mainContent}>
        {searching || loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : products.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={48} color="#94a3b8" />
            <Text style={styles.noProductsText}>Không tìm thấy sản phẩm nào</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={() => { setKeyword(''); setSelectedCategory('all'); }}>
              <Text style={styles.resetBtnText}>Làm mới</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            numColumns={2} // THIẾT LẬP 2 CỘT TRÊN 1 HÀNG
            columnWrapperStyle={styles.columnWrapper}
            renderItem={({ item }) => (
              <ProductCard 
                product={item} 
                onPress={() => openProductDetails(item)} // MỞ MODAL NGAY KHI CLICK
              />
            )}
            contentContainerStyle={styles.productList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

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

// Mockup data phòng hờ kết nối API
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
    height: '100%',
  },
  categoryNavbarContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    zIndex: 10,
  },
  rowNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowNavbarScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#10b981',
    fontWeight: '700',
  },
  expandArrowBtn: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#f1f5f9',
    backgroundColor: '#fff',
    paddingRight: 6,
  },
  expandedGridBlock: {
    padding: 16,
    backgroundColor: '#fff',
  },
  expandedGridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  expandedGridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  expandArrowBtnActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryGridChip: {
    width: (width - 48) / 3, // Chia 3 cột đều
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  categoryGridChipSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  categoryGridChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  categoryGridChipTextSelected: {
    color: '#10b981',
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noProductsText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  resetBtn: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetBtnText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  productList: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 4,
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
