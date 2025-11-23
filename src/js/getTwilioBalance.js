import axios from "axios"
import { getAuthentication, toCredentials, Authentication } from "../context/AuthenticationProvider"

/**
 * Get Twilio account balance
 * @param {Authentication} [authentication] - Optional authentication, will use stored auth if not provided
 * @returns {Promise<{balance: string, currency: string}>}
 */
export const getTwilioBalance = async (authentication = null) => {
  const auth = authentication || getAuthentication()
  
  if (!auth || !auth.accountSid) {
    throw new Error("Twilio authentication is required")
  }

  const credentials = toCredentials(auth)
  const url = `https://api.twilio.com/2010-04-01/Accounts/${auth.accountSid}/Balance.json`

  try {
    const response = await axios.get(url, {
      auth: credentials,
    })

    return {
      balance: parseFloat(response.data.balance) || 0,
      currency: response.data.currency || "USD",
    }
  } catch (error) {
    console.error("Error fetching Twilio balance:", error)
    throw new Error(
      error.response?.status === 401
        ? "Unauthorized: Invalid Twilio credentials"
        : `Failed to fetch balance: ${error.message}`
    )
  }
}

/**
 * Format balance for display
 * @param {number} balance
 * @param {string} currency
 * @returns {string}
 */
export const formatBalance = (balance, currency = "USD") => {
  const formattedBalance = Math.round(balance * 100) / 100
  return `${formattedBalance} ${currency}`
}

