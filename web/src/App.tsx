import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import AuthScreen from "./components/AuthScreen";
import Sidebar from "./components/Sidebar";
import { getAuthStatus, logout } from "./lib/api";
import type { AuthStatus } from "./lib/types";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Review = lazy(() => import("./pages/Review"));
const Prompts = lazy(() => import("./pages/Prompts"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Punishments = lazy(() => import("./pages/Punishments"));
const Finance = lazy(() => import("./pages/Finance"));
const Settings = lazy(() => import("./pages/Settings"));
const Health = lazy(() => import("./pages/Health"));
const Exercise = lazy(() => import("./pages/Exercise"));

const Loading = () => (
  <div className="page">
    <div className="card">加载中...</div>
  </div>
);

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "连接失败，请稍后再试。";
}

export default function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadAuthStatus = useCallback(async () => {
    setAuthLoading(true);
    try {
      const status = await getAuthStatus();
      setAuthStatus(status);
      setAuthError(null);
    } catch (error) {
      setAuthStatus(null);
      setAuthError(getErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAuthStatus();
  }, [loadAuthStatus]);

  const handleAuthenticated = useCallback((status: AuthStatus) => {
    setAuthStatus(status);
    setAuthError(null);
  }, []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
      const status = await getAuthStatus();
      setAuthStatus(status);
      setAuthError(null);
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setLoggingOut(false);
    }
  }, []);

  if (authLoading && !authStatus) {
    return (
      <div className="auth-shell">
        <section className="auth-card">
          <div className="card auth-panel">
            <div className="card-title">正在连接认证服务...</div>
            <div className="card-subtitle">我们先确认当前浏览器里的 Passkey 会话状态。</div>
          </div>
        </section>
      </div>
    );
  }

  if (!authStatus?.authenticated) {
    return (
      <AuthScreen
        status={authStatus}
        systemError={authError}
        onAuthenticated={handleAuthenticated}
        onRetry={loadAuthStatus}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar userName={authStatus.userName} loggingOut={loggingOut} onLogout={handleLogout} />
      <main className="main-shell">
        {authError ? (
          <div className="card auth-inline-error">
            <strong>提示：</strong>
            {authError}
          </div>
        ) : null}
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/review" element={<Review />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/punishments" element={<Punishments />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/exercise" element={<Exercise />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/health" element={<Health />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
