-- Create user_phone_numbers table to assign phone numbers to users
CREATE TABLE IF NOT EXISTS user_phone_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, phone_number)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_user_id ON user_phone_numbers(user_id);

-- Create index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_phone_number ON user_phone_numbers(phone_number);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_phone_numbers_updated_at 
  BEFORE UPDATE ON user_phone_numbers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

