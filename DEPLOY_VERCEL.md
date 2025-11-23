# Hướng dẫn Deploy lên Vercel

## Bước 1: Chuẩn bị

1. Đảm bảo bạn đã có tài khoản Vercel: https://vercel.com
2. Cài đặt Vercel CLI (nếu muốn deploy từ command line):
   ```bash
   npm i -g vercel
   ```

## Bước 2: Cấu hình Build

Project đã được cấu hình với:
- `vercel.json` - Cấu hình routing cho Vercel
- `api/` folder - Chứa serverless functions
- `public/templates.json` - File JSON mặc định

## Bước 3: Deploy cơ bản (không dùng database)

1. **Deploy lên Vercel:**
   - Option 1: Vercel Dashboard
     - Push code lên GitHub
     - Import project vào Vercel dashboard
     - Deploy tự động
   
   - Option 2: Vercel CLI
     ```bash
     vercel
     ```

2. **Hiện tại templates sẽ lưu trong localStorage của browser** (mỗi user có data riêng)

3. **Để enable API routes:**
   - Mở `src/js/templateService.js`
   - Tìm function `isApiAvailable()` 
   - Đổi `return false` thành `return true` (khi bạn đã setup database)

## Bước 4: Setup Database (Tùy chọn - Khuyến nghị cho Production)

### Option A: Sử dụng Vercel KV (Redis)

1. **Install KV package:**
   ```bash
   npm install @vercel/kv
   ```

2. **Setup Vercel KV:**
   - Vào Vercel Dashboard > Your Project > Storage
   - Tạo KV Database mới
   - Copy các environment variables:
     - `KV_URL`
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN`

3. **Cập nhật API route:**
   - Rename `api/templates-kv.example.js` thành `api/templates.js`
   - Thay thế file cũ

4. **Enable API:**
   - Mở `src/js/templateService.js`
   - Đổi `isApiAvailable()` thành `return true`

### Option B: Sử dụng Supabase/MongoDB/PostgreSQL

Tạo file `api/templates.js` mới và kết nối với database của bạn.

## Bước 5: Environment Variables

Thêm vào Vercel Dashboard > Settings > Environment Variables:

- Nếu dùng Vercel KV: các biến KV_* (tự động thêm khi tạo KV)
- Nếu cần: Thêm các biến khác từ `.env`

## Lưu ý

1. **Static Files (templates.json, users.json):**
   - Files trong `public/` sẽ được serve static
   - Chỉ có thể đọc, không thể ghi trực tiếp từ client
   - Sử dụng API routes để ghi dữ liệu

2. **localStorage:**
   - Hiện tại vẫn hoạt động như backup/cache
   - Mỗi user sẽ có data riêng trong browser của họ

3. **Export/Import:**
   - Chức năng export/import vẫn hoạt động bình thường
   - Users có thể export templates và import lại

## Production Best Practices

1. ✅ Sử dụng database thay vì localStorage
2. ✅ Thêm authentication cho API routes
3. ✅ Validate data trước khi save
4. ✅ Add rate limiting
5. ✅ Backup data định kỳ

## Troubleshooting

### API không hoạt động:
- Kiểm tra `isApiAvailable()` trong `templateService.js`
- Kiểm tra API routes trong Vercel dashboard > Functions
- Xem logs trong Vercel dashboard > Deployments

### Templates không load:
- Kiểm tra console trong browser
- Kiểm tra Network tab trong DevTools
- Kiểm tra localStorage có data không

