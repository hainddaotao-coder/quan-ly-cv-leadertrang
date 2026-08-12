# PKC Task Manager

Website quản lý công việc hằng ngày dành cho Bác sĩ – Leader Trang tại PKC Pet Center, sử dụng Supabase Database và đăng nhập email không cần mật khẩu.

## Chức năng

- Quản lý việc gấp – quan trọng.
- Quản lý việc quan trọng – chưa gấp.
- Quản lý công việc thường xuyên.
- Theo dõi các ca bệnh trong ngày.
- Quản lý trọng tâm trong tuần.
- Tạo, hoàn thành, kéo thả và xoá công việc.
- Xuất báo cáo công việc ngày thành PDF bằng chức năng in của trình duyệt.
- Đồng bộ dữ liệu nhanh giữa máy tính và điện thoại qua Supabase.
- Đăng nhập bảo mật bằng đường dẫn gửi qua email.
- Có sẵn dữ liệu giả lập để trình diễn.

## Chạy trên máy tính

Yêu cầu Node.js 20.9 trở lên.

```bash
npm install
npm run dev
```

Mở `http://localhost:3000` trên trình duyệt.

## 1. Chuẩn bị Supabase

Mở **SQL Editor** của Supabase, sao chép toàn bộ file `supabase-schema.sql` và nhấn **Run**.

Trong **Authentication → URL Configuration**:

- `Site URL`: nhập domain Vercel chính thức.
- `Redirect URLs`: thêm domain Vercel chính thức và `http://localhost:3000`.

## 2. Đưa lên GitHub

1. Tạo repository mới trên GitHub.
2. Giải nén mã nguồn này.
3. Mở Terminal tại thư mục dự án.
4. Chạy các lệnh:

```bash
git init
git add .
git commit -m "Initial PKC task manager"
git branch -M main
git remote add origin URL_REPOSITORY_GITHUB
git push -u origin main
```

## 3. Triển khai trên Vercel

1. Đăng nhập Vercel.
2. Chọn **Add New Project**.
3. Import repository GitHub vừa tạo.
4. Trong **Environment Variables**, thêm `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` theo file `.env.example`.
5. Xóa biến `GOOGLE_SCRIPT_URL` cũ nếu có.
6. Giữ nguyên cấu hình Next.js mặc định và chọn **Deploy**.

## Lưu ý về dữ liệu

Website kết nối trực tiếp với Supabase và được bảo vệ bằng Row Level Security. Mỗi tài khoản chỉ đọc và cập nhật công việc của chính mình. Giao diện cập nhật tức thời rồi đồng bộ phía sau nên phản hồi nhanh hơn Apps Script.
