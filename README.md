# PKC Task Manager

Website quản lý công việc hằng ngày dành cho Bác sĩ – Leader Trang tại PKC Pet Center, sử dụng Supabase và không yêu cầu đăng nhập.

## Chức năng

- Quản lý việc gấp – quan trọng.
- Quản lý việc quan trọng – chưa gấp.
- Quản lý công việc thường xuyên.
- Theo dõi các ca bệnh trong ngày.
- Quản lý trọng tâm trong tuần.
- Tạo, hoàn thành, kéo thả và xoá công việc.
- Xuất báo cáo ngày thành PDF.
- Đồng bộ dữ liệu nhanh giữa máy tính và điện thoại qua Supabase.
- Mở website và sử dụng ngay, không cần tài khoản hoặc mật khẩu.
- Có sẵn dữ liệu giả lập để trình diễn.

## 1. Chuẩn bị Supabase

Mở **SQL Editor** của Supabase, sao chép toàn bộ file `supabase-schema.sql` và nhấn **Run**.

## 2. Chạy trên máy tính

Yêu cầu Node.js 20.9 trở lên.

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## 3. Đưa lên GitHub

Thay toàn bộ mã nguồn cũ bằng nội dung trong thư mục này. `package.json` phải nằm ở thư mục gốc của repository.

```bash
git add .
git commit -m "Switch PKC task manager to public Supabase access"
git push
```

## 4. Cấu hình Vercel

Thêm hai Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Giá trị mẫu nằm trong `.env.example`. Xóa biến `GOOGLE_SCRIPT_URL` cũ nếu còn, sau đó Redeploy.

## Lưu ý bảo mật

Website không có đăng nhập. Bất kỳ ai có đường dẫn đều có thể xem và thay đổi dữ liệu; chỉ nên chia sẻ đường dẫn trong nội bộ.
