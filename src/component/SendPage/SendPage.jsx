import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuthentication } from "../../context/AuthenticationProvider"
import { useUser } from "../../context/UserProvider"
import { getTwilioPhoneNumbers } from "../../js/getTwilioPhoneNumbers"
import { sendTwilioMessage } from "../../js/sendTwilioMessage"
import { phonePattern } from "../../js/util"
import { Layout } from "../Layout/Layout"
import { ErrorLabel } from "../ErrorLabel/ErrorLabel"
import { Loading3QuartersOutlined, CheckOutlined } from "@ant-design/icons"
import { getUserPhoneNumber } from "../../js/userPhoneNumberService"
import {
  getUserTemplateByType,
  TEMPLATE_TYPES,
  PLACEHOLDER_MAPPINGS,
  replacePlaceholders,
  extractPlaceholders
} from "../../js/templateService"

// Parse phone number from URL param (e.g., "+15105209170" -> { countryCode: "+1", phoneNumber: "5105209170" })
const parsePhoneNumber = (fullNumber) => {
  if (!fullNumber || fullNumber === "") {
    return { countryCode: "+1", phoneNumber: "" }
  }
  
  // Remove all non-digits except leading +
  const cleaned = fullNumber.replace(/[^\d+]/g, "")
  
  // Try to extract country code (common codes: +1, +44, +33, etc.)
  // For simplicity, we'll assume +1 for US/Canada (1 digit) or try to detect
  if (cleaned.startsWith("+1") && cleaned.length > 2) {
    return {
      countryCode: "+1",
      phoneNumber: cleaned.substring(2)
    }
  }
  
  // If starts with + but not +1, try to extract first 1-3 digits as country code
  if (cleaned.startsWith("+")) {
    // Common country codes: 1 digit (+1), 2 digits (+44, +33), 3 digits (+351)
    // For now, we'll be conservative and take first digit after +
    const match = cleaned.match(/^\+(\d{1,3})(\d+)$/)
    if (match) {
      return {
        countryCode: "+" + match[1],
        phoneNumber: match[2]
      }
    }
  }
  
  // Default: assume +1 and treat all as phone number
  const digitsOnly = cleaned.replace(/\+/g, "")
  return {
    countryCode: "+1",
    phoneNumber: digitsOnly
  }
}

export const SendPage = () => {
  const { from: fromParam, to: toParam } = useParams()
  const [phoneNumbers, setPhoneNumbers] = useState([])
  const [from, setFrom] = useState(fromParam ?? "")
  
  // Parse toParam if exists
  const initialTo = parsePhoneNumber(toParam ?? "")
  const [countryCode, setCountryCode] = useState(initialTo.countryCode)
  const [phoneNumber, setPhoneNumber] = useState(initialTo.phoneNumber)
  
  const [message, setMessage] = useState("")
  const [loadingPhoneNumbers, setLoadingPhoneNumbers] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState(null)
  const [authentication] = useAuthentication()
  const [user] = useUser()
  const navigate = useNavigate()

  // Template state
  const [selectedTemplateType, setSelectedTemplateType] = useState(null)
  const [currentTemplate, setCurrentTemplate] = useState(null)
  
  // Load shopname and date from localStorage
  const loadPersistedValues = () => {
    try {
      const savedShopname = localStorage.getItem("twilio_sms_shopname")
      const savedDate = localStorage.getItem("twilio_sms_date")
      return {
        shopname: savedShopname || "",
        date: savedDate || ""
      }
    } catch (e) {
      return { shopname: "", date: "" }
    }
  }
  
  const [placeholderValues, setPlaceholderValues] = useState(() => {
    const persisted = loadPersistedValues()
    return {
      cusname: "",
      shopname: persisted.shopname,
      orderid: "",
      date: persisted.date,
      productname: ""
    }
  })

  // Paste data state
  const [pasteData, setPasteData] = useState("")

  // Load số điện thoại được assign cho user
  useEffect(() => {
    const loadUserPhoneNumber = async () => {
      if (!user?.id) {
        setLoadingPhoneNumbers(false)
        return
      }

      try {
        const userPhone = await getUserPhoneNumber(user.id)
        
        // Nếu user có phone number được assign, chỉ hiển thị số đó
        if (userPhone) {
          setPhoneNumbers([userPhone])
          // Auto select số điện thoại được assign
          setFrom(userPhone)
        } else {
          // Nếu user chưa có phone number được assign, load tất cả số
          const allPhones = await getTwilioPhoneNumbers()
          setPhoneNumbers(allPhones)
        }
      } catch (e) {
        setError(e)
        // Fallback: load tất cả số nếu có lỗi
        try {
          const allPhones = await getTwilioPhoneNumbers()
          setPhoneNumbers(allPhones)
        } catch (err) {
          setError(err)
        }
      } finally {
        setLoadingPhoneNumbers(false)
      }
    }

    loadUserPhoneNumber()
  }, [user?.id])

  // Load template when type is selected
  useEffect(() => {
    const loadTemplate = async () => {
      if (!selectedTemplateType || !user || selectedTemplateType === TEMPLATE_TYPES.OTHERS) {
        setCurrentTemplate(null)
        return
      }

      try {
        const template = await getUserTemplateByType(user.id, selectedTemplateType)
        setCurrentTemplate(template)
        if (template) {
          // Load persisted shopname and date from localStorage
          const persisted = loadPersistedValues()
          // Reset placeholder values when template changes, but preserve cusname, shopname, and date if they were already filled
          setPlaceholderValues(prev => ({
            cusname: prev.cusname || "", // Keep existing cusname if present
            shopname: prev.shopname || persisted.shopname || "", // Keep existing shopname or load from localStorage
            orderid: "",
            date: prev.date || persisted.date || "", // Keep existing date or load from localStorage
            productname: ""
          }))
          setMessage("")
        }
      } catch (err) {
        console.error("Error loading template:", err)
        setCurrentTemplate(null)
      }
    }

    loadTemplate()
  }, [selectedTemplateType, user])

  // Auto-fill message when placeholder values change
  useEffect(() => {
    if (currentTemplate && selectedTemplateType !== TEMPLATE_TYPES.OTHERS) {
      const filledMessage = replacePlaceholders(currentTemplate.content, placeholderValues)
      setMessage(filledMessage)
    }
  }, [placeholderValues, currentTemplate, selectedTemplateType])

  // Combine country code and phone number for full number
  const getFullTo = () => {
    return countryCode + phoneNumber
  }

  const handleCountryCodeChange = e => {
    let val = e.target.value
    // Ensure it starts with +
    if (!val.startsWith("+")) {
      val = "+" + val
    }
    // Only allow + and digits
    val = val.replace(/[^\d+]/g, "")
    // Limit to reasonable length (max 4 chars: +123)
    if (val.length <= 4) {
      setCountryCode(val)
    }
  }

  const handlePhoneNumberChange = e => {
    const val = e.target.value
    // Only allow digits
    const digitsOnly = val.replace(/\D/g, "")
    // Limit to reasonable length (max 15 digits for phone number)
    if (digitsOnly.length <= 15) {
      setPhoneNumber(digitsOnly)
    }
  }

  const handleTemplateTypeChange = type => {
    setSelectedTemplateType(type)
    if (type === TEMPLATE_TYPES.OTHERS) {
      setCurrentTemplate(null)
      setMessage("")
      // Load persisted shopname and date from localStorage
      const persisted = loadPersistedValues()
      // Keep cusname, shopname, and date when switching to Others if they were already filled
      setPlaceholderValues(prev => ({
        cusname: prev.cusname || "", // Keep existing cusname if present
        shopname: prev.shopname || persisted.shopname || "", // Keep existing shopname or load from localStorage
        orderid: "",
        date: prev.date || persisted.date || "", // Keep existing date or load from localStorage
        productname: ""
      }))
    }
  }

  const handlePlaceholderChange = (key, value) => {
    setPlaceholderValues(prev => ({
      ...prev,
      [key]: value
    }))
    
    // Persist shopname and date to localStorage when user changes them
    if (key === "shopname") {
      try {
        if (value) {
          localStorage.setItem("twilio_sms_shopname", value)
        } else {
          localStorage.removeItem("twilio_sms_shopname")
        }
      } catch (e) {
        console.error("Error saving shopname to localStorage:", e)
      }
    }
    if (key === "date") {
      try {
        if (value) {
          localStorage.setItem("twilio_sms_date", value)
        } else {
          localStorage.removeItem("twilio_sms_date")
        }
      } catch (e) {
        console.error("Error saving date to localStorage:", e)
      }
    }
  }

  const handleMessageChange = e => {
    // If Others is selected, allow free editing
    if (selectedTemplateType === TEMPLATE_TYPES.OTHERS) {
      setMessage(e.target.value)
    } else {
      // If template is selected, still allow manual editing but will be overridden by auto-fill
      setMessage(e.target.value)
    }
  }

  // Parse paste data and auto-fill fields
  const parsePasteData = text => {
    if (!text || text.trim() === "") return

    const lines = text.split("\n").map(line => line.trim()).filter(line => line !== "")
    
    // Parse name (first non-empty line that doesn't look like a phone number)
    let name = ""
    if (lines.length > 0) {
      const firstLine = lines[0]
      // Check if first line is not a phone number
      const isPhoneNumber = /[\d\(\)\+]/.test(firstLine) && /\d{7,}/.test(firstLine)
      if (!isPhoneNumber) {
        name = firstLine
      } else if (lines.length > 1) {
        // If first line is phone, try second line
        name = lines[1]
      }
    }

    // Parse phone number - look for patterns like (+1)9173613346 or +19173613346
    let phoneMatch = null
    let countryCodeFound = "+1"
    let phoneNumberFound = ""

    // Try to find phone number in all lines
    for (const line of lines) {
      // Pattern 1: (+1)9173613346 - exact match for this format
      phoneMatch = line.match(/\(\+(\d{1,3})\)(\d{6,15})/)
      if (phoneMatch) {
        countryCodeFound = "+" + phoneMatch[1]
        // Remove all non-digits to get clean phone number
        phoneNumberFound = phoneMatch[2].replace(/\D/g, "")
        break
      }

      // Pattern 2: +19173613346 (no parentheses)
      phoneMatch = line.match(/\+(\d{1,3})(\d{6,15})/)
      if (phoneMatch) {
        countryCodeFound = "+" + phoneMatch[1]
        phoneNumberFound = phoneMatch[2].replace(/\D/g, "")
        break
      }

      // Pattern 3: Any line with numbers that could be a phone (at least 10 digits)
      const digitsOnly = line.replace(/\D/g, "")
      if (digitsOnly.length >= 10) {
        // Try to extract country code (common: 1 for US)
        if (digitsOnly.startsWith("1") && digitsOnly.length === 11) {
          countryCodeFound = "+1"
          phoneNumberFound = digitsOnly.substring(1)
          break
        } else if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
          // Assume +1 for US numbers if no country code detected
          countryCodeFound = "+1"
          phoneNumberFound = digitsOnly.length > 10 ? digitsOnly.substring(digitsOnly.length - 10) : digitsOnly
          break
        }
      }
    }

    // Auto-fill fields
    if (name && name.trim() !== "") {
      // Remove quotes at the beginning and end if present
      let cleanedName = name.trim()
      if ((cleanedName.startsWith('"') && cleanedName.endsWith('"')) ||
          (cleanedName.startsWith("'") && cleanedName.endsWith("'"))) {
        cleanedName = cleanedName.slice(1, -1).trim()
      }
      
      setPlaceholderValues(prev => ({
        ...prev,
        cusname: cleanedName
      }))
    }

    if (phoneNumberFound && phoneNumberFound.length >= 10) {
      setCountryCode(countryCodeFound)
      setPhoneNumber(phoneNumberFound)
    }
  }

  const handlePasteDataChange = e => {
    const text = e.target.value
    setPasteData(text)
    
    // Auto-parse when user pastes data
    if (text) {
      parsePasteData(text)
    }
  }

  const handleFromSelect = phoneNumber => {
    if (from === phoneNumber) {
      // Nếu đã chọn rồi thì bỏ chọn
      setFrom("")
    } else {
      // Chọn số mới
      setFrom(phoneNumber)
    }
  }

  const handleSend = () => {
    if (sendingMessage) return

    setSendingMessage(true)
    const fullTo = getFullTo()
    sendTwilioMessage(authentication, fullTo, from, message)
      .catch(setError)
      .then(messageSid => {
        // After sending, preserve shopname and date (they are already in localStorage)
        // Only reset other fields for next message
        setPlaceholderValues(prev => ({
          cusname: "", // Reset cusname for next message
          shopname: prev.shopname || "", // Keep shopname (already persisted in localStorage)
          orderid: "", // Reset orderid for next message
          date: prev.date || "", // Keep date (already persisted in localStorage)
          productname: "" // Reset productname for next message
        }))
        // Reset message and phone number for next message
        setPhoneNumber("")
        setMessage("")
        navigate(`/sent/${messageSid}`)
      })
      .finally(() => setSendingMessage(false))
  }

  const isValid = () => {
    const isValidFrom = phoneNumbers.includes(from)
    const fullTo = getFullTo()
    // Validate: country code must start with + and have at least 1 digit
    // Phone number must have at least 10 digits (standard phone number length)
    const isValidCountryCode = countryCode.startsWith("+") && countryCode.length >= 2
    const isValidPhoneNumber = phoneNumber.length >= 10
    const isValidTo = isValidCountryCode && isValidPhoneNumber && fullTo.match(phonePattern) !== null
    const isValidMessage = message.length > 0 && message.length < 500
    return !sendingMessage && isValidFrom && isValidTo && isValidMessage
  }

  const fullTo = getFullTo()
  const hint = `Send a message from  ${from === "" ? "?" : from}  to  ${fullTo === "" ? "?" : fullTo}`

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0">
          <h3>Send</h3>
          <p className="my-4">Chọn số điện thoại để gửi tin nhắn.</p>
          <ErrorLabel error={error} className="mb-4" />
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {/* Two Column Layout: Left (From/To) and Right (Paste Data) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Left Column: From and To */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From (Số gửi):</label>
            {loadingPhoneNumbers ? (
              <div className="flex items-center text-gray-500">
                <Loading3QuartersOutlined spin className="mr-2" />
                <span>Đang tải danh sách số điện thoại...</span>
              </div>
            ) : phoneNumbers.length === 0 ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-yellow-700 text-sm">
                  Bạn chưa được phân bổ số điện thoại. Vui lòng liên hệ admin để được phân bổ số điện thoại.
                </p>
              </div>
            ) : phoneNumbers.length === 1 ? (
              // Nếu chỉ có 1 số (đã được assign), hiển thị dạng read-only
              <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded border-2 flex items-center justify-center mr-3 bg-teal-500 border-teal-500">
                    <CheckOutlined className="text-white text-xs" />
                  </div>
                  <span className="text-sm font-semibold text-teal-700">
                    {phoneNumbers[0]}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">(Số điện thoại được phân bổ cho bạn)</span>
                </div>
              </div>
            ) : (
              // Nếu có nhiều số, hiển thị selector
              <div className="border border-gray-300 rounded-md p-3 bg-white max-h-60 overflow-y-auto">
                {phoneNumbers.map(phone => {
                  const isSelected = from === phone
                  return (
                    <div
                      key={phone}
                      onClick={() => !sendingMessage && handleFromSelect(phone)}
                      className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-teal-50 border-2 border-teal-400"
                          : "hover:bg-gray-50 border-2 border-transparent"
                      } ${sendingMessage ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 ${
                          isSelected
                            ? "bg-teal-500 border-teal-500"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && <CheckOutlined className="text-white text-xs" />}
                      </div>
                      <span className={`text-sm ${isSelected ? "font-semibold text-teal-700" : "text-gray-700"}`}>
                        {phone}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
              {from && phoneNumbers.length > 1 && (
                <p className="mt-2 text-sm text-teal-600">
                  Đã chọn: <strong>{from}</strong>
                </p>
              )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To (Số nhận):</label>
            <div className="flex gap-2">
              <div className="flex-shrink-0">
                <input
                  type="text"
                  value={countryCode}
                  onChange={handleCountryCodeChange}
                  placeholder="+1"
                  disabled={sendingMessage}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  maxLength={4}
                />
              </div>
              <div className="flex-1">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  placeholder="5105209170"
                  disabled={sendingMessage}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  maxLength={15}
                />
              </div>
            </div>
                {fullTo && (
                  <p className="mt-1 text-xs text-gray-500">
                    Số đầy đủ: <strong>{fullTo}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Paste Data Section */}
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 h-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste thông tin khách hàng (tùy chọn):
                </label>
                <textarea
                  value={pasteData}
                  onChange={handlePasteDataChange}
                  placeholder="Paste thông tin khách hàng vào đây. Ví dụ:&#10;Rhonda Saunders&#10;(+1)9173613346&#10;1316 Noble Ave Apt 1b&#10;Bronx, New York"
                  disabled={sendingMessage}
                  rows="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm resize-none"
                />
                <p className="mt-2 text-xs text-gray-600">
                  Hệ thống sẽ tự động nhận diện tên và số điện thoại từ dữ liệu paste và điền vào các ô tương ứng.
                </p>
              </div>
            </div>
          </div>

          {/* Template Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại tin nhắn:</label>
            <div className="flex flex-wrap gap-3">
              {Object.values(TEMPLATE_TYPES).map(type => (
                <label
                  key={type}
                  className={`flex items-center cursor-pointer ${
                    sendingMessage ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="templateType"
                    value={type}
                    checked={selectedTemplateType === type}
                    onChange={() => !sendingMessage && handleTemplateTypeChange(type)}
                    disabled={sendingMessage}
                    className="mr-2"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Placeholder Fields - Only show if template is selected and not Others */}
          {selectedTemplateType && selectedTemplateType !== TEMPLATE_TYPES.OTHERS && currentTemplate && (
            <div className="mb-4 bg-teal-50 p-4 rounded-lg border border-teal-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Thông tin đơn hàng:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(PLACEHOLDER_MAPPINGS).map(([key, label]) => {
              // Only show fields that are used in the template
              const placeholders = extractPlaceholders(currentTemplate.content)
              if (!placeholders.includes(key)) return null

              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}:
                  </label>
                  <input
                    type="text"
                    value={placeholderValues[key]}
                    onChange={e => handlePlaceholderChange(key, e.target.value)}
                    placeholder={`Nhập ${label.toLowerCase()}`}
                    disabled={sendingMessage}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              )
            })}
          </div>
              {currentTemplate && (
                <p className="mt-3 text-xs text-gray-600">
                  <strong>Template:</strong> {currentTemplate.name || currentTemplate.type}
                </p>
              )}
            </div>
          )}

          {/* Show message if Others is selected but no template exists */}
          {selectedTemplateType && selectedTemplateType !== TEMPLATE_TYPES.OTHERS && !currentTemplate && (
            <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-sm text-yellow-700">
                Chưa có template cho loại "{selectedTemplateType}". 
                <button
                  onClick={() => navigate("/templates")}
                  className="ml-2 underline font-semibold"
                >
                  Tạo template tại đây
                </button>
                hoặc chọn "Others" để gửi tin nhắn tự do.
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung tin nhắn:</label>
            <textarea
              className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder={
                selectedTemplateType === TEMPLATE_TYPES.OTHERS
                  ? hint
                  : currentTemplate
                  ? "Tin nhắn sẽ tự động điền từ template..."
                  : "Chọn loại tin nhắn để sử dụng template..."
              }
              value={message}
              onChange={handleMessageChange}
              minLength="1"
              maxLength="500"
              disabled={sendingMessage}
              rows="5"
            ></textarea>
            <p className="text-xs font-thin m-0 mt-1">
              Messages must be between 1 and 500 characters. {message.length}/500
            </p>
          </div>
        </div>
        
        {/* Sticky Send Button */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white pt-4 pb-2 mt-4">
          <div className="flex justify-end">
            <button 
              className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              onClick={handleSend} 
              disabled={!isValid()}
            >
              {!sendingMessage && "Send"}
              {sendingMessage && (
                <span className="flex items-center gap-2">
                  <Loading3QuartersOutlined spin="true" />
                  <span>Sending...</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
