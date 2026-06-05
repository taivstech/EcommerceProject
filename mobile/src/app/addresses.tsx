import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Switch, 
  ActivityIndicator, 
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { addressService, UserAddressResponse } from '../services/addressService';
import GhnAddressSelector from '../components/ui/ghnAddressSelector';

export default function AddressBookScreen() {
  const [addresses, setAddresses] = useState<UserAddressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Form State
  const [receiverName, setReceiverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [defaultAddress, setDefaultAddress] = useState(false);
  
  // GHN position selection
  const [ghnData, setGhnData] = useState<{
    province?: string;
    provinceId?: string;
    district?: string;
    districtId?: number;
    ward?: string;
    wardCode?: string;
  }>({});

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressService.getAllMyAddresses();
      setAddresses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleOpenAddForm = () => {
    setEditingAddressId(null);
    setReceiverName('');
    setPhoneNumber('');
    setDetailAddress('');
    setDefaultAddress(false);
    setGhnData({});
    setShowForm(true);
  };

  const handleOpenEditForm = (addr: UserAddressResponse) => {
    setEditingAddressId(addr.id);
    setReceiverName(addr.receiverName);
    setPhoneNumber(addr.phoneNumber);
    setDetailAddress(addr.detailAddress || '');
    setDefaultAddress(addr.defaultAddress);
    setGhnData({
      province: addr.province,
      provinceId: addr.provinceId,
      district: addr.district,
      districtId: addr.districtId,
      ward: addr.ward,
      wardCode: addr.wardCode,
    });
    setShowForm(true);
  };

  const handleSaveAddress = async () => {
    if (!receiverName.trim() || !phoneNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập Họ tên và Số điện thoại.');
      return;
    }

    if (!ghnData.province || !ghnData.district || !ghnData.ward) {
      Alert.alert('Lỗi', 'Vui lòng chọn đầy đủ Tỉnh, Quận, Phường.');
      return;
    }

    // Tự sinh địa chỉ đầy đủ (full address)
    const fullAddress = [
      detailAddress.trim(),
      ghnData.ward,
      ghnData.district,
      ghnData.province
    ].filter(Boolean).join(', ');

    const payload = {
      receiver_name: receiverName.trim(),
      phone_number: phoneNumber.trim(),
      detail_address: detailAddress.trim(),
      full_address: fullAddress,
      ward: ghnData.ward,
      ward_code: ghnData.wardCode,
      district: ghnData.district,
      district_id: ghnData.districtId,
      province: ghnData.province,
      province_id: ghnData.provinceId,
      default_address: defaultAddress,
    };

    setLoading(true);
    try {
      let success = false;
      if (editingAddressId) {
        success = await addressService.updateMyAddress(editingAddressId, payload);
      } else {
        success = await addressService.createMyAddress(payload);
      }

      if (success) {
        Alert.alert('Thành công', editingAddressId ? 'Đã cập nhật địa chỉ!' : 'Đã thêm địa chỉ mới!');
        setShowForm(false);
        await loadAddresses();
      } else {
        Alert.alert('Lỗi', 'Không thể lưu địa chỉ. Xin thử lại.');
      }
    } catch {
      Alert.alert('Lỗi', 'Hệ thống gặp sự cố, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa địa chỉ này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const success = await addressService.deleteMyAddress(id);
              if (success) {
                await loadAddresses();
              } else {
                Alert.alert('Lỗi', 'Không thể xóa địa chỉ.');
              }
            } catch {
              Alert.alert('Lỗi', 'Gặp sự cố hệ thống.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSetDefault = async (id: string) => {
    setLoading(true);
    try {
      const success = await addressService.setMyDefaultAddress(id);
      if (success) {
        await loadAddresses();
      } else {
        Alert.alert('Lỗi', 'Không thể đặt địa chỉ mặc định.');
      }
    } catch {
      Alert.alert('Lỗi', 'Gặp sự cố hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Custom Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => showForm ? setShowForm(false) : router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{showForm ? (editingAddressId ? 'Sửa Địa Chỉ' : 'Thêm Địa Chỉ Mới') : 'Sổ Địa Chỉ'}</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading && !showForm ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : showForm ? (
        /* FORM VIEW */
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Thông tin liên hệ</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên người nhận *</Text>
              <TextInput
                placeholder="Nhập tên người nhận"
                style={styles.textInput}
                value={receiverName}
                onChangeText={setReceiverName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số điện thoại *</Text>
              <TextInput
                placeholder="Nhập số điện thoại"
                style={styles.textInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Địa chỉ giao hàng</Text>
            
            <GhnAddressSelector 
              value={ghnData}
              onChange={setGhnData}
              required
            />

            <View style={[styles.inputGroup, { marginTop: 12 }]}>
              <Text style={styles.inputLabel}>Địa chỉ chi tiết (Số nhà, ngõ, tên đường...)</Text>
              <TextInput
                placeholder="Ví dụ: Số 12, ngõ 34, đường Lê Lợi"
                style={[styles.textInput, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
                value={detailAddress}
                onChangeText={setDetailAddress}
                multiline
              />
            </View>
          </View>

          <View style={[styles.card, styles.switchRow]}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>Đặt làm địa chỉ mặc định</Text>
              <Text style={styles.switchSubtitle}>Sử dụng làm địa chỉ chính khi thanh toán</Text>
            </View>
            <Switch 
              value={defaultAddress}
              onValueChange={setDefaultAddress}
              trackColor={{ false: '#e2e8f0', true: '#a7f3d0' }}
              thumbColor={defaultAddress ? '#10b981' : '#cbd5e1'}
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAddress}>
            <Text style={styles.saveBtnText}>LƯU ĐỊA CHỈ</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* LIST VIEW */
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {addresses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="location-outline" size={64} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>Chưa có địa chỉ nào</Text>
                <Text style={styles.emptySubtitle}>Hãy thêm địa chỉ giao hàng của bạn để tiến hành thanh toán nhanh chóng hơn.</Text>
              </View>
            ) : (
              addresses.map(addr => (
                <View key={addr.id} style={[styles.addressCard, addr.defaultAddress && styles.addressCardDefault]}>
                  <View style={styles.addressCardHeader}>
                    <View style={styles.receiverNameRow}>
                      <Text style={styles.receiverName}>{addr.receiverName}</Text>
                      {addr.defaultAddress && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Mặc định</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.addressActions}>
                      <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleOpenEditForm(addr)}>
                        <Ionicons name="create-outline" size={18} color="#475569" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleDeleteAddress(addr.id)}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.phoneText}>SĐT: {addr.phoneNumber}</Text>
                  <Text style={styles.fullAddressText}>{addr.fullAddress}</Text>

                  {!addr.defaultAddress && (
                    <TouchableOpacity style={styles.setDefaultLink} onPress={() => handleSetDefault(addr.id)}>
                      <Text style={styles.setDefaultLinkText}>Đặt làm địa chỉ mặc định</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </ScrollView>

          {/* Floating Action Button */}
          <TouchableOpacity style={styles.addFloatBtn} onPress={handleOpenAddForm}>
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addFloatBtnText}>Thêm Địa Chỉ Mới</Text>
          </TouchableOpacity>
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
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addressCardDefault: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  receiverName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  defaultBadge: {
    backgroundColor: '#10b981',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIconBtn: {
    padding: 2,
  },
  phoneText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  fullAddressText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 12,
  },
  setDefaultLink: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  setDefaultLinkText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  addFloatBtn: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#10b981',
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addFloatBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
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
  formContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  switchSubtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
