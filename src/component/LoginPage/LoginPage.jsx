import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LayoutWithoutNavBar } from "../Layout/Layout"
import { authenticateUser } from "../../js/userServiceSupabase"
import { useUser } from "../../context/UserProvider"
import { ErrorLabel } from "../ErrorLabel/ErrorLabel"
import { SuccessLabel } from "../SuccessLabel/SuccessLabel"

export const LoginPage = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [, setUser] = useUser()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log("Login attempt:", { username, passwordLength: password.length })
      const user = await authenticateUser(username.trim(), password)
      if (user) {
        setUser(user)
        // Redirect đến trang dashboard sau khi đăng nhập thành công
        navigate("/dashboard")
      } else {
        setError(new Error("Tên đăng nhập hoặc mật khẩu không đúng"))
      }
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err : new Error("Có lỗi xảy ra khi đăng nhập"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <LayoutWithoutNavBar>
      <div className="max-w-md mx-auto mt-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Đăng Nhập</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Tên đăng nhập
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Nhập tên đăng nhập"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Nhập mật khẩu"
            />
          </div>

          <ErrorLabel error={error} />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600 text-center">
          <p>Demo accounts:</p>
          <p className="mt-1">
            <strong>username đăng nhập không khoảng cách </strong>
          </p>
          <button
            type="button"
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            className="mt-4 text-xs text-red-600 hover:text-red-800 underline"
          >
            Reset dữ liệu (Xóa localStorage)
          </button>
        </div>
      </div>
    </LayoutWithoutNavBar>
  )
}

