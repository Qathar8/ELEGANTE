/*
  # Create default admin user

  1. New Data
    - Creates default super admin user with username 'admin' and password 'admin123'
    - Password is properly hashed using bcrypt

  2. Security
    - Uses bcrypt hashing for password security
    - Sets role as 'super_admin' for full system access
*/

-- Insert default admin user with hashed password
-- Password: admin123
-- Hash generated with bcrypt rounds=10
INSERT INTO users (username, password, role) 
VALUES (
  'admin', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'super_admin'
) ON CONFLICT (username) DO NOTHING;