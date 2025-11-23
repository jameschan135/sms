/**
 * Template Service - Quản lý message templates cho từng user
 */

const TEMPLATES_STORAGE_KEY = "twilio_sms_templates"

// Template types
export const TEMPLATE_TYPES = {
  ESTIMATE: "Estimate",
  DELIVERED: "Delivered",
  CANCEL: "Cancel",
  DELAY: "Delay",
  OTHERS: "Others"
}

// Placeholder mappings
export const PLACEHOLDER_MAPPINGS = {
  cusname: "Customer name",
  shopname: "Shop name",
  orderid: "Order id",
  date: "Date",
  productname: "Product Name"
}

/**
 * @typedef {Object} MessageTemplate
 * @property {string} id
 * @property {string} userId
 * @property {string} type - "Estimate" | "Delivered" | "Cancel" | "Delay" | "Others"
 * @property {string} content - Template content với placeholders {cusname}, {shopname}, etc.
 * @property {string} name - Tên template (optional)
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * Check if API routes are available (for Vercel deployment)
 * @returns {boolean}
 */
const isApiAvailable = () => {
  // In production/Vercel, check if API routes exist
  // For now, we'll use localStorage/file JSON as fallback
  return false // Set to true when API is deployed
}

/**
 * Load templates từ API, localStorage, hoặc file JSON
 * @returns {Promise<Array<MessageTemplate>>}
 */
export const loadTemplates = async () => {
  // Try API first (for Vercel deployment)
  if (isApiAvailable()) {
    try {
      const response = await fetch("/api/templates")
      if (response.ok) {
        const templates = await response.json()
        // Sync to localStorage as cache
        localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
        return templates
      }
    } catch (e) {
      console.warn("API not available, falling back to localStorage/JSON:", e)
    }
  }

  // Check localStorage first
  try {
    const storedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY)
    if (storedTemplates) {
      const templates = JSON.parse(storedTemplates)
      console.log("Loaded templates from localStorage:", templates.length)
      return templates
    }
  } catch (e) {
    console.error("Error parsing templates from localStorage:", e)
    localStorage.removeItem(TEMPLATES_STORAGE_KEY)
  }

  // Try to load from JSON file (for initial setup)
  try {
    const basePath = import.meta.env.BASE_URL || "/"
    const pathsToTry = [
      `${basePath}templates.json`.replace("//", "/"),
      "/templates.json",
      "./templates.json",
      "templates.json"
    ]
    
    for (const jsonPath of pathsToTry) {
      try {
        console.log("Trying to load templates from:", jsonPath)
        const response = await fetch(jsonPath)
        if (response.ok) {
          const templates = await response.json()
          console.log("Loaded templates from JSON:", templates.length)
          // Save to localStorage for future use
          localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
          return templates
        } else {
          console.log(`Failed to load from ${jsonPath}, status:`, response.status)
        }
      } catch (fetchError) {
        console.log(`Error fetching ${jsonPath}:`, fetchError.message)
      }
    }
    console.warn("No templates loaded from file")
  } catch (e) {
    console.error("Error loading templates.json:", e)
  }

  // Return empty array if nothing found
  return []
}

/**
 * Lưu templates vào API (if available), localStorage, hoặc trigger download
 * @param {Array<MessageTemplate>} templates
 */
const saveTemplates = async templates => {
  // Try API first (for Vercel deployment)
  if (isApiAvailable()) {
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(templates)
      })
      if (response.ok) {
        // Also save to localStorage as cache
        localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
        return
      }
    } catch (e) {
      console.warn("API save failed, using localStorage:", e)
    }
  }

  // Save to localStorage (fallback)
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
  
  // Note: In production with static hosting, file JSON cannot be written directly
  // Users should use export function to download JSON file
}

/**
 * Lấy templates của user hiện tại
 * @param {string} userId
 * @returns {Promise<Array<MessageTemplate>>}
 */
export const getUserTemplates = async userId => {
  const templates = await loadTemplates()
  return templates.filter(t => t.userId === userId)
}

/**
 * Lấy template theo type của user
 * @param {string} userId
 * @param {string} type
 * @returns {Promise<MessageTemplate | null>}
 */
export const getUserTemplateByType = async (userId, type) => {
  const templates = await getUserTemplates(userId)
  return templates.find(t => t.type === type) || null
}

/**
 * Tạo template mới
 * @param {string} userId
 * @param {Object} templateData
 * @param {string} templateData.type
 * @param {string} templateData.content
 * @param {string} [templateData.name]
 * @returns {Promise<MessageTemplate>}
 */
export const createTemplate = async (userId, templateData) => {
  const templates = await loadTemplates()
  
  // Kiểm tra xem user đã có template với type này chưa
  const existingTemplate = templates.find(
    t => t.userId === userId && t.type === templateData.type
  )
  
  if (existingTemplate) {
    throw new Error(`Template với type "${templateData.type}" đã tồn tại. Vui lòng cập nhật template hiện có.`)
  }
  
  const newTemplate = {
    id: Date.now().toString(),
    userId,
    type: templateData.type,
    content: templateData.content,
    name: templateData.name || `${templateData.type} Template`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  templates.push(newTemplate)
  await saveTemplates(templates)
  return newTemplate
}

/**
 * Cập nhật template
 * @param {string} templateId
 * @param {Object} updates
 * @returns {Promise<MessageTemplate | null>}
 */
export const updateTemplate = async (templateId, updates) => {
  const templates = await loadTemplates()
  const index = templates.findIndex(t => t.id === templateId)
  
  if (index === -1) return null
  
  // Nếu đổi type, kiểm tra xem user đã có template với type mới chưa
  if (updates.type && updates.type !== templates[index].type) {
    const existingTemplate = templates.find(
      t => t.userId === templates[index].userId && 
           t.type === updates.type && 
           t.id !== templateId
    )
    if (existingTemplate) {
      throw new Error(`Template với type "${updates.type}" đã tồn tại.`)
    }
  }
  
  templates[index] = {
    ...templates[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  await saveTemplates(templates)
  return templates[index]
}

/**
 * Xóa template
 * @param {string} templateId
 * @returns {Promise<boolean>}
 */
export const deleteTemplate = async templateId => {
  const templates = await loadTemplates()
  const filteredTemplates = templates.filter(t => t.id !== templateId)
  await saveTemplates(filteredTemplates)
  return true
}

/**
 * Extract placeholders từ template content
 * @param {string} content
 * @returns {Array<string>} - Array of placeholder names (without {})
 */
export const extractPlaceholders = content => {
  const regex = /\{(\w+)\}/g
  const placeholders = []
  let match
  
  while ((match = regex.exec(content)) !== null) {
    if (!placeholders.includes(match[1])) {
      placeholders.push(match[1])
    }
  }
  
  return placeholders
}

/**
 * Replace placeholders trong template với values
 * @param {string} templateContent
 * @param {Object} values - Object với keys là placeholder names (without {})
 * @returns {string}
 */
export const replacePlaceholders = (templateContent, values) => {
  let result = templateContent
  Object.keys(values).forEach(key => {
    const value = values[key] || ""
    const regex = new RegExp(`\\{${key}\\}`, "g")
    result = result.replace(regex, value)
  })
  return result
}

/**
 * Export templates ra JSON string để download
 * @param {string} userId - Optional: chỉ export templates của user này
 * @returns {Promise<string>}
 */
export const exportTemplatesToJSON = async userId => {
  let templates = await loadTemplates()
  if (userId) {
    templates = templates.filter(t => t.userId === userId)
  }
  return JSON.stringify(templates, null, 2)
}

/**
 * Export templates ra file download
 * @param {string} userId - Optional: chỉ export templates của user này
 */
export const downloadTemplates = async userId => {
  try {
    const jsonString = await exportTemplatesToJSON(userId)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = userId ? `templates-${userId}.json` : "templates.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error("Error downloading templates:", e)
    throw new Error(`Failed to download templates: ${e.message}`)
  }
}

/**
 * Import templates từ JSON string
 * @param {string} jsonString
 * @param {boolean} merge - Nếu true, merge với templates hiện có. Nếu false, replace all.
 * @returns {Promise<Array<MessageTemplate>>}
 */
export const importTemplatesFromJSON = async (jsonString, merge = true) => {
  try {
    const importedTemplates = JSON.parse(jsonString)
    if (!Array.isArray(importedTemplates)) {
      throw new Error("Invalid JSON format: expected array")
    }

    let existingTemplates = []
    if (merge) {
      existingTemplates = await loadTemplates()
    }

    // Merge templates (avoid duplicates by ID)
    const templateMap = new Map()
    
    // Add existing templates
    existingTemplates.forEach(t => templateMap.set(t.id, t))
    
    // Add/update imported templates
    importedTemplates.forEach(t => {
      // Generate new ID if importing to different user or if ID conflicts
      if (!templateMap.has(t.id)) {
        templateMap.set(t.id, t)
      } else {
        // Update existing template
        templateMap.set(t.id, {
          ...templateMap.get(t.id),
          ...t,
          updatedAt: new Date().toISOString()
        })
      }
    })

    const mergedTemplates = Array.from(templateMap.values())
    await saveTemplates(mergedTemplates)
    return mergedTemplates
  } catch (e) {
    throw new Error(`Failed to import templates: ${e.message}`)
  }
}

/**
 * Import templates từ file (triggered by file input)
 * @param {File} file
 * @param {boolean} merge
 * @returns {Promise<Array<MessageTemplate>>}
 */
export const importTemplatesFromFile = async (file, merge = true) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async e => {
      try {
        const templates = await importTemplatesFromJSON(e.target.result, merge)
        resolve(templates)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

