import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  TextInput, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ghnService, GhnProvince, GhnDistrict, GhnWard } from '../../services/ghnService';

const { height } = Dimensions.get('window');

interface GhnAddressSelectorProps {
  value: {
    province?: string;
    provinceId?: string;
    district?: string;
    districtId?: number;
    ward?: string;
    wardCode?: string;
  };
  onChange: (data: {
    province?: string;
    provinceId?: string;
    district?: string;
    districtId?: number;
    ward?: string;
    wardCode?: string;
  }) => void;
  required?: boolean;
}

type ModalType = 'province' | 'district' | 'ward' | null;

export default function GhnAddressSelector({ value, onChange, required = false }: GhnAddressSelectorProps) {
  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Load Provinces on mount
  useEffect(() => {
    ghnService.getProvinces().then(data => {
      setProvinces(data);
    });
  }, []);

  // Load Districts when province changes
  useEffect(() => {
    if (value.provinceId) {
      setLoading(true);
      ghnService.getDistricts(Number(value.provinceId))
        .then(data => {
          setDistricts(data);
        })
        .finally(() => setLoading(false));
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [value.provinceId]);

  // Load Wards when district changes
  useEffect(() => {
    if (value.districtId) {
      setLoading(true);
      ghnService.getWards(value.districtId)
        .then(data => {
          setWards(data);
        })
        .finally(() => setLoading(false));
    } else {
      setWards([]);
    }
  }, [value.districtId]);

  const openSelectionModal = (type: ModalType) => {
    setSearchQuery('');
    setActiveModal(type);
  };

  const selectProvince = (item: GhnProvince) => {
    onChange({
      province: item.ProvinceName,
      provinceId: String(item.ProvinceID),
      district: undefined,
      districtId: undefined,
      ward: undefined,
      wardCode: undefined,
    });
    setActiveModal(null);
  };

  const selectDistrict = (item: GhnDistrict) => {
    onChange({
      ...value,
      district: item.DistrictName,
      districtId: item.DistrictID,
      ward: undefined,
      wardCode: undefined,
    });
    setActiveModal(null);
  };

  const selectWard = (item: GhnWard) => {
    onChange({
      ...value,
      ward: item.WardName,
      wardCode: item.WardCode,
    });
    setActiveModal(null);
  };

  // Filter list based on search query
  const getFilteredList = () => {
    const query = searchQuery.toLowerCase().trim();
    if (activeModal === 'province') {
      return query ? provinces.filter(p => p.ProvinceName.toLowerCase().includes(query)) : provinces;
    }
    if (activeModal === 'district') {
      return query ? districts.filter(d => d.DistrictName.toLowerCase().includes(query)) : districts;
    }
    if (activeModal === 'ward') {
      return query ? wards.filter(w => w.WardName.toLowerCase().includes(query)) : wards;
    }
    return [];
  };

  return (
    <View style={styles.container}>
      {/* Tỉnh / Thành phố */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Tỉnh / Thành phố {required && <Text style={styles.requiredStar}>*</Text>}</Text>
        <TouchableOpacity 
          style={styles.selectorBtn} 
          onPress={() => openSelectionModal('province')}
        >
          <Text style={[styles.selectorText, !value.province && styles.placeholderText]}>
            {value.province || 'Chọn Tỉnh / Thành phố'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Quận / Huyện */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Quận / Huyện {required && <Text style={styles.requiredStar}>*</Text>}</Text>
        <TouchableOpacity 
          style={[styles.selectorBtn, !value.provinceId && styles.selectorBtnDisabled]} 
          onPress={() => value.provinceId && openSelectionModal('district')}
          disabled={!value.provinceId}
        >
          <Text style={[styles.selectorText, !value.district && styles.placeholderText]}>
            {value.district || 'Chọn Quận / Huyện'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Phường / Xã */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Phường / Xã {required && <Text style={styles.requiredStar}>*</Text>}</Text>
        <TouchableOpacity 
          style={[styles.selectorBtn, !value.districtId && styles.selectorBtnDisabled]} 
          onPress={() => value.districtId && openSelectionModal('ward')}
          disabled={!value.districtId}
        >
          <Text style={[styles.selectorText, !value.ward && styles.placeholderText]}>
            {value.ward || 'Chọn Phường / Xã'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Selection Modal */}
      <Modal
        visible={activeModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === 'province' && 'Chọn Tỉnh / Thành phố'}
                {activeModal === 'district' && 'Chọn Quận / Huyện'}
                {activeModal === 'ward' && 'Chọn Phường / Xã'}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#334155" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                placeholder="Tìm kiếm..."
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* List */}
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#10b981" />
              </View>
            ) : (
              <FlatList<GhnProvince | GhnDistrict | GhnWard>
                data={getFilteredList() as (GhnProvince | GhnDistrict | GhnWard)[]}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => {
                  let text = '';
                  let isSelected = false;
                  let onPressFn = () => {};

                  if (activeModal === 'province') {
                    const p = item as GhnProvince;
                    text = p.ProvinceName;
                    isSelected = value.provinceId === String(p.ProvinceID);
                    onPressFn = () => selectProvince(p);
                  } else if (activeModal === 'district') {
                    const d = item as GhnDistrict;
                    text = d.DistrictName;
                    isSelected = value.districtId === d.DistrictID;
                    onPressFn = () => selectDistrict(d);
                  } else if (activeModal === 'ward') {
                    const w = item as GhnWard;
                    text = w.WardName;
                    isSelected = value.wardCode === w.WardCode;
                    onPressFn = () => selectWard(w);
                  }

                  return (
                    <TouchableOpacity 
                      style={[styles.listItem, isSelected && styles.listItemSelected]}
                      onPress={onPressFn}
                    >
                      <Text style={[styles.listItemText, isSelected && styles.listItemTextSelected]}>
                        {text}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color="#10b981" />
                      )}
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  fieldContainer: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#ef4444',
  },
  selectorBtn: {
    height: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorBtnDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  selectorText: {
    fontSize: 14,
    color: '#0f172a',
  },
  placeholderText: {
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.75,
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
  closeBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 30,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  listItemSelected: {
    backgroundColor: '#f0fdf4',
  },
  listItemText: {
    fontSize: 14,
    color: '#334155',
  },
  listItemTextSelected: {
    color: '#10b981',
    fontWeight: '600',
  },
});
