# THIẾT KẾ HỆ THỐNG – TÁC NHÂN VÀ BIỂU ĐỒ USECASE

## Đề tài: Hệ thống Thương mại Điện tử (EcommerceWeb)

---

## 1. Danh sách các Tác nhân (Actors) và Mô tả

| STT | Tên tác nhân | Mô tả chi tiết |
|:---:|---|---|
| 1 | **Khách hàng (Buyer)** | Người dùng cuối của hệ thống. Có thể truy cập website để duyệt, tìm kiếm sản phẩm (hỗ trợ tìm kiếm thông minh qua Elasticsearch), xem chi tiết sản phẩm và chọn biến thể (variant), quản lý giỏ hàng, đặt hàng, chọn địa chỉ giao hàng, thanh toán (COD / VNPAY / MoMo / PayPal), theo dõi trạng thái đơn hàng, đánh giá sản phẩm sau khi nhận hàng, quản lý danh sách yêu thích (wishlist), sử dụng mã giảm giá (coupon), và nhắn tin trực tiếp với shop. |
| 2 | **Người bán (Seller)** | Chủ shop – đăng ký và quản lý thông tin shop (tên, logo, mô tả, địa chỉ). Quản lý sản phẩm (tạo/sửa/xoá) bao gồm thuộc tính (attributes) và biến thể (variants) theo mô hình EAV, quản lý ảnh sản phẩm. Xử lý đơn hàng (xác nhận, cập nhật trạng thái, huỷ). Tạo và quản lý mã giảm giá. Quản lý hệ thống kho hàng (tạo/sửa/xoá warehouse, mỗi kho tương ứng một điểm lấy hàng trên GHN). Thêm/xoá nhân viên kho. Xem dashboard thống kê doanh thu và tổng quan hoạt động. Nhắn tin với khách hàng. |
| 3 | **Nhân viên kho (Warehouse Employee)** | Nhân viên được Seller thêm vào để quản lý một hoặc nhiều kho hàng cụ thể. Có quyền xem các đơn hàng được phân về kho mình phụ trách, xác nhận đóng gói đơn hàng, cập nhật trạng thái đơn (từ PROCESSING sang SHIPPED), và quản lý tồn kho (stock) trong phạm vi kho được phân công. Không có quyền tạo/sửa sản phẩm, quản lý tài chính hay cài đặt shop. |
| 4 | **Quản trị viên (Admin)** | Người quản lý toàn bộ hệ thống với quyền cao nhất. Duyệt hoặc từ chối shop đăng ký. Quản lý người dùng (xem, khoá/mở tài khoản). Quản lý danh mục sản phẩm (category). Xem và quản lý tất cả đơn hàng trên hệ thống. Xử lý hoàn tiền. Quản lý role và permission. Xem analytics và báo cáo toàn hệ thống. Kích hoạt reindex dữ liệu tìm kiếm (Elasticsearch). |
| 5 | **Cổng thanh toán (Payment Gateway)** | Các hệ thống thanh toán bên ngoài hỗ trợ xử lý giao dịch trực tuyến, bao gồm: **VNPAY** (thanh toán qua thẻ ATM/Visa/MasterCard nội địa Việt Nam), **MoMo** (thanh toán qua ví điện tử MoMo), và **PayPal** (thanh toán quốc tế qua thẻ Visa/MasterCard/tài khoản PayPal). Mỗi cổng nhận yêu cầu thanh toán từ hệ thống, xử lý giao dịch, gửi callback (IPN – Instant Payment Notification) về kết quả thanh toán thành công hoặc thất bại, và redirect người dùng về trang kết quả đặt hàng. Ngoài ra hệ thống còn hỗ trợ **COD** (thanh toán khi nhận hàng). |
| 6 | **Đơn vị vận chuyển (Shipping Carrier)** | Hệ thống bên ngoài (Giao Hàng Nhanh – GHN) cung cấp dịch vụ vận chuyển. Cung cấp API tra cứu địa chỉ (tỉnh/huyện/xã), tính phí vận chuyển từ kho đến khách hàng, đăng ký điểm lấy hàng (mỗi warehouse tương ứng một GHN Shop), tạo đơn vận chuyển, và cập nhật trạng thái giao hàng. Hệ thống sử dụng GHN API để tự động xác định kho tối ưu nhất (phí ship thấp nhất) khi xử lý đơn hàng. |

---

## 2. Biểu đồ Usecase tổng quát

### 2.1. Buyer (Khách hàng)

```
Buyer
  ├── UC01: Đăng ký tài khoản
  ├── UC02: Đăng nhập / Đăng xuất
  ├── UC03: Quản lý hồ sơ cá nhân
  │     ├── Cập nhật thông tin cá nhân
  │     └── Quản lý địa chỉ giao hàng (CRUD)
  ├── UC04: Tìm kiếm sản phẩm
  │     ├── Tìm kiếm theo từ khoá (Elasticsearch)
  │     ├── Gợi ý tự động (Autocomplete)
  │     └── Lọc theo danh mục / giá / shop
  ├── UC05: Xem chi tiết sản phẩm
  │     ├── Xem ảnh sản phẩm
  │     ├── Chọn biến thể (variant: màu, size...)
  │     └── Xem đánh giá từ người mua khác
  ├── UC06: Quản lý giỏ hàng
  │     ├── Thêm sản phẩm vào giỏ
  │     ├── Cập nhật số lượng
  │     └── Xoá sản phẩm khỏi giỏ
  ├── UC07: Đặt hàng (Checkout)
  │     ├── Chọn địa chỉ giao hàng
  │     ├── Xem phí vận chuyển (tính qua GHN)
  │     ├── Áp dụng mã giảm giá
  │     ├── Chọn phương thức thanh toán (COD / VNPAY / MoMo / PayPal)
  │     └── Xác nhận đặt hàng
  │           └── <<include>> Thanh toán online (VNPAY / MoMo / PayPal) [nếu chọn]
  ├── UC08: Theo dõi đơn hàng
  │     ├── Xem danh sách đơn hàng
  │     ├── Xem chi tiết đơn hàng
  │     ├── Xác nhận đã nhận hàng
  │     └── Huỷ đơn hàng
  ├── UC09: Đánh giá sản phẩm
  │     └── Viết review + cho điểm (sau khi nhận hàng)
  ├── UC10: Quản lý Wishlist
  │     ├── Thêm sản phẩm yêu thích
  │     └── Xoá sản phẩm khỏi wishlist
  ├── UC11: Quản lý mã giảm giá
  │     └── Xem danh sách coupon khả dụng
  ├── UC12: Nhắn tin với Shop
  │     └── Chat real-time (WebSocket)
  └── UC13: Xem thông báo
        └── Nhận thông báo đơn hàng / khuyến mãi
```

### 2.2. Seller (Người bán)

```
Seller
  ├── UC14: Đăng ký Shop
  │     └── Gửi yêu cầu duyệt (chờ Admin phê duyệt)
  ├── UC15: Quản lý thông tin Shop
  │     ├── Cập nhật tên, mô tả, logo
  │     └── Cập nhật địa chỉ shop (GHN address selector)
  ├── UC16: Quản lý sản phẩm
  │     ├── Tạo sản phẩm mới
  │     │     ├── Thêm ảnh sản phẩm (gallery)
  │     │     ├── Tạo thuộc tính (attributes: Color, Size...)
  │     │     ├── Tạo biến thể (variants) từ tổ hợp attributes
  │     │     └── Upload ảnh cho từng variant
  │     ├── Chỉnh sửa sản phẩm
  │     │     └── Sửa thông tin, attributes, variants, ảnh
  │     └── Xoá sản phẩm (soft delete)
  ├── UC17: Quản lý đơn hàng
  │     ├── Xem danh sách đơn hàng của shop
  │     ├── Xác nhận đơn hàng
  │     ├── Cập nhật trạng thái đơn
  │     └── Huỷ đơn hàng (kèm lý do)
  ├── UC18: Quản lý mã giảm giá (Coupon)
  │     ├── Tạo coupon mới
  │     ├── Sửa coupon
  │     └── Vô hiệu hoá coupon
  ├── UC19: Quản lý kho hàng (Warehouse) ⭐ MỚI
  │     ├── Tạo kho mới
  │     │     └── <<include>> Đăng ký điểm lấy hàng trên GHN
  │     ├── Sửa thông tin kho
  │     ├── Kích hoạt / Vô hiệu hoá kho
  │     └── Xoá kho
  ├── UC20: Quản lý nhân viên kho ⭐ MỚI
  │     ├── Mời nhân viên (bằng email/username)
  │     ├── Phân công nhân viên vào kho
  │     └── Xoá nhân viên khỏi kho
  ├── UC21: Xem Dashboard & Thống kê
  │     ├── Doanh thu hôm nay / tổng
  │     ├── Số đơn hàng theo trạng thái
  │     └── Sản phẩm bán chạy
  └── UC22: Nhắn tin với khách hàng
        └── Chat real-time (WebSocket)
```

### 2.3. Warehouse Employee (Nhân viên kho) ⭐ MỚI

```
Warehouse Employee
  ├── UC23: Đăng nhập hệ thống
  │     └── Xem dashboard kho được phân công
  ├── UC24: Xem đơn hàng theo kho
  │     ├── Xem danh sách đơn hàng assigned cho kho mình
  │     └── Xem chi tiết đơn hàng
  ├── UC25: Xử lý đơn hàng
  │     ├── Xác nhận đóng gói
  │     ├── Cập nhật trạng thái (PROCESSING → SHIPPED)
  │     └── <<include>> Tạo đơn vận chuyển trên GHN
  └── UC26: Quản lý tồn kho
        ├── Xem số lượng tồn kho theo sản phẩm/variant
        └── Cập nhật stock (nhập/xuất kho)
```

### 2.4. Admin (Quản trị viên)

```
Admin
  ├── UC27: Quản lý người dùng
  │     ├── Xem danh sách người dùng
  │     ├── Khoá / Mở tài khoản
  │     └── Phân quyền (role assignment)
  ├── UC28: Quản lý Shop
  │     ├── Xem danh sách shop
  │     ├── Duyệt shop mới (approve/reject)
  │     └── Đình chỉ shop vi phạm
  ├── UC29: Quản lý danh mục sản phẩm
  │     ├── Tạo danh mục mới
  │     ├── Sửa danh mục
  │     └── Xoá danh mục
  ├── UC30: Quản lý đơn hàng toàn hệ thống
  │     ├── Xem tất cả đơn hàng
  │     ├── Can thiệp xử lý đơn
  │     └── Hoàn tiền (refund)
  ├── UC31: Quản lý Role & Permission
  │     ├── Tạo/sửa/xoá role
  │     └── Gán permission cho role
  ├── UC32: Xem Analytics & Báo cáo
  │     ├── Thống kê doanh thu toàn hệ thống
  │     ├── Thống kê người dùng
  │     └── Thống kê sản phẩm
  └── UC33: Quản lý hệ thống
        └── Trigger reindex Elasticsearch
```

### 2.5. Payment Gateway (Cổng thanh toán – VNPAY / MoMo / PayPal)

```
Payment Gateway (VNPAY / MoMo / PayPal)
  ├── UC34: Xử lý thanh toán
  │     ├── Nhận yêu cầu thanh toán từ hệ thống
  │     ├── Hiển thị trang thanh toán cho khách
  │     │     ├── VNPAY: thanh toán thẻ ATM/Visa/MasterCard nội địa VN
  │     │     ├── MoMo: thanh toán qua ví điện tử MoMo
  │     │     └── PayPal: thanh toán quốc tế (Visa/MasterCard/PayPal)
  │     └── Xử lý giao dịch
  └── UC35: Gửi kết quả thanh toán
        ├── Gửi IPN callback về hệ thống
        └── Redirect khách về trang kết quả
```

### 2.6. Shipping Carrier (Đơn vị vận chuyển – GHN)

```
Shipping Carrier (GHN)
  ├── UC36: Cung cấp dữ liệu địa chỉ
  │     └── API tra cứu Tỉnh / Huyện / Xã
  ├── UC37: Tính phí vận chuyển
  │     └── Tính phí từ kho (warehouse) → địa chỉ khách
  ├── UC38: Đăng ký điểm lấy hàng
  │     └── Mỗi warehouse = 1 GHN Shop (pickup point)
  ├── UC39: Tạo đơn vận chuyển
  │     └── Tạo đơn ship từ kho tối ưu đến khách
  └── UC40: Cập nhật trạng thái giao hàng
        └── Webhook / Callback trạng thái vận đơn
```

---

## 3. Bảng phân quyền (Permission Matrix)

| Chức năng | Buyer | Seller | Warehouse Employee | Admin |
|---|:---:|:---:|:---:|:---:|
| Đăng ký / Đăng nhập | ✅ | ✅ | ✅ | ✅ |
| Xem / Tìm kiếm sản phẩm | ✅ | ✅ | ❌ | ✅ |
| Quản lý giỏ hàng | ✅ | ❌ | ❌ | ❌ |
| Đặt hàng & Thanh toán | ✅ | ❌ | ❌ | ❌ |
| Theo dõi đơn hàng (của mình) | ✅ | ❌ | ❌ | ❌ |
| Đánh giá sản phẩm | ✅ | ❌ | ❌ | ❌ |
| Quản lý Wishlist | ✅ | ❌ | ❌ | ❌ |
| Chat | ✅ | ✅ | ❌ | ✅ |
| CRUD Sản phẩm | ❌ | ✅ | ❌ | ✅ |
| Quản lý Shop | ❌ | ✅ | ❌ | ✅ |
| Quản lý Coupon | ❌ | ✅ | ❌ | ✅ |
| CRUD Kho hàng | ❌ | ✅ | ❌ | ✅ |
| Thêm/Xoá nhân viên kho | ❌ | ✅ | ❌ | ✅ |
| Xem đơn hàng (kho mình) | ❌ | ✅ *(tất cả)* | ✅ *(kho được gán)* | ✅ *(tất cả)* |
| Đóng gói & Gửi hàng | ❌ | ✅ | ✅ | ❌ |
| Quản lý tồn kho (stock) | ❌ | ✅ | ✅ *(kho mình)* | ✅ |
| Xem Dashboard / Thống kê | ❌ | ✅ *(shop)* | ❌ | ✅ *(toàn hệ thống)* |
| Duyệt Shop | ❌ | ❌ | ❌ | ✅ |
| Quản lý User | ❌ | ❌ | ❌ | ✅ |
| Quản lý Role & Permission | ❌ | ❌ | ❌ | ✅ |
| Quản lý Danh mục | ❌ | ❌ | ❌ | ✅ |

---

## 4. Luồng xử lý đơn hàng với Multi-Warehouse

```
┌──────────────────────────────────────────────────────────────────┐
│                    LUỒNG ĐẶT HÀNG (ORDER FLOW)                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Buyer chọn sản phẩm → Thêm vào giỏ → Checkout                 │
│       │                                                          │
│       ▼                                                          │
│  Chọn địa chỉ giao hàng (district_id, ward_code)               │
│       │                                                          │
│       ▼                                                          │
│  Hệ thống lấy tất cả Warehouse (ACTIVE) của Shop               │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────┐                │
│  │ Với MỖI warehouse:                          │                │
│  │   → Gọi GHN API tính phí ship              │                │
│  │     (from: warehouse → to: khách)           │                │
│  │   → Lưu kết quả {warehouse_id, fee}        │                │
│  └─────────────────────────────────────────────┘                │
│       │                                                          │
│       ▼                                                          │
│  Chọn warehouse có phí ship THẤP NHẤT (= tối ưu nhất)          │
│       │                                                          │
│       ▼                                                          │
│  Tạo Order → OrderShopGroup (gắn warehouse_id)                 │
│       │                                                          │
│       ▼                                                          │
│  Thanh toán (COD / VNPAY / MoMo / PayPal)                        │
│       │                                                          │
│       ▼                                                          │
│  Warehouse Employee (kho được chọn) nhận đơn                    │
│       │                                                          │
│       ▼                                                          │
│  Đóng gói → Tạo đơn GHN (ShopId = ghn_shop_id) → SHIPPED      │
│       │                                                          │
│       ▼                                                          │
│  GHN giao hàng → Buyer xác nhận nhận hàng → COMPLETED          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Mô hình quan hệ giữa các Actor

```
                           ┌─────────────┐
                           │    ADMIN     │
                           │  (hệ thống) │
                           └──────┬──────┘
                                  │
                    duyệt shop, quản lý user, analytics
                                  │
                                  ▼
┌──────────┐   đặt hàng   ┌─────────────┐  tạo & quản lý  ┌───────────────┐
│  BUYER   │─────────────▶│   SELLER    │────────────────▶│  WAREHOUSE    │
│ (khách   │◀─────────────│ (chủ shop)  │   kho & nhân    │  EMPLOYEE     │
│  hàng)   │  giao hàng   └──────┬──────┘   viên          │ (nhân viên    │
└────┬─────┘                     │                         │    kho)       │
     │                           │                         └───────┬───────┘
     │                           │                                 │
     │                           │                                 │
     │ thanh toán           tính phí,                     xử lý đơn,
     │                    đăng ký kho,                   đóng gói,
     │                    tạo đơn ship                   cập nhật stock
     ▼                           ▼                                 │
┌──────────────────┐  ┌──────────────────┐                         │
│ Payment Gateways │  │    GHN API       │◀────────────────────────┘
│ ┌──────┐┌──────┐ │  │   (Shipping      │     tạo đơn vận chuyển
│ │VNPAY ││ MoMo │ │  │    Carrier)      │
│ └──────┘└──────┘ │  └──────────────────┘
│    ┌──────────┐  │
│    │  PayPal  │  │
│    └──────────┘  │
└──────────────────┘
```
