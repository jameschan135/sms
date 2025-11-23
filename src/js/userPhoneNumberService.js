/**
 * User Phone Number Service - Quản lý phân bổ số điện thoại cho users
 */

import { supabase } from '../lib/supabase'

/**
 * Lấy số điện thoại được assign cho user
 * @param {string} userId
 * @returns {Promise<string | null>} Phone number hoặc null nếu chưa được assign
 */
export const getUserPhoneNumber = async (userId) => {
  try {
    if (!userId) return null

    const { data, error } = await supabase
      .from('user_phone_numbers')
      .select('phone_number')
      .eq('user_id', userId)
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user chưa có phone number được assign
        return null
      }
      console.error('Error getting user phone number:', error)
      throw error
    }

    return data?.phone_number || null
  } catch (error) {
    console.error('Error in getUserPhoneNumber:', error)
    return null
  }
}

/**
 * Assign số điện thoại cho user
 * @param {string} userId
 * @param {string} phoneNumber
 * @returns {Promise<boolean>}
 */
export const assignPhoneNumberToUser = async (userId, phoneNumber) => {
  try {
    if (!userId || !phoneNumber) {
      throw new Error('User ID and phone number are required')
    }

    // Xóa phone number cũ của user (nếu có) để đảm bảo mỗi user chỉ có 1 số
    await supabase
      .from('user_phone_numbers')
      .delete()
      .eq('user_id', userId)

    // Thêm phone number mới
    const { error } = await supabase
      .from('user_phone_numbers')
      .insert([{
        user_id: userId,
        phone_number: phoneNumber
      }])

    if (error) {
      console.error('Error assigning phone number to user:', error)
      throw error
    }

    console.log('Assigned phone number', phoneNumber, 'to user', userId)
    return true
  } catch (error) {
    console.error('Error in assignPhoneNumberToUser:', error)
    throw error
  }
}

/**
 * Xóa phone number assignment của user
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export const removePhoneNumberFromUser = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const { error } = await supabase
      .from('user_phone_numbers')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing phone number from user:', error)
      throw error
    }

    console.log('Removed phone number from user', userId)
    return true
  } catch (error) {
    console.error('Error in removePhoneNumberFromUser:', error)
    throw error
  }
}

/**
 * Lấy tất cả user phone number assignments (cho admin)
 * @returns {Promise<Array<{user_id: string, phone_number: string, user: Object}>>}
 */
export const getAllUserPhoneNumbers = async () => {
  try {
    const { data, error } = await supabase
      .from('user_phone_numbers')
      .select(`
        user_id,
        phone_number,
        users (
          id,
          username,
          name,
          role
        )
      `)
      .order('phone_number', { ascending: true })

    if (error) {
      console.error('Error getting all user phone numbers:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllUserPhoneNumbers:', error)
    throw error
  }
}

/**
 * Lấy user ID của phone number (để check xem số nào đã được assign)
 * @param {string} phoneNumber
 * @returns {Promise<string | null>}
 */
export const getUserIdByPhoneNumber = async (phoneNumber) => {
  try {
    if (!phoneNumber) return null

    const { data, error } = await supabase
      .from('user_phone_numbers')
      .select('user_id')
      .eq('phone_number', phoneNumber)
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error getting user ID by phone number:', error)
      throw error
    }

    return data?.user_id || null
  } catch (error) {
    console.error('Error in getUserIdByPhoneNumber:', error)
    return null
  }
}

