# FRONTEND — Labstore Admin Dashboard

---

## VAI TRÒ

Bạn là AI agent phụ trách **toàn bộ phần frontend** của hệ thống Labstore Admin Dashboard — một giao diện quản trị e-commerce đầy đủ chức năng. Bạn chịu trách nhiệm xây dựng UI/UX, kết nối API backend, và đảm bảo trải nghiệm quản trị mượt mà, chuyên nghiệp.

---

## CÔNG NGHỆ BẮT BUỘC

| Thành phần | Công nghệ |
|---|---|
| Framework | React.js (Vite hoặc CRA) |
| Styling | Tailwind CSS |
| Language | JavaScript hoặc TypeScript |

**Công nghệ tự chọn thêm** (khuyến nghị nếu phù hợp):
- React Router v6 — điều hướng
- Zustand hoặc Redux Toolkit — state management
- TanStack Query (React Query) — data fetching & caching
- Axios — HTTP client
- React Hook Form + Zod — form & validation
- Recharts hoặc Chart.js — biểu đồ thống kê
- shadcn/ui hoặc Headless UI — UI components
- React Hot Toast / Sonner — toast notifications
- React Table (TanStack Table) — bảng dữ liệu
- React DnD — drag & drop (sắp xếp danh mục)
- React Quill / TipTap — rich text editor
- date-fns / dayjs — xử lý ngày tháng
- Leaflet / React Map — bản đồ địa lý
- i18next — đa ngôn ngữ

---

## QUY TẮC MÔI TRƯỜNG & BẢO MẬT

- URL API backend và các key nhạy cảm phải lưu trong file **`.env`** — KHÔNG hardcode trong code
- Commit file **`.env.example`** (chứa key rỗng)
- **KHÔNG commit** file `.env`

**Biến môi trường cần thiết:**
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Labstore Dashboard
```
> Nếu dùng CRA thì prefix là `REACT_APP_` thay vì `VITE_`

---

## QUY TẮC LÀM VIỆC

### Git & Commit
- Mỗi trang / chức năng hoàn chỉnh → **1 commit riêng**
- Format commit bắt buộc:
  ```
  [ai-<tên-model>] feat: <mô tả ngắn>
  ```
  Ví dụ:
  ```
  [ai-codex-gpt-5.5] feat: product list page + filter + pagination
  [ai-codex-gpt-5.5] feat: order detail page + status update
  [ai-codex-gpt-5.5] fix: dashboard chart not rendering on mobile
  ```
- Sử dụng `.gitignore` để loại trừ: `.env`, `node_modules/`, `dist/`, `build/`

### Cache
- Sau khi hoàn thành hoặc chỉnh sửa một trang / chức năng, cập nhật **`cache.md`** với:
  - Tên trang / chức năng đã làm
  - Route URL tương ứng
  - API endpoint đã kết nối
  - Component chính đã tạo
  - Ghi chú quan trọng (state phức tạp, bug đã fix, thư viện đặc biệt...)
- Mục đích: AI hoặc dev đọc `cache.md` để nắm nhanh trạng thái frontend mà không cần đọc lại toàn bộ code

---

## CẤU TRÚC ROUTE & TRANG

### Layout chính
```
/login                          ← Trang đăng nhập
/dashboard                      ← Tổng quan (sau khi đăng nhập)
```

### Các trang quản lý
```
/products                       ← Danh sách sản phẩm
/products/create                ← Tạo sản phẩm
/products/:id/edit              ← Chỉnh sửa sản phẩm

/categories                     ← Quản lý danh mục

/orders                         ← Danh sách đơn hàng
/orders/:id                     ← Chi tiết đơn hàng

/customers                      ← Danh sách khách hàng
/customers/:id                  ← Chi tiết khách hàng

/promotions/coupons             ← Mã giảm giá
/promotions/flash-sales         ← Flash sale
/promotions/banners             ← Banner quảng cáo
/promotions/affiliate           ← Affiliate / Referral

/payments                       ← Giao dịch thanh toán

/shipping                       ← Cấu hình vận chuyển
/shipping/returns               ← Quản lý trả hàng

/reviews                        ← Đánh giá & bình luận

/support/tickets                ← Help desk / Ticket
/support/live-chat              ← Live chat
/support/faq                    ← FAQ & Knowledge base

/notifications                  ← Quản lý thông báo

/reports                        ← Báo cáo & thống kê

/seo                            ← Quản lý SEO
/blog                           ← Blog & Tin tức

/settings                       ← Cài đặt hệ thống
/settings/admins                ← Quản lý tài khoản admin
/settings/audit-log             ← Nhật ký hoạt động
```

---

## DANH SÁCH CHỨC NĂNG FRONTEND

### 1. Authentication
- Trang đăng nhập (email + password)
- Xác thực 2 bước (2FA)
- Đổi mật khẩu
- Tự động refresh token khi hết hạn
- Redirect về `/login` khi chưa đăng nhập
- Bảo vệ route theo role (Super Admin, Manager, Staff...)

### 2. Dashboard — Tổng quan
- Các card thống kê: doanh thu, đơn hàng, khách hàng mới, tồn kho thấp
- Biểu đồ doanh thu theo thời gian (line / bar chart)
- Biểu đồ trạng thái đơn hàng (donut / pie chart)
- Bảng top sản phẩm bán chạy
- Bản đồ phân bố đơn hàng theo khu vực (Leaflet)
- Bộ lọc khoảng thời gian (hôm nay / tuần / tháng / năm)
- Tỷ lệ chuyển đổi (CVR) & Giá trị đơn hàng trung bình (AOV)

### 3. Quản lý Sản phẩm
- Danh sách sản phẩm: search, filter (danh mục, trạng thái, tồn kho), sort, phân trang
- Form tạo / chỉnh sửa sản phẩm:
  - Thông tin cơ bản, mô tả (rich text editor)
  - Upload nhiều ảnh (drag & drop preview)
  - Quản lý biến thể (size, màu sắc...)
  - Thông tin tồn kho & giá
  - SEO metadata (title, description, slug)
- Đổi trạng thái nhanh (toggle hiển thị / ẩn)
- Import từ file Excel/CSV
- Export danh sách Excel/CSV
- Xóa một hoặc nhiều sản phẩm (bulk action)

### 4. Quản lý Danh mục
- Hiển thị cây danh mục cha - con
- Form tạo / chỉnh sửa (tên, ảnh, danh mục cha)
- Sắp xếp thứ tự bằng drag & drop
- Xóa danh mục

### 5. Quản lý Đơn hàng
- Danh sách đơn hàng: filter (trạng thái, ngày, khách hàng), search, phân trang
- Chi tiết đơn hàng: thông tin khách, sản phẩm, thanh toán, vận chuyển
- Cập nhật trạng thái đơn hàng (timeline trực quan)
- Lịch sử thay đổi trạng thái
- Xuất hóa đơn PDF (in hoặc download)
- Export danh sách CSV
- Bulk action: cập nhật trạng thái nhiều đơn cùng lúc

### 6. Quản lý Khách hàng
- Danh sách: search, filter (nhóm, trạng thái), phân trang
- Chi tiết khách hàng: thông tin cá nhân, lịch sử mua hàng, điểm thưởng
- Khóa / Mở khóa tài khoản
- Phân nhóm / Segment khách hàng
- Ghi chú CRM cho từng khách
- Quản lý điểm thưởng

### 7. Quản lý Khuyến mãi & Marketing
- **Mã giảm giá:** danh sách, tạo / chỉnh sửa / xóa, hiển thị trạng thái
- **Flash sale:** danh sách, tạo campaign với countdown timer
- **Banner / Popup:** upload ảnh, cấu hình vị trí, thời gian hiển thị
- **Affiliate:** danh sách đối tác, tracking link, báo cáo hoa hồng
- **Email campaign:** soạn nội dung, chọn đối tượng, lên lịch gửi

### 8. Quản lý Thanh toán
- Danh sách giao dịch: filter (phương thức, trạng thái, ngày), search
- Chi tiết giao dịch
- Thực hiện hoàn tiền (refund) với xác nhận
- Báo cáo đối soát doanh thu

### 9. Quản lý Vận chuyển
- Cấu hình phí ship theo khu vực / trọng lượng
- Danh sách đơn vị vận chuyển đã tích hợp
- Theo dõi trạng thái giao hàng
- Quản lý kho (nhiều địa điểm)
- Danh sách đơn trả hàng / hoàn hàng

### 10. Đánh giá & Bình luận
- Danh sách đánh giá: filter (sao, sản phẩm, trạng thái), search
- Duyệt / Ẩn / Xóa đánh giá
- Trả lời đánh giá trực tiếp trong trang
- Hiển thị đánh giá tiêu cực nổi bật để xử lý nhanh

### 11. Hỗ trợ Khách hàng
- **Ticket / Help Desk:** danh sách, chi tiết, phân công nhân viên, cập nhật trạng thái
- **Live Chat:** giao diện chat realtime (WebSocket / SignalR)
- **FAQ:** CRUD câu hỏi thường gặp, phân nhóm theo chủ đề

### 12. Thông báo
- Bell icon trên header với badge số thông báo chưa đọc
- Dropdown danh sách thông báo mới nhất
- Trang quản lý tất cả thông báo
- Realtime cập nhật khi có đơn hàng mới / tồn kho thấp

### 13. Báo cáo & Thống kê
- Báo cáo doanh thu: biểu đồ + bảng chi tiết, filter theo khoảng thời gian
- Báo cáo sản phẩm bán chạy
- Báo cáo tồn kho (sắp hết, đã hết)
- Báo cáo hành vi khách hàng
- Báo cáo Affiliate / Referral
- Nút export Excel / PDF cho từng báo cáo

### 14. SEO & Nội dung
- Form chỉnh sửa meta title, description cho từng sản phẩm / danh mục / trang
- **Blog:** danh sách bài viết, tạo / chỉnh sửa (rich text editor), trạng thái (nháp / công khai)
- Quản lý redirect URL
- Xem trước SEO snippet

### 15. Cài đặt Hệ thống
- **Thông tin cửa hàng:** tên, logo, địa chỉ, múi giờ, tiền tệ, ngôn ngữ
- **Quản lý Admin:** danh sách, tạo / chỉnh sửa / xóa tài khoản, gán role
- **Audit Log:** lịch sử hoạt động của admin (ai làm gì, lúc nào)
- **Cài đặt 2FA:** bật / tắt cho tài khoản
- **Giao diện:** dark / light mode toggle

---

## YÊU CẦU UI/UX

- Giao diện **responsive** — hoạt động tốt trên cả desktop và tablet
- Sidebar navigation có thể thu gọn
- Dark / Light mode
- Loading skeleton khi fetch dữ liệu
- Empty state đẹp khi không có dữ liệu
- Toast notification phản hồi sau mỗi hành động (thành công / thất bại)
- Confirmation dialog trước khi xóa / hành động không thể hoàn tác
- Bảng dữ liệu có phân trang, có thể chọn số dòng / trang
- Form validation rõ ràng với thông báo lỗi inline

---

## GHI CHÚ CẤU TRÚC CODE

- Mỗi module / trang tách folder riêng trong `src/pages/` hoặc `src/features/`
- Tách components tái sử dụng vào `src/components/`
- Custom hooks vào `src/hooks/`
- API calls tập trung vào `src/services/` hoặc `src/api/`
- Không gọi API trực tiếp trong component, dùng React Query hoặc custom hook

---

## ĐỌC THÊM

- Xem **`cache.md`** để biết trang nào đã xây xong, API nào đã kết nối
- Xem **`.env.example`** để biết biến môi trường cần cấu hình
- API backend được document tại: `http://localhost:5000/swagger`