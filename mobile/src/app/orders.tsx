import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  TextInput, 
  Alert, 
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { orderService, OrderResponse, OrderShopGroupResponse, OrderItemResponse } from '../services/orderService';

const { width } = Dimensions.get('window');

type OrderTab = 'ALL' | 'PENDING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTab>('ALL');
  
  // Selected Order Detail State
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'PENDING':
        return orders.filter(o => o.status === 'PENDING' || o.status === 'AWAITING_PAYMENT');
      case 'SHIPPING':
        return orders.filter(o => o.status === 'PROCESSING' || o.status === 'SHIPPED' || o.status === 'DELIVERED');
      case 'COMPLETED':
        return orders.filter(o => o.status === 'COMPLETED');
      case 'CANCELLED':
        return orders.filter(o => o.status === 'CANCELLED' || o.status === 'RETURNED');
      default:
        return orders;
    }
  };

  const getStatusLabel = (status: OrderResponse['status']) => {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'AWAITING_PAYMENT': return 'Chờ thanh toán';
      case 'PROCESSING': return 'Đang xử lý';
      case 'SHIPPED': return 'Đang giao hàng';
      case 'DELIVERED': return 'Đã giao hàng';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      case 'RETURNED': return 'Trả hàng/Hoàn tiền';
      default: return status;
    }
  };

  const getStatusColor = (status: OrderResponse['status']) => {
    switch (status) {
      case 'PENDING':
      case 'AWAITING_PAYMENT':
        return '#f59e0b'; // Amber
      case 'PROCESSING':
      case 'SHIPPED':
        return '#3b82f6'; // Blue
      case 'DELIVERED':
      case 'COMPLETED':
        return '#10b981'; // Green
      case 'CANCELLED':
      case 'RETURNED':
        return '#ef4444'; // Red
      default:
        return '#64748b';
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    if (!cancelReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền lý do hủy đơn hàng.');
      return;
    }

    setActionLoading(true);
    try {
      const success = await orderService.cancelOrder(selectedOrder.id, cancelReason.trim());
      if (success) {
        Alert.alert('Thành công', 'Đơn hàng của bạn đã được hủy.');
        setCancelModalVisible(false);
        setCancelReason('');
        setSelectedOrder(null);
        await loadOrders();
      } else {
        Alert.alert('Lỗi', 'Không thể hủy đơn hàng vào lúc này.');
      }
    } catch {
      Alert.alert('Lỗi', 'Gặp sự cố kết nối.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceipt = async (orderId: string) => {
    Alert.alert(
      'Xác nhận đã nhận hàng',
      'Bạn có chắc chắn đã nhận đầy đủ sản phẩm và muốn hoàn thành đơn hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đã nhận',
          onPress: async () => {
            setActionLoading(true);
            try {
              const success = await orderService.confirmReceipt(orderId);
              if (success) {
                Alert.alert('Thành công', 'Đơn hàng đã hoàn thành. Cảm ơn bạn đã mua sắm!');
                setSelectedOrder(null);
                await loadOrders();
              } else {
                Alert.alert('Lỗi', 'Thao tác không thành công.');
              }
            } catch {
              Alert.alert('Lỗi', 'Gặp sự cố kết nối.');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const getFirstItemImage = (shopGroups: OrderShopGroupResponse[]) => {
    if (shopGroups && shopGroups.length > 0 && shopGroups[0].items && shopGroups[0].items.length > 0) {
      return shopGroups[0].items[0].productImage || 'https://placehold.co/100x100?text=No+Image';
    }
    return 'https://placehold.co/100x100?text=No+Image';
  };

  const getTotalItemCount = (shopGroups: OrderShopGroupResponse[]) => {
    return shopGroups?.reduce((total, group) => {
      return total + (group.items?.reduce((groupTotal, item) => groupTotal + item.quantity, 0) || 0);
    }, 0) || 0;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {(['ALL', 'PENDING', 'SHIPPING', 'COMPLETED', 'CANCELLED'] as OrderTab[]).map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'ALL' && 'Tất cả'}
                {tab === 'PENDING' && 'Chờ xử lý'}
                {tab === 'SHIPPING' && 'Đang giao'}
                {tab === 'COMPLETED' && 'Đã giao'}
                {tab === 'CANCELLED' && 'Đã hủy'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : getFilteredOrders().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Không có đơn hàng nào</Text>
          <Text style={styles.emptySubtitle}>Danh sách đơn hàng của bạn đang trống ở mục này.</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {getFilteredOrders().map(order => (
            <TouchableOpacity 
              key={order.id} 
              style={styles.orderCard}
              onPress={() => setSelectedOrder(order)}
            >
              {/* Order Card Header */}
              <View style={styles.orderCardHeader}>
                <Text style={styles.orderIdText} numberOfLines={1}>Mã: #{order.id.slice(-8).toUpperCase()}</Text>
                <Text style={[styles.statusBadge, { color: getStatusColor(order.status) }]}>
                  {getStatusLabel(order.status)}
                </Text>
              </View>

              {/* Order Summary Item Preview */}
              <View style={styles.orderSummaryItem}>
                <Image 
                  source={{ uri: getFirstItemImage(order.shopGroups) }} 
                  style={styles.productImg}
                  contentFit="contain"
                />
                <View style={styles.orderInfoContainer}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {order.shopGroups?.[0]?.items?.[0]?.productName || 'Đơn hàng sản phẩm'}
                  </Text>
                  <Text style={styles.itemCountText}>Tổng số lượng: {getTotalItemCount(order.shopGroups)} món</Text>
                  <Text style={styles.orderTimeText}>Đặt ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</Text>
                </View>
              </View>

              {/* Order Total row */}
              <View style={styles.orderCardFooter}>
                <View style={styles.paymentMethodBadge}>
                  <Text style={styles.paymentMethodText}>{order.payment}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.totalLabel}>Thành tiền:</Text>
                  <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* DETAIL MODAL (SLIDE UP) */}
      {selectedOrder && (
        <Modal
          visible={true}
          animationType="slide"
          onRequestClose={() => setSelectedOrder(null)}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedOrder(null)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Chi tiết đơn hàng</Text>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Status Header */}
              <View style={[styles.modalStatusHeader, { backgroundColor: getStatusColor(selectedOrder.status) + '15' }]}>
                <Ionicons name="information-circle-outline" size={22} color={getStatusColor(selectedOrder.status)} />
                <View>
                  <Text style={[styles.modalStatusTitle, { color: getStatusColor(selectedOrder.status) }]}>
                    {getStatusLabel(selectedOrder.status)}
                  </Text>
                  <Text style={styles.modalStatusSubtitle}>
                    Mã đơn: {selectedOrder.id}
                  </Text>
                </View>
              </View>

              {/* Address details */}
              {selectedOrder.shippingAddress && (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Địa chỉ nhận hàng</Text>
                  <Text style={styles.receiverNameText}>{selectedOrder.shippingAddress.receiverName}</Text>
                  <Text style={styles.phoneText}>SĐT: {selectedOrder.shippingAddress.phoneNumber}</Text>
                  <Text style={styles.addressText}>{selectedOrder.shippingAddress.fullAddress}</Text>
                </View>
              )}

              {/* Order items list */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Sản phẩm đã mua</Text>
                {selectedOrder.shopGroups?.map(group => (
                  <View key={group.id} style={styles.shopGroupContainer}>
                    {group.warehouseName && (
                      <View style={styles.warehouseRow}>
                        <Ionicons name="business" size={14} color="#64748b" />
                        <Text style={styles.warehouseText}>Kho xuất: {group.warehouseName}</Text>
                      </View>
                    )}
                    {group.items?.map(item => (
                      <View key={item.id} style={styles.itemRow}>
                        <Image 
                          source={{ uri: item.productImage || 'https://placehold.co/85x85?text=No+Image' }} 
                          style={styles.itemImg}
                          contentFit="contain"
                        />
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                          {item.variantName ? (
                            <Text style={styles.itemVariant}>Phân loại: {item.variantName}</Text>
                          ) : null}
                          <View style={styles.itemPriceQty}>
                            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                            <Text style={styles.itemQty}>x{item.quantity}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>

              {/* Payment & Invoice information */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tạm tính ({getTotalItemCount(selectedOrder.shopGroups)} món)</Text>
                  <Text style={styles.summaryVal}>${selectedOrder.subtotal.toFixed(2)}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                  <Text style={styles.summaryVal}>${selectedOrder.shippingFee.toFixed(2)}</Text>
                </View>

                {selectedOrder.totalDiscount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Giảm giá</Text>
                    <Text style={[styles.summaryVal, styles.discountText]}>-${selectedOrder.totalDiscount.toFixed(2)}</Text>
                  </View>
                )}

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabelLarge}>Tổng thanh toán</Text>
                  <Text style={styles.totalValLarge}>${selectedOrder.total.toFixed(2)}</Text>
                </View>

                <View style={[styles.summaryRow, { marginTop: 12 }]}>
                  <Text style={styles.summaryLabel}>Phương thức thanh toán</Text>
                  <Text style={styles.summaryVal}>{selectedOrder.payment}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Trạng thái thanh toán</Text>
                  <Text style={[styles.summaryVal, { color: selectedOrder.isPaid ? '#10b981' : '#ef4444', fontWeight: 'bold' }]}>
                    {selectedOrder.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </Text>
                </View>
              </View>

              {selectedOrder.note ? (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Ghi chú đơn hàng</Text>
                  <Text style={styles.noteText}>{selectedOrder.note}</Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Bottom Actions inside Detail Modal */}
            <View style={styles.modalBottomBar}>
              {/* Cancel Button (Pending or Awaiting Payment) */}
              {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'AWAITING_PAYMENT') && (
                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => setCancelModalVisible(true)}
                  disabled={actionLoading}
                >
                  <Text style={styles.cancelBtnText}>HỦY ĐƠN HÀNG</Text>
                </TouchableOpacity>
              )}

              {/* Confirm Receipt Button (Delivered) */}
              {selectedOrder.status === 'DELIVERED' && (
                <TouchableOpacity 
                  style={styles.confirmBtn} 
                  onPress={() => handleConfirmReceipt(selectedOrder.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>ĐÃ NHẬN ĐƯỢC HÀNG</Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Go back */}
              <TouchableOpacity style={styles.backLinkBtn} onPress={() => setSelectedOrder(null)}>
                <Text style={styles.backLinkBtnText}>Quay lại</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {/* CANCEL REASON MODAL */}
      <Modal
        visible={cancelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.cancelOverlay}>
          <View style={styles.cancelCard}>
            <Text style={styles.cancelTitle}>Hủy Đơn Hàng</Text>
            <Text style={styles.cancelSubtitle}>Vui lòng cho biết lý do hủy đơn hàng của bạn để giúp chúng tôi cải thiện dịch vụ:</Text>
            
            <TextInput
              placeholder="Nhập lý do hủy đơn hàng..."
              placeholderTextColor="#94a3b8"
              style={styles.reasonInput}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              maxLength={200}
            />

            <View style={styles.cancelActions}>
              <TouchableOpacity 
                style={styles.cancelBackBtn} 
                onPress={() => setCancelModalVisible(false)}
                disabled={actionLoading}
              >
                <Text style={styles.cancelBackBtnText}>Quay lại</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelSubmitBtn} 
                onPress={handleCancelOrder}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.cancelSubmitBtnText}>Xác Nhận Hủy</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  tabBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtnActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  tabText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    maxWidth: width * 0.5,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  orderInfoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  itemCountText: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  orderTimeText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  orderCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  paymentMethodBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  paymentMethodText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
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
    borderBottomColor: '#e2e8f0',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalScroll: {
    paddingBottom: 30,
  },
  modalStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  modalStatusTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalStatusSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderBottomWidth: 6,
    borderBottomColor: '#f1f5f9',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  receiverNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  shopGroupContainer: {
    marginBottom: 16,
  },
  warehouseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  warehouseText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemImg: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1e293b',
    lineHeight: 18,
  },
  itemVariant: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  itemPriceQty: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemQty: {
    fontSize: 12,
    color: '#64748b',
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
  summaryVal: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '500',
  },
  discountText: {
    color: '#ef4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabelLarge: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalValLarge: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  noteText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  modalBottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
    gap: 8,
  },
  confirmBtn: {
    backgroundColor: '#10b981',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fee2e2',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  backLinkBtn: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLinkBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  cancelOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cancelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  cancelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  cancelSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    height: 80,
    paddingHorizontal: 12,
    paddingTop: 8,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  cancelActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBackBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBackBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelSubmitBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSubmitBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
