import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  Modal,
  FlatList,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { cartService, CartItem } from '../services/cartService';
import { addressService, UserAddressResponse } from '../services/addressService';
import { orderService, CheckoutRequest } from '../services/orderService';
import { ghnService } from '../services/ghnService';
import { shopService } from '../services/shopService';
import { couponService, CouponResponse } from '../services/couponService';
import { paymentService } from '../services/paymentService';
import { warehouseService, WarehouseResponse } from '../services/warehouseService';

const { width } = Dimensions.get('window');

export default function CheckoutScreen() {
  const { shopId } = useLocalSearchParams<{ shopId: string }>();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Address states
  const [addresses, setAddresses] = useState<UserAddressResponse[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddressResponse | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Shipping Fee & GHN Services states
  const [shippingFee, setShippingFee] = useState(0);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<number>(2); // Default: 2 (Standard)

  // Warehouse states
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseResponse | null>(null);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);

  // Coupons states
  const [platformCoupons, setPlatformCoupons] = useState<CouponResponse[]>([]);
  const [shopCoupons, setShopCoupons] = useState<CouponResponse[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResponse | null>(null); // Platform
  const [appliedShopCoupon, setAppliedShopCoupon] = useState<CouponResponse | null>(null); // Shop
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState<null | 'platform' | 'shop'>(null);

  // Other Form States
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VNPAY' | 'PAYPAL' | 'MOMO'>('COD');

  const loadData = async () => {
    console.log('--- MOBILE LOG: loadData() BẮT ĐẦU CHẠY ---');
    console.log('--- MOBILE LOG: shopId đang tìm kiếm:', shopId);
    setLoading(true);
    try {
      // 1. Tải giỏ hàng
      const items = await cartService.getCartItems();
      console.log('--- MOBILE LOG: Lấy giỏ hàng thành công, số lượng:', items.length);
      const filtered = shopId 
        ? items.filter(item => (item.product_info?.shop_id || (item.product_info as any)?.shopId || 'other') === shopId)
        : items;
      console.log('--- MOBILE LOG: Sau khi lọc theo shopId:', filtered.length);

      if (filtered.length === 0) {
        console.log('--- MOBILE LOG: Số lượng sản phẩm sau khi lọc là 0, redirect về /cart');
        Alert.alert('Thông báo', 'Giỏ hàng của bạn đang trống.');
        router.replace('/cart');
        return;
      }
      setCartItems(filtered);

      // 2. Tải địa chỉ nhận hàng
      const addrList = await addressService.getAllMyAddresses();
      console.log('--- MOBILE LOG: Lấy địa chỉ thành công, số lượng:', addrList.length);
      setAddresses(addrList);
      if (addrList.length > 0) {
        const defaultAddr = addrList.find(a => a.defaultAddress) || addrList[0];
        setSelectedAddress(defaultAddr);
      }
    } catch (err) {
      console.error('--- MOBILE LOG: Lỗi trong loadData():', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('--- MOBILE LOG: checkout.tsx useEffect chạy, shopId nhận được:', shopId);
    if (shopId) {
      console.log('--- MOBILE LOG: shopId hợp lệ, tiến hành loadData()');
      loadData();
    } else {
      console.log('--- MOBILE LOG: shopId chưa có, đang đợi 500ms để check lại...');
      const timer = setTimeout(() => {
        console.log('--- MOBILE LOG: Hết 500ms, check lại shopId:', shopId);
        if (!shopId) {
          console.log('--- MOBILE LOG: Vẫn không có shopId, redirect về /cart');
          Alert.alert('Lỗi', 'Vui lòng chọn cửa hàng cần mua trước khi thanh toán.');
          router.replace('/cart');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shopId]);

  // Tải danh sách dịch vụ giao hàng khi đổi địa chỉ hoặc shopId
  useEffect(() => {
    const fetchServices = async () => {
      if (!selectedAddress || !selectedAddress.districtId || !shopId) {
        setAvailableServices([]);
        return;
      }
      try {
        const shopAddresses = await shopService.getShopAddresses([shopId]);
        const shopAddr = shopAddresses[0];
        const fromDistrict = shopAddr?.districtId;
        
        if (fromDistrict && selectedAddress.districtId) {
          const services = await ghnService.getAvailableServices(
            Number(fromDistrict),
            Number(selectedAddress.districtId)
          );
          setAvailableServices(services);

          // Tính tổng cân nặng của giỏ hàng (kg -> grams)
          let totalWeight = 0;
          cartItems.forEach(item => {
            const itemWeight = (item.product_info?.weight || 0.3) * 1000; // default 300g
            totalWeight += itemWeight * item.quantity;
          });

          const hasHeavy = services.some(s => s.service_type_id === 5);
          const hasStandard = services.some(s => s.service_type_id === 2);

          if (totalWeight > 30000 && hasHeavy) {
            setSelectedServiceType(5);
          } else if (hasStandard) {
            setSelectedServiceType(2);
          } else if (services.length > 0) {
            setSelectedServiceType(services[0].service_type_id);
          }
        }
      } catch (err) {
        console.error('Lỗi lấy dịch vụ giao hàng:', err);
      }
    };

    fetchServices();
  }, [selectedAddress, shopId, cartItems]);

  // Tải danh sách kho hàng của shop
  useEffect(() => {
    if (!shopId) return;
    const fetchWarehouses = async () => {
      setLoadingWarehouse(true);
      try {
        const list = await warehouseService.getShopWarehouses(shopId);
        setWarehouses(list);
        if (list.length > 0) {
          const defaultWh = list.find(w => w.isDefault) || list[0];
          setSelectedWarehouse(defaultWh);
        }
      } catch (err) {
        console.error('Lỗi lấy kho hàng:', err);
      } finally {
        setLoadingWarehouse(false);
      }
    };
    fetchWarehouses();
  }, [shopId]);

  // Tính toán phí vận chuyển thực tế từ GHN API
  useEffect(() => {
    const calculateShipping = async () => {
      if (!selectedAddress || !selectedAddress.districtId || !selectedAddress.wardCode || cartItems.length === 0 || !shopId) {
        setShippingFee(0);
        return;
      }

      setLoadingShipping(true);
      try {
        let totalWeight = 0;
        cartItems.forEach(item => {
          const itemWeight = (item.product_info?.weight || 0.3) * 1000; // default 300g
          totalWeight += itemWeight * item.quantity;
        });

        const shopAddresses = await shopService.getShopAddresses([shopId]);
        const shopAddr = shopAddresses[0];
        const fromDistrictId = shopAddr?.districtId;
        const fromWardCode = shopAddr?.wardCode || '';

        if (!fromDistrictId) {
          setShippingFee(2.50);
          return;
        }

        const feeVnd = await ghnService.calculateFee({
          service_type_id: selectedServiceType,
          from_district_id: Number(fromDistrictId),
          from_ward_code: fromWardCode,
          to_district_id: Number(selectedAddress.districtId),
          to_ward_code: selectedAddress.wardCode || '',
          weight: Math.max(1, Math.round(totalWeight))
        });
        
        const feeUsd = feeVnd ? feeVnd / 25000 : 2.50; // Quy đổi USD
        setShippingFee(Math.round(feeUsd * 100) / 100);
      } catch (err) {
        console.error('Lỗi tính phí giao hàng:', err);
        setShippingFee(2.50);
      } finally {
        setLoadingShipping(false);
      }
    };

    calculateShipping();
  }, [selectedAddress, cartItems, selectedServiceType, shopId]);

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const isCouponApplicable = (coupon: CouponResponse, scope: 'platform' | 'shop') => {
    const subtotal = calculateSubtotal();

    // 1. Giới hạn lượt sử dụng cá nhân
    if (coupon.maxUsagePerUser !== undefined && coupon.maxUsagePerUser !== null &&
        coupon.currentUserUsageCount !== undefined && coupon.currentUserUsageCount !== null &&
        coupon.currentUserUsageCount >= coupon.maxUsagePerUser) {
      return false;
    }

    // 2. Đã dùng (nếu maxUsagePerUser <= 1)
    if (coupon.usedByCurrentUser && (coupon.maxUsagePerUser === undefined || coupon.maxUsagePerUser === null || coupon.maxUsagePerUser <= 1)) {
      return false;
    }

    // 3. Hết lượt sử dụng tổng thể
    if (coupon.maxUsage !== undefined && coupon.maxUsage !== null &&
        coupon.currentUsage !== undefined && coupon.currentUsage !== null &&
        coupon.currentUsage >= coupon.maxUsage) {
      return false;
    }

    // 4. Giá trị đơn hàng tối thiểu
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return false;
    }

    // 5. Chống cộng gộp 2 mã freeship
    if (coupon.discountType === 'FREE_SHIPPING') {
      if (scope === 'platform' && appliedShopCoupon?.discountType === 'FREE_SHIPPING') return false;
      if (scope === 'shop' && appliedCoupon?.discountType === 'FREE_SHIPPING') return false;
    }

    return true;
  };

  const platformDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const c = appliedCoupon;
    const subtotal = calculateSubtotal();
    if (c.minOrderAmount && subtotal < c.minOrderAmount) return 0;

    if (c.discountType === 'FREE_SHIPPING') {
      let discount = shippingFee;
      if (c.discountValue && c.discountValue > 0) discount = Math.min(discount, c.discountValue);
      if (c.maxDiscount && c.maxDiscount > 0) discount = Math.min(discount, c.maxDiscount);
      return Math.max(0, discount);
    }
    
    if (c.discountType === 'PERCENTAGE') {
      let discount = (subtotal * (c.discountValue || 0)) / 100;
      if (c.maxDiscount && discount > c.maxDiscount) discount = c.maxDiscount;
      return discount;
    }
    
    if (c.discountType === 'FIXED_AMOUNT') return c.discountValue || 0;
    return 0;
  }, [appliedCoupon, cartItems, shippingFee]);

  const shopDiscount = useMemo(() => {
    if (!appliedShopCoupon) return 0;
    const c = appliedShopCoupon;
    const subtotal = calculateSubtotal();
    if (c.minOrderAmount && subtotal < c.minOrderAmount) return 0;

    if (c.discountType === 'FREE_SHIPPING') {
      const remainingShipping = Math.max(0, shippingFee - platformDiscount);
      let discount = remainingShipping;
      if (c.discountValue && c.discountValue > 0) discount = Math.min(discount, c.discountValue);
      if (c.maxDiscount && c.maxDiscount > 0) discount = Math.min(discount, c.maxDiscount);
      return Math.max(0, discount);
    }
    
    if (c.discountType === 'PERCENTAGE') {
      let discount = (subtotal * (c.discountValue || 0)) / 100;
      if (c.maxDiscount && discount > c.maxDiscount) discount = c.maxDiscount;
      return discount;
    }
    
    if (c.discountType === 'FIXED_AMOUNT') return c.discountValue || 0;
    return 0;
  }, [appliedShopCoupon, cartItems, shippingFee, platformDiscount]);

  const totalDiscount = platformDiscount + shopDiscount;
  const finalTotal = Math.max(0, calculateSubtotal() + shippingFee - totalDiscount);

  const fetchPlatformCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const data = await couponService.getPlatformCoupons();
      setPlatformCoupons(data.filter(c => c.isActive));
    } catch (err) {
      console.error('Lỗi tải platform coupons:', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const fetchShopCoupons = async () => {
    if (!shopId) return;
    setLoadingCoupons(true);
    try {
      const data = await couponService.getShopCoupons(shopId);
      setShopCoupons(data.filter(c => c.isActive));
    } catch (err) {
      console.error('Lỗi tải shop coupons:', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleApplyCouponByCode = async (code: string, scope: 'platform' | 'shop') => {
    if (!code.trim()) return;
    try {
      const coupon = await couponService.getCouponByCode(code.trim());
      if (coupon && coupon.isActive) {
        if (scope === 'shop' && coupon.shopId !== shopId) {
          Alert.alert('Không áp dụng được', 'Mã giảm giá này không thuộc cửa hàng này.');
          return;
        }
        if (scope === 'platform' && coupon.shopId) {
          Alert.alert('Không áp dụng được', 'Mã giảm giá này là mã của shop.');
          return;
        }

        if (!isCouponApplicable(coupon, scope)) {
          Alert.alert('Không đủ điều kiện', 'Đơn hàng không đủ điều kiện tối thiểu hoặc hết lượt dùng.');
          return;
        }

        if (scope === 'platform') {
          setAppliedCoupon(coupon);
        } else {
          setAppliedShopCoupon(coupon);
        }
        Alert.alert('Thành công', 'Áp dụng mã giảm giá thành công!');
        setCouponCodeInput('');
      } else {
        Alert.alert('Lỗi', 'Mã giảm giá không hợp lệ hoặc đã hết hạn.');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không kiểm tra được mã giảm giá.');
    }
  };

  const openCouponModal = async (scope: 'platform' | 'shop') => {
    setShowCouponModal(scope);
    if (scope === 'platform') {
      await fetchPlatformCoupons();
    } else {
      await fetchShopCoupons();
    }
  };

  const handleSelectCoupon = (coupon: CouponResponse, scope: 'platform' | 'shop') => {
    if (!isCouponApplicable(coupon, scope)) {
      Alert.alert('Không thể chọn', 'Đơn hàng chưa đủ điều kiện áp dụng mã này.');
      return;
    }
    if (scope === 'platform') {
      setAppliedCoupon(coupon);
    } else {
      setAppliedShopCoupon(coupon);
    }
    setShowCouponModal(null);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Lỗi', 'Vui lòng chọn địa chỉ nhận hàng.');
      return;
    }

    setSubmitting(true);

    const payload: CheckoutRequest = {
      receiver_name: selectedAddress.receiverName,
      phone_number: selectedAddress.phoneNumber,
      full_address: selectedAddress.fullAddress,
      detail_address: selectedAddress.detailAddress,
      ward: selectedAddress.ward,
      ward_code: selectedAddress.wardCode,
      district: selectedAddress.district,
      district_id: selectedAddress.districtId,
      province: selectedAddress.province,
      province_id: selectedAddress.provinceId,
      payment: paymentMethod,
      coupon_code: appliedCoupon?.code || undefined,
      shop_coupon_code: appliedShopCoupon?.code || undefined,
      note: note.trim() || undefined,
      shop_id: shopId || undefined
    };

    try {
      const order = await orderService.checkout(payload);
      if (order && order.id) {
        // Đồng bộ xóa giỏ hàng local và server
        await cartService.clearCart();

        if (['VNPAY', 'PAYPAL', 'MOMO'].includes(paymentMethod)) {
          const paymentUrl = await paymentService.createPaymentUrl(paymentMethod, order.id);
          if (paymentUrl) {
            Alert.alert(
              'Thanh toán trực tuyến',
              `Hệ thống sẽ chuyển hướng bạn đến cổng thanh toán ${paymentMethod}.`,
              [
                { 
                  text: 'Đồng ý', 
                  onPress: async () => {
                    await WebBrowser.openBrowserAsync(paymentUrl);
                    router.replace('/orders');
                  }
                }
              ]
            );
          } else {
            Alert.alert('Thành công', 'Đã đặt hàng! Tuy nhiên lỗi tạo cổng thanh toán online, bạn vui lòng thanh toán sau trong trang đơn hàng.');
            router.replace('/orders');
          }
        } else {
          Alert.alert(
            '🎉 Đặt hàng thành công!',
            'Đơn hàng của bạn đang được xử lý và sẽ được giao đến bạn sớm nhất.',
            [{ text: 'Xem đơn hàng', onPress: () => router.replace('/orders') }]
          );
        }
      } else {
        Alert.alert('Lỗi', 'Đặt hàng thất bại. Vui lòng thử lại.');
      }
    } catch (err: any) {
      Alert.alert('Lỗi đặt hàng', err.message || 'Thao tác đặt hàng gặp sự cố.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDiscount = (coupon: CouponResponse) => {
    if (coupon.discountType === 'PERCENTAGE') {
      return `${coupon.discountValue}% Off${coupon.maxDiscount ? ` (Tối đa $${Number(coupon.maxDiscount).toFixed(2)})` : ''}`;
    }
    if (coupon.discountType === 'FIXED_AMOUNT') {
      return `Giảm $${Number(coupon.discountValue).toFixed(2)}`;
    }
    if (coupon.discountType === 'FREE_SHIPPING') {
      const cap = coupon.discountValue || coupon.maxDiscount;
      return cap ? `Freeship (Lên tới $${Number(cap).toFixed(2)})` : 'Miễn phí vận chuyển';
    }
    return '';
  };

  const selectAddressFromList = (addr: UserAddressResponse) => {
    setSelectedAddress(addr);
    setShowAddressModal(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const subtotal = calculateSubtotal();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh Toán</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* Địa chỉ giao hàng */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
              {addresses.length > 0 && (
                <TouchableOpacity onPress={() => setShowAddressModal(true)}>
                  <Text style={styles.changeAddressLink}>Thay đổi</Text>
                </TouchableOpacity>
              )}
            </View>

            {selectedAddress ? (
              <View style={styles.addressInfoBlock}>
                <View style={styles.receiverNameRow}>
                  <Ionicons name="person" size={14} color="#475569" />
                  <Text style={styles.receiverNameText}>{selectedAddress.receiverName}</Text>
                  <Text style={styles.phoneText}>- {selectedAddress.phoneNumber}</Text>
                </View>
                <View style={[styles.receiverNameRow, { marginTop: 6, alignItems: 'flex-start' }]}>
                  <Ionicons name="location" size={15} color="#475569" style={{ marginTop: 2 }} />
                  <Text style={styles.addressText}>{selectedAddress.fullAddress}</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.addAddressPrompt}
                onPress={() => router.push('/addresses')}
              >
                <Ionicons name="add-circle-outline" size={24} color="#10b981" />
                <Text style={styles.addAddressPromptText}>Thêm địa chỉ giao hàng để tiếp tục</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Danh sách sản phẩm thanh toán */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sản phẩm thanh toán</Text>
            {cartItems.map((item, index) => (
              <View key={item.id || index} style={styles.productRow}>
                <Image 
                  source={{ uri: item.product_image || 'https://placehold.co/100x100?text=No+Image' }} 
                  style={styles.productImg}
                  contentFit="contain"
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.product_name}
                  </Text>
                  {item.variant_name ? (
                    <Text style={styles.variantName}>Phân loại: {item.variant_name}</Text>
                  ) : null}
                  <View style={styles.productSubRow}>
                    <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                    <Text style={styles.productQty}>x{item.quantity}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Vận chuyển & Kho hàng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức vận chuyển</Text>
            
            <View style={styles.shippingPartnerBlock}>
              <View style={styles.shippingPartnerHeader}>
                <Ionicons name="car-outline" size={18} color="#10b981" />
                <Text style={styles.shippingPartnerName}>Giao hàng nhanh (GHN)</Text>
              </View>
              {loadingShipping ? (
                <ActivityIndicator size="small" color="#10b981" style={{ alignSelf: 'flex-start', marginTop: 4 }} />
              ) : (
                <Text style={styles.shippingPartnerFee}>
                  Phí vận chuyển: {shippingFee > 0 ? `$${shippingFee.toFixed(2)}` : 'Miễn phí'}
                </Text>
              )}
            </View>

            {/* Warehouse display */}
            {loadingWarehouse ? (
              <View style={[styles.warehouseBlock, { alignItems: 'center' }]}>
                <ActivityIndicator size="small" color="#10b981" />
              </View>
            ) : selectedWarehouse ? (
              <View style={styles.warehouseBlock}>
                <View style={styles.warehouseHeader}>
                  <Ionicons name="cube-outline" size={16} color="#10b981" />
                  <Text style={styles.warehouseTitle}>Fulfill từ kho hàng: {selectedWarehouse.name}</Text>
                </View>
                <Text style={styles.warehouseAddress}>{selectedWarehouse.fullAddress}</Text>
              </View>
            ) : null}
          </View>

          {/* Mã giảm giá */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mã giảm giá</Text>
            
            {/* Platform Coupon */}
            <View style={styles.couponBlock}>
              {appliedCoupon ? (
                <View style={styles.couponBadge}>
                  <Ionicons name="pricetag" size={16} color="#ef4444" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.couponBadgeCode}>{appliedCoupon.code} (Hệ thống)</Text>
                    <Text style={styles.couponBadgeDesc}>{formatDiscount(appliedCoupon)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setAppliedCoupon(null)}>
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.couponPlaceholderBtn} 
                  onPress={() => openCouponModal('platform')}
                >
                  <Ionicons name="pricetag-outline" size={18} color="#ef4444" />
                  <Text style={styles.couponPlaceholderText}>Chọn GoCart Coupon</Text>
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Shop Coupon */}
            <View style={[styles.couponBlock, { marginTop: 12 }]}>
              {appliedShopCoupon ? (
                <View style={[styles.couponBadge, { borderColor: '#f97316', backgroundColor: '#fff7ed' }]}>
                  <Ionicons name="gift" size={16} color="#f97316" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.couponBadgeCode, { color: '#ea580c' }]}>{appliedShopCoupon.code} (Cửa hàng)</Text>
                    <Text style={[styles.couponBadgeDesc, { color: '#f97316' }]}>{formatDiscount(appliedShopCoupon)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setAppliedShopCoupon(null)}>
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.couponPlaceholderBtn, { borderColor: '#fed7aa' }]} 
                  onPress={() => openCouponModal('shop')}
                >
                  <Ionicons name="gift-outline" size={18} color="#f97316" />
                  <Text style={[styles.couponPlaceholderText, { color: '#ea580c' }]}>Chọn Shop Coupon</Text>
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Phương thức thanh toán */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            
            <View style={styles.paymentGrid}>
              {/* COD */}
              <TouchableOpacity 
                style={[styles.paymentCard, paymentMethod === 'COD' && styles.paymentCardSelected]}
                onPress={() => setPaymentMethod('COD')}
                activeOpacity={0.7}
              >
                <Ionicons name="cash-outline" size={24} color={paymentMethod === 'COD' ? '#10b981' : '#64748b'} />
                <Text style={[styles.paymentCardText, paymentMethod === 'COD' && styles.paymentCardTextSelected]}>COD</Text>
                <Text style={styles.paymentCardSubText}>Khi nhận hàng</Text>
              </TouchableOpacity>

              {/* VNPAY */}
              <TouchableOpacity 
                style={[styles.paymentCard, paymentMethod === 'VNPAY' && styles.paymentCardSelected]}
                onPress={() => setPaymentMethod('VNPAY')}
                activeOpacity={0.7}
              >
                <Ionicons name="qr-code-outline" size={24} color={paymentMethod === 'VNPAY' ? '#10b981' : '#64748b'} />
                <Text style={[styles.paymentCardText, paymentMethod === 'VNPAY' && styles.paymentCardTextSelected]}>VNPay</Text>
                <Text style={styles.paymentCardSubText}>Thẻ ATM / QR</Text>
              </TouchableOpacity>

              {/* PAYPAL */}
              <TouchableOpacity 
                style={[styles.paymentCard, paymentMethod === 'PAYPAL' && styles.paymentCardSelected]}
                onPress={() => setPaymentMethod('PAYPAL')}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-paypal" size={24} color={paymentMethod === 'PAYPAL' ? '#10b981' : '#64748b'} />
                <Text style={[styles.paymentCardText, paymentMethod === 'PAYPAL' && styles.paymentCardTextSelected]}>PayPal</Text>
                <Text style={styles.paymentCardSubText}>Quốc tế</Text>
              </TouchableOpacity>

              {/* MOMO */}
              <TouchableOpacity 
                style={[styles.paymentCard, paymentMethod === 'MOMO' && styles.paymentCardSelected]}
                onPress={() => setPaymentMethod('MOMO')}
                activeOpacity={0.7}
              >
                <Ionicons name="wallet-outline" size={24} color={paymentMethod === 'MOMO' ? '#10b981' : '#64748b'} />
                <Text style={[styles.paymentCardText, paymentMethod === 'MOMO' && styles.paymentCardTextSelected]}>MoMo</Text>
                <Text style={styles.paymentCardSubText}>Ví điện tử</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ghi chú đơn hàng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú đơn hàng (Tùy chọn)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Lời nhắn cho shipper hoặc nhà bán hàng..."
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={200}
            />
          </View>

          {/* Chi tiết thanh toán */}
          <View style={[styles.section, { marginBottom: 30 }]}>
            <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính ({cartItems.length} sản phẩm):</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí giao hàng:</Text>
              {loadingShipping ? (
                <ActivityIndicator size="small" color="#10b981" />
              ) : (
                <Text style={shippingFee > 0 ? styles.summaryValue : styles.freeText}>
                  {shippingFee > 0 ? `$${shippingFee.toFixed(2)}` : 'Miễn phí'}
                </Text>
              )}
            </View>
            {platformDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GoCart Discount:</Text>
                <Text style={styles.discountText}>-${platformDiscount.toFixed(2)}</Text>
              </View>
            )}
            {shopDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shop Discount:</Text>
                <Text style={styles.discountText}>-${shopDiscount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer / Place Order Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.checkoutBtn, (!selectedAddress || submitting) && styles.checkoutBtnDisabled]} 
          onPress={handlePlaceOrder}
          disabled={!selectedAddress || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.checkoutBtnText}>Đặt Hàng (${finalTotal.toFixed(2)})</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* CHOOSE SAVED ADDRESS MODAL */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn địa chỉ nhận hàng</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={addresses}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.addressItem, selectedAddress?.id === item.id && styles.addressItemSelected]}
                  onPress={() => selectAddressFromList(item)}
                >
                  <View style={styles.addressItemHeader}>
                    <Text style={styles.addressItemName}>{item.receiverName}</Text>
                    <Text style={styles.addressItemPhone}>{item.phoneNumber}</Text>
                  </View>
                  <Text style={styles.addressItemText}>{item.fullAddress}</Text>
                  {item.defaultAddress && (
                    <Text style={styles.addressItemDefault}>Mặc định</Text>
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity 
              style={styles.modalAddAddressBtn}
              onPress={() => {
                setShowAddressModal(false);
                router.push('/addresses');
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.modalAddAddressBtnText}>Thêm địa chỉ mới</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CHOOSE COUPON MODAL */}
      <Modal
        visible={showCouponModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCouponModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showCouponModal === 'platform' ? 'Chọn mã giảm giá GoCart' : 'Chọn mã giảm giá Cửa hàng'}
              </Text>
              <TouchableOpacity onPress={() => setShowCouponModal(null)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {/* Input to type coupon manual */}
            <View style={styles.modalSearchBox}>
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Nhập mã giảm giá..."
                value={couponCodeInput}
                onChangeText={setCouponCodeInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                style={styles.modalSearchBtn}
                onPress={() => handleApplyCouponByCode(couponCodeInput, showCouponModal!)}
              >
                <Text style={styles.modalSearchBtnText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>

            {loadingCoupons ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#10b981" />
              </View>
            ) : (
              <FlatList
                data={showCouponModal === 'platform' ? platformCoupons : shopCoupons}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: '#64748b', fontSize: 13 }}>Không tìm thấy mã giảm giá nào khả dụng.</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const applicable = isCouponApplicable(item, showCouponModal!);
                  const isSelected = showCouponModal === 'platform' 
                    ? appliedCoupon?.id === item.id 
                    : appliedShopCoupon?.id === item.id;

                  return (
                    <TouchableOpacity 
                      style={[
                        styles.couponItem, 
                        isSelected && styles.couponItemSelected,
                        !applicable && styles.couponItemDisabled
                      ]}
                      onPress={() => {
                        if (applicable) {
                          handleSelectCoupon(item, showCouponModal!);
                        }
                      }}
                      disabled={!applicable}
                      activeOpacity={applicable ? 0.7 : 1}
                    >
                      <View style={styles.couponItemHeader}>
                        <Ionicons 
                          name={showCouponModal === 'platform' ? 'pricetag' : 'gift'} 
                          size={18} 
                          color={showCouponModal === 'platform' ? '#ef4444' : '#f97316'} 
                        />
                        <Text style={[
                          styles.couponItemCode, 
                          showCouponModal === 'platform' ? { color: '#dc2626' } : { color: '#ea580c' }
                        ]}>
                          {item.code}
                        </Text>
                      </View>
                      <Text style={styles.couponItemDiscount}>{formatDiscount(item)}</Text>
                      {item.minOrderAmount ? (
                        <Text style={styles.couponItemMin}>Đơn tối thiểu: ${item.minOrderAmount.toFixed(2)}</Text>
                      ) : null}
                      {item.description ? (
                        <Text style={styles.couponItemDesc}>{item.description}</Text>
                      ) : null}
                      {!applicable && (
                        <Text style={styles.couponItemUnavailableText}>
                          {item.maxUsagePerUser !== undefined && item.currentUserUsageCount !== undefined &&
                          item.currentUserUsageCount >= item.maxUsagePerUser
                            ? 'Bạn đã đạt giới hạn sử dụng mã này'
                            : item.usedByCurrentUser
                            ? 'Bạn đã sử dụng mã này rồi'
                            : item.maxUsage !== undefined && item.currentUsage !== undefined && item.currentUsage >= item.maxUsage
                            ? 'Mã giảm giá đã hết lượt sử dụng'
                            : item.discountType === 'FREE_SHIPPING' &&
                              ((showCouponModal === 'platform' && appliedShopCoupon?.discountType === 'FREE_SHIPPING') ||
                               (showCouponModal === 'shop' && appliedCoupon?.discountType === 'FREE_SHIPPING'))
                            ? 'Không thể kết hợp hai mã miễn phí vận chuyển'
                            : 'Đơn hàng không đủ điều kiện tối thiểu'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  container: { flex: 1, padding: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  changeAddressLink: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
  addressInfoBlock: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  receiverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiverNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  phoneText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    flex: 1,
  },
  addAddressPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    backgroundColor: '#f0fdf4',
  },
  addAddressPromptText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  productImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1e293b',
    lineHeight: 16,
    marginBottom: 4,
  },
  variantName: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  productSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  productQty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  shippingPartnerBlock: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    marginTop: 6,
  },
  shippingPartnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  shippingPartnerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  shippingPartnerFee: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  warehouseBlock: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
  },
  warehouseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  warehouseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  warehouseAddress: {
    fontSize: 12,
    color: '#15803d',
    lineHeight: 16,
  },
  couponBlock: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  couponPlaceholderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fcfdfd',
  },
  couponPlaceholderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 8,
  },
  couponBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 12,
  },
  couponBadgeCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b91c1c',
  },
  couponBadgeDesc: {
    fontSize: 11,
    color: '#dc2626',
    marginTop: 2,
    fontWeight: '500',
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  paymentCard: {
    width: (width - 64 - 10) / 2,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  paymentCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  paymentCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
  },
  paymentCardTextSelected: {
    color: '#0f172a',
  },
  paymentCardSubText: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 2,
  },
  noteInput: {
    height: 64,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    fontSize: 13,
    color: '#0f172a',
    textAlignVertical: 'top',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#64748b', fontSize: 13 },
  summaryValue: { color: '#0f172a', fontSize: 13, fontWeight: '500' },
  freeText: { color: '#10b981', fontSize: 13, fontWeight: '600' },
  discountText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  totalValue: { color: '#10b981', fontSize: 20, fontWeight: '800' },
  bottomBar: {
    padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fff',
  },
  checkoutBtn: {
    backgroundColor: '#10b981', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  checkoutBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  checkoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSearchBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalSearchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0f172a',
  },
  modalSearchBtn: {
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalSearchBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addressItem: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 10,
  },
  addressItemSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  addressItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  addressItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  addressItemPhone: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  addressItemText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  addressItemDefault: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: '#e6fbf1',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 8,
  },
  modalAddAddressBtn: {
    backgroundColor: '#0f172a',
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    gap: 6,
  },
  modalAddAddressBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  couponItem: {
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  couponItemSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  couponItemDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#f1f5f9',
    opacity: 0.6,
  },
  couponItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  couponItemCode: {
    fontSize: 14,
    fontWeight: '700',
  },
  couponItemDiscount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  couponItemMin: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  couponItemDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  couponItemUnavailableText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 8,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
});
