import { GithubOutlined, InboxOutlined, SendOutlined, FileTextFilled, UserOutlined, LogoutOutlined, SettingOutlined, FileTextOutlined, DashboardOutlined, NotificationOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { useUser } from "../../context/UserProvider"
import { isAdmin } from "../../context/UserProvider"

const termsAndConditionsUrl = import.meta.env.VITE_TERMS_AND_CONDITIONS_URL
const githubUrl = import.meta.env.VITE_GITHUB_URL

const NavItem = ({ className, children, onClick = () => {} }) => (
  <span
    onClick={onClick}
    className={`h-14 flex flex-col justify-center items-center px-4 hover:bg-violet-700 hover:cursor-pointer ${className}`}
  >
    {children}
  </span>
)

const NavBar = () => {
  const navigate = useNavigate()
  const [user, setUser] = useUser()

  const navigateToInbox = () => {
    navigate("/inbox")
  }

  const navigateToSend = () => {
    navigate("/send")
  }

  const navigateToMassSend = () => {
    navigate("/mass-send")
  }

  const navigateToAdmin = () => {
    navigate("/admin")
  }

  const navigateToTemplates = () => {
    navigate("/templates")
  }

  const navigateToDashboard = () => {
    navigate("/dashboard")
  }

  const handleLogout = () => {
    setUser(null)
    navigate("/login")
  }

  return (
    <>
      <nav className="flex text-white px-1 sm:px-4">
        <div className="flex">
          <NavItem onClick={navigateToInbox}>
            <InboxOutlined className="text-lg" />
            <span className="mt-1">Inbox</span>
          </NavItem>
          <NavItem onClick={navigateToSend}>
            <SendOutlined className="text-lg" />
            <span className="mt-1">Send</span>
          </NavItem>
          <NavItem onClick={navigateToMassSend}>
            <NotificationOutlined className="text-lg" />
            <span className="mt-1">Mass Send</span>
          </NavItem>
          <NavItem onClick={navigateToTemplates}>
            <FileTextOutlined className="text-lg" />
            <span className="mt-1">Templates</span>
          </NavItem>
          {user && (
            <NavItem onClick={navigateToDashboard}>
              <DashboardOutlined className="text-lg" />
              <span className="mt-1">Dashboard</span>
            </NavItem>
          )}
          {user && isAdmin(user) && (
            <NavItem onClick={navigateToAdmin}>
              <SettingOutlined className="text-lg" />
              <span className="mt-1">Admin</span>
            </NavItem>
          )}
        </div>
        <div className="grow flex justify-center items-center text-lg">Twilio SMS Web</div>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <span className="text-sm flex items-center gap-1">
                <UserOutlined />
                {user.name}
              </span>
              <NavItem onClick={handleLogout}>
                <LogoutOutlined className="text-lg" />
                <span className="mt-1">Đăng xuất</span>
              </NavItem>
            </>
          )}
        </div>
      </nav>
    </>
  )
}

const Footer = () => (
  <div className="w-full py-2 text-white flex flex-col items-center text-xs gap-1">
    <a href={githubUrl} className="text-white">
      <span className="block">
        <GithubOutlined />
        <span className="mx-2">GitHub</span>
      </span>
    </a>
    <span className="block">
      <a href={termsAndConditionsUrl} className="text-white">
        <FileTextFilled />
        <span className="mx-2">Terms and Conditions</span>
      </a>
    </span>
  </div>
)

export const Layout = ({ children }) => (
  <div className="flex flex-col min-h-full bg-gray-200">
    <div className="bg-violet-900 flex justify-center">
      <span className="block h-14 w-full max-w-screen-lg">
        <NavBar />
      </span>
    </div>
    <div className="grow flex justify-center">
      <span className="block bg-gray-50 w-full max-w-screen-lg p-1 sm:p-4">{children}</span>
    </div>
    <div className="bg-violet-900">
      <Footer />
    </div>
  </div>
)

export const LayoutWithoutNavBar = ({ children }) => (
  <div className="flex flex-col h-full">
    <div className="flex h-14">
      <div className="bg-violet-900 grow flex justify-center items-center text-lg text-white">Twilio SMS Web</div>
    </div>
    <div className="flex grow">
      <div className="bg-gray-200 grow"></div>
      <div className="bg-gray-100 w-full max-w-screen-md pt-2 pb-4 px-4">{children}</div>
      <div className="bg-gray-200 grow"></div>
    </div>
    <div className="bg-violet-900">
      <Footer />
    </div>
  </div>
)
