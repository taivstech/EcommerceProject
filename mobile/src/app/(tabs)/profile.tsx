import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, UserResponse } from '../../services/productService';
import { authStore } from '../../services/api';

export default function ProfileScreen() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth Form states
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const checkUserStatus = async () => {
    setLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      alert('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }
    setAuthLoading(true);
    try {
      const success = await authService.login(username, password);
      if (success) {
        alert('Đăng nhập thành công!');
        const userObj = authStore.getUser();
        setUser(userObj);
        // Reset form
        setUsername('');
        setPassword('');

        // Kiểm tra chuyển hướng sau đăng nhập
        try {
          const redirectStr = await AsyncStorage.getItem('auth_redirect');
          if (redirectStr) {
            await AsyncStorage.removeItem('auth_redirect');
            if (redirectStr.startsWith('{')) {
              const redirectObj = JSON.parse(redirectStr);
              router.replace(redirectObj);
            } else {
              router.replace(redirectStr as any);
            }
            return;
          }
        } catch (e) {
          console.error('Lỗi kiểm tra auth_redirect:', e);
        }
      } else {
        alert('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi hệ thống đăng nhập.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim() || !email.trim()) {
      alert('Vui lòng điền đầy đủ Tên đăng nhập, Mật khẩu và Email.');
      return;
    }
    setAuthLoading(true);
    try {
      const success = await authService.register({
        username,
        password,
        email,
        full_name: fullName || username,
        phone
      });
      if (success) {
        alert('Đăng ký tài khoản thành công! Hãy tiến hành đăng nhập.');
        setIsLoginView(true);
      } else {
        alert('Đăng ký thất bại.');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi hệ thống đăng ký.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      alert('Đã đăng xuất.');
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {user ? (
        /* MÀN HÌNH SAU KHI ĐĂNG NHẬP THÀNH CÔNG */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header Hồ sơ */}
          <View style={styles.profileHeaderBlock}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {user.full_name ? user.full_name[0].toUpperCase() : user.username[0].toUpperCase()}
              </Text>
            </View>
            <Text style={styles.profileName}>{user.full_name || user.username}</Text>
            <Text style={styles.profileRole}>Vai trò: {user.roles?.join(', ') || 'BUYER'}</Text>
          </View>

          {/* Khối thông tin chi tiết */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoBlockTitle}>Thông tin cá nhân</Text>
            
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color="#64748b" style={styles.infoIcon} />
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoLabel}>Tên tài khoản</Text>
                <Text style={styles.infoValue}>{user.username}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.infoIcon} />
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoLabel}>Email liên hệ</Text>
                <Text style={styles.infoValue}>{user.email || 'Chưa thiết lập'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color="#64748b" style={styles.infoIcon} />
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>{user.phone || 'Chưa thiết lập'}</Text>
              </View>
            </View>
          </View>

          {/* Khối tác vụ bổ sung */}
          <View style={styles.menuBlock}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/orders')}>
              <Ionicons name="receipt-outline" size={20} color="#1e293b" />
              <Text style={styles.menuItemText}>Đơn hàng của tôi</Text>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/addresses')}>
              <Ionicons name="location-outline" size={20} color="#1e293b" />
              <Text style={styles.menuItemText}>Sổ địa chỉ</Text>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Nút đăng xuất màu đỏ */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>Đăng Xuất</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* MÀN HÌNH ĐĂNG NHẬP / ĐĂNG KÝ (AUTH) */
        <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>
              {isLoginView ? 'Chào Mừng Trở Lại' : 'Tạo Tài Khoản Mới'}
            </Text>
            <Text style={styles.authSubtitle}>
              {isLoginView 
                ? 'Đăng nhập để nhận các đề xuất sản phẩm tốt nhất' 
                : 'Đăng ký tài khoản để bắt đầu trải nghiệm mua sắm'}
            </Text>

            {/* Khối nhập liệu */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên đăng nhập *</Text>
              <TextInput
                placeholder="Nhập tên đăng nhập"
                style={styles.textInput}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            {!isLoginView && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên</Text>
                <TextInput
                  placeholder="Nhập họ và tên của bạn"
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            )}

            {!isLoginView && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  placeholder="Nhập email"
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            )}

            {!isLoginView && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <TextInput
                  placeholder="Nhập số điện thoại"
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu *</Text>
              <TextInput
                placeholder="Nhập mật khẩu"
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Nút hành động */}
            <TouchableOpacity 
              style={styles.authBtn} 
              onPress={isLoginView ? handleLogin : handleRegister}
              disabled={authLoading}
            >
              {authLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.authBtnText}>
                  {isLoginView ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ NGAY'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Switch Đăng nhập/Đăng ký */}
            <TouchableOpacity 
              style={styles.switchLink}
              onPress={() => setIsLoginView(!isLoginView)}
            >
              <Text style={styles.switchLinkText}>
                {isLoginView 
                  ? 'Chưa có tài khoản? Đăng ký ngay' 
                  : 'Đã có tài khoản? Quay về Đăng nhập'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileHeaderBlock: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#10b981',
    marginBottom: 12,
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10b981',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  infoBlock: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 24,
    textAlign: 'center',
    marginRight: 12,
  },
  infoTextGroup: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
  },
  menuBlock: {
    backgroundColor: '#fff',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
  },
  logoutBtn: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fee2e2',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  authContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  authBtn: {
    backgroundColor: '#10b981',
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  authBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  switchLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchLinkText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
});
