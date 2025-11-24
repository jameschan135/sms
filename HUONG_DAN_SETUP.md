# Hướng Dẫn Setup Dự Án Twilio SMS Web

Hướng dẫn chi tiết từ đầu để setup và deploy dự án Twilio SMS Web lên GitHub, Vercel và cấu hình Supabase database.

---

## 📋 Mục Lục

1. [Chuẩn Bị Môi Trường](#1-chuẩn-bị-môi-trường)
2. [Setup GitHub Repository](#2-setup-github-repository)
3. [Deploy Lên Vercel](#3-deploy-lên-vercel)
4. [Setup Supabase Database](#4-setup-supabase-database)
5. [Cấu Hình Environment Variables](#5-cấu-hình-environment-variables)
6. [Test và Kiểm Tra](#6-test-và-kiểm-tra)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Chuẩn Bị Môi Trường

### 1.1. Cài Đặt Node.js

1. Tải và cài đặt Node.js từ [nodejs.org](https://nodejs.org/)
   - Khuyến nghị: Node.js version 18.x hoặc cao hơn
   - Kiểm tra: `node --version`

2. Cài đặt npm (đi kèm với Node.js)
   - Kiểm tra: `npm --version`

### 1.2. Cài Đặt Git

1. Tải và cài đặt Git từ [git-scm.com](https://git-scm.com/)
2. Cấu hình Git (nếu chưa có):
   ```bash
   git config --global user.name "Tên của bạn"
   git config --global user.email "email@example.com"
   ```

### 1.3. Cài Đặt Dependencies

1. Mở terminal/command prompt trong thư mục dự án
2. Chạy lệnh:
   ```bash
   npm install
   ```

3. Đợi quá trình cài đặt hoàn tất

---

## 2. Setup GitHub Repository

### 2.1. Tạo Repository Trên GitHub

1. Đăng nhập vào [GitHub](https://github.com)
2. Click nút **"New"** hoặc **"+"** > **"New repository"**
3. Điền thông tin:
   - **Repository name**: `twilio-sms-web` (hoặc tên bạn muốn)
   - **Description**: "Twilio SMS Web Application"
   - **Visibility**: Chọn Public hoặc Private
   - **Không** tích vào "Initialize with README" (nếu đã có code)
4. Click **"Create repository"**

### 2.2. Push Code Lên GitHub

1. Mở terminal trong thư mục dự án

2. Kiểm tra trạng thái Git:
   ```bash
   git status
   ```

3. Thêm tất cả files vào staging:
   ```bash
   git add .
   ```

4. Commit code:
   ```bash
   git commit -m "Initial commit: Twilio SMS Web application"
   ```

5. Thêm remote repository (thay `YOUR_USERNAME` và `YOUR_REPO_NAME`):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   ```

6. Push code lên GitHub:
   ```bash
   git branch -M main
   git push -u origin main
   ```

7. Nếu được yêu cầu đăng nhập, sử dụng GitHub Personal Access Token

### 2.3. Tạo .gitignore (Nếu Chưa Có)

Đảm bảo file `.gitignore` có các nội dung sau:

```
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env-prod
.env.development

# Build output
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

---

## 3. Deploy Lên Vercel

### 3.1. Tạo Tài Khoản Vercel

1. Truy cập [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Chọn **"Continue with GitHub"** để đăng nhập bằng GitHub account
4. Authorize Vercel truy cập vào GitHub repositories

### 3.2. Import Project Vào Vercel

1. Trong Vercel Dashboard, click **"Add New..."** > **"Project"**
2. Tìm và chọn repository `twilio-sms-web` vừa tạo trên GitHub
3. Click **"Import"**

### 3.3. Cấu Hình Build Settings

Vercel sẽ tự động detect cấu hình từ `package.json` và `vercel.json`:

- **Framework Preset**: Vite
- **Root Directory**: `./` (mặc định)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**Lưu ý**: Nếu không tự động detect, cấu hình thủ công:
- Build Command: `npm run build`
- Output Directory: `dist`

### 3.4. Cấu Hình Environment Variables (Tạm Thời)

**Bước này sẽ hoàn thiện sau khi setup Supabase**, nhưng bạn có thể thêm các biến sau:

1. Trong màn hình **"Configure Project"**, scroll xuống **"Environment Variables"**
2. Thêm các biến (sẽ cập nhật sau khi có Supabase):
   - `VITE_SUPABASE_URL` (để trống tạm thời)
   - `VITE_SUPABASE_ANON_KEY` (để trống tạm thời)

3. Click **"Deploy"**

### 3.5. Đợi Deploy Hoàn Tất

1. Vercel sẽ tự động build và deploy project
2. Quá trình mất khoảng 2-5 phút
3. Khi hoàn tất, bạn sẽ nhận được URL: `https://your-project-name.vercel.app`

### 3.6. Kiểm Tra Deployment

1. Click vào URL được cung cấp
2. Kiểm tra xem ứng dụng có chạy không
3. Nếu có lỗi, xem logs trong Vercel Dashboard > **Deployments** > Click vào deployment > **"View Function Logs"**

---

## 4. Setup Supabase Database

### 4.1. Tạo Supabase Project

1. Truy cập [supabase.com](https://supabase.com)
2. Click **"Start your project"** hoặc **"Sign In"** nếu đã có tài khoản
3. Đăng nhập/Đăng ký bằng GitHub hoặc Email
4. Click **"New Project"**

### 4.2. Cấu Hình Project

1. Điền thông tin:
   - **Name**: `twilio-sms-web` (hoặc tên bạn muốn)
   - **Database Password**: Tạo password mạnh (⚠️ **Lưu lại password này**)
   - **Region**: Chọn region gần nhất (ví dụ: `Southeast Asia (Singapore)`)
   - **Pricing Plan**: Chọn Free tier (nếu mới bắt đầu)

2. Click **"Create new project"**
3. Đợi project được tạo (khoảng 2-3 phút)

### 4.3. Lấy Supabase Credentials

1. Trong Supabase Dashboard, vào **Settings** (biểu tượng bánh răng) > **API**
2. Copy các thông tin sau:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
     - Đây là `VITE_SUPABASE_URL`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - Đây là `VITE_SUPABASE_ANON_KEY`

3. **Lưu lại** các thông tin này để sử dụng ở bước sau

### 4.4. Tạo Database Tables

1. Vào **SQL Editor** trong Supabase Dashboard (menu bên trái)

2. **Migration 1: Tạo bảng users**
   - Click **"New query"**
   - Copy toàn bộ nội dung từ file `supabase/migrations/001_create_users_table.sql`
   - Paste vào SQL Editor
   - Click **"Run"** hoặc nhấn `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - Đợi thông báo "Success. No rows returned"

3. **Migration 2: Tạo bảng user_phone_numbers**
   - Click **"New query"** (tạo query mới)
   - Copy toàn bộ nội dung từ file `supabase/migrations/002_create_user_phone_numbers_table.sql`
   - Paste vào SQL Editor
   - Click **"Run"**
   - Đợi thông báo "Success. No rows returned"

4. **Kiểm tra tables đã được tạo**:
   - Vào **Table Editor** trong menu bên trái
   - Bạn sẽ thấy 2 tables: `users` và `user_phone_numbers`

### 4.5. Cấu Hình Row Level Security (RLS)

**Quan trọng**: Supabase mặc định bật RLS. Để ứng dụng hoạt động, bạn cần disable RLS hoặc tạo policies.

**Option 1: Disable RLS (Cho Development - Không khuyến nghị cho Production)**

1. Vào **SQL Editor**
2. Tạo query mới và chạy:

```sql
-- Disable RLS cho users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS cho user_phone_numbers table
ALTER TABLE user_phone_numbers DISABLE ROW LEVEL SECURITY;
```

**Option 2: Tạo Policies (Khuyến nghị cho Production)**

1. Vào **SQL Editor**
2. Tạo query mới và chạy:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_phone_numbers ENABLE ROW LEVEL SECURITY;

-- Policy cho phép đọc tất cả users
CREATE POLICY "Allow read all users" ON users FOR SELECT USING (true);

-- Policy cho phép insert users
CREATE POLICY "Allow insert users" ON users FOR INSERT WITH CHECK (true);

-- Policy cho phép update users
CREATE POLICY "Allow update users" ON users FOR UPDATE USING (true);

-- Policy cho phép delete users
CREATE POLICY "Allow delete users" ON users FOR DELETE USING (true);

-- Policies cho user_phone_numbers
CREATE POLICY "Allow read all user_phone_numbers" ON user_phone_numbers FOR SELECT USING (true);
CREATE POLICY "Allow insert user_phone_numbers" ON user_phone_numbers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update user_phone_numbers" ON user_phone_numbers FOR UPDATE USING (true);
CREATE POLICY "Allow delete user_phone_numbers" ON user_phone_numbers FOR DELETE USING (true);
```

### 4.6. Kiểm Tra Dữ Liệu Mẫu

1. Vào **Table Editor** > **users**
2. Bạn sẽ thấy 2 users mặc định:
   - `admin` / `*****` (role: admin)
   - `user1` / `*****` (role: user)

---

## 5. Cấu Hình Environment Variables

### 5.1. Cấu Hình Local Development

1. Tạo file `.env` trong thư mục root của project (cùng cấp với `package.json`)

2. Thêm nội dung sau:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Twilio Configuration (Optional - for auto sign-in)
VITE_AUTHENTICATION_ACCOUNT_SID=
VITE_AUTHENTICATION_API_KEY=
VITE_AUTHENTICATION_API_SECRET=

# Other (Optional)
VITE_GOOGLE_TAG_MANAGER_ID=
VITE_TERMS_AND_CONDITIONS_URL=
VITE_GITHUB_URL=
```

3. Thay thế:
   - `VITE_SUPABASE_URL`: Với Project URL từ Supabase
   - `VITE_SUPABASE_ANON_KEY`: Với anon public key từ Supabase

4. **⚠️ Quan trọng**: Không commit file `.env` lên GitHub (đã có trong `.gitignore`)

### 5.2. Cấu Hình Vercel Environment Variables

1. Vào Vercel Dashboard > Chọn project `twilio-sms-web`
2. Vào **Settings** > **Environment Variables**
3. Thêm các biến sau:

   **Production:**
   - `VITE_SUPABASE_URL` = `https://xxxxxxxxxxxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

   **Preview:** (Tùy chọn - nếu muốn dùng cho preview deployments)
   - `VITE_SUPABASE_URL` = `https://xxxxxxxxxxxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

   **Development:** (Tùy chọn)
   - `VITE_SUPABASE_URL` = `https://xxxxxxxxxxxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. Click **"Save"** sau mỗi biến

5. **Redeploy** project:
   - Vào **Deployments** tab
   - Click **"..."** (3 chấm) trên deployment mới nhất
   - Chọn **"Redeploy"**
   - Đợi deployment hoàn tất

---

## 6. Test và Kiểm Tra

### 6.1. Test Local Development

1. Chạy development server:
   ```bash
   npm run dev
   ```

2. Mở browser: `http://localhost:3000`

3. Test đăng nhập:
   - Username: `admin`
   - Password: `admin123`

4. Kiểm tra:
   - ✅ Đăng nhập thành công
   - ✅ Dashboard hiển thị
   - ✅ Admin page có thể truy cập (nếu là admin)
   - ✅ Có thể xem danh sách users từ Supabase

### 6.2. Test Production (Vercel)

1. Truy cập URL Vercel: `https://your-project-name.vercel.app`

2. Test đăng nhập:
   - Username: `admin`
   - Password: `admin123`

3. Kiểm tra:
   - ✅ Ứng dụng load được
   - ✅ Đăng nhập thành công
   - ✅ Kết nối Supabase hoạt động
   - ✅ Có thể xem users từ database

### 6.3. Test Twilio Integration

1. Đăng nhập vào ứng dụng
2. Vào **Authentication** page
3. Cấu hình Twilio credentials:
   - **Account SID**: Từ Twilio Console
   - **Auth Token**: Từ Twilio Console
   - Hoặc sử dụng API Key/Secret

4. Kiểm tra:
   - ✅ Authentication thành công
   - ✅ Có thể xem danh sách phone numbers
   - ✅ Có thể gửi/nhận SMS

---

## 7. Troubleshooting

### 7.1. Lỗi Build trên Vercel

**Lỗi**: Build failed

**Giải pháp**:
1. Kiểm tra logs trong Vercel Dashboard > Deployments
2. Đảm bảo `package.json` có đầy đủ dependencies
3. Kiểm tra `vercel.json` cấu hình đúng
4. Đảm bảo Node.js version phù hợp (thêm vào `package.json`):
   ```json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

### 7.2. Lỗi Kết Nối Supabase

**Lỗi**: "Failed to fetch" hoặc CORS error

**Giải pháp**:
1. Kiểm tra `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` đúng chưa
2. Kiểm tra RLS policies đã được cấu hình
3. Kiểm tra Supabase project đang active (không bị pause)
4. Kiểm tra Network tab trong browser DevTools để xem lỗi chi tiết

### 7.3. Lỗi Database Tables Không Tồn Tại

**Lỗi**: "relation 'users' does not exist"

**Giải pháp**:
1. Vào Supabase SQL Editor
2. Chạy lại các migration files
3. Kiểm tra Table Editor xem tables đã được tạo chưa

### 7.4. Lỗi Permission Denied

**Lỗi**: "permission denied for table users"

**Giải pháp**:
1. Disable RLS hoặc tạo policies phù hợp (xem bước 4.5)
2. Kiểm tra anon key có đúng không
3. Kiểm tra Supabase project settings

### 7.5. Environment Variables Không Hoạt Động

**Lỗi**: Environment variables không được load

**Giải pháp**:
1. Đảm bảo tên biến bắt đầu với `VITE_` (cho Vite projects)
2. Redeploy project sau khi thêm environment variables
3. Kiểm tra trong Vercel Dashboard > Settings > Environment Variables
4. Clear browser cache và hard refresh (Ctrl+Shift+R)

### 7.6. Lỗi Authentication

**Lỗi**: Không thể đăng nhập

**Giải pháp**:
1. Kiểm tra users đã được tạo trong Supabase (Table Editor)
2. Kiểm tra password đúng (mặc định: `admin123` cho admin)
3. Kiểm tra console trong browser DevTools để xem lỗi chi tiết
4. Kiểm tra kết nối Supabase hoạt động

---

## 8. Next Steps

Sau khi setup xong, bạn có thể:

1. **Tùy chỉnh users**: Thêm/sửa/xóa users trong Supabase Table Editor
2. **Phân bổ số điện thoại**: Vào Admin page và assign số điện thoại cho từng user
3. **Cấu hình Twilio**: Mỗi user cần cấu hình Twilio credentials riêng
4. **Bảo mật**: 
   - Hash passwords (sử dụng bcrypt)
   - Bật RLS và tạo policies phù hợp
   - Sử dụng Supabase Auth thay vì custom authentication
5. **Thêm tính năng**: 
   - Templates management với database
   - Messages history với database
   - Analytics và reporting

---

## 9. Tài Liệu Tham Khảo

- **Vite Documentation**: https://vitejs.dev/
- **React Documentation**: https://react.dev/
- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Twilio Documentation**: https://www.twilio.com/docs
- **Project README**: Xem file `README.md`
- **Supabase Setup Guide**: Xem file `SUPABASE_SETUP.md`
- **Vercel Deploy Guide**: Xem file `DEPLOY_VERCEL.md`

---

## 10. Checklist Hoàn Thành

- [ ] Đã cài đặt Node.js và Git
- [ ] Đã tạo GitHub repository và push code
- [ ] Đã deploy lên Vercel thành công
- [ ] Đã tạo Supabase project
- [ ] Đã chạy database migrations
- [ ] Đã cấu hình RLS policies
- [ ] Đã thêm environment variables vào Vercel
- [ ] Đã test local development
- [ ] Đã test production deployment
- [ ] Đã test đăng nhập và kết nối Supabase
- [ ] Đã cấu hình Twilio credentials

---

**Chúc bạn setup thành công! 🎉**

Nếu gặp vấn đề, hãy xem phần Troubleshooting hoặc kiểm tra logs trong Vercel Dashboard và Supabase Dashboard.

