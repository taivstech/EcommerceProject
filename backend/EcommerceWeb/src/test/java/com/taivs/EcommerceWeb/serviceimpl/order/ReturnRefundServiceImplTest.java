package com.taivs.EcommerceWeb.serviceimpl.order;

import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.services.notification.NotificationService;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseStockService;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.models.order.OrderShopGroup;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.repositories.order.OrderItemRepository;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.dto.request.order.CreateReturnRequest;
import com.taivs.EcommerceWeb.dto.request.order.SellerReturnActionRequest;
import com.taivs.EcommerceWeb.dto.response.order.ReturnRequestResponse;
import com.taivs.EcommerceWeb.enums.order.ReturnReason;
import com.taivs.EcommerceWeb.models.order.ReturnRequest;
import com.taivs.EcommerceWeb.enums.order.ReturnStatus;
import com.taivs.EcommerceWeb.repositories.order.ReturnRequestRepository;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReturnRefundServiceImplTest {

    @Mock ReturnRequestRepository returnRequestRepository;
    @Mock OrderRepository orderRepository;
    @Mock OrderItemRepository orderItemRepository;
    @Mock NotificationService notificationService;
    @Mock WarehouseStockService warehouseStockService;

    @InjectMocks ReturnRefundServiceImpl service;

    private static final String BUYER_ID = "buyer-123";
    private static final String SELLER_ID = "seller-456";

    private User buyer;
    private User seller;
    private Shop sellerShop;
    private Order deliveredOrder;
    private OrderItem orderItem;
    private OrderShopGroup shopGroup;

    @BeforeEach
    void setUp() {
        var ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(new TestingAuthenticationToken(BUYER_ID, null));
        SecurityContextHolder.setContext(ctx);

        buyer = mock(User.class);
        lenient().when(buyer.getId()).thenReturn(BUYER_ID);
        lenient().when(buyer.getUsername()).thenReturn("buyer");

        seller = mock(User.class);
        lenient().when(seller.getId()).thenReturn(SELLER_ID);

        sellerShop = mock(Shop.class);
        lenient().when(sellerShop.getUser()).thenReturn(seller);

        shopGroup = mock(OrderShopGroup.class);
        lenient().when(shopGroup.getShop()).thenReturn(sellerShop);

        orderItem = mock(OrderItem.class);
        lenient().when(orderItem.getId()).thenReturn("item-1");
        lenient().when(orderItem.getProductName()).thenReturn("Test Product");
        lenient().when(orderItem.getProductImage()).thenReturn("img.jpg");
        lenient().when(orderItem.getVariantName()).thenReturn("Size M");
        lenient().when(orderItem.getQuantity()).thenReturn(2);
        lenient().when(orderItem.getPrice()).thenReturn(new BigDecimal("50000"));
        lenient().when(orderItem.getOrderShopGroup()).thenReturn(shopGroup);

        deliveredOrder = mock(Order.class);
        lenient().when(deliveredOrder.getId()).thenReturn("order-1");
        lenient().when(deliveredOrder.getStatus()).thenReturn(OrderStatus.DELIVERED);
        lenient().when(deliveredOrder.getUser()).thenReturn(buyer);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private CreateReturnRequest validReturn() {
        CreateReturnRequest req = new CreateReturnRequest();
        req.setOrderId("order-1");
        req.setOrderItemId("item-1");
        req.setReason("DEFECTIVE");
        req.setDescription("Item is broken");
        return req;
    }

    // ── createReturnRequest ──

    @Test
    @DisplayName("createReturnRequest - valid request succeeds")
    void createReturnRequest_success() {
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(deliveredOrder));
        when(orderItemRepository.findById("item-1")).thenReturn(Optional.of(orderItem));
        when(returnRequestRepository.existsByOrderItem_IdAndStatusNot("item-1", ReturnStatus.CANCELLED))
                .thenReturn(false);
        when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(inv -> {
            ReturnRequest rr = inv.getArgument(0);
            rr.setId("rr-1");
            return rr;
        });

        ReturnRequestResponse response = service.createReturnRequest(validReturn());

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("REQUESTED");
        assertThat(response.getRefundAmount()).isEqualByComparingTo(new BigDecimal("100000"));
        verify(notificationService).createAndPush(eq(SELLER_ID), eq("RETURN_REQUEST"),
                anyString(), anyString(), anyString(), eq("RETURN"));
    }

    @Test
    @DisplayName("createReturnRequest - order not DELIVERED throws exception")
    void createReturnRequest_orderNotDelivered() {
        Order pendingOrder = mock(Order.class);
        when(pendingOrder.getStatus()).thenReturn(OrderStatus.PENDING);
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(pendingOrder));

        assertThatThrownBy(() -> service.createReturnRequest(validReturn()))
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_ORDER_STATUS);
    }

    @Test
    @DisplayName("createReturnRequest - not order owner throws unauthorized")
    void createReturnRequest_notOwner() {
        User otherUser = mock(User.class);
        when(otherUser.getId()).thenReturn("other-user");
        Order otherOrder = mock(Order.class);
        when(otherOrder.getStatus()).thenReturn(OrderStatus.DELIVERED);
        when(otherOrder.getUser()).thenReturn(otherUser);
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(otherOrder));

        assertThatThrownBy(() -> service.createReturnRequest(validReturn()))
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.UNAUTHORIZED);
    }

    @Test
    @DisplayName("createReturnRequest - already exists throws exception")
    void createReturnRequest_alreadyExists() {
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(deliveredOrder));
        when(orderItemRepository.findById("item-1")).thenReturn(Optional.of(orderItem));
        when(returnRequestRepository.existsByOrderItem_IdAndStatusNot("item-1", ReturnStatus.CANCELLED))
                .thenReturn(true);

        assertThatThrownBy(() -> service.createReturnRequest(validReturn()))
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.ALREADY_EXISTS);
    }

    // ── cancelReturnRequest ──

    @Test
    @DisplayName("cancelReturnRequest - REQUESTED status succeeds")
    void cancelReturnRequest_success() {
        ReturnRequest rr = ReturnRequest.builder()
                .id("rr-1").status(ReturnStatus.REQUESTED).user(buyer).orderItem(orderItem).build();
        when(returnRequestRepository.findByIdWithDetails("rr-1")).thenReturn(Optional.of(rr));

        service.cancelReturnRequest("rr-1");

        assertThat(rr.getStatus()).isEqualTo(ReturnStatus.CANCELLED);
        assertThat(rr.getResolvedAt()).isNotNull();
    }

    @Test
    @DisplayName("cancelReturnRequest - APPROVED status throws exception")
    void cancelReturnRequest_notRequested() {
        ReturnRequest rr = ReturnRequest.builder()
                .id("rr-1").status(ReturnStatus.APPROVED).user(buyer).orderItem(orderItem).build();
        when(returnRequestRepository.findByIdWithDetails("rr-1")).thenReturn(Optional.of(rr));

        assertThatThrownBy(() -> service.cancelReturnRequest("rr-1"))
                .isInstanceOf(AppException.class)
                .extracting(e -> ((AppException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_REQUEST);
    }

    // ── sellerAction ──

    @Test
    @DisplayName("sellerAction - approve sets APPROVED and notifies buyer")
    void sellerAction_approve() {
        // Switch to seller
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken(SELLER_ID, null));

        ReturnRequest rr = ReturnRequest.builder()
                .id("rr-1").status(ReturnStatus.REQUESTED).user(buyer)
                .reason(ReturnReason.DEFECTIVE)
                .orderItem(orderItem).order(deliveredOrder).build();
        when(returnRequestRepository.findByIdWithDetails("rr-1")).thenReturn(Optional.of(rr));

        SellerReturnActionRequest action = new SellerReturnActionRequest();
        action.setAction("APPROVED");
        action.setSellerResponse("Approved, please ship back.");

        ReturnRequestResponse resp = service.sellerAction("rr-1", action);

        assertThat(resp.getStatus()).isEqualTo("APPROVED");
        verify(notificationService).createAndPush(eq(BUYER_ID), eq("RETURN_APPROVED"),
                anyString(), anyString(), anyString(), eq("RETURN"));
    }

    @Test
    @DisplayName("sellerAction - reject sets REJECTED")
    void sellerAction_reject() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken(SELLER_ID, null));

        ReturnRequest rr = ReturnRequest.builder()
                .id("rr-1").status(ReturnStatus.REQUESTED).user(buyer)
                .reason(ReturnReason.DEFECTIVE)
                .orderItem(orderItem).order(deliveredOrder).build();
        when(returnRequestRepository.findByIdWithDetails("rr-1")).thenReturn(Optional.of(rr));

        SellerReturnActionRequest action = new SellerReturnActionRequest();
        action.setAction("REJECTED");
        action.setSellerResponse("Not eligible.");

        ReturnRequestResponse resp = service.sellerAction("rr-1", action);

        assertThat(resp.getStatus()).isEqualTo("REJECTED");
        assertThat(rr.getResolvedAt()).isNotNull();
    }
}
