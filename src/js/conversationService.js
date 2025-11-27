/**
 * Conversation Service - Quản lý read/unread status của conversations
 */

import { supabase } from '../lib/supabase'

/**
 * Mark conversation as read
 * @param {string} userId - User ID
 * @param {string} phoneNumber - Phone number của conversation partner
 * @returns {Promise<{success: boolean, last_read_at: string}>}
 */
export const markConversationAsRead = async (userId, phoneNumber) => {
  try {
    if (!userId || !phoneNumber) {
      throw new Error('User ID and phone number are required')
    }

    console.log('Calling mark-read API:', { userId, phoneNumber })
    
    // Try API endpoint first (for production/Vercel)
    const url = `/api/conversations/${encodeURIComponent(phoneNumber)}/mark-read`
    console.log('API URL:', url)
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      console.log('API Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('API Success response:', data)
        return data
      }

      // If 404, fallback to direct Supabase call
      if (response.status === 404) {
        console.warn('API endpoint not found (404), falling back to direct Supabase call')
        return await markConversationAsReadDirect(userId, phoneNumber)
      }

      // Other errors
      const errorData = await response.json().catch(() => ({ error: 'Failed to mark as read' }))
      console.error('API Error response:', errorData)
      throw new Error(errorData.error || `Failed to mark conversation as read (${response.status})`)
    } catch (fetchError) {
      // Network error or API not available, fallback to direct Supabase
      console.warn('API call failed, falling back to direct Supabase call:', fetchError.message)
      return await markConversationAsReadDirect(userId, phoneNumber)
    }
  } catch (error) {
    console.error('Error marking conversation as read:', error)
    throw error
  }
}

/**
 * Mark conversation as read directly via Supabase (fallback when API is not available)
 * @param {string} userId - User ID
 * @param {string} phoneNumber - Phone number của conversation partner
 * @returns {Promise<{success: boolean, last_read_at: string}>}
 */
const markConversationAsReadDirect = async (userId, phoneNumber) => {
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('conversations')
    .upsert(
      {
        user_id: userId,
        phone_number: phoneNumber,
        last_read_at: now,
        updated_at: now,
      },
      {
        onConflict: 'user_id,phone_number',
      }
    )
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    throw new Error(error.message || 'Failed to update conversation')
  }

  return {
    success: true,
    phone_number: phoneNumber,
    last_read_at: data.last_read_at,
  }
}

/**
 * Get last read timestamp for a conversation
 * @param {string} userId - User ID
 * @param {string} phoneNumber - Phone number của conversation partner
 * @returns {Promise<string|null>} - last_read_at timestamp or null
 */
export const getLastReadAt = async (userId, phoneNumber) => {
  try {
    if (!userId || !phoneNumber) {
      return null
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('last_read_at')
      .eq('user_id', userId)
      .eq('phone_number', phoneNumber)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - conversation chưa được mark as read
        return null
      }
      console.error('Error getting last read at:', error)
      return null
    }

    return data?.last_read_at || null
  } catch (error) {
    console.error('Error in getLastReadAt:', error)
    return null
  }
}

/**
 * Get all conversations with last_read_at for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array<{phone_number: string, last_read_at: string}>>}
 */
export const getUserConversations = async (userId) => {
  try {
    if (!userId) {
      return []
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('phone_number, last_read_at')
      .eq('user_id', userId)

    if (error) {
      console.error('Error getting user conversations:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserConversations:', error)
    return []
  }
}

