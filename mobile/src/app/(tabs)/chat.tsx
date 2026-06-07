import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { authStore } from '../../services/api';
import { authService } from '../../services/productService';
import { messageService, PrivateChatResponse, ChatContactResponse } from '../../services/messageService';

export default function ChatScreen() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Chats & Search States
  const [rooms, setRooms] = useState<PrivateChatResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatContactResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Check auth state
  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        await loadRooms();
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Re-run check and reload when screen is focused
  useFocusEffect(
    useCallback(() => {
      checkAuth();
    }, [])
  );

  // Load chat rooms list
  const loadRooms = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await messageService.getMyPrivateChats();
      setRooms(data);
    } catch (err) {
      console.error('Lỗi lấy danh sách phòng chat:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadRooms();
  };

  // Handle debounced contact search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await messageService.searchContacts(searchQuery.trim());
        setSearchResults(results);
      } catch (error) {
        console.error('Lỗi tìm kiếm liên hệ:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Start chat with a contact
  const startChatWith = async (contactId: string, contactName: string) => {
    setLoading(true);
    try {
      const chat = await messageService.createOrGetPrivateChat(contactId);
      if (chat && chat.room_id) {
        setSearchQuery('');
        setSearchResults([]);
        router.push({
          pathname: '/chat/[roomId]' as any,
          params: { roomId: chat.room_id, otherUserName: contactName }
        });
      } else {
        alert('Không thể tạo phòng chat.');
      }
    } catch (err) {
      alert('Không thể kết nối phòng chat.');
    } finally {
      setLoading(false);
    }
  };

  // Open chat room
  const openChatRoom = (room: PrivateChatResponse) => {
    router.push({
      pathname: '/chat/[roomId]' as any,
      params: { roomId: room.room_id, otherUserName: room.other_user_name }
    });
  };

  // Format relative time helper
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return `${mins}p trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h trước`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} ngày trước`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  // Render when loading initially
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Đang tải thông tin chat...</Text>
      </View>
    );
  }

  // Render when NOT authenticated
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hội thoại</Text>
        </View>
        <View style={styles.unauthContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubbles-outline" size={64} color="#10b981" />
          </View>
          <Text style={styles.unauthTitle}>Trò chuyện cùng Cửa hàng</Text>
          <Text style={styles.unauthSubtitle}>
            Vui lòng đăng nhập tài khoản để xem các cuộc trò chuyện và liên hệ trao đổi trực tiếp với nhà bán hàng.
          </Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/profile')}>
            <Text style={styles.loginBtnText}>ĐĂNG NHẬP NGAY</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hội thoại</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            placeholder="Tìm kiếm liên hệ, cửa hàng để chat..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Main List */}
      <View style={{ flex: 1 }}>
        {searchQuery.trim() ? (
          /* Search results view */
          isSearching ? (
            <View style={styles.centerListContainer}>
              <ActivityIndicator color="#10b981" size="small" />
              <Text style={styles.searchFeedback}>Đang tìm kiếm liên hệ...</Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.centerListContainer}>
              <Ionicons name="people-outline" size={48} color="#cbd5e1" />
              <Text style={styles.searchFeedback}>Không tìm thấy cửa hàng hay người dùng nào.</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => startChatWith(item.id, item.name)}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarLetter}>
                      {(item.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactType}>
                      {item.type === 'SHOP' ? 'Cửa hàng' : 'Thành viên'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                </TouchableOpacity>
              )}
            />
          )
        ) : (
          /* Normal chat rooms list */
          rooms.length === 0 ? (
            <FlatList
              data={[]}
              renderItem={null}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubble-ellipses-outline" size={64} color="#cbd5e1" />
                  <Text style={styles.emptyText}>Chưa có cuộc hội thoại nào.</Text>
                  <Text style={styles.emptySubtext}>Tìm kiếm liên hệ phía trên hoặc vào trang sản phẩm để chat với Shop!</Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={rooms}
              keyExtractor={(item) => item.room_id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
              }
              renderItem={({ item }) => {
                const unreadCount = item.unread_count || 0;
                return (
                  <TouchableOpacity
                    style={styles.roomItem}
                    onPress={() => openChatRoom(item)}
                  >
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarLetter}>
                        {(item.other_user_name || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={styles.roomInfo}>
                      <View style={styles.roomHeaderRow}>
                        <Text style={styles.roomName} numberOfLines={1}>
                          {item.other_user_name}
                        </Text>
                        <Text style={styles.roomTime}>
                          {formatTime(item.last_message_at)}
                        </Text>
                      </View>
                      
                      <View style={styles.roomMessageRow}>
                        <Text
                          style={[
                            styles.roomMessage,
                            unreadCount > 0 && styles.roomMessageUnread
                          ]}
                          numberOfLines={1}
                        >
                          {item.last_message || 'Bắt đầu cuộc trò chuyện...'}
                        </Text>
                        
                        {unreadCount > 0 ? (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )
        )}
      </View>
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
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  unauthContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  unauthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  unauthSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  loginBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  searchSection: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
    height: '100%',
  },
  listContent: {
    paddingVertical: 6,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#e6f4ea',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#a3e635',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
  },
  roomInfo: {
    flex: 1,
    marginLeft: 12,
  },
  roomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  roomTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  roomMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomMessage: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
    marginRight: 12,
  },
  roomMessageUnread: {
    fontWeight: '700',
    color: '#0f172a',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  contactType: {
    fontSize: 11,
    color: '#10b981',
    marginTop: 2,
    fontWeight: '500',
  },
  centerListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  searchFeedback: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  }
});
