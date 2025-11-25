import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Layout } from "../Layout/Layout"
import { useAuthentication } from "../../context/AuthenticationProvider"
import { useUser } from "../../context/UserProvider"
import { isAdmin } from "../../context/UserProvider"
import { InboxOutlined, SendOutlined, SettingOutlined, FileTextOutlined, DollarOutlined, LoadingOutlined } from "@ant-design/icons"
import { getTwilioBalance, formatBalance } from "../../js/getTwilioBalance"
import { ErrorLabel } from "../ErrorLabel/ErrorLabel"

export const DashboardPage = () => {
  const navigate = useNavigate()
  const [authentication] = useAuthentication()
  const [user] = useUser()
  const hasTwilioAuth = authentication && authentication.accountSid && authentication.accountSid !== ""
  const [balance, setBalance] = useState(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [balanceError, setBalanceError] = useState(null)

  // Load balance khi có Twilio auth
  useEffect(() => {
    if (hasTwilioAuth) {
      setLoadingBalance(true)
      setBalanceError(null)
      getTwilioBalance()
        .then(balanceData => {
          setBalance(balanceData)
        })
        .catch(err => {
          console.error("Error loading balance:", err)
          setBalanceError(err)
        })
        .finally(() => {
          setLoadingBalance(false)
        })
    } else {
      setBalance(null)
      setBalanceError(null)
    }
  }, [hasTwilioAuth, authentication?.accountSid])

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Chào mừng, {user?.name || user?.username}!</h2>
        
        {!hasTwilioAuth && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Bạn cần cấu hình Twilio credentials để sử dụng các tính năng SMS. 
                  <button
                    onClick={() => navigate("/authentication")}
                    className="ml-2 underline font-semibold"
                  >
                    Nhấn vào đây để cấu hình
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div
            onClick={() => navigate("/inbox")}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-teal-400"
          >
            <div className="flex items-center mb-4">
              <InboxOutlined className="text-3xl text-teal-500 mr-3" />
              <h3 className="text-xl font-semibold">Inbox</h3>
            </div>
            <p className="text-gray-600">Xem tin nhắn đã nhận và đã gửi</p>
            {!hasTwilioAuth && (
              <span className="inline-block mt-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                Cần Twilio Auth
              </span>
            )}
          </div>

          <div
            onClick={() => navigate("/send")}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-teal-400"
          >
            <div className="flex items-center mb-4">
              <SendOutlined className="text-3xl text-teal-500 mr-3" />
              <h3 className="text-xl font-semibold">Gửi SMS</h3>
            </div>
            <p className="text-gray-600">Gửi tin nhắn SMS mới</p>
            {!hasTwilioAuth && (
              <span className="inline-block mt-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                Cần Twilio Auth
              </span>
            )}
          </div>

          <div
            onClick={() => navigate("/templates")}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-teal-400"
          >
            <div className="flex items-center mb-4">
              <FileTextOutlined className="text-3xl text-teal-500 mr-3" />
              <h3 className="text-xl font-semibold">Templates</h3>
            </div>
            <p className="text-gray-600">Quản lý message templates</p>
          </div>

          {user && isAdmin(user) && (
            <div
              onClick={() => navigate("/admin")}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-teal-400"
            >
              <div className="flex items-center mb-4">
                <SettingOutlined className="text-3xl text-teal-500 mr-3" />
                <h3 className="text-xl font-semibold">Quản trị</h3>
              </div>
              <p className="text-gray-600">Quản lý thành viên hệ thống</p>
            </div>
          )}
        </div>

        {hasTwilioAuth && (
          <>
            {/* Balance Card */}
            <div className="mt-8 bg-gradient-to-r from-teal-400 to-teal-500 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <DollarOutlined className="text-2xl mr-2" />
                    <h3 className="text-xl font-semibold">Số dư tài khoản</h3>
                  </div>
                  {loadingBalance ? (
                    <div className="flex items-center mt-2">
                      <LoadingOutlined className="text-2xl mr-2" spin />
                      <span className="text-lg">Đang tải...</span>
                    </div>
                  ) : balanceError ? (
                    <div className="mt-2">
                      <ErrorLabel error={balanceError} className="text-white" />
                    </div>
                  ) : balance ? (
                    <p className="text-3xl font-bold mt-2">
                      {formatBalance(balance.balance, balance.currency)}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90">Twilio Account</p>
                  <p className="text-xs opacity-75 mt-1 font-mono">
                    {authentication?.accountSid?.substring(0, 12)}...
                  </p>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
              <p className="text-sm text-green-700">
                ✓ Twilio đã được cấu hình. Bạn có thể sử dụng tất cả các tính năng SMS.
              </p>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

