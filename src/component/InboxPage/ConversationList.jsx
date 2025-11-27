import { useEffect, useState } from "react"
import { fromNow } from "../../js/util"
import { MessageDirection } from "../../js/types"
import { LoadingOutlined, CheckOutlined } from "@ant-design/icons"
import { getUserConversations, markConversationAsRead } from "../../js/conversationService"

/**
 * @typedef {import("../../js/types").Message} Message
 */

/**
 * Group messages into conversations with unread count based on last_read_at
 * @param {Array<Message>} messages
 * @param {string|null} userPhoneNumber
 * @param {Object<string, string>} lastReadMap - Map of phone_number -> last_read_at
 * @returns {Array<{id: string, phoneNumber: string, lastMessage: Message, unreadCount: number}>}
 */
const groupMessagesIntoConversations = (messages, userPhoneNumber, lastReadMap = {}) => {
  const conversationsMap = new Map()

  messages.forEach(message => {
    // Determine the other party's phone number
    let otherParty
    if (userPhoneNumber) {
      // If user has assigned phone number, determine other party based on direction
      otherParty = message.direction === MessageDirection.received ? message.from : message.to
      // Skip if this is the user's own number
      if (otherParty === userPhoneNumber) return
    } else {
      // If no user phone number, use the "from" number for received messages
      // and "to" number for sent messages to identify conversations
      otherParty = message.direction === MessageDirection.received ? message.from : message.to
    }

    const conversationId = otherParty

    if (!conversationsMap.has(conversationId)) {
      conversationsMap.set(conversationId, {
        id: conversationId,
        phoneNumber: otherParty,
        messages: [],
        unreadCount: 0,
      })
    }

    const conversation = conversationsMap.get(conversationId)
    conversation.messages.push(message)

    // Count unread messages based on last_read_at
    // A message is unread if:
    // 1. It's a received message
    // 2. last_read_at is null (never read) OR message.date > last_read_at
    if (message.direction === MessageDirection.received) {
      const lastReadAt = lastReadMap[otherParty]
      const messageDate = new Date(message.date)
      
      if (!lastReadAt || messageDate > new Date(lastReadAt)) {
        conversation.unreadCount++
      }
    }
  })

  // Convert to array and sort by last message date
  return Array.from(conversationsMap.values())
    .map(conv => ({
      id: conv.id,
      phoneNumber: conv.phoneNumber,
      lastMessage: conv.messages.sort((a, b) => new Date(b.date) - new Date(a.date))[0],
      unreadCount: conv.unreadCount,
    }))
    .sort((a, b) => new Date(b.lastMessage.date) - new Date(a.lastMessage.date))
}

/**
 * @param {Object} props
 * @param {Array<Message>} props.messages
 * @param {string|null} props.selectedConversationId
 * @param {function(string)} props.onSelectConversation
 * @param {string|null} props.userPhoneNumber
 * @param {boolean} props.loading
 * @param {string} props.userId - User ID để load last_read_at
 * @param {string} props.filter - "all" or "unread"
 * @param {function} props.onConversationRead - Callback khi conversation được mark as read
 */
export const ConversationList = ({
  messages = [],
  selectedConversationId = null,
  onSelectConversation,
  userPhoneNumber = null,
  loading = false,
  userId = null,
  filter = "all",
  onConversationRead = () => {},
}) => {
  const [lastReadMap, setLastReadMap] = useState({})
  const [markingAsRead, setMarkingAsRead] = useState({}) // Track which conversation is being marked

  // Load last_read_at for all conversations
  useEffect(() => {
    if (userId) {
      loadLastReadMap()
    }
  }, [userId])

  const loadLastReadMap = async () => {
    if (!userId) return
    
    try {
      const conversations = await getUserConversations(userId)
      const map = {}
      conversations.forEach(conv => {
        map[conv.phone_number] = conv.last_read_at
      })
      setLastReadMap(map)
    } catch (err) {
      console.error('Error loading conversations:', err)
    }
  }

  const handleMarkAsRead = async (e, phoneNumber) => {
    e.stopPropagation() // Prevent triggering conversation selection
    
    if (!userId || !phoneNumber) {
      console.warn('Cannot mark as read: missing userId or phoneNumber', { userId, phoneNumber })
      return
    }
    
    console.log('Marking conversation as read:', { userId, phoneNumber })
    setMarkingAsRead(prev => ({ ...prev, [phoneNumber]: true }))
    
    // Update lastReadMap immediately with current timestamp (optimistic update)
    const now = new Date().toISOString()
    setLastReadMap(prev => ({
      ...prev,
      [phoneNumber]: now
    }))
    
    try {
      const result = await markConversationAsRead(userId, phoneNumber)
      console.log('Mark as read successful:', result)
      
      // Reload from database to ensure consistency
      await loadLastReadMap()
      
      // Call callback to reload messages if needed
      if (onConversationRead) {
        setTimeout(() => {
          onConversationRead()
        }, 300)
      }
    } catch (err) {
      console.error('Error marking conversation as read:', err)
      
      // Revert optimistic update on error
      setLastReadMap(prev => {
        const newMap = { ...prev }
        delete newMap[phoneNumber]
        return newMap
      })
      
      // Try to reload from database
      await loadLastReadMap()
      
      alert(`Lỗi khi đánh dấu đã đọc: ${err.message}\n\nVui lòng kiểm tra:\n1. API endpoint có hoạt động không\n2. Migration đã được chạy trong Supabase chưa\n3. Console để xem chi tiết lỗi`)
    } finally {
      setMarkingAsRead(prev => ({ ...prev, [phoneNumber]: false }))
    }
  }

  const allConversations = groupMessagesIntoConversations(messages, userPhoneNumber, lastReadMap)
  
  // Filter conversations based on tab
  const conversations = filter === "unread" 
    ? allConversations.filter(conv => conv.unreadCount > 0)
    : allConversations

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingOutlined className="text-4xl text-teal-600" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>{filter === "unread" ? "Không có tin nhắn chưa đọc" : "Không có cuộc trò chuyện nào"}</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {conversations.map(conversation => {
        const isSelected = selectedConversationId === conversation.id
        const lastMessage = conversation.lastMessage
        const preview = lastMessage.body || (lastMessage.media > 0 ? "📎 Có file đính kèm" : "")

        return (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`
              p-3 border-b border-gray-200 cursor-pointer transition-colors relative
              ${isSelected ? "bg-teal-50 border-l-4 border-l-teal-500" : "hover:bg-gray-100 active:bg-gray-200"}
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900 truncate text-sm">{conversation.phoneNumber}</h4>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {conversation.unreadCount > 0 && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, conversation.phoneNumber)}
                        disabled={markingAsRead[conversation.phoneNumber]}
                        className="p-1.5 rounded-full hover:bg-teal-100 active:bg-teal-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Đánh dấu đã đọc"
                      >
                        {markingAsRead[conversation.phoneNumber] ? (
                          <LoadingOutlined className="text-teal-600 text-xs" spin />
                        ) : (
                          <CheckOutlined className="text-teal-600 text-xs" />
                        )}
                      </button>
                    )}
                    <p className="text-xs text-gray-500">{fromNow(lastMessage.date)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate flex-1">{preview}</p>
                  {conversation.unreadCount > 0 && (
                    <span className="ml-2 flex-shrink-0 bg-teal-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

