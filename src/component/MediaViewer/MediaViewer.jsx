import "./MediaViewer.css"
import { useEffect, useState } from "react"
import { getTwilioMedia } from "../../js/getTwilioMedia"
import { LoadingOutlined } from "@ant-design/icons"
import { isEmpty } from "../../js/util"
import { useIsMounted } from "../../js/useIsMounted"
import { ErrorLabel } from "../ErrorLabel/ErrorLabel"

const Loading = () => (
  <div className="message-viewer-loading">
    <LoadingOutlined className="text-primary" />
    <span className="message-viewer-loading-text">Loading media...</span>
  </div>
)

export const MediaViewer = ({ messageSid = "", thumbnail = false }) => {
  const [loading, setLoading] = useState(true)
  const [media, setMedia] = useState([])
  const [error, setError] = useState(null)
  const isMounted = useIsMounted()

  useEffect(() => {
    setLoading(true)
    setError(null)
    getTwilioMedia(messageSid)
      .then(m => {
        setMedia(m)
        setError(null)
      })
      .catch(err => {
        console.error("Failed to load media:", err)
        setError(err)
        setMedia([])
      })
      .finally(() => setLoading(false))
  }, [isMounted, messageSid])

  if (loading) {
    return <Loading />
  }

  if (error) {
    return <ErrorLabel error={error} className="text-sm" />
  }

  if (isEmpty(media)) {
    return null
  }

  return (
    <>
      {media.map(m => (
        <img
          className={`message-viewer-content ${thumbnail ? "thumbnail" : ""}`}
          key={m}
          src={m}
          alt="Attached media file (MMS)"
        />
      ))}
    </>
  )
}
