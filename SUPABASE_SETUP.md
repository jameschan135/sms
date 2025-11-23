# Hướng Dẫn Setup Supabase cho Twilio SMS Web

## Bước 1: Tạo Supabase Project

1. Truy cập [https://supabase.com](https://supabase.com)
2. Đăng ký/Đăng nhập tài khoản
3. Click "New Project"
4. Điền thông tin:
   - **Name**: twilio-sms-web (hoặc tên bạn muốn)
   - **Database Password**: Tạo password mạnh (lưu lại)
   - **Region**: Chọn region gần nhất
5. Click "Create new project" và đợi project được tạo (khoảng 2 phút)

## Bước 2: Lấy Supabase Credentials

1. Vào **Settings** > **API**
2. Copy các thông tin sau:
   - **Project URL** (VITE_SUPABASE_URL)
   - **anon/public key** (VITE_SUPABASE_ANON_KEY)

## Bước 3: Tạo Database Tables

1. Vào **SQL Editor** trong Supabase Dashboard
2. Chạy các SQL migrations theo thứ tự:

### Migration 1: Tạo bảng users

Tạo file mới và chạy SQL migration:

```sql
-- File: supabase/migrations/001_create_users_table.sql
-- Copy nội dung từ file này và chạy trong SQL Editor
```

Hoặc chạy trực tiếp:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default users
INSERT INTO users (username, password, role, name) 
VALUES 
  ('admin', 'admin123', 'admin', 'Administrator'),
  ('user1', 'user123', 'user', 'User One')
ON CONFLICT (username) DO NOTHING;
```

3. Click "Run" để thực thi SQL

### Migration 2: Tạo bảng user_phone_numbers (Phân bổ số điện thoại cho users)

Tạo file mới và chạy SQL migration:

```sql
-- File: supabase/migrations/002_create_user_phone_numbers_table.sql
-- Copy nội dung từ file này và chạy trong SQL Editor
```

Hoặc chạy trực tiếp:

```sql
-- Create user_phone_numbers table to assign phone numbers to users
CREATE TABLE IF NOT EXISTS user_phone_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, phone_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_user_id ON user_phone_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_phone_number ON user_phone_numbers(phone_number);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_phone_numbers_updated_at 
  BEFORE UPDATE ON user_phone_numbers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

4. Click "Run" để thực thi SQL

## Bước 4: Cấu Hình Row Level Security (RLS)

**Quan trọng**: Supabase mặc định bật RLS. Bạn cần cấu hình để cho phép đọc/ghi:

1. Vào **Authentication** > **Policies**
2. Hoặc chạy SQL sau trong SQL Editor:

```sql
-- Disable RLS cho users table (cho phép public access)
-- LƯU Ý: Trong production, nên bật RLS và tạo policies phù hợp
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS cho user_phone_numbers table
ALTER TABLE user_phone_numbers DISABLE ROW LEVEL SECURITY;

-- Hoặc nếu muốn bật RLS, tạo policies:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_phone_numbers ENABLE ROW LEVEL SECURITY;

-- Policy cho phép đọc tất cả users (cho admin page)
-- CREATE POLICY "Allow read all users" ON users FOR SELECT USING (true);

-- Policy cho phép insert (cho admin tạo user)
-- CREATE POLICY "Allow insert users" ON users FOR INSERT WITH CHECK (true);

-- Policy cho phép update (cho admin update user)
-- CREATE POLICY "Allow update users" ON users FOR UPDATE USING (true);

-- Policy cho phép delete (cho admin xóa user)
-- CREATE POLICY "Allow delete users" ON users FOR DELETE USING (true);

-- Policies cho user_phone_numbers (tương tự)
-- CREATE POLICY "Allow read all user_phone_numbers" ON user_phone_numbers FOR SELECT USING (true);
-- CREATE POLICY "Allow insert user_phone_numbers" ON user_phone_numbers FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow update user_phone_numbers" ON user_phone_numbers FOR UPDATE USING (true);
-- CREATE POLICY "Allow delete user_phone_numbers" ON user_phone_numbers FOR DELETE USING (true);
```

## Bước 5: Cấu Hình Environment Variables

1. Tạo file `.env` trong root project:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Thay thế với giá trị thực từ Supabase Dashboard

## Bước 6: Cấu Hình Vercel (Nếu deploy)

1. Vào Vercel Dashboard > Project Settings > Environment Variables
2. Thêm các biến:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Redeploy project

## Bước 7: Test

1. Chạy `npm install` để cài đặt dependencies
2. Chạy `npm run dev`
3. Đăng nhập với:
   - Username: `admin`
   - Password: `admin123`
4. Kiểm tra Admin page để xem danh sách users từ Supabase

## Lưu Ý Bảo Mật

⚠️ **Quan trọng**: 
- Hiện tại password được lưu plain text (không hash)
- Trong production, nên hash password bằng bcrypt hoặc sử dụng Supabase Auth
- Nên bật RLS và tạo policies phù hợp
- Không commit file `.env` vào git

## Troubleshooting

### Lỗi: "Failed to fetch" hoặc CORS
- Kiểm tra Supabase URL và Anon Key đúng chưa
- Kiểm tra RLS policies

### Lỗi: "relation 'users' does not exist"
- Chạy lại SQL migration trong SQL Editor

### Lỗi: "permission denied"
- Disable RLS hoặc tạo policies phù hợp

## Next Steps

Sau khi setup xong, bạn có thể:
1. **Phân bổ số điện thoại cho users**: Vào Admin page và assign số điện thoại cho từng user
2. Migrate dữ liệu từ localStorage sang Supabase
3. Thêm tính năng hash password
4. Sử dụng Supabase Auth thay vì custom authentication
5. Thêm các tables khác (messages, templates, etc.)

## Tính Năng Phân Bổ Số Điện Thoại

Sau khi setup xong, bạn có thể:
- Vào **Admin page** để phân bổ số điện thoại cho từng user
- Mỗi user chỉ được quản lý 1 số điện thoại
- User chỉ thấy tin nhắn của số điện thoại được phân bổ trong Inbox
- Trong Send page, user chỉ thấy số điện thoại được phân bổ và đã được auto select

