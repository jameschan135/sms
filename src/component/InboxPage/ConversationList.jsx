import { fromNow } from "../../js/util"
import { MessageDirection } from "../../js/types"
import { LoadingOutlined } from "@ant-design/icons"

/**
 * @typedef {import("../../js/types").Message} Message
 */

/**
 * Group messages into conversations
 * A conversation is identified by a unique pair of phone numbers (from/to)
 * @param {Array<Message>} messages
 * @returns {Array<{id: string, phoneNumber: string, lastMessage: Message, unreadCount: number}>}
 */
const groupMessagesIntoConversations = (messages, userPhoneNumber) => {
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

    // Count unread messages (received messages that are not read)
    if (message.direction === MessageDirection.received && !message.isRead) {
      conversation.unreadCount++
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
 */
export const ConversationList = ({
  messages = [],
  selectedConversationId = null,
  onSelectConversation,
  userPhoneNumber = null,
  loading = false,
}) => {
  const conversations = groupMessagesIntoConversations(messages, userPhoneNumber)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingOutlined className="text-4xl text-purple-900" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Không có cuộc trò chuyện nào</p>
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
              p-3 border-b border-gray-200 cursor-pointer transition-colors
              ${isSelected ? "bg-purple-100 border-l-4 border-l-purple-600" : "hover:bg-gray-100 active:bg-gray-200"}
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900 truncate text-sm">{conversation.phoneNumber}</h4>
                  <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{fromNow(lastMessage.date)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate flex-1">{preview}</p>
                  {conversation.unreadCount > 0 && (
                    <span className="ml-2 flex-shrink-0 bg-purple-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
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

