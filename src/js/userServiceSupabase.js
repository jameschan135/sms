/**
 * User Service - Quản lý users từ Supabase Database
 */

import { supabase } from '../lib/supabase'

const CURRENT_USER_KEY = "twilio_sms_current_user"

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} password - Plain text password (trong production nên hash)
 * @property {string} role - "admin" | "user"
 * @property {string} name
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * Load users từ Supabase
 * @returns {Promise<Array<User>>}
 */
export const loadUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading users from Supabase:', error)
      throw error
    }

    console.log('Loaded users from Supabase:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('Error in loadUsers:', error)
    throw error
  }
}

/**
 * Tìm user theo username
 * @param {string} username
 * @returns {Promise<User | null>}
 */
export const findUserByUsername = async (username) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      console.error('Error finding user by username:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in findUserByUsername:', error)
    return null
  }
}

/**
 * Tìm user theo ID
 * @param {string} userId
 * @returns {Promise<User | null>}
 */
export const findUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error finding user by ID:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in findUserById:', error)
    return null
  }
}

/**
 * Thêm user mới
 * @param {Omit<User, "id" | "created_at" | "updated_at">} userData
 * @returns {Promise<User>}
 */
export const createUser = async (userData) => {
  try {
    // Check if username already exists
    const existingUser = await findUserByUsername(userData.username)
    if (existingUser) {
      throw new Error('Username already exists')
    }

    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      throw error
    }

    console.log('Created user:', data.username)
    return data
  } catch (error) {
    console.error('Error in createUser:', error)
    throw error
  }
}

/**
 * Xóa user theo ID
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export const deleteUser = async (userId) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('Error deleting user:', error)
      throw error
    }

    console.log('Deleted user:', userId)
    return true
  } catch (error) {
    console.error('Error in deleteUser:', error)
    throw error
  }
}

/**
 * Cập nhật user
 * @param {string} userId
 * @param {Partial<User>} updates
 * @returns {Promise<User | null>}
 */
export const updateUser = async (userId, updates) => {
  try {
    // If updating username, check if it's already taken
    if (updates.username) {
      const existingUser = await findUserByUsername(updates.username)
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Username already exists')
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      throw error
    }

    console.log('Updated user:', userId)
    return data
  } catch (error) {
    console.error('Error in updateUser:', error)
    throw error
  }
}

/**
 * Xác thực đăng nhập
 * @param {string} username
 * @param {string} password
 * @returns {Promise<User | null>}
 */
export const authenticateUser = async (username, password) => {
  try {
    console.log('Authenticating user:', username)
    
    const user = await findUserByUsername(username)
    console.log('Found user:', user ? user.username : 'null')
    
    if (user && user.password === password) {
      // Lưu thông tin user hiện tại (không lưu password)
      const { password: _, ...userWithoutPassword } = user
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword))
      console.log('Authentication successful for:', username)
      return userWithoutPassword
    }
    
    console.log('Authentication failed for:', username)
    return null
  } catch (error) {
    console.error('Error in authenticateUser:', error)
    return null
  }
}

/**
 * Lấy user hiện tại đã đăng nhập
 * @returns {User | null}
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem(CURRENT_USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  } catch (e) {
    return null
  }
}

/**
 * Đăng xuất
 */
export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY)
}

/**
 * Kiểm tra user có phải admin không
 * @param {User | null} user
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  return user && user.role === 'admin'
}

/**
 * Export users ra JSON string
 * @returns {Promise<string>}
 */
export const exportUsersToJSON = async () => {
  const users = await loadUsers()
  return JSON.stringify(users, null, 2)
}

/**
 * Import users từ JSON string
 * @param {string} jsonString
 * @returns {Promise<Array<User>>}
 */
export const importUsersFromJSON = async (jsonString) => {
  try {
    const users = JSON.parse(jsonString)
    if (!Array.isArray(users)) {
      throw new Error('Invalid JSON format: expected array')
    }

    // Insert users one by one (handle conflicts)
    const importedUsers = []
    for (const user of users) {
      try {
        // Remove id, created_at, updated_at if present (let DB generate them)
        const { id, created_at, updated_at, ...userData } = user
        const created = await createUser(userData)
        importedUsers.push(created)
      } catch (error) {
        // If user already exists, skip
        if (error.message.includes('already exists')) {
          console.warn(`User ${user.username} already exists, skipping`)
        } else {
          throw error
        }
      }
    }

    return importedUsers
  } catch (e) {
    throw new Error(`Failed to import users: ${e.message}`)
  }
}

