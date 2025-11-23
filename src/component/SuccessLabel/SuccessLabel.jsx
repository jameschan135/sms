export const SuccessLabel = ({ success, text }) => {
  const message = success || text
  if (message !== null && message !== undefined && message.length > 0) {
    return (
      <div className="bg-green-100 border-green-800 border p-2 rounded mb-4">
        <span className="text-green-800">{message}</span>
      </div>
    )
  }
  return null
}
