import React, { useContext, useState, useEffect } from "react"
import { getCurrentUser, logout as logoutUser } from "../js/userServiceSupabase"

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} role
 * @property {string} name
 * @property {string} createdAt
 */

const UserReadContext = React.createContext(null)
const UserWriteContext = React.createContext(() => {})

/**
 * Hook để sử dụng user context
 * @returns {[User | null, function(User | null)]}
 */
export const useUser = () => {
  const user = useContext(UserReadContext)
  const setUser = useContext(UserWriteContext)
  return [user, setUser]
}

/**
 * Kiểm tra user có phải admin không
 * @param {User | null} user
 * @returns {boolean}
 */
export const isAdmin = user => {
  return user && user.role === "admin"
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  // Load user từ localStorage khi component mount
  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
  }, [])

  const handleSetUser = newUser => {
    setUser(newUser)
    if (!newUser) {
      logoutUser()
    }
  }

  return (
    <UserReadContext.Provider value={user}>
      <UserWriteContext.Provider value={handleSetUser}>{children}</UserWriteContext.Provider>
    </UserReadContext.Provider>
  )
}

