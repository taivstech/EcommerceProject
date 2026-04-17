PDF TEMPLATE CONTENT:
000: BÁO CÁO PHÂN TÍCH & THIẾT KẾ HỆ THỐNG THƯƠNG MẠI ĐIỆN
001: TỬ
002: Mỗi nhóm sinh viên phải nộp một cuốn báo cáo phân tích và thiết kế hệ thống hoàn chỉnh,
003: bao gồm các phần sau theo đúng thứ tự:
004: 1. Trang bìa
005: o Ghi rõ tên đề tài
006: o Tên đầy đủ các thành viên trong nhóm cùng mã số sinh viên
007: 2. Trang đánh giá mức độ hoàn thành của các thành viên
008: o Đánh giá phần trăm (%) mức độ hoàn thành công việc của từng thành viên
009: o Mức độ hoàn thành phải được các thành viên trong nhóm thống nhất và đồng
010: ý, VD như sau:
011: STT Họ và tên Mã số Vai trò Mức độ hoàn thành
012: 1 Nguyễn Văn An B21DCCN219 Trưởng nhóm 100%
013: 2 Lê Thị B B21DCCN918 Thành viên 60%
014: …
015: …
016: 3. Trang mục lục
017: o Liệt kê các chương, mục, tiểu mục với số trang tương ứng để tiện tra cứu
018: 4. Trang ký hiệu và chữ viết tắt
019: o Liệt kê các ký hiệu, thuật ngữ viết tắt sử dụng trong báo cáo
020: o Sắp xếp theo thứ tự bảng chữ cái (ABC) để dễ tham khảo
021: 5. Tiếp theo là phần nội dung theo bố cục (bắt buộc) sau:
022: CHƯƠNG 1: TÁC NHÂN VÀ BIỂU ĐỒ USECASE TỔNG QUÁT
023: 1.1. Danh sách tác nhân (Actors)
024: Bảng liệt kê các tác nhân (tên, mô tả chi tiết về vai trò, đối tượng đại diện)
025: Các tác nhân điển hình: Khách hàng (chưa đăng nhập/đã đăng nhập), Quản trị viên, Nhân viên
026: kho, Cổng thanh toán, Đơn vị vận chuyển…
027: 1.2. Biểu đồ Usecase tổng quát
028: Hình vẽ (UML) thể hiện tất cả các usecase và mối quan hệ với tác nhân
029: Chú thích rõ các khối usecase theo từng tác nhân (có thể phân vùng)
030: CHƯƠNG 2: MÔ TẢ VÀ ĐẶC TẢ USECASE CHI TIẾT
031: 2.1. Bảng danh mục Usecase
032: Bảng liệt kê tất cả các usecase đã xác định, phân loại theo tác nhân, kèm mô tả ngắn gọn
033: 2.2. Đặc tả Usecase chi tiết
034: Với mỗi usecase, trình bày theo cấu trúc bảng thống nhất gồm:
035: • Tên Usecase
036: • Tác nhân chính
037: • Mô tả ngắn
038: • Điều kiện tiên quyết
039: • Điều kiện kết thúc (thành công / thất bại)
040: 1
041: • Luồng sự kiện chính (từng bước)
042: • Luồng sự kiện phụ (các ngoại lệ, rẽ nhánh)
043: Ghi chú: Nên đặc tả lần lượt cho tất cả usecase trong bảng 2.1.
044: CHƯƠNG 3: BIỂU ĐỒ TUẦN TỰ CHI TIẾT
045: 3.1. Nguyên tắc xây dựng biểu đồ tuần tự
046: Xác định các đối tượng (Actor, Boundary, Control, Entity)
047: Các ký hiệu UML: lifeline, message, alt, loop, opt…
048: 3.2. Biểu đồ tuần tự cho từng Usecase
049: Với mỗi usecase trong danh mục, vẽ một biểu đồ tuần tự tương ứng (hình UML)
050: Thể hiện rõ thứ tự thông điệp, các điều kiện rẽ nhánh (nếu có) dựa trên luồng sự kiện đã đặc
051: tả
052: Có thể nhóm các usecase có luồng tương tự nhau, nhưng nên vẽ riêng để đảm bảo chi tiết.
053: CHƯƠNG 4: BIỂU ĐỒ LỚP VÀ THIẾT KẾ CƠ SỞ DỮ LIỆU
054: 4.1. Biểu đồ lớp (Class Diagram) tổng quát
055: Hình vẽ UML thể hiện các lớp chính (thực thể, điều khiển, biên giới nếu cần)
056: Các thuộc tính (kèm kiểu dữ liệu)
057: Các phương thức quan trọng
058: Mối quan hệ (kế thừa, kết hợp, bội số)
059: 4.2. Thiết kế cơ sở dữ liệu quan hệ
060: Chuyển đổi từ biểu đồ lớp sang mô hình CSDL
061: Bảng mô tả chi tiết từng bảng gồm:
062: • Tên bảng
063: • Các cột (tên, kiểu dữ liệu, ràng buộc: PK, FK, NOT NULL, UNIQUE,
064: DEFAULT…)
065: • Mô tả ý nghĩa
066: Có thể kèm theo sơ đồ quan hệ giữa các bảng (ERD)
067: CHƯƠNG 5: THIẾT KẾ GIAO DIỆN (UI/UX – WIREFRAME /
068: MOCKUP)
069: 5.1. Danh sách các trang giao diện chính
070: • Trang chủ
071: • Danh sách sản phẩm (có bộ lọc, tìm kiếm)
072: • Chi tiết sản phẩm
073: • Giỏ hàng
074: • Thanh toán
075: • Lịch sử đơn hàng / Hồ sơ cá nhân
076: • Các trang quản trị (Dashboard, Quản lý sản phẩm, Quản lý đơn hàng, Quản lý
077: người dùng…)
078: 5.2. Wireframe / Mockup từng trang
079: Hình ảnh phác thảo (Figma, Balsamiq, vẽ tay)
080: Mỗi hình có chú thích bố cục (header, footer, sidebar, nội dung chính)
081: Xác định các thành phần tương tác: nút bấm, form nhập liệu, bảng dữ liệu, menu…
082: 2
083: 5.3. Nguyên tắc thiết kế
084: Tính nhất quán giữa các trang
085: Trải nghiệm người dùng hợp lý (dễ thao tác, thông báo rõ ràng)
086: Dễ dàng triển khai thành HTML/CSS/JS
087: CHƯƠNG 6: LỰA CHỌN CÔNG CỤ PHÁT TRIỂN HỆ THỐNG
088: 6.1. Giới thiệu các công nghệ dự kiến
089: • Backend: [Ví dụ: Java Spring Boot, Node.js, PHP Laravel…]
090: • Frontend: [Ví dụ: React, Vue, Angular, hoặc HTML/CSS/JS thuần]
091: • Cơ sở dữ liệu: [Ví dụ: MySQL, PostgreSQL, MongoDB]
092: • Cổng thanh toán: [VNPAY, PayPal, Stripe…]
093: • Vận chuyển: [Giao Hàng Nhanh, Viettel Post, GHTK…]
094: • Công cụ hỗ trợ: Git, Figma, Postman, Docker (nếu có)
095: 6.2. Lý do lựa chọn và sự phù hợp
096: Phân tích ưu điểm từng công cụ đối với yêu cầu của hệ thống (bảo mật, hiệu năng, dễ học,
097: cộng đồng, chi phí…)
098: Giải thích tại sao bộ công nghệ này phù hợp với quy mô đồ án / dự án thực tế
099: 6.3. Kiến trúc tổng thể dự kiến (nếu cần)
100: Sơ đồ các thành phần (client – server – database – third-party services)
101: Giao tiếp REST API hoặc GraphQL…
102: YÊU CẦU VỀ TRÌNH BÀY BÁO CÁO
103: 1. Yêu cầu chung
104: • Báo cáo phải được trình bày rõ ràng, mạch lạc, không mắc lỗi chính tả hoặc ngữ
105: pháp.
106: • Nội dung cần thống nhất về định dạng, cách đánh số đề mục, bảng biểu và hình
107: ảnh.
108: 2. Định dạng trang giấy
109: • Khổ giấy: A4
110: • Lề trang (Margins):
111: o Trên: 2.0 cm
112: o Dưới: 2.0 cm
113: o Trái: 3.0 cm
114: o Phải: 2.0 cm
115: • Header / Footer: cách mép giấy 1.0 cm
116: • Căn lề (Alignment): Justified (canh đều 2 bên)
117: • Khoảng cách đoạn (Paragraph spacing):
118: o Before: 3 pt
119: o After: 3 pt
120: • Giãn dòng (Line spacing): Multiple 1.3
121: 3. Định dạng chữ
122: • Font chữ: Times New Roman
123: • Cỡ chữ:
124: o Nội dung thông thường: Size 13
125: o Tiêu đề chương: In hoa, in đậm, size 14
126: o Tiêu đề mục lớn trong chương: In đậm, size 13
127: 3
128: • Phải thống nhất toàn bộ font chữ, cỡ chữ và kiểu chữ trong toàn bộ báo cáo.
129: 4. Đánh số hình, bảng và đề mục
130: • Hình vẽ và bảng biểu phải được đánh số theo chương, ví dụ:
131: o Hình 2.1: Hình thứ nhất trong Chương 2
132: o Bảng 3.5: Bảng thứ năm trong Chương 3
133: • Cách đánh số đề mục: sử dụng hệ thống phân cấp như sau:
134: o Cấp chương: 1, 2, 3, ...
135: o Cấp mục: 1.1, 1.2, ...
136: o Cấp tiểu mục: 1.1.1, 1.1.2, ...
137: o (nếu cần sâu hơn): 1.1.1.1, ...
138: 5. Header và Footer trên mỗi trang
139: • Header (góc trên trái): Ghi tên đề tài bài tập lớn
140: • Footer (góc dưới phải): Ghi số thứ tự trang (Page number)
141: 4

DOCX PART 1 (lines 0-399):
0000: HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG
0001: KHOA CÔNG NGHỆ THÔNG TIN
0002: —------------------------
0003: BÁO CÁO BÀI TẬP LỚN
0004: PHÁT TRIỂN HỆ THỐNG TMĐT
0005: Đề tài: Website TMĐT
0006: Nhóm lớp: 5 - Nhóm BTL: 6
0007: Giảng viên: Đỗ Quang Hưng
0008: Thành viên: Nguyễn Duy Hoàng  - B22DCCN334
0009: Trần Trọng Đại          - B22DCCN178
0010: Lê Đức Toàn              - B22DCCN730
0011: Võ Sỹ Tài                   - B22DCCN706
0012: Hà Nội - 2026
0013: 1. Danh sách các tác nhân (Actors) và mô tả:
0014: STT
0015: Tên tác nhân
0016: Mô tả chi tiết
0017: 1
0018: Quản trị viên (Admin)
0019: Người quản lý toàn bộ hệ thống với quyền cao nhất.
0020: - Duyệt hoặc từ chối shop đăng ký.
0021: - Quản lý người dùng.
0022: - Quản lý danh mục sản phẩm (category).
0023: - Xem và quản lý tất cả đơn hàng trên hệ thống.
0024: - Quản lý role và permission.
0025: - Xem analytics và báo cáo toàn hệ thống.
0026: 2
0027: Người bán hàng (Seller)
0028: Chủ shop - đăng ký và quản lý thông tin shop.
0029: - Quản lý sản phẩm và xử lý đơn hàng.
0030: - Tạo và quản lý mã giảm giá.
0031: - Quản lý hệ thống kho hàng, thêm/xóa nhân viên kho.
0032: - Xem dashboard thống kê doanh thu và hoạt động.
0033: - Nhắn tin với khách hàng.
0034: 3
0035: Nhân viên kho (Warehouse Employee)
0036: Nhân viên được Seller thêm vào để quản lý một hoặc nhiều kho hàng cụ thể.
0037: - Có quyền xem các đơn hàng được phân về kho mình phụ trách, xác nhận đóng gói đơn hàng, cập nhật trạng thái đơn.
0038: - Quản lý tồn kho (stock) trong kho được phân công.
0039: 4
0040: Khách hàng (Customer)
0041: Người dùng cuối của hệ thống.
0042: - Truy cập website để duyệt, tìm kiếm sản phẩm, xem chi tiết sản phẩm.
0043: - Quản lý giỏ hàng, đặt hàng, sử dụng mã giảm giá (voucher), thanh toán, theo dõi trạng thái đơn hàng, đánh giá sản phẩm sau khi nhận hàng.
0044: - Nhắn tin trực tiếp với shop.
0045: 5
0046: Cổng thanh toán (Payment Gateway)
0047: Các hệ thống thanh toán bên ngoài hỗ trợ xử lý giao dịch trực tuyến (VNPAY, MoMo, PayPal).
0048: - Mỗi cổng nhận yêu cầu thanh toán từ hệ thống, xử lý giao dịch, gửi callback (IPN - Instant Payment Notification) về kết quả thanh toán thành công hoặc thất bại, và redirect người dùng về trang kết quả đặt hàng.
0049: - Ngoài ra hệ thống còn hỗ trợ COD (thanh toán khi nhận hàng).
0050: 6
0051: Đơn vị vận chuyển (Shipping Carrier)
0052: Hệ thống bên ngoài (Giao Hàng Nhanh - GHN) cung cấp dịch vụ vận chuyển.
0053: - Cung cấp API tra cứu địa chỉ, tính phí vận chuyển từ kho đến khách hàng.
0054: 2. Biểu đồ Usecase tổng quát của hệ thống:
0055: 1. Mô tả Usecase tổng quát (Bảng danh mục Usecase):
0056: Tác nhân
0057: Tên Usecase
0058: Mô tả ngắn gọn
0059: Người xem
0060: Tìm kiếm sản phẩm (SP)
0061: Tìm kiếm sản phẩm theo từ khóa, danh mục, giá và bộ lọc.
0062: Quản lý giỏ hàng
0063: Thêm, sửa số lượng hoặc xóa sản phẩm trong giỏ hàng.
0064: Khách hàng (Customer)
0065: Đăng ký tài khoản
0066: Cho phép người dùng mới tạo tài khoản trên hệ thống.
0067: Quản lý thông tin cá nhân
0068: Cập nhật thông tin cá nhân và quản lý địa chỉ giao hàng.
0069: Đặt hàng
0070: Tạo đơn hàng, chọn địa chỉ, chi phí và xác nhận mua.
0071: Đánh giá SP
0072: Gửi điểm đánh giá và nhận xét sau khi nhận hàng.
0073: Nhắn tin
0074: Trao đổi trực tiếp với shop qua chat realtime.
0075: Quản trị viên (Admin)
0076: Quản lý shop
0077: Duyệt shop mới, theo dõi và đình chỉ shop vi phạm.
0078: Quản lý người dùng
0079: Xem danh sách, khóa / mở khóa tài khoản và phân quyền.
0080: Quản lý danh mục SP
0081: Tạo / sửa / xóa danh mục sản phẩm cho hệ thống.
0082: Người bán (Seller)
0083: Đăng ký shop
0084: Gửi yêu cầu mở shop và chờ quản trị viên duyệt.
0085: Quản lý thông tin shop
0086: Cập nhật tên, mô tả, logo, kho và địa chỉ shop.
0087: Quản lý SP
0088: Tạo / sửa / xóa sản phẩm, mô tả, thuộc tính và ảnh.
0089: Quản lý đơn hàng
0090: Xem, xác nhận, cập nhật trạng thái và hủy đơn của shop.
0091: Quản lý mã giảm giá
0092: Tạo, chỉnh sửa và vô hiệu hóa voucher của shop.
0093: Quản lý nhân viên kho
0094: Đăng ký, phân công hoặc gỡ nhân viên khỏi kho hàng.
0095: Nhân viên kho
0096: Quản lý tồn kho
0097: Theo dõi và cập nhật số lượng tồn theo biến thể.
0098: Quản lý đơn hàng theo kho
0099: Xem danh sách đơn được gán cho kho, đóng gói, tạo vận đơn và cập nhật trạng thái giao hàng.
0100: 2. Đặc tả Usecase chi tiết:
0101: 2.1. UC01 - Tìm kiếm sản phẩm
0102: Mục
0103: Nội dung chi tiết
0104: Tác nhân chính
0105: Người xem
0106: Mô tả
0107: Tìm kiếm sản phẩm theo từ khóa, danh mục, giá và bộ lọc.
0108: Điều kiện tiên quyết
0109: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0110: Điều kiện kết thúc
0111: Người xem tìm kiếm được sản phẩm theo nhu cầu.
0112: Luồng sự kiện chính
0113: 1. Người dùng truy cập chức năng Tìm kiếm sản phẩm.2. Hệ thống hiển thị thanh tìm kiếm.3. Người dùng nhập tên, điều kiện, lọc và chọn Tìm kiếm.4. Hệ thống hiển thị thông tin chi tiết cho người dùng.
0114: 5. Người dùng chọn vào sản phẩm.
0115: 6. Hệ thống hiển thị trang giao diện chi tiết về sản phẩm mà người dùng đã chọn.
0116: Luồng sự kiện phụ
0117: A1: Không tìm thấy sản phẩm
0118: Tại bước 3, hệ thống hiển thị thông báo sản phẩm không tồn tại và yêu cầu nhập lại.
0119: A2: Hủy bỏ thao tác
0120: Người dùng nhấn nút "Hủy" hoặc đóng trình duyệt -> Hệ thống không thực hiện thay đổi nào.
0121: 2.2. UC02 - Quản lý giỏ hàng
0122: Mục
0123: Nội dung chi tiết
0124: Tác nhân chính
0125: Người xem
0126: Mô tả
0127: Thêm, sửa số lượng hoặc xóa sản phẩm trong giỏ hàng.
0128: Điều kiện tiên quyết
0129: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0130: Điều kiện kết thúc
0131: Giỏ hàng hiển thị thông tin các sản phẩm được thêm vào.
0132: Luồng sự kiện chính
0133: 1. Người dùng truy cập trang sản phẩm cần thêm vào giỏ và chọn số lượng cần thêm.2. Người dùng chọn chức năng “Thêm vào giỏ hàng”3. Hệ thống hiển thị thông báo thêm vào giỏ thành công.4. Người dùng chọn chức năng Giỏ hàng5. Hệ thống hiển thị trang Giỏ hàng với thông tin sản phẩm đã được thêm, cùng với thông tin hiện tại của mỗi sản phẩm (Trạng thái, số lượng còn lại).
0134: Luồng sự kiện phụ
0135: A1: Quá số lượng hiện tại của sản phẩm
0136: Tại bước 2, nếu số lượng hiện tại < số lượng thêm vào giỏ -> Hệ thống hiển thị thông báo quá số lượng đang có.
0137: A2: Hủy bỏ thao tác
0138: Người dùng nhấn nút "Hủy" hoặc đóng trình duyệt -> Hệ thống không thực hiện thay đổi nào.
0139: 2.3. UC03 - Đăng ký tài khoản
0140: Mục
0141: Nội dung chi tiết
0142: Tác nhân chính
0143: Khách hàng
0144: Mô tả
0145: Người dùng mới tạo tài khoản trên hệ thống.
0146: Điều kiện tiên quyết
0147: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0148: Điều kiện kết thúc
0149: Đăng ký tài khoản thành công.
0150: Luồng sự kiện chính
0151: 1. Người dùng chọn chức năng Đăng ký.2. Hệ thống hiển thị trang Đăng ký với thông tin cần điền.3. Người dùng nhập thông tin cần thiết và chọn Đăng ký.4. Hệ thống hiển thị thông báo đăng ký thành công.
0152: Luồng sự kiện phụ
0153: A1: Thông tin không hợp lệ
0154: Tại bước 4, nếu thông tin không hợp lệ -> Hệ thống hiển thị thông báo lỗi.
0155: A2: Hủy bỏ thao tác
0156: Người dùng nhấn nút "Hủy" hoặc đóng trình duyệt -> Hệ thống không thực hiện thay đổi nào.
0157: 2.4. UC04 - Quản lý thông tin cá nhân
0158: Mục
0159: Nội dung chi tiết
0160: Tác nhân chính
0161: Khách hàng
0162: Mô tả
0163: Cập nhật thông tin cá nhân và quản lý địa chỉ giao hàng.
0164: Điều kiện tiên quyết
0165: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0166: 3. Khách hàng đã đăng nhập vào hệ thống.
0167: Điều kiện kết thúc
0168: Cập nhật thông tin khách hàng thành công.
0169: Luồng sự kiện chính
0170: 1. Người dùng chọn chức năng Thông tin khách hàng.2. Hệ thống hiển thị trang Thông tin khách hàng với thông tin đã có.3. Người dùng chọn chức năng Cập nhật.4. Hệ thống hiển thị trang Chỉnh sửa với thông tin cần điền.5. Người dùng nhập thông tin cần thiết và chọn Cập nhật.6. Hệ thống hiển thị thông báo cập nhật thành công.
0171: Luồng sự kiện phụ
0172: A1: Thông tin không hợp lệ
0173: Tại bước 6, nếu thông tin không hợp lệ -> Hệ thống hiển thị thông báo lỗi.
0174: A2: Hủy bỏ thao tác
0175: Người dùng nhấn nút "Hủy" hoặc đóng trình duyệt -> Hệ thống không thực hiện thay đổi nào.
0176: 2.5. UC05 - Đặt hàng
0177: Mục
0178: Nội dung chi tiết
0179: Tác nhân chính
0180: Khách hàng
0181: Mô tả
0182: Tạo đơn hàng, chọn địa chỉ, chi phí và xác nhận mua.
0183: Điều kiện tiên quyết
0184: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0185: 3. Khách hàng đã đăng nhập vào hệ thống.
0186: Điều kiện kết thúc
0187: Đặt hàng thành công.
0188: Luồng sự kiện chính
0189: 1. Người dùng chọn sản phẩm cần mua và chọn chức năng Đặt hàng.2. Hệ thống hiển thị trang Đặt hàng với địa chỉ nhận hàng, phí ship và phương thức thanh toán..3. Khách hàng chọn voucher (nếu có) và Tạo đơn thanh toán.4. Hệ thống chuyển sang trang thanh toán.
0190: 5. Khách hàng xác nhận thông tin và chọn phương thức thanh toán.
0191: 6. Hệ thống ghi nhận yêu cầu và chuyển hướng sang cổng thanh toán.
0192: 7. Hệ thống nhận kết quả thanh toán thành công từ cổng thanh toán.
0193: 8. Hệ thống tạo phiếu đơn hàng (mã giao dịch, thông tin đơn hàng, thông tin khách) và lưu vào CSDL.
0194: 9. Hệ thống thông báo kết quả thành công đến khách hàng.
0195: Luồng sự kiện phụ
0196: A1: Hủy bỏ thao tác
0197: Tại bước 2,3 hoặc 5, khách hàng nhấn nút "Hủy" hoặc đóng trình duyệt. Hệ thống không thực hiện thay đổi nào.
0198: A2: Thanh toán thất bại
0199: Tại bước 5, cổng thanh toán trả về kết quả thất bại (ví dụ: số dư không đủ). -> Hệ thống hiển thị thông báo lỗi cho khách hàng, đề nghị thử lại hoặc chọn phương thức khác.
0200: A3: Sản phẩm vừa được mua bởi người khác
0201: Trong lúc khách hàng đang thao tác thanh toán, một người khác đã đặt hàng thành công sản phẩm này. Khi hệ thống chuẩn bị lưu đơn hàng (bước 6) sẽ phát hiện trạng
0202: thái sản phẩm đã thay đổi. -> Hệ thống hủy giao dịch, thông báo lỗi "Sản phẩm đã có người đặt trước đó" và hoàn tiền lại cho khách hàng (nếu có).
0203: 2.6. UC06 - Đánh giá sản phẩm
0204: Mục
0205: Nội dung chi tiết
0206: Tác nhân chính
0207: Khách hàng
0208: Mô tả
0209: Gửi điểm đánh giá và nhận xét sau khi nhận hàng.
0210: Điều kiện tiên quyết
0211: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0212: 3. Khách hàng đã đăng nhập vào hệ thống.
0213: Điều kiện kết thúc
0214: Khách hàng đánh giá sản phẩm thành công.
0215: Luồng sự kiện chính
0216: 1. Người dùng chọn chức năng Thông tin đơn hàng.2. Hệ thống hiển thị trang Thông tin đơn hàng với các đơn hàng đã, đang và chưa được nhận.3. Người dùng chọn đơn hàng đã nhận và chọn sản phẩm cần đánh giá.4. Hệ thống hiển thị trang Đánh giá sản phẩm với thông tin cần điền.5. Người dùng nhập thông tin đánh giá và chọn Cập nhật.6. Hệ thống hiển thị thông báo đánh giá thành công.
0217: Luồng sự kiện phụ
0218: A1: Hủy bỏ thao tác
0219: Người dùng nhấn nút "Hủy" hoặc đóng trình duyệt -> Hệ thống không thực hiện thay đổi nào.
0220: 2.7. UC07 - Nhắn tin
0221: Mục
0222: Nội dung chi tiết
0223: Tác nhân chính
0224: Khách hàng
0225: Mô tả
0226: Trao đổi trực tiếp với shop qua chat realtime.
0227: Điều kiện tiên quyết
0228: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0229: 3. Khách hàng đã đăng nhập vào hệ thống.
0230: Điều kiện kết thúc
0231: Khách hàng chat được với shop thành công.
0232: Luồng sự kiện chính
0233: 1. Người dùng chọn tên shop qua trang thông tin sản phẩm.2. Hệ thống hiển thị trang Thông tin shop.3. Người dùng chọn chức năng Chat với shop.4. Hệ thống hiển thị trang Chat.5. Người dùng nhập thông tin cần trao đổi và chọn gửi.6. Hệ thống hiển thị thông tin trên lịch sử Chat và thông báo gửi thành công.
0234: Luồng sự kiện phụ
0235: A1: Hủy bỏ thao tác
0236: Người dùng nhấn nút "Hủy" hoặc đóng trình duyệt -> Hệ thống không thực hiện thay đổi nào.
0237: 2.8. UC08 - Quản lý shop
0238: Mục
0239: Nội dung chi tiết
0240: Tác nhân chính
0241: Quản trị viên (Admin)
0242: Mô tả
0243: Duyệt shop mới, theo dõi và đình chỉ shop vi phạm.
0244: Điều kiện tiên quyết
0245: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0246: 3. Admin đã đăng nhập vào hệ thống.
0247: Điều kiện kết thúc
0248: Duyệt shop thành công.
0249: Luồng sự kiện chính
0250: 1. Admin chọn chức năng Quản lý shop.2. Hệ thống hiển thị trang Danh sách shop, mỗi shop đều có chức năng Duyệt và Đình chỉ hoạt động.3. Admin tìm tên shop trên thanh tìm kiếm và chọn chức năng tìm kiếm.
0251: 4. Hệ thống hiển thị shop phù hợp với thông tin tìm kiếm.
0252: 5. Admin chọn shop cần duyệt.6. Hệ thống hiển thị trang Thông tin của shop chưa được duyệt.7. Admin xác nhận thông tin shop và chọn Duyệt.8. Hệ thống thông báo shop đã duyệt thành công.
0253: Luồng sự kiện phụ
0254: A1: Không tìm thấy shop
0255: Tại bước 3, hệ thống hiển thị thông báo shop không tồn tại và yêu cầu nhập lại.
0256: A2: Hủy bỏ thao tác
0257: Người dùng nhấn nút "Hủy" hoặc đóng trình duyệt -> Hệ thống không thực hiện thay đổi nào.
0258: 2.9. UC09 - Quản lý người dùng
0259: Mục
0260: Nội dung chi tiết
0261: Tác nhân chính
0262: Quản trị viên (Admin)
0263: Mô tả
0264: Xem danh sách, khóa / mở khóa tài khoản và phân quyền.
0265: Điều kiện tiên quyết
0266: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0267: 3. Admin đã đăng nhập vào hệ thống.
0268: Điều kiện kết thúc
0269: Admin thao tác thành công.
0270: Luồng sự kiện chính
0271: 1. Admin chọn chức năng Quản lý người dùng.2. Hệ thống hiển thị trang Danh sách khách hàng, mỗi khách hàng đều có chức năng Khóa và Mở khóa tài khoản.
0272: 3. Admin tìm tên khách hàng trên thanh tìm kiếm và chọn chức năng tìm kiếm.
0273: 4. Hệ thống hiển thị khách hàng phù hợp với thông tin tìm kiếm.5. Admin chọn khách hàng cần thao tác.6. Hệ thống hiển thị trang Thông tin khách hàng.7. Admin xác nhận thông tin khách hàng.
0274: Luồng sự kiện phụ
0275: A1: Không tìm thấy khách hàng
0276: Tại bước 3, hệ thống hiển thị thông báo khách hàng không tồn tại và yêu cầu nhập lại.
0277: A2: Hủy bỏ thao tác
0278: Người dùng nhấn nút "Hủy" hoặc đóng trình duyệt -> Hệ thống không thực hiện thay đổi nào.
0279: 2.10. UC10 - Quản lý danh mục sản phẩm
0280: Mục
0281: Nội dung chi tiết
0282: Tác nhân chính
0283: Quản trị viên (Admin)
0284: Mô tả
0285: Tạo / sửa / xóa danh mục sản phẩm cho hệ thống.
0286: Điều kiện tiên quyết
0287: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0288: 3. Admin đã đăng nhập vào hệ thống.
0289: Điều kiện kết thúc
0290: Thêm danh mục sản phẩm thành công.
0291: Luồng sự kiện chính
0292: 1. Admin chọn chức năng Quản lý danh mục.2. Hệ thống hiển thị trang Danh sách danh mục, mỗi danh mục đều có chức năng Sửa và Xóa.3. Admin chọn chức năng Thêm danh mục.
0293: 4. Hệ thống hiển thị trang Thông tin danh mục với mô tả.
0294: 5. Admin nhập tên danh mục, mô tả và chọn Xác nhận.6. Hệ thống thông báo Danh mục đã được thêm.
0295: Luồng sự kiện phụ
0296: A1: Hủy bỏ thao tác
0297: Người dùng nhấn nút "Hủy" hoặc đóng trình duyệt -> Hệ thống không thực hiện thay đổi nào.
0298: 2.11. UC11 - Đăng ký shop
0299: Mục
0300: Nội dung chi tiết
0301: Tác nhân chính
0302: Người bán (Seller)
0303: Mô tả
0304: Gửi yêu cầu mở shop và chờ quản trị viên duyệt.
0305: Điều kiện tiên quyết
0306: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0307: 3. Seller đã đăng nhập vào hệ thống.
0308: Điều kiện kết thúc
0309: Gửi yêu cầu mở shop thành công.
0310: Luồng sự kiện chính
0311: 1. Seller chọn chức năng Đăng ký shop.2. Hệ thống hiển thị trang Đăng ký shop với các thông tin cần điền.3. Seller nhập thông tin cần thiết và chọn chức năng Gửi yêu cầu.
0312: 4. Hệ thống hiển thị thông báo Gửi yêu cầu thành công.
0313: Luồng sự kiện phụ
0314: A1: Thông tin không hợp lệ
0315: Tại bước 4, nếu thông tin không hợp lệ -> Hệ thống hiển thị thông báo lỗi.
0316: A2: Hủy bỏ thao tác
0317: Người dùng nhấn nút "Hủy" hoặc đóng trình duyệt -> Hệ thống không thực hiện thay đổi nào.
0318: 2.12. UC12 - Quản lý thông tin shop
0319: Mục
0320: Nội dung chi tiết
0321: Tác nhân chính
0322: Người bán (Seller)
0323: Mô tả
0324: Cập nhật tên, mô tả, logo, kho và địa chỉ shop.
0325: Điều kiện tiên quyết
0326: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0327: 3. Seller đã đăng nhập vào hệ thống.
0328: Điều kiện kết thúc
0329: Cập nhật thông tin shop thành công.
0330: Luồng sự kiện chính
0331: 1. Seller chọn chức năng Thông tin shop.2. Hệ thống hiển thị trang Thông tin Shop với thông tin đã có từ trước.3. Seller chọn chức năng Cập nhật.4. Hệ thống hiển thị trang Chỉnh sửa với thông tin cần điền.5. Seller nhập thông tin cần thiết và chọn Cập nhật.6. Hệ thống hiển thị thông báo cập nhật thành công.
0332: Luồng sự kiện phụ
0333: A1: Thông tin không hợp lệ
0334: Tại bước 6, nếu thông tin không hợp lệ -> Hệ thống hiển thị thông báo lỗi.
0335: A2: Hủy bỏ thao tác
0336: Người dùng nhấn nút "Hủy" hoặc đóng trình duyệt -> Hệ thống không thực hiện thay đổi nào.
0337: 2.13. UC13 - Quản lý sản phẩm
0338: Mục
0339: Nội dung chi tiết
0340: Tác nhân chính
0341: Người bán (Seller)
0342: Mô tả
0343: Tạo / sửa / xóa sản phẩm, mô tả, thuộc tính và ảnh.
0344: Điều kiện tiên quyết
0345: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0346: 3. Seller đã đăng nhập vào hệ thống.
0347: Điều kiện kết thúc
0348: Thêm sản phẩm thành công.
0349: Luồng sự kiện chính
0350: 1. Seller chọn chức năng Quản lý sản phẩm.2. Hệ thống hiển thị trang Danh sách sản phẩm, mỗi danh mục đều có chức năng Sửa và Xóa.3. Seller chọn chức năng Thêm sản phẩm.
0351: 4. Hệ thống hiển thị trang Thông tin sản phẩm với các thông tin cần nhập.
0352: 5. Seller nhập thông tin sản phẩm và chọn Xác nhận.6. Hệ thống thông báo sản phẩm đã được thêm.
0353: Luồng sự kiện phụ
0354: A1: Thông tin không hợp lệ
0355: Tại bước 6, nếu thông tin không hợp lệ -> Hệ thống hiển thị thông báo lỗi.
0356: A2: Hủy bỏ thao tác
0357: Người dùng nhấn nút "Hủy" hoặc đóng trình duyệt -> Hệ thống không thực hiện thay đổi nào.
0358: 2.14. UC14 - Quản lý đơn hàng
0359: Mục
0360: Nội dung chi tiết
0361: Tác nhân chính
0362: Người bán (Seller)
0363: Mô tả
0364: Xem, xác nhận, cập nhật trạng thái và hủy đơn của shop.
0365: Điều kiện tiên quyết
0366: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0367: 3. Seller đã đăng nhập vào hệ thống.
0368: Điều kiện kết thúc
0369: Xác nhận đơn hàng thành công.
0370: Luồng sự kiện chính
0371: 1. Seller chọn chức năng Quản lý đơn hàng.2. Hệ thống hiển thị trang Danh sách đơn hàng.3. Seller chọn đơn hàng chưa được xác nhận.
0372: 4. Hệ thống hiển thị trang Xác nhận đơn hàng với các thông tin của đơn hàng.
0373: 5. Seller chọn Kho hàng còn chứa sản phẩm có trong đơn hàng và chọn Xác nhận.6. Hệ thống thông báo Đơn hàng đã được xác nhận thành công.
0374: Luồng sự kiện phụ
0375: A1: Hủy bỏ thao tác
0376: Người dùng nhấn nút "Hủy" hoặc đóng trình duyệt -> Hệ thống không thực hiện thay đổi nào.
0377: 2.15. UC15 - Quản lý mã giảm giá
0378: Mục
0379: Nội dung chi tiết
0380: Tác nhân chính
0381: Người bán (Seller)
0382: Mô tả
0383: Tạo, chỉnh sửa và vô hiệu hóa voucher của shop.
0384: Điều kiện tiên quyết
0385: 1. Hệ thống và các dịch vụ liên quan đang hoạt động.2. Dữ liệu đầu vào cần thiết đã sẵn sàng.
0386: 3. Seller đã đăng nhập vào hệ thống.
0387: Điều kiện kết thúc
0388: Thêm voucher thành công.
0389: Luồng sự kiện chính
0390: 1. Seller chọn chức năng Quản lý Voucher.2. Hệ thống hiển thị trang Danh sách voucher.3. Seller chọn chức năng Thêm voucher.
0391: 4. Hệ thống hiển thị trang Thông tin voucher với các thông tin cần nhập.
0392: 5. Seller nhập thông tin voucher, số lượng, ngày bắt đầu, ngày kết thúc và chọn Tạo mã.6. Hệ thống thông báo Voucher đã được tạo.
0393: Luồng sự kiện phụ
0394: A1: Thông tin không hợp lệ
0395: Tại bước 6, nếu thông tin không hợp lệ -> Hệ thống hiển thị thông báo lỗi.
0396: A2: Hủy bỏ thao tác
0397: Người dùng nhấn nút "Hủy" hoặc đóng trình duyệt -> Hệ thống không thực hiện thay đổi nào.
0398: 2.16. UC16 - Quản lý nhân viên kho
0399: Mục