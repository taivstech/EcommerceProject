package com.taivs.EcommerceWeb.serviceimpl.cart;

import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.dto.request.cart.AddToCartRequest;
import com.taivs.EcommerceWeb.dto.request.cart.UpdateCartItemRequest;
import com.taivs.EcommerceWeb.models.cart.CartItem;
import com.taivs.EcommerceWeb.repositories.cart.CartItemRepository;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.repositories.product.ProductVariantRepository;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceImplTest {

    @Mock CartItemRepository cartItemRepository;
    @Mock ProductVariantRepository productVariantRepository;
    @Mock UserRepository userRepository;

    @InjectMocks CartServiceImpl service;

    private static final String USER_ID = "user-1";
    private User user;
    private ProductVariant variant;

    @BeforeEach
    void setUp() {
        var ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(new TestingAuthenticationToken(USER_ID, null));
        SecurityContextHolder.setContext(ctx);

        user = mock(User.class);
        lenient().when(user.getId()).thenReturn(USER_ID);

        variant = mock(ProductVariant.class);
        lenient().when(variant.getId()).thenReturn("var-1");
        lenient().when(variant.getStock()).thenReturn(100L);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("addToCart - new item creates cart item and saves")
    void addToCart_newItem_success() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(productVariantRepository.findById("var-1")).thenReturn(Optional.of(variant));
        when(cartItemRepository.findByUser_IdAndProductVariant_Id(USER_ID, "var-1"))
                .thenReturn(Optional.empty());

        AddToCartRequest req = AddToCartRequest.builder()
                .productVariantId("var-1").quantity(2).build();
        service.addToCart(req);

        ArgumentCaptor<CartItem> captor = ArgumentCaptor.forClass(CartItem.class);
        verify(cartItemRepository).save(captor.capture());
        assertThat(captor.getValue().getQuantity()).isEqualTo(2);
    }

    @Test
    @DisplayName("addToCart - existing item increments quantity")
    void addToCart_existingItem_incrementsQuantity() {
        CartItem existing = CartItem.builder()
                .id("ci-1").user(user).productVariant(variant).quantity(3).build();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(productVariantRepository.findById("var-1")).thenReturn(Optional.of(variant));
        when(cartItemRepository.findByUser_IdAndProductVariant_Id(USER_ID, "var-1"))
                .thenReturn(Optional.of(existing));

        AddToCartRequest req = AddToCartRequest.builder()
                .productVariantId("var-1").quantity(2).build();
        service.addToCart(req);

        ArgumentCaptor<CartItem> captor = ArgumentCaptor.forClass(CartItem.class);
        verify(cartItemRepository).save(captor.capture());
        assertThat(captor.getValue().getQuantity()).isEqualTo(5); // 3 + 2
    }

    @Test
    @DisplayName("addToCart - insufficient stock throws exception")
    void addToCart_insufficientStock() {
        when(variant.getStock()).thenReturn(1L);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(productVariantRepository.findById("var-1")).thenReturn(Optional.of(variant));

        AddToCartRequest req = AddToCartRequest.builder()
                .productVariantId("var-1").quantity(5).build();

        assertThatThrownBy(() -> service.addToCart(req))
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.INSUFFICIENT_STOCK);
    }

    @Test
    @DisplayName("updateQuantity - valid update saves new quantity")
    void updateQuantity_success() {
        CartItem item = CartItem.builder().id("ci-1").user(user).productVariant(variant).quantity(1).build();
        when(cartItemRepository.findById("ci-1")).thenReturn(Optional.of(item));

        UpdateCartItemRequest req = UpdateCartItemRequest.builder().quantity(3).build();
        service.updateQuantity("ci-1", req);

        assertThat(item.getQuantity()).isEqualTo(3);
        verify(cartItemRepository).save(item);
    }

    @Test
    @DisplayName("removeItem - not owner throws unauthorized")
    void removeItem_notOwner_throwsUnauthorized() {
        User other = mock(User.class);
        when(other.getId()).thenReturn("other-user");
        CartItem item = CartItem.builder().id("ci-1").user(other).productVariant(variant).quantity(1).build();
        when(cartItemRepository.findById("ci-1")).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> service.removeItem("ci-1"))
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.UNAUTHORIZED);
    }
}
