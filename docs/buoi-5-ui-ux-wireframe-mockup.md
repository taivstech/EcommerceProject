# BUỔI 5: THIẾT KẾ GIAO DIỆN (UI/UX - WIREFRAME/MOCKUP)

## Đề tài: Hệ thống Thương mại Điện tử (EcommerceWeb)

Ngày thực hiện: Thứ 2, 30/03/2026

---

## 1) Cách làm khi đã có sẵn Frontend

Với dự án đã có FE, cách làm đúng và nhanh nhất là reverse-wireframe:

1. Chốt danh sách màn hình theo use case và route thực tế.
2. Trích xuất layout chuẩn đang dùng (header, footer, sidebar, main content).
3. Chuẩn hóa các thành phần chính (button, form, table, navigation).
4. Vẽ wireframe low-fidelity theo cấu trúc hiện tại để đảm bảo tính khả thi khi triển khai HTML/CSS/JS.
5. Gắn ghi chú UX cho từng màn hình (luồng chính, trạng thái rỗng, lỗi, loading, responsive).

Kết quả: vẫn đáp ứng yêu cầu môn học về wireframe/mockup, đồng thời bám sát codebase đang chạy.

---

## 2) Danh sách trang tối thiểu (đã map với FE hiện tại)

| Nhóm trang | Route thực tế | Trạng thái |
|---|---|---|
| Trang chủ | / | Có sẵn |
| Danh sách sản phẩm + bộ lọc | /shop | Có sẵn |
| Chi tiết sản phẩm | /product/:productId | Có sẵn |
| Giỏ hàng | /cart | Có sẵn |
| Thanh toán | /checkout | Có sẵn |
| Quản trị - Dashboard | /admin | Có sẵn |
| Quản trị - Quản lý sản phẩm | /store/manage-product | Có sẵn |
| Quản trị - Quản lý đơn hàng | /store/orders | Có sẵn |
| Hồ sơ cá nhân | /profile | Có sẵn |

Ghi chú: hệ thống tách vai trò quản trị nền tảng (admin) và vận hành shop (store). Với yêu cầu học phần, nhóm trang quản trị đã được bao phủ bằng dashboard + quản lý sản phẩm + quản lý đơn hàng.

---

## 3) Hệ thống layout chuẩn

### 3.1. Public layout

- Header: logo, thanh điều hướng, tìm kiếm, tài khoản/giỏ hàng.
- Main: nội dung theo từng trang.
- Footer: thông tin hệ thống, liên kết phụ.

### 3.2. Admin/Store layout

- Sidebar trái: menu chức năng theo vai trò.
- Topbar hoặc tiêu đề nội dung.
- Main content: dashboard, bảng dữ liệu, form.

### 3.3. Quy tắc nhất quán

- Cùng hệ lưới và spacing cho các trang cùng nhóm.
- Nút hành động chính dùng cùng kiểu màu và thứ bậc.
- Trạng thái loading/empty/error phải có ở mọi trang dữ liệu.
- Tối ưu responsive: desktop ưu tiên bảng, mobile ưu tiên card/stack.

---

## 4) Wireframe low-fidelity cho từng trang

## 4.1. Trang chủ

Mục tiêu UX: dẫn người dùng từ khám phá đến mua hàng nhanh.

```text
+--------------------------------------------------------------------------------+
| HEADER: Logo | Search | Nav Menu | Account | Cart                              |
+--------------------------------------------------------------------------------+
| HERO BANNER (CTA: Mua ngay / Khám phá)                                         |
+--------------------------------------------------------------------------------+
| Recommended For You (grid card sản phẩm)                                       |
+--------------------------------------------------------------------------------+
| More Products (nhiều section danh mục)                                         |
+--------------------------------------------------------------------------------+
| Value Props / Specs (vận chuyển, bảo hành, hỗ trợ...)                          |
+--------------------------------------------------------------------------------+
| Newsletter Signup                                                              |
+--------------------------------------------------------------------------------+
| FOOTER                                                                         |
+--------------------------------------------------------------------------------+
```

Thành phần chính: button CTA, card sản phẩm, section heading, input email.

---

## 4.2. Trang danh sách sản phẩm (có bộ lọc)

Mục tiêu UX: tìm nhanh sản phẩm phù hợp qua lọc + sắp xếp + phân trang.

```text
+--------------------------------------------------------------------------------+
| HEADER                                                                         |
+--------------------------------------------------------------------------------+
| Title + Tabs (Products / Stores) + Sort                                        |
+--------------------------------------------------------------------------------+
| SIDEBAR FILTERS           | MAIN LIST                                           |
| - Location                | - Product grid (card)                               |
| - Category                | - Price display                                     |
| - Rating                  | - Sold/Rating                                       |
| - Price range             | - Pagination                                         |
+--------------------------------------------------------------------------------+
| FOOTER                                                                         |
+--------------------------------------------------------------------------------+
```

Thành phần chính: radio/checkbox, dropdown sort, pagination, product card.

---

## 4.3. Trang chi tiết sản phẩm

Mục tiêu UX: cung cấp đủ thông tin trước quyết định thêm giỏ/mua ngay.

```text
+--------------------------------------------------------------------------------+
| HEADER                                                                         |
+--------------------------------------------------------------------------------+
| Breadcrumbs                                                                    |
+--------------------------------------------------------------------------------+
| Gallery ảnh | Thông tin sản phẩm | Giá | Biến thể | Nút Add to Cart / Buy Now  |
+--------------------------------------------------------------------------------+
| Tabs/Sections: Mô tả | Đánh giá | Chính sách                                   |
+--------------------------------------------------------------------------------+
| Frequently Bought Together (slider/grid)                                       |
+--------------------------------------------------------------------------------+
| Similar Products (grid)                                                        |
+--------------------------------------------------------------------------------+
| FOOTER                                                                         |
+--------------------------------------------------------------------------------+
```

Thành phần chính: variant selector, quantity control, CTA mua hàng, review block.

---

## 4.4. Trang giỏ hàng

Mục tiêu UX: chỉnh số lượng nhanh, chọn shop và đi thanh toán ít lỗi.

```text
+--------------------------------------------------------------------------------+
| HEADER                                                                         |
+--------------------------------------------------------------------------------+
| Cart Title                                                                     |
+--------------------------------------------------------------------------------+
| Bảng/nhóm theo shop                                                            |
| - Chọn shop (radio)                                                            |
| - Danh sách item: ảnh, tên, biến thể, đơn giá, số lượng, thành tiền, xóa       |
| - Tổng theo shop                                                               |
| - Nút Checkout                                                                 |
+--------------------------------------------------------------------------------+
| FOOTER                                                                         |
+--------------------------------------------------------------------------------+
```

Thành phần chính: table/list item, counter, delete action, checkout button.

---

## 4.5. Trang thanh toán

Mục tiêu UX: review đơn hàng rõ ràng, giảm thao tác thừa trước khi đặt.

```text
+--------------------------------------------------------------------------------+
| CHECKOUT HEADER (logo + tiêu đề)                                               |
+--------------------------------------------------------------------------------+
| Danh sách sản phẩm đặt mua                                                     |
| - Ảnh, tên, biến thể                                                           |
| - Đơn giá, số lượng, tổng dòng                                                 |
+--------------------------------------------------------------------------------+
| ORDER SUMMARY (sticky/bottom section)                                          |
| - Tạm tính, phí ship, giảm giá, tổng cuối                                      |
| - Nút Place Order                                                              |
+--------------------------------------------------------------------------------+
```

Thành phần chính: order summary, pricing breakdown, place order CTA.

---

## 4.6. Trang quản trị - Dashboard

Mục tiêu UX: theo dõi KPI và ra quyết định nhanh.

```text
+--------------------------------------------------------------------------------+
| SIDEBAR | TOP ACTIONS (Date filter, Export)                                    |
+--------------------------------------------------------------------------------+
| KPI CARDS: Revenue | Orders | Products | Stores | Users                        |
+--------------------------------------------------------------------------------+
| Charts: Donut trạng thái đơn | Revenue trend | User growth | Category revenue  |
+--------------------------------------------------------------------------------+
| Bảng/khối số liệu vận hành khác                                                 |
+--------------------------------------------------------------------------------+
```

Thành phần chính: cards, charts, filter button group, export button.

---

## 4.7. Trang quản trị - Quản lý sản phẩm

Mục tiêu UX: quản lý vòng đời sản phẩm bằng bảng dữ liệu rõ ràng.

```text
+--------------------------------------------------------------------------------+
| SIDEBAR | PAGE TITLE + Add Product button                                      |
+--------------------------------------------------------------------------------+
| TABLE PRODUCTS                                                                  |
| Columns: Product | Base Price | Variants | Stock | Sold | Status | Actions     |
| Actions: Edit | Delete                                                          |
+--------------------------------------------------------------------------------+
```

Thành phần chính: data table, status badge, action icon button, add form entry point.

---

## 4.8. Trang quản trị - Quản lý đơn hàng

Mục tiêu UX: xử lý đơn theo trạng thái, tìm kiếm nhanh, thao tác ít click.

```text
+--------------------------------------------------------------------------------+
| SIDEBAR | PAGE TITLE                                                            |
+--------------------------------------------------------------------------------+
| FILTER TABS: All | Pending | Confirmed | Shipping | Delivered | Cancelled      |
| SEARCH BOX                                                                      |
+--------------------------------------------------------------------------------+
| ORDER CARDS/LIST                                                                |
| - Header đơn: mã đơn, thời gian, trạng thái, tổng tiền                         |
| - Customer info                                                                 |
| - Preview sản phẩm                                                              |
| - Actions: Confirm / Ship / Deliver / Cancel                                   |
+--------------------------------------------------------------------------------+
```

Thành phần chính: tab filter, search input, status chip, action buttons, modal chi tiết/hủy.

---

## 4.9. Trang hồ sơ cá nhân

Mục tiêu UX: người dùng tự cập nhật thông tin cá nhân và địa chỉ giao hàng.

```text
+--------------------------------------------------------------------------------+
| HEADER                                                                         |
+--------------------------------------------------------------------------------+
| PROFILE TITLE                                                                   |
+--------------------------------------------------------------------------------+
| MAIN (2 cột)                       | SIDEBAR                                    |
| - Avatar block (upload)            | - User summary                              |
| - Personal Information form         | - Link quản lý địa chỉ                      |
| - Security section                  |                                            |
+--------------------------------------------------------------------------------+
```

Thành phần chính: input form, upload avatar, save button, info card, navigation card.

---

## 5) Thư viện thành phần UI dùng xuyên suốt

- Nút bấm: Primary, Secondary, Danger, Disabled.
- Form: text input, password, number, date, select, textarea, radio, checkbox.
- Bảng dữ liệu: header, sortable column (nếu cần), pagination.
- Điều hướng: navbar public, sidebar admin/store, breadcrumbs.
- Card: product card, stats card, order card.
- Phản hồi hệ thống: toast, empty state, loading skeleton/spinner.

---

## 6) Quy chuẩn UX cần giữ

- Đảm bảo hành động chính luôn nhìn thấy rõ ở viewport đầu.
- Không để luồng checkout phụ thuộc quá nhiều popup.
- Trạng thái lỗi cần thông báo gần vị trí nhập liệu hoặc hành động thất bại.
- Các action có rủi ro cao (xóa, hủy đơn) phải có bước xác nhận.
- Responsive:
  - Desktop: ưu tiên bảng và dashboard nhiều cột.
  - Mobile: chuyển bảng sang card, giữ CTA nổi bật ở cuối màn hình.

---

## 7) Tiêu chí nghiệm thu Buổi 5

1. Có đầy đủ wireframe cho toàn bộ trang bắt buộc.
2. Mỗi wireframe thể hiện rõ header/footer/sidebar/main content.
3. Có chỉ rõ component chính: button, form, table, menu.
4. Có nguyên tắc nhất quán UI và ghi chú UX cơ bản.
5. Có thể bàn giao ngay cho frontend dev để triển khai/chuẩn hóa giao diện.

---



## 8) Kết luận

Bộ wireframe/mockup đã hoàn tất theo đúng phạm vi yêu cầu học phần và bám sát FE đang có, giúp giảm rủi ro lệch thiết kế khi triển khai thực tế.
