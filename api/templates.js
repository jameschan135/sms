/**
 * Vercel Serverless Function for Templates API
 * 
 * This API handles GET (read) and POST (write) requests for templates
 * 
 * For Vercel deployment, place this in the api/ folder at the root of your project
 * 
 * Note: For production, you should use a database like Vercel KV, MongoDB, or PostgreSQL
 * This example uses file system (not recommended for production due to read-only limitation)
 * 
 * Setup Vercel KV or external database for production use:
 * 1. Install @vercel/kv: npm install @vercel/kv
 * 2. Set up Vercel KV in your Vercel dashboard
 * 3. Update this file to use KV instead of file system
 */

// For now, we'll return an error suggesting to use localStorage/file JSON
// When you're ready to use Vercel KV or database, update this function

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
      // For production, fetch from Vercel KV or database
      // Example with Vercel KV:
      /*
      import { kv } from '@vercel/kv'
      const templates = await kv.get('templates') || []
      res.status(200).json(templates)
      */
      
      // For now, return empty array (client will use localStorage/file JSON)
      res.status(200).json([])
    } else if (req.method === 'POST') {
      // POST /api/templates - Save templates
      const templates = req.body

      if (!Array.isArray(templates)) {
        return res.status(400).json({ error: 'Templates must be an array' })
      }

      // For production, save to Vercel KV or database
      // Example with Vercel KV:
      /*
      import { kv } from '@vercel/kv'
      await kv.set('templates', templates)
      res.status(200).json({ success: true, count: templates.length })
      */

      // For now, return success (but templates are saved in localStorage on client)
      res.status(200).json({ success: true, count: templates.length })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

