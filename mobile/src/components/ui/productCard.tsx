import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProductResponse, productService } from '../../services/productService';
import { cartService } from '../../services/cartService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2; // Chia 2 cột kèm khoảng cách biên

interface ProductCardProps {
  product: ProductResponse;
  showSoldBadge?: boolean;
  onPress?: () => void;
}

export default function ProductCard({ product, showSoldBadge = true, onPress }: ProductCardProps) {
  const rating = product.avg_rating || 4.5; // Điểm đánh giá trung bình mặc định nếu null
  const totalSold = product.total_sold || 0;

  // Tính toán giá tiền
  let minPrice = product.price || product.min_price || 0;
  let maxPrice = product.price || product.max_price || 0;

  if (product.variants && product.variants.length > 0) {
    const prices = product.variants.map(v => v.price);
    minPrice = Math.min(...prices);
    maxPrice = Math.max(...prices);
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const displayPrice = minPrice === maxPrice
    ? `$${formatPrice(minPrice)}`
    : `$${formatPrice(minPrice)} - $${formatPrice(maxPrice)}`;

  const mainImage = product.images?.find(img => img.is_main)?.url || 
                    product.images?.[0]?.url || 
                    'https://placehold.co/300x300?text=' + encodeURIComponent(product.name);

  const handleCardClick = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/product/${product.id}`);
    }
  };

  const handleAddToCart = async (e: any) => {
    e.stopPropagation();
    try {
      let variantId = product.variants?.[0]?.id;
      if (!variantId) {
        // Fetch đầy đủ thông tin để lấy ID phân loại (vì API recommend thường không trả về variants)
        const fullProduct = await productService.getProductById(product.id);
        if (fullProduct && fullProduct.variants && fullProduct.variants.length > 0) {
          variantId = fullProduct.variants[0].id;
        }
      }
      
      if (!variantId) {
        alert('Sản phẩm này bị lỗi dữ liệu (không có phân loại). Không thể thêm!');
        return;
      }
      
      await cartService.addToCart(product, 1, variantId);
      alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
    } catch (err) {
      alert('Thao tác lỗi, xin vui lòng thử lại.');
    }
  };

  const isSale = minPrice < maxPrice || product.isNew;

  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.card} onPress={handleCardClick}>
      {/* Container Ảnh */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: mainImage }} style={styles.image} contentFit="contain" />
        
        {/* Nhãn Tag */}
        <View style={styles.badgeContainer}>
          {product.isNew && (
            <View style={[styles.badge, styles.badgeNew]}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
          {minPrice < maxPrice && (
            <View style={[styles.badge, styles.badgeSale]}>
              <Text style={styles.badgeText}>SALE</Text>
            </View>
          )}
        </View>

        {/* Nút giỏ hàng nhanh */}
        <TouchableOpacity style={styles.quickAddBtn} onPress={handleAddToCart}>
          <Ionicons name="cart" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Thông tin sản phẩm */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.ratingRow}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color="#f59e0b" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
          {showSoldBadge && totalSold > 0 && (
            <Text style={styles.soldText}>
              Đã bán {totalSold >= 1000 ? `${(totalSold / 1000).toFixed(1)}k` : totalSold}
            </Text>
          )}
        </View>

        <Text style={styles.price} numberOfLines={1}>
          {displayPrice}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '90%',
    height: '90%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'column',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
  },
  badgeNew: {
    backgroundColor: '#3b82f6',
  },
  badgeSale: {
    backgroundColor: '#ef4444',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  quickAddBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContainer: {
    marginTop: 8,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1e293b',
    lineHeight: 17,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 3,
  },
  ratingText: {
    color: '#d97706',
    fontSize: 10,
    fontWeight: '600',
  },
  soldText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 6,
  },
});
