# PKC Task Manager

Website quản lý công việc hằng ngày dành cho Bác sĩ – Leader Trang tại PKC Pet Center.

## Chức năng

- Quản lý việc gấp – quan trọng.
- Quản lý việc quan trọng – chưa gấp.
- Quản lý công việc thường xuyên.
- Theo dõi các ca bệnh trong ngày.
- Quản lý trọng tâm trong tuần.
- Tạo, hoàn thành, kéo thả và xoá công việc.
- Xuất báo cáo công việc ngày thành PDF bằng chức năng in của trình duyệt.
- Có sẵn dữ liệu giả lập để trình diễn.

## Chạy trên máy tính

Yêu cầu Node.js 20.9 trở lên.

```bash
npm install
npm run dev
```

Mở `http://localhost:3000` trên trình duyệt.

## Đưa lên GitHub

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

## Triển khai trên Vercel

1. Đăng nhập Vercel.
2. Chọn **Add New Project**.
3. Import repository GitHub vừa tạo.
4. Giữ nguyên cấu hình Next.js mặc định.
5. Chọn **Deploy**.

## Lưu ý về dữ liệu

Phiên bản hiện tại lưu dữ liệu bằng `localStorage`, vì vậy dữ liệu chỉ tồn tại trên từng trình duyệt. Google Sheet đã chuẩn bị riêng nhưng chưa được kết nối. Khi có URL Apps Script API, thay lớp lưu dữ liệu trình duyệt bằng API để máy tính và điện thoại dùng chung dữ liệu.
