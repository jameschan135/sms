import { Navigate } from "react-router-dom"
import { useUser } from "../../context/UserProvider"

/**
 * Component bảo vệ route - chỉ cho phép truy cập khi đã đăng nhập
 */
export const UserProtectedRoute = ({ children }) => {
  const [user] = useUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

/**
 * Component bảo vệ route - chỉ cho phép admin truy cập
 */
export const AdminProtectedRoute = ({ children }) => {
  const [user] = useUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== "admin") {
    return <Navigate to="/inbox" replace />
  }

  return children
}

