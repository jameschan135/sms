/**
 * User Service - Quản lý users từ localStorage và JSON
 */

const USERS_STORAGE_KEY = "twilio_sms_users"
const CURRENT_USER_KEY = "twilio_sms_current_user"

// Default users intentionally empty to avoid shipping hardcoded credentials
const DEFAULT_USERS = []

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} password - Plain text password (trong production nên hash)
 * @property {string} role - "admin" | "user"
 * @property {string} name
 * @property {string} createdAt
 */

/**
 * Load users từ localStorage hoặc từ file JSON mặc định
 * @returns {Promise<Array<User>>}
 */
export const loadUsers = async () => {
  // Kiểm tra localStorage trước
  const storedUsers = localStorage.getItem(USERS_STORAGE_KEY)
  if (storedUsers) {
    try {
      const users = JSON.parse(storedUsers)
      console.log("Loaded users from localStorage:", users.length)
      return users
    } catch (e) {
      console.error("Error parsing users from localStorage:", e)
      // Xóa dữ liệu localStorage bị lỗi
      localStorage.removeItem(USERS_STORAGE_KEY)
    }
  }

  // Nếu không có trong localStorage, load từ file JSON
  try {
    // Thử cả đường dẫn với base path và không có base path
    const basePath = import.meta.env.BASE_URL || "/"
    const pathsToTry = [
      `${basePath}users.json`.replace("//", "/"),
      "/users.json",
      "./users.json",
      "users.json"
    ]
    
    for (const jsonPath of pathsToTry) {
      try {
        console.log("Trying to load users from:", jsonPath)
        const response = await fetch(jsonPath)
        if (response.ok) {
          const users = await response.json()
          console.log("Loaded users from JSON:", users.length, users)
          // Lưu vào localStorage để dùng lần sau
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
          return users
        } else {
          console.log(`Failed to load from ${jsonPath}, status:`, response.status)
        }
      } catch (fetchError) {
        console.log(`Error fetching ${jsonPath}:`, fetchError.message)
      }
    }
    console.error("Failed to load users.json from all attempted paths")
  } catch (e) {
    console.error("Error loading users.json:", e)
  }

  // Nếu không load được từ file, sử dụng default users và lưu vào localStorage
  console.warn("No users loaded from file, using default users")
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS))
  return DEFAULT_USERS
}

/**
 * Lưu users vào localStorage
 * @param {Array<User>} users
 */
export const saveUsers = users => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

/**
 * Thêm user mới
 * @param {Omit<User, "id" | "createdAt">} userData
 * @returns {Promise<User>}
 */
export const createUser = async userData => {
  const users = await loadUsers()
  const newUser = {
    ...userData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
  users.push(newUser)
  saveUsers(users)
  return newUser
}

/**
 * Xóa user theo ID
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export const deleteUser = async userId => {
  const users = await loadUsers()
  const filteredUsers = users.filter(u => u.id !== userId)
  saveUsers(filteredUsers)
  return true
}

/**
 * Cập nhật user
 * @param {string} userId
 * @param {Partial<User>} updates
 * @returns {Promise<User | null>}
 */
export const updateUser = async (userId, updates) => {
  const users = await loadUsers()
  const index = users.findIndex(u => u.id === userId)
  if (index === -1) return null

  users[index] = { ...users[index], ...updates }
  saveUsers(users)
  return users[index]
}

/**
 * Tìm user theo username
 * @param {string} username
 * @returns {Promise<User | null>}
 */
export const findUserByUsername = async username => {
  const users = await loadUsers()
  return users.find(u => u.username === username) || null
}

/**
 * Xác thực đăng nhập
 * @param {string} username
 * @param {string} password
 * @returns {Promise<User | null>}
 */
export const authenticateUser = async (username, password) => {
  console.log("Authenticating user:", username)
  const users = await loadUsers()
  console.log("Available users:", users.map(u => u.username))
  
  const user = await findUserByUsername(username)
  console.log("Found user:", user ? user.username : "null")
  
  if (user && user.password === password) {
    // Lưu thông tin user hiện tại (không lưu password)
    const { password: _, ...userWithoutPassword } = user
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword))
    console.log("Authentication successful for:", username)
    return userWithoutPassword
  }
  
  console.log("Authentication failed for:", username)
  return null
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
export const isAdmin = user => {
  return user && user.role === "admin"
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
export const importUsersFromJSON = async jsonString => {
  try {
    const users = JSON.parse(jsonString)
    if (Array.isArray(users)) {
      saveUsers(users)
      return users
    }
    throw new Error("Invalid JSON format: expected array")
  } catch (e) {
    throw new Error(`Failed to import users: ${e.message}`)
  }
}

