import { supabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'

export const createDefaultAdmin = async () => {
  try {
    // Check if admin user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'admin')
      .maybeSingle()

    if (existingUser) {
      console.log('Admin user already exists')
      return
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Insert the default admin user
    const { error } = await supabase
      .from('users')
      .insert([{
        username: 'admin',
        password: hashedPassword,
        role: 'super_admin'
      }])

    if (error) {
      console.error('Error creating default admin:', error)
    } else {
      console.log('Default admin user created successfully')
    }
  } catch (error) {
    console.error('Error in createDefaultAdmin:', error)
  }
}