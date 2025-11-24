import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Layout } from "../Layout/Layout"
import { allPhones, MessageFilterEnum } from "./Selector"
import { getTwilioPhoneNumbers } from "../../js/getTwilioPhoneNumbers"
import { getMessages } from "./getMessages"
import { ErrorLabel } from "../ErrorLabel/ErrorLabel"
import { useAuthentication } from "../../context/AuthenticationProvider"
import { useUser } from "../../context/UserProvider"
import { getUserPhoneNumber } from "../../js/userPhoneNumberService"
import { ConversationList } from "./ConversationList"
import { ConversationView } from "./ConversationView"

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
  const [selectedConversationId, setSelectedConversationId] = useState(null)

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

  const loadMessages = async () => {
    if (!hasTwilioAuth || loadingUserPhone) return

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

  useEffect(() => {
    loadMessages()
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

  // Auto-select first conversation when messages load
  useEffect(() => {
    if (messages.length > 0 && !selectedConversationId && userPhoneNumber) {
      // Get first conversation
      const conversations = new Set()
      messages.forEach(message => {
        const otherParty = message.direction === "received" ? message.from : message.to
        if (otherParty !== userPhoneNumber) {
          conversations.add(otherParty)
        }
      })
      if (conversations.size > 0) {
        setSelectedConversationId(Array.from(conversations)[0])
      }
    }
  }, [messages, selectedConversationId, userPhoneNumber])

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 bg-white">
          <h3 className="text-2xl font-bold">Inbox</h3>
          {userPhoneNumber ? (
            <p className="text-sm text-gray-600 mt-1">
              Số điện thoại: <strong>{userPhoneNumber}</strong>
            </p>
          ) : (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
              <p className="text-sm text-yellow-700">
                Bạn chưa được phân bổ số điện thoại. Vui lòng liên hệ admin để được phân bổ số điện thoại.
              </p>
            </div>
          )}
        </div>

        <ErrorLabel error={error} className="mx-4 mt-4" />

        {/* Main Content - 3 Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Conversation List */}
          <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900">Cuộc trò chuyện</h4>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConversationList
                messages={messages}
                selectedConversationId={selectedConversationId}
                onSelectConversation={setSelectedConversationId}
                userPhoneNumber={userPhoneNumber}
                loading={loadingMessages || loadingUserPhone}
              />
            </div>
          </div>

          {/* Middle Column - Conversation View */}
          <div className="flex-1 flex flex-col bg-white">
            <ConversationView
              messages={messages}
              conversationId={selectedConversationId}
              userPhoneNumber={userPhoneNumber}
              loading={loadingMessages || loadingUserPhone}
              onMessageSent={loadMessages}
            />
          </div>

          {/* Right Column - Placeholder (for future use) */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 flex items-center justify-center">
            <p className="text-gray-500 text-sm">Khu vực này dành cho tính năng tương lai</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
