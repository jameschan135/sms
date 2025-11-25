import { useEffect, useRef, useState } from "react"
import { MessageDirection } from "../../js/types"
import { fromNow } from "../../js/util"
import { MediaViewer } from "../MediaViewer/MediaViewer"
import { LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons"
import { InboxOutlined, SendOutlined } from "@ant-design/icons"
import { sendTwilioMessage } from "../../js/sendTwilioMessage"
import { useAuthentication } from "../../context/AuthenticationProvider"
import { SuccessLabel } from "../SuccessLabel/SuccessLabel"
import { ErrorLabel } from "../ErrorLabel/ErrorLabel"

/**
 * @typedef {import("../../js/types").Message} Message
 */

/**
 * Get status display info (text, color, icon)
 * @param {string} status - Message status from Twilio
 * @returns {Object} Status display info
 */
const getStatusDisplay = (status) => {
  const statusLower = (status || "").toLowerCase()
  
  switch (statusLower) {
    case "delivered":
      return {
        text: "Đã gửi",
        color: "text-green-500",
        bgColor: "bg-green-50",
        icon: <CheckCircleOutlined className="text-green-500" />
      }
    case "sent":
      return {
        text: "Đã gửi",
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        icon: <ClockCircleOutlined className="text-blue-500" />
      }
    case "queued":
      return {
        text: "Đang chờ",
        color: "text-yellow-500",
        bgColor: "bg-yellow-50",
        icon: <ClockCircleOutlined className="text-yellow-500" />
      }
    case "failed":
    case "undelivered":
      return {
        text: "Gửi thất bại",
        color: "text-red-500",
        bgColor: "bg-red-50",
        icon: <CloseCircleOutlined className="text-red-500" />
      }
    case "receiving":
    case "received":
      return {
        text: "Đang nhận",
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        icon: <ClockCircleOutlined className="text-blue-500" />
      }
    default:
      return {
        text: status || "Không xác định",
        color: "text-gray-500",
        bgColor: "bg-gray-50",
        icon: <ExclamationCircleOutlined className="text-gray-500" />
      }
  }
}

/**
 * Filter messages for a specific conversation
 * @param {Array<Message>} messages
 * @param {string} conversationId - The other party's phone number
 * @param {string|null} userPhoneNumber - User's phone number
 * @returns {Array<Message>}
 */
const getConversationMessages = (messages, conversationId, userPhoneNumber) => {
  if (!conversationId) return []

  if (userPhoneNumber) {
    // Filter messages between user and the selected conversation
    return messages
      .filter(message => {
        const isFromUser = message.from === userPhoneNumber
        const isToUser = message.to === userPhoneNumber
        const isFromOther = message.from === conversationId
        const isToOther = message.to === conversationId

        return (isFromUser && isToOther) || (isFromOther && isToUser)
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort chronologically
  } else {
    // If no user phone number, show all messages involving the conversationId
    return messages
      .filter(message => message.from === conversationId || message.to === conversationId)
      .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort chronologically
  }
}

/**
 * @param {Object} props
 * @param {Array<Message>} props.messages
 * @param {string|null} props.conversationId
 * @param {string|null} props.userPhoneNumber
 * @param {boolean} props.loading
 * @param {function} props.onMessageSent - Callback when message is sent successfully
 */
export const ConversationView = ({
  messages = [],
  conversationId = null,
  userPhoneNumber = null,
  loading = false,
  onMessageSent = () => {},
}) => {
  const messagesEndRef = useRef(null)
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [authentication] = useAuthentication()

  const conversationMessages = getConversationMessages(messages, conversationId, userPhoneNumber)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversationMessages])

  // Reset message text when conversation changes
  useEffect(() => {
    setMessageText("")
    setSendError(null)
    setSendSuccess(false)
  }, [conversationId])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!messageText.trim() || !conversationId || !userPhoneNumber || sending) {
      return
    }

    setSending(true)
    setSendError(null)
    setSendSuccess(false)

    try {
      await sendTwilioMessage(authentication, conversationId, userPhoneNumber, messageText.trim())
      setMessageText("")
      setSendSuccess(true)
      
      // Call callback to reload messages after a short delay
      // (Twilio API may take a moment to update)
      if (onMessageSent) {
        setTimeout(() => {
          onMessageSent()
        }, 1000) // Wait 1 second before reloading
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSendSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Error sending message:", error)
      setSendError(error.message || "Không thể gửi tin nhắn. Vui lòng thử lại.")
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e) => {
    // Send on Enter, but allow Shift+Enter for new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingOutlined className="text-4xl text-purple-900" />
      </div>
    )
  }

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">Chọn một cuộc trò chuyện</p>
          <p className="text-sm">Chọn một cuộc trò chuyện từ danh sách bên trái để xem tin nhắn</p>
        </div>
      </div>
    )
  }

  if (conversationMessages.length === 0 && !loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b border-gray-200 p-4 bg-white shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900">{conversationId}</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>Không có tin nhắn nào trong cuộc trò chuyện này</p>
        </div>
        <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
          {!userPhoneNumber ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Bạn cần được phân bổ số điện thoại để gửi tin nhắn. Vui lòng liên hệ admin.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                disabled={sending || !userPhoneNumber}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sending || !userPhoneNumber}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 self-end"
              >
                {sending ? (
                  <>
                    <LoadingOutlined className="animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <SendOutlined />
                    <span>Gửi</span>
                  </>
                )}
              </button>
            </form>
          )}
          {sendError && <ErrorLabel error={sendError} className="mt-2" />}
          {sendSuccess && <SuccessLabel text="Tin nhắn đã được gửi thành công!" />}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-white shadow-sm">
        <h3 className="font-semibold text-lg text-gray-900">{conversationId}</h3>
        <p className="text-xs text-gray-500 mt-1">{conversationMessages.length} tin nhắn</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-3">
          {conversationMessages.map(message => {
            const isReceived = message.direction === MessageDirection.received
            const isSent = message.direction === MessageDirection.sent

            return (
              <div
                key={message.messageSid}
                className={`flex ${isSent ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[75%] rounded-2xl px-4 py-2 shadow-sm
                    ${isSent ? "bg-purple-600 text-white rounded-tr-sm" : "bg-white text-gray-900 rounded-tl-sm"}
                  `}
                >
                  <div className="flex items-start gap-2">
                    {isReceived && (
                      <InboxOutlined className="text-xs mt-0.5 flex-shrink-0 text-gray-400" />
                    )}
                    {isSent && (
                      <SendOutlined className="text-xs mt-0.5 flex-shrink-0 text-purple-200" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {message.body || (message.media > 0 ? "📎 Có file đính kèm" : "")}
                      </p>
                      {message.media > 0 && (
                        <div className="mt-2">
                          <MediaViewer messageSid={message.messageSid} thumbnail="false" />
                        </div>
                      )}
                      <div className={`flex items-center gap-2 mt-1.5 flex-wrap ${isSent ? "text-purple-100" : "text-gray-400"}`}>
                        <p className="text-xs">
                          {fromNow(message.date)}
                        </p>
                        {/* Show status for sent messages only */}
                        {isSent && message.status && (
                          <span 
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              isSent 
                                ? "bg-white/20 text-white border border-white/30" 
                                : `${getStatusDisplay(message.status).bgColor} ${getStatusDisplay(message.status).color}`
                            }`}
                            title={`Trạng thái: ${message.status}`}
                          >
                            {getStatusDisplay(message.status).icon}
                            <span>{getStatusDisplay(message.status).text}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Always show, but disable if no userPhoneNumber */}
      <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0 min-h-[120px]">
        {!userPhoneNumber ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Bạn cần được phân bổ số điện thoại để gửi tin nhắn. Vui lòng liên hệ admin.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                disabled={sending || !userPhoneNumber}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sending || !userPhoneNumber}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 self-end"
              >
                {sending ? (
                  <>
                    <LoadingOutlined className="animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <SendOutlined />
                    <span>Gửi</span>
                  </>
                )}
              </button>
            </form>
            {sendError && <ErrorLabel error={sendError} className="mt-2" />}
            {sendSuccess && <SuccessLabel text="Tin nhắn đã được gửi thành công!" />}
          </>
        )}
      </div>
    </div>
  )
}

