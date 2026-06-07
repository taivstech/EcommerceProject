package com.taivs.EcommerceWeb.models.order;

import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.exceptions.AppException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class OrderTest {

    private Order orderWithStatus(OrderStatus status) {
        return Order.builder().id("o-1").status(status).build();
    }

    @Test
    @DisplayName("changeStatus: PENDING → CONFIRMED is valid")
    void pendingToConfirmed() {
        Order order = orderWithStatus(OrderStatus.PENDING);
        order.changeStatus(OrderStatus.CONFIRMED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }

    @Test
    @DisplayName("changeStatus: PENDING → SHIPPING is invalid")
    void pendingToShipping_throws() {
        Order order = orderWithStatus(OrderStatus.PENDING);
        assertThatThrownBy(() -> order.changeStatus(OrderStatus.SHIPPING))
                .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("changeStatus: CONFIRMED → SHIPPING is valid")
    void confirmedToShipping() {
        Order order = orderWithStatus(OrderStatus.CONFIRMED);
        order.changeStatus(OrderStatus.SHIPPING);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.SHIPPING);
    }

    @Test
    @DisplayName("changeStatus: SHIPPING → DELIVERED is valid")
    void shippingToDelivered() {
        Order order = orderWithStatus(OrderStatus.SHIPPING);
        order.changeStatus(OrderStatus.DELIVERED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.DELIVERED);
    }

    @Test
    @DisplayName("confirmReceipt: DELIVERED → COMPLETED")
    void confirmReceipt_delivered() {
        Order order = orderWithStatus(OrderStatus.DELIVERED);
        order.confirmReceipt();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(order.getIsPaid()).isTrue();
    }

    @Test
    @DisplayName("confirmReceipt: non-DELIVERED throws exception")
    void confirmReceipt_notDelivered_throws() {
        Order order = orderWithStatus(OrderStatus.PENDING);
        assertThatThrownBy(order::confirmReceipt)
                .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("getIsPaid: returns true when status is COMPLETED even if isPaid was false")
    void getIsPaid_completedStatus() {
        Order order = Order.builder()
                .status(OrderStatus.COMPLETED)
                .isPaid(false)
                .build();
        assertThat(order.getIsPaid()).isTrue();
    }

    @Test
    @DisplayName("getIsPaid: returns true when isPaid is true even if status is not COMPLETED")
    void getIsPaid_isPaidTrue() {
        Order order = Order.builder()
                .status(OrderStatus.PENDING)
                .isPaid(true)
                .build();
        assertThat(order.getIsPaid()).isTrue();
    }


    @Test
    @DisplayName("changeStatus: COMPLETED is terminal state")
    void completed_isTerminal() {
        Order order = orderWithStatus(OrderStatus.COMPLETED);
        assertThatThrownBy(() -> order.changeStatus(OrderStatus.CANCELLED))
                .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("changeStatus: AWAITING_PAYMENT → PENDING is valid")
    void awaitingPaymentToPending() {
        Order order = orderWithStatus(OrderStatus.AWAITING_PAYMENT);
        order.changeStatus(OrderStatus.PENDING);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING);
    }

    @Test
    @DisplayName("changeStatus: AWAITING_PAYMENT → CANCELLED is valid")
    void awaitingPaymentToCancelled() {
        Order order = orderWithStatus(OrderStatus.AWAITING_PAYMENT);
        order.changeStatus(OrderStatus.CANCELLED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
    }
}
