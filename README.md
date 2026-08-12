# PKC Task Manager · Supabase + ChatGPT MCP

Website quản lý công việc dành cho **Bác sĩ – Leader Trang** tại PKC Pet Center. Website không yêu cầu đăng nhập, đồng bộ dữ liệu bằng Supabase và có MCP server để ChatGPT đọc/điều khiển công việc.

## Chức năng

- Quản lý việc gấp, việc quan trọng, việc thường xuyên, trọng tâm tuần và ca bệnh cần theo dõi.
- Tạo, hoàn thành, kéo thả, xoá/lưu trữ công việc.
- Xuất báo cáo ngày thành PDF.
- Đồng bộ máy tính và điện thoại qua Supabase.
- MCP tại `/api/mcp` cho phép ChatGPT xem, tạo, sửa, hoàn thành, di chuyển và lưu trữ công việc.

## 1. Supabase

Nếu chưa chạy schema, mở **Supabase → SQL Editor**, sao chép toàn bộ `supabase-schema.sql` và nhấn **Run**. Script giữ lại dữ liệu đang có.

Lấy Secret key tại **Supabase → Project Settings → API Keys → Secret keys**. Không gửi key này qua chat và không đưa vào GitHub.

## 2. Chạy trên máy tính

Yêu cầu Node.js 20.9 trở lên.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Điền `SUPABASE_SECRET_KEY` và `PKC_MCP_TOKEN` vào `.env.local`, rồi mở `http://localhost:3000`.

## 3. Đưa lên GitHub và Vercel

Đưa toàn bộ nội dung thư mục lên repository, bảo đảm `package.json` ở thư mục gốc.

Trong **Vercel → Project → Settings → Environment Variables**, thêm đủ bốn biến:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
PKC_MCP_TOKEN
```

Sau đó **Redeploy**. Không đặt tiền tố `NEXT_PUBLIC_` cho secret key hoặc MCP token.

## 4. Kết nối ChatGPT

Sau khi Vercel chạy thành công, MCP endpoint là:

```text
https://TEN-MIEN-VERCEL-CUA-BAN.vercel.app/api/mcp
```

- Nếu giao diện tạo app hỗ trợ **Bearer token**, dùng endpoint trên và nhập giá trị `PKC_MCP_TOKEN` làm token.
- Nếu chỉ có **No authentication**, dùng URL `https://TEN-MIEN-VERCEL-CUA-BAN.vercel.app/api/mcp?token=GIA-TRI-PKC_MCP_TOKEN`.
- Vào **ChatGPT → Settings → Apps → Advanced settings**, bật Developer mode; sau đó **Apps → Create**, nhập endpoint và chọn **Scan tools**.

Các câu lệnh mẫu:

- “Liệt kê các việc gấp chưa hoàn thành hôm nay.”
- “Tạo ca bệnh cần theo dõi: Mèo Bông, kiểm tra nhiệt độ lúc 15:00.”
- “Đánh dấu công việc kiểm tra lịch trực là hoàn thành.”
- “Tóm tắt tiến độ công việc hôm nay.”

## Lưu ý bảo mật

MCP endpoint được bảo vệ bằng `PKC_MCP_TOKEN`, nhưng website hiện không có đăng nhập. Bất kỳ ai có đường dẫn website vẫn có thể xem và thay đổi dữ liệu. Chỉ chia sẻ đường dẫn trong nội bộ và không lưu thông tin y tế nhạy cảm có thể nhận diện chủ nuôi.
