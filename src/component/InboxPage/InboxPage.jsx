import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Layout } from "../Layout/Layout"
import { MessageRows } from "../MessageRows/MessageRows"
import { allPhones, MessageFilterEnum, Selector } from "./Selector"
import { getTwilioPhoneNumbers } from "../../js/getTwilioPhoneNumbers"
import { getMessages } from "./getMessages"
import { ErrorLabel } from "../ErrorLabel/ErrorLabel"
import { useAuthentication } from "../../context/AuthenticationProvider"
import { useUser } from "../../context/UserProvider"
import { getUserPhoneNumber } from "../../js/userPhoneNumberService"

export const InboxPage = () => {
  const navigate = useNavigate()
  const [authentication] = useAuthentication()
  const [user] = useUser()
  const hasTwilioAuth = authentication && authentication.accountSid && authentication.accountSid !== ""
  const [messages, setMessages] = useState([])
  const [phoneNumbers, setPhoneNumbers] = useState([])
  const [userPhoneNumber, setUserPhoneNumber] = useState(null) // Số điện thoại được assign cho user
  const [phoneNumber, setPhoneNumber] = useState(allPhones)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [loadingPhones, setLoadingPhones] = useState(true)
  const [loadingUserPhone, setLoadingUserPhone] = useState(true)
  const [messageFilter, setMessageFilter] = useState(MessageFilterEnum.all)
  const [error, setError] = useState(null)

  // Load số điện thoại được assign cho user
  useEffect(() => {
    const loadUserPhoneNumber = async () => {
      if (!user?.id) {
        setLoadingUserPhone(false)
        return
      }

      try {
        const phone = await getUserPhoneNumber(user.id)
        setUserPhoneNumber(phone)
        // Nếu user có phone number được assign, tự động set làm phoneNumber mặc định
        if (phone) {
          setPhoneNumber(phone)
        }
      } catch (e) {
        console.error('Error loading user phone number:', e)
      } finally {
        setLoadingUserPhone(false)
      }
    }

    loadUserPhoneNumber()
  }, [user?.id])

  useEffect(() => {
    if (!hasTwilioAuth || loadingUserPhone) return

    const run = async () => {
      setLoadingMessages(true)
      try {
        // Nếu user có phone number được assign, chỉ hiển thị messages của số đó
        const phoneToUse = userPhoneNumber || phoneNumber
        const ms = await getMessages(phoneToUse, messageFilter)
        setMessages(ms)
      } catch (e) {
        setError(e)
      } finally {
        setLoadingMessages(false)
      }
    }
    run()
  }, [phoneNumber, messageFilter, userPhoneNumber, hasTwilioAuth, loadingUserPhone])

  useEffect(() => {
    if (!hasTwilioAuth) {
      setLoadingPhones(false)
      return
    }

    getTwilioPhoneNumbers()
      .then(setPhoneNumbers)
      .catch(setError)
      .finally(() => setLoadingPhones(false))
  }, [hasTwilioAuth])

  if (!hasTwilioAuth) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-4">Inbox</h3>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
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
                <h4 className="text-lg font-semibold text-yellow-800 mb-2">Cần cấu hình Twilio</h4>
                <p className="text-sm text-yellow-700 mb-4">
                  Bạn cần cấu hình Twilio credentials để xem và gửi tin nhắn SMS.
                </p>
                <button
                  onClick={() => navigate("/authentication")}
                  className="bg-violet-900 text-white px-4 py-2 rounded-md hover:bg-violet-800"
                >
                  Cấu hình Twilio ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Nếu user có phone number được assign, ẩn selector và chỉ hiển thị messages của số đó
  const showSelector = !userPhoneNumber

  return (
    <Layout>
      <h3>Inbox</h3>
      {userPhoneNumber ? (
        <p className="my-4">
          Tin nhắn của số điện thoại <strong>{userPhoneNumber}</strong> được hiển thị ở đây, tin nhắn mới nhất ở trên cùng.
        </p>
      ) : (
        <p className="my-4">Your messages are displayed on this page, with the most recent ones at the top.</p>
      )}
      {!userPhoneNumber && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-sm text-yellow-700">
            Bạn chưa được phân bổ số điện thoại. Vui lòng liên hệ admin để được phân bổ số điện thoại.
          </p>
        </div>
      )}
      <ErrorLabel error={error} className="mb-4" />
      {showSelector && (
        <Selector
          phoneNumbers={phoneNumbers}
          phoneNumber={phoneNumber}
          loading={loadingPhones}
          onMessageFilterChange={setMessageFilter}
          onPhoneNumberChange={setPhoneNumber}
        />
      )}
      <MessageRows loading={loadingMessages} messages={messages} />
    </Layout>
  )
}
