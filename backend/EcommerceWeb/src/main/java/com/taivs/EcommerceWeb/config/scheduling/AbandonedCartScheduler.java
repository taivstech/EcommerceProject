package com.taivs.EcommerceWeb.config.scheduling;

import com.taivs.EcommerceWeb.models.cart.CartItem;
import com.taivs.EcommerceWeb.repositories.cart.CartItemRepository;
import com.taivs.EcommerceWeb.utils.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class AbandonedCartScheduler {

    private static final String EMAILED_KEY_PREFIX = "cart:reminded:";
    private static final long COOLDOWN_DAYS = 3;

    private final CartItemRepository cartItemRepository;
    private final EmailService emailService;
    private final RedisTemplate<String, Object> redisTemplate;

    @Scheduled(cron = "0 0 10 * * *")
    @Transactional(readOnly = true)
    public void remindAbandonedCarts() {
        log.info("Running abandoned cart reminder job");

        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        List<CartItem> abandonedItems = cartItemRepository.findAbandonedCartItems(threshold);

        if (abandonedItems.isEmpty()) {
            log.debug("No abandoned carts found");
            return;
        }

        Map<String, List<CartItem>> grouped = abandonedItems.stream()
                .collect(Collectors.groupingBy(ci -> ci.getUser().getId()));

        int sent = 0;
        for (var entry : grouped.entrySet()) {
            String userId = entry.getKey();
            List<CartItem> items = entry.getValue();

            String cooldownKey = EMAILED_KEY_PREFIX + userId;
            if (Boolean.TRUE.equals(redisTemplate.hasKey(cooldownKey))) {
                continue;
            }

            String email = items.get(0).getUser().getEmail();
            String username = items.get(0).getUser().getFullName();
            if (username == null)
                username = items.get(0).getUser().getUsername();

            String htmlContent = buildAbandonedCartEmail(username, items);
            emailService.sendEmail(email, "Bạn có sản phẩm chưa thanh toán! 🛒", htmlContent);

            redisTemplate.opsForValue().set(cooldownKey, "1", COOLDOWN_DAYS, TimeUnit.DAYS);
            sent++;
        }

        log.info("Abandoned cart reminders sent to {} users", sent);
    }

    private String buildAbandonedCartEmail(String username, List<CartItem> items) {
        StringBuilder itemRows = new StringBuilder();
        for (CartItem ci : items) {
            String productName = ci.getProductVariant().getProduct().getName();
            String variantName = ci.getProductVariant().getName();
            String price = ci.getProductVariant().getPrice().toPlainString();
            itemRows.append(String.format("""
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">%s — %s</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">%d</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">%s₫</td>
                    </tr>
                    """, productName, variantName != null ? variantName : "", ci.getQuantity(), price));
        }

        return String.format(
                """
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; color: #333; }
                                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                .header { background: #ff6b35; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                                .content { padding: 20px; background: #f9f9f9; border-radius: 0 0 5px 5px; }
                                table { width: 100%%; border-collapse: collapse; margin: 15px 0; }
                                th { background: #ff6b35; color: white; padding: 10px; text-align: left; }
                                .button { display: inline-block; padding: 12px 24px; background: #ff6b35; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h2>Giỏ hàng của bạn đang chờ!</h2>
                                </div>
                                <div class="content">
                                    <p>Xin chào <strong>%s</strong>,</p>
                                    <p>Bạn có %d sản phẩm trong giỏ hàng chưa thanh toán:</p>
                                    <table>
                                        <tr>
                                            <th>Sản phẩm</th>
                                            <th>SL</th>
                                            <th>Giá</th>
                                        </tr>
                                        %s
                                    </table>
                                    <p>Đừng để bỏ lỡ — sản phẩm có thể hết hàng bất cứ lúc nào!</p>
                                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                                        Nếu bạn đã thanh toán, vui lòng bỏ qua email này.
                                    </p>
                                </div>
                            </div>
                        </body>
                        </html>
                        """,
                username, items.size(), itemRows);
    }
}
