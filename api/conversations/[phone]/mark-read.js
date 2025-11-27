/**
 * Vercel Serverless Function for Marking Conversation as Read
 * 
 * PATCH /api/conversations/:phone/mark-read
 * 
 * Marks all messages in a conversation as read by updating last_read_at timestamp
 */

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get phone number from URL parameter
    const { phone } = req.query

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' })
    }

    // Get user ID from request body
    // In production, you should get this from authentication token
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required in request body' })
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Update or insert conversation with current timestamp
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('conversations')
      .upsert(
        {
          user_id: userId,
          phone_number: phone,
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
      return res.status(500).json({ error: error.message || 'Failed to update conversation' })
    }

    return res.status(200).json({
      success: true,
      phone_number: phone,
      last_read_at: data.last_read_at,
    })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

