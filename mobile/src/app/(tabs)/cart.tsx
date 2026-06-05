import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { cartService, CartItem } from '../../services/cartService';
import { authStore } from '../../services/api';

const { width } = Dimensions.get('window');

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  const loadCart = async () => {
    setLoading(true);
    try {
      const items = await cartService.getCartItems();
      setCartItems(items);

      // Auto-select shop if there is only one shop in the cart
      const uniqueShopIds = Array.from(new Set(items.map(item => item.product_info?.shop_id || (item.product_info as any)?.shopId || 'other')));
      if (uniqueShopIds.length === 1) {
        setSelectedShopId(uniqueShopIds[0]);
      } else if (selectedShopId && !uniqueShopIds.includes(selectedShopId)) {
        setSelectedShopId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [selectedShopId])
  );

  const handleQtyChange = async (itemId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    await cartService.updateCartItem(itemId, newQty);
    // Reload items without full spinner if possible, or just call loadCart
    try {
      const items = await cartService.getCartItems();
      setCartItems(items);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    await cartService.removeCartItem(itemId);
    alert('Đã xóa sản phẩm khỏi giỏ hàng.');
    loadCart();
  };

  // Group cart items by shop
  const itemsByShop = useMemo(() => {
    const grouped: Record<string, { shopId: string; shopName: string; items: CartItem[] }> = {};
    cartItems.forEach(item => {
      const shopId = item.product_info?.shop_id || (item.product_info as any)?.shopId || 'other';
      const shopName = item.product_info?.shop_name || (item.product_info as any)?.shopName || 'Cửa hàng khác';
      if (!grouped[shopId]) {
        grouped[shopId] = { shopId, shopName, items: [] };
      }
      grouped[shopId].items.push(item);
    });
    return Object.values(grouped);
  }, [cartItems]);

  const calculateSubtotal = () => {
    if (!selectedShopId) return 0;
    return cartItems
      .filter(item => (item.product_info?.shop_id || (item.product_info as any)?.shopId || 'other') === selectedShopId)
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giỏ hàng của tôi</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={async () => { await cartService.clearCart(); setSelectedShopId(null); loadCart(); }}>
            <Text style={styles.clearText}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cart-outline" size={64} color="#94a3b8" />
          <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
          <Text style={styles.emptySubtitle}>Hãy lướt xem các sản phẩm và chọn mua món đồ yêu thích của bạn nhé!</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/' as any)}>
            <Text style={styles.shopBtnText}>Mua Sắm Ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.container}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.itemList}
          >
            {itemsByShop.map(shop => {
              const isSelected = selectedShopId === shop.shopId;
              const shopTotal = shop.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

              return (
                <View key={shop.shopId} style={[styles.shopSection, isSelected && styles.shopSectionSelected]}>
                  {/* Shop Header with Radio button */}
                  <TouchableOpacity 
                    style={styles.shopHeader} 
                    onPress={() => setSelectedShopId(shop.shopId)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    
                    <Ionicons name="storefront-outline" size={18} color="#1e293b" style={styles.shopIcon} />
                    <Text style={styles.shopNameText} numberOfLines={1}>
                      {shop.shopName}
                    </Text>
                  </TouchableOpacity>

                  {/* Items list for this shop */}
                  <View style={styles.shopItemsContainer}>
                    {shop.items.map(item => (
                      <View key={item.id} style={styles.card}>
                        <Image 
                          source={{ uri: item.product_image || 'https://placehold.co/100x100?text=No+Image' }} 
                          style={styles.productImg}
                          contentFit="contain"
                        />
                        
                        <View style={styles.infoContainer}>
                          <Text style={styles.productName} numberOfLines={2}>
                            {item.product_name}
                          </Text>
                          {item.variant_name ? (
                            <Text style={styles.variantName}>Phân loại: {item.variant_name}</Text>
                          ) : null}
                          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                        </View>

                        {/* Controls on the right */}
                        <View style={styles.controlsContainer}>
                          <TouchableOpacity 
                            style={styles.deleteBtn}
                            onPress={() => handleRemoveItem(item.id)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                          </TouchableOpacity>

                          <View style={styles.quantityRow}>
                            <TouchableOpacity 
                              style={styles.qtyBtn} 
                              onPress={() => handleQtyChange(item.id, item.quantity, -1)}
                            >
                              <Ionicons name="remove" size={14} color="#475569" />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{item.quantity}</Text>
                            <TouchableOpacity 
                              style={styles.qtyBtn} 
                              onPress={() => handleQtyChange(item.id, item.quantity, 1)}
                            >
                              <Ionicons name="add" size={14} color="#475569" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Shop Footer summary */}
                  <View style={styles.shopFooter}>
                    <Text style={styles.shopFooterLabel}>Tạm tính cửa hàng:</Text>
                    <Text style={[styles.shopFooterValue, isSelected && styles.shopFooterValueSelected]}>
                      ${shopTotal.toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Checkout summary and button */}
          <View style={styles.checkoutBlock}>
            {!selectedShopId && (
              <View style={styles.noShopSelectedContainer}>
                <Ionicons name="information-circle-outline" size={18} color="#64748b" />
                <Text style={styles.noShopSelectedText}>
                  Vui lòng chọn cửa hàng để tiến hành đặt hàng.
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.checkoutBtn, !selectedShopId && styles.checkoutBtnDisabled]} 
              disabled={!selectedShopId}
              onPress={async () => {
                console.log('--- MOBILE LOG: NÚT "Tiến Hành Thanh Toán" ĐÃ BẤM ---');
                const token = authStore.getToken();
                console.log('--- MOBILE LOG: Token status:', token ? 'Đăng nhập rồi' : 'Chưa đăng nhập');
                console.log('--- MOBILE LOG: selectedShopId:', selectedShopId);
                if (!token) {
                  console.log('--- MOBILE LOG: Chưa đăng nhập, hiển thị alert và lưu auth_redirect');
                  alert('Vui lòng đăng nhập để tiến hành thanh toán.');
                  try {
                    await AsyncStorage.setItem('auth_redirect', `/checkout?shopId=${selectedShopId}`);
                    console.log('--- MOBILE LOG: Đã lưu auth_redirect vào AsyncStorage');
                  } catch (e) {
                    console.error('--- MOBILE LOG: Lỗi lưu auth_redirect:', e);
                  }
                  router.push('/profile' as any);
                } else {
                  console.log('--- MOBILE LOG: Đã đăng nhập, gọi router.push tới /checkout?shopId=' + selectedShopId);
                  try {
                    router.push(`/checkout?shopId=${selectedShopId}` as any);
                    console.log('--- MOBILE LOG: Đã gọi router.push thành công');
                  } catch (err: any) {
                    console.error('--- MOBILE LOG: Lỗi gọi router.push:', err.message);
                  }
                }
              }}
            >
              <Text style={styles.checkoutBtnText}>Tiến Hành Thanh Toán</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  clearText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  itemList: {
    padding: 16,
  },
  shopSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  shopSectionSelected: {
    borderColor: '#10b981',
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  shopIcon: {
    marginRight: 8,
  },
  shopNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: '#10b981',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  shopItemsContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
  },
  productImg: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1e293b',
    lineHeight: 18,
    marginBottom: 4,
  },
  variantName: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  controlsContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 64,
    marginLeft: 8,
  },
  deleteBtn: {
    padding: 2,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    paddingHorizontal: 6,
  },
  shopFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fcfdfd',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    gap: 8,
  },
  shopFooterLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  shopFooterValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  shopFooterValueSelected: {
    color: '#10b981',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  shopBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  checkoutBlock: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: 13,
  },
  summaryValue: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '500',
  },
  freeText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  totalValue: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '800',
  },
  noShopSelectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noShopSelectedText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  checkoutBtn: {
    backgroundColor: '#10b981',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  checkoutBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
