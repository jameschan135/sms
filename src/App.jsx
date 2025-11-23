import React from "react"
import { HashRouter, Route, Routes, Navigate } from "react-router-dom"

import { UserProvider } from "./context/UserProvider"
import { AuthenticationProvider } from "./context/AuthenticationProvider"
import { ComposerProvider } from "./context/ComposerProvider"
import { LoginPage } from "./component/LoginPage/LoginPage"
import { DashboardPage } from "./component/DashboardPage/DashboardPage"
import { AdminPage } from "./component/AdminPage/AdminPage"
import { AuthenticationPage } from "./component/AuthenticationPage/AuthenticationPage"
import { AuthenticationAuthTokenPage } from "./component/AuthenticationAuthTokenPage/AuthenticationAuthTokenPage"
import { AuthenticationApiKeyPage } from "./component/AuthenticationApiKeyPage/AuthenticationApiKeyPage"
import { AuthenticatedRoute } from "./component/AuthenticatedRoute/AuthentiatedRoute"
import { UserProtectedRoute, AdminProtectedRoute } from "./component/UserProtectedRoute/UserProtectedRoute"
import { UiPage } from "./component/UiPage/UiPage"
import { NotFoundPage } from "./component/NotFoundPage/NotFoundPage"
import { InboxPage } from "./component/InboxPage/InboxPage"
import { ConversationPage } from "./component/ConversationPage/ConversationPage"
import { SendPage } from "./component/SendPage/SendPage"
import { MassSendPage } from "./component/MassSendPage/MassSendPage"
import { MessagePage } from "./component/MessagePage/MessagePage"
import { SentPage } from "./component/SentPage/SentPage"
import { TemplatePage } from "./component/TemplatePage/TemplatePage"

export const App = () => {
  return (
    <div className="h-full">
      <UserProvider>
        <AuthenticationProvider>
          <ComposerProvider>
            <HashRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route
                  path="/dashboard"
                  element={
                    <UserProtectedRoute>
                      <DashboardPage />
                    </UserProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminPage />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/authentication"
                  element={
                    <UserProtectedRoute>
                      <AuthenticationPage />
                    </UserProtectedRoute>
                  }
                />
                <Route
                  path="/authentication-token"
                  element={
                    <UserProtectedRoute>
                      <AuthenticationAuthTokenPage />
                    </UserProtectedRoute>
                  }
                />
                <Route
                  path="/authentication-api-key"
                  element={
                    <UserProtectedRoute>
                      <AuthenticationApiKeyPage />
                    </UserProtectedRoute>
                  }
                />
                <Route
                  path="/inbox"
                  element={
                    <UserProtectedRoute>
                      <InboxPage />
                    </UserProtectedRoute>
                  }
                />
                <Route
                  path="/message/:messageSid"
                  element={
                    <UserProtectedRoute>
                      <AuthenticatedRoute>
                        <MessagePage />
                      </AuthenticatedRoute>
                    </UserProtectedRoute>
                  }
                />
                <Route
                  path="/sent/:messageSid"
                  element={
                    <UserProtectedRoute>
                      <AuthenticatedRoute>
                        <SentPage />
                      </AuthenticatedRoute>
                    </UserProtectedRoute>
                  }
                />
                <Route
                  path="/conversation/:from/:to"
                  element={
                    <UserProtectedRoute>
                      <AuthenticatedRoute>
                        <ConversationPage />
                      </AuthenticatedRoute>
                    </UserProtectedRoute>
                  }
                />
                <Route
                  path="/send"
                  element={
                    <UserProtectedRoute>
                      <AuthenticatedRoute>
                        <SendPage />
                      </AuthenticatedRoute>
                    </UserProtectedRoute>
                  }
                />
                <Route
                  path="/send/:from/:to"
                  element={
                    <UserProtectedRoute>
                      <AuthenticatedRoute>
                        <SendPage />
                      </AuthenticatedRoute>
                    </UserProtectedRoute>
                  }
                />
                <Route
                  path="/mass-send"
                  element={
                    <UserProtectedRoute>
                      <AuthenticatedRoute>
                        <MassSendPage />
                      </AuthenticatedRoute>
                    </UserProtectedRoute>
                  }
                />
                <Route
                  path="/templates"
                  element={
                    <UserProtectedRoute>
                      <TemplatePage />
                    </UserProtectedRoute>
                  }
                />
                <Route path="/ui" element={<UiPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </HashRouter>
          </ComposerProvider>
        </AuthenticationProvider>
      </UserProvider>
    </div>
  )
}
