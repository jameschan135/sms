/**
 * Example: Templates API using Vercel KV
 * 
 * To use this:
 * 1. Install @vercel/kv: npm install @vercel/kv
 * 2. Set up Vercel KV in your Vercel dashboard (https://vercel.com/dashboard)
 * 3. Add environment variables:
 *    - KV_URL
 *    - KV_REST_API_URL
 *    - KV_REST_API_TOKEN
 *    - KV_REST_API_READ_ONLY_TOKEN
 * 4. Rename this file to templates.js and replace the existing one
 * 5. Update templateService.js: isApiAvailable() to return true
 */

import { kv } from '@vercel/kv'

const TEMPLATES_KEY = 'twilio_sms_templates'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    if (req.method === 'GET') {
      // GET /api/templates - Read all templates
      const templates = await kv.get(TEMPLATES_KEY) || []
      res.status(200).json(templates)
    } else if (req.method === 'POST') {
      // POST /api/templates - Save templates
      const templates = req.body

      if (!Array.isArray(templates)) {
        return res.status(400).json({ error: 'Templates must be an array' })
      }

      // Save to Vercel KV
      await kv.set(TEMPLATES_KEY, templates)
      
      res.status(200).json({ 
        success: true, 
        count: templates.length,
        message: 'Templates saved successfully'
      })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

