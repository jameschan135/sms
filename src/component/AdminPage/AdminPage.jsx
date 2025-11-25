import { useState, useEffect } from "react"
import { Layout } from "../Layout/Layout"
import { loadUsers, createUser, deleteUser, exportUsersToJSON, importUsersFromJSON } from "../../js/userServiceSupabase"
import { ErrorLabel } from "../ErrorLabel/ErrorLabel"
import { SuccessLabel } from "../SuccessLabel/SuccessLabel"
import { DeleteOutlined, DownloadOutlined, UploadOutlined, PlusOutlined, PhoneOutlined } from "@ant-design/icons"
import { getTwilioPhoneNumbers } from "../../js/getTwilioPhoneNumbers"
import { 
  getUserPhoneNumber, 
  assignPhoneNumberToUser, 
  removePhoneNumberFromUser,
  getAllUserPhoneNumbers 
} from "../../js/userPhoneNumberService"
import { useAuthentication } from "../../context/AuthenticationProvider"

/**
 * @typedef {import("../../js/userServiceSupabase").User} User
 */

export const AdminPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    role: "user",
  })
  const [authentication] = useAuthentication()
  const [phoneNumbers, setPhoneNumbers] = useState([])
  const [loadingPhones, setLoadingPhones] = useState(false)
  const [userPhoneAssignments, setUserPhoneAssignments] = useState({}) // { userId: phoneNumber }
  const [assigningPhone, setAssigningPhone] = useState(null) // userId đang được assign

  useEffect(() => {
    loadUsersList()
  }, [])

  // Load phone numbers từ Twilio
  useEffect(() => {
    const loadPhoneNumbers = async () => {
      const hasTwilioAuth = authentication && authentication.accountSid && authentication.accountSid !== ""
      if (!hasTwilioAuth) {
        return
      }

      setLoadingPhones(true)
      try {
        const phones = await getTwilioPhoneNumbers()
        setPhoneNumbers(phones)
      } catch (err) {
        console.error('Error loading phone numbers:', err)
      } finally {
        setLoadingPhones(false)
      }
    }

    loadPhoneNumbers()
  }, [authentication])

  // Load phone number assignments cho tất cả users
  useEffect(() => {
    const loadAssignments = async () => {
      if (users.length === 0) return

      try {
        const assignments = {}
        for (const user of users) {
          const phone = await getUserPhoneNumber(user.id)
          if (phone) {
            assignments[user.id] = phone
          }
        }
        setUserPhoneAssignments(assignments)
      } catch (err) {
        console.error('Error loading phone assignments:', err)
      }
    }

    loadAssignments()
  }, [users])

  const loadUsersList = async () => {
    setLoading(true)
    setError(null)
    try {
      const usersList = await loadUsers()
      setUsers(usersList)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async e => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      // Kiểm tra username đã tồn tại chưa
      const existingUser = users.find(u => u.username === newUser.username)
      if (existingUser) {
        setError(new Error("Tên đăng nhập đã tồn tại"))
        return
      }

      await createUser(newUser)
      setSuccess("Thêm thành viên thành công!")
      setNewUser({ username: "", password: "", name: "", role: "user" })
      setShowAddForm(false)
      await loadUsersList()
    } catch (err) {
      setError(err)
    }
  }

  const handleDeleteUser = async userId => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thành viên này?")) {
      return
    }

    setError(null)
    setSuccess(null)

    try {
      await deleteUser(userId)
      setSuccess("Xóa thành viên thành công!")
      await loadUsersList()
    } catch (err) {
      setError(err)
    }
  }

  const handleExportJSON = async () => {
    try {
      const jsonString = await exportUsersToJSON()
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "users.json"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSuccess("Đã xuất file users.json thành công!")
    } catch (err) {
      setError(err)
    }
  }

  const handleImportJSON = e => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async event => {
      try {
        const jsonString = event.target.result
        await importUsersFromJSON(jsonString)
        setSuccess("Đã import file users.json thành công!")
        await loadUsersList()
      } catch (err) {
        setError(err)
      }
    }
    reader.readAsText(file)
    // Reset input để có thể chọn lại file cùng tên
    e.target.value = ""
  }

  const handleAssignPhoneNumber = async (userId, phoneNumber) => {
    if (!phoneNumber) {
      // Xóa assignment nếu phoneNumber là empty
      try {
        await removePhoneNumberFromUser(userId)
        setUserPhoneAssignments(prev => {
          const newAssignments = { ...prev }
          delete newAssignments[userId]
          return newAssignments
        })
        setSuccess("Đã xóa phân bổ số điện thoại thành công!")
      } catch (err) {
        setError(err)
      }
      return
    }

    setAssigningPhone(userId)
    setError(null)
    setSuccess(null)

    try {
      await assignPhoneNumberToUser(userId, phoneNumber)
      setUserPhoneAssignments(prev => ({
        ...prev,
        [userId]: phoneNumber
      }))
      setSuccess(`Đã phân bổ số điện thoại ${phoneNumber} cho user thành công!`)
    } catch (err) {
      setError(err)
    } finally {
      setAssigningPhone(null)
    }
  }

  return (
    <Layout>
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Quản Lý Thành Viên</h2>
        <p className="text-gray-600">Quản lý danh sách thành viên của hệ thống</p>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-500 flex items-center gap-2"
        >
          <PlusOutlined />
          {showAddForm ? "Ẩn Form" : "Thêm Thành Viên"}
        </button>
        <button
          onClick={handleExportJSON}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          <DownloadOutlined />
          Xuất JSON
        </button>
        <label className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 cursor-pointer">
          <UploadOutlined />
          Nhập JSON
          <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
        </label>
      </div>

      <ErrorLabel error={error} />
      <SuccessLabel success={success} />

      {showAddForm && (
        <div className="bg-white p-4 rounded-md border border-gray-300 mb-4">
          <h3 className="text-lg font-semibold mb-3">Thêm Thành Viên Mới</h3>
          <form onSubmit={handleAddUser} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập *</label>
              <input
                type="text"
                value={newUser.username}
                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
              <input
                type="password"
                value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị *</label>
              <input
                type="text"
                value={newUser.name}
                onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Tên hiển thị"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò *</label>
              <select
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-500"
              >
                Thêm
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setNewUser({ username: "", password: "", name: "", role: "user" })
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-md border border-gray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tên đăng nhập</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tên hiển thị</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vai trò</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Số điện thoại</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ngày tạo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    Chưa có thành viên nào
                  </td>
                </tr>
              ) : (
                users.map(user => {
                  const assignedPhone = userPhoneAssignments[user.id]
                  const isAssigning = assigningPhone === user.id
                  
                  return (
                    <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{user.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{user.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{user.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-teal-50 text-teal-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {loadingPhones ? (
                          <span className="text-gray-400">Đang tải...</span>
                        ) : phoneNumbers.length === 0 ? (
                          <span className="text-gray-400">Chưa có số điện thoại</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={assignedPhone || ""}
                              onChange={(e) => handleAssignPhoneNumber(user.id, e.target.value)}
                              disabled={isAssigning}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                            >
                              <option value="">-- Chưa phân bổ --</option>
                              {phoneNumbers.map(phone => {
                                // Check xem số này đã được assign cho user khác chưa
                                const assignedToOtherUser = Object.entries(userPhoneAssignments)
                                  .some(([otherUserId, otherPhone]) => 
                                    otherUserId !== user.id && otherPhone === phone
                                  )
                                
                                return (
                                  <option 
                                    key={phone} 
                                    value={phone}
                                    disabled={assignedToOtherUser}
                                  >
                                    {phone} {assignedToOtherUser ? "(Đã được phân bổ)" : ""}
                                  </option>
                                )
                              })}
                            </select>
                            {assignedPhone && (
                              <span className="text-green-600 text-xs">
                                <PhoneOutlined /> {assignedPhone}
                              </span>
                            )}
                            {isAssigning && (
                              <span className="text-gray-400 text-xs">Đang xử lý...</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(user.created_at || user.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <DeleteOutlined />
                          Xóa
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

