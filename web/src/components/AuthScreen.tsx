import { useEffect, useMemo, useState } from "react";
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import {
  createPasskeyLoginOptions,
  createPasskeyRegistrationOptions,
  verifyPasskeyLogin,
  verifyPasskeyRegistration,
} from "../lib/api";
import type { AuthStatus } from "../lib/types";

type AuthScreenProps = {
  status: AuthStatus | null;
  systemError?: string | null;
  onAuthenticated: (status: AuthStatus) => void;
  onRetry: () => void;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "认证失败，请稍后再试。";
}

export default function AuthScreen({
  status,
  systemError,
  onAuthenticated,
  onRetry,
}: AuthScreenProps) {
  const supportsPasskey = useMemo(() => browserSupportsWebAuthn(), []);
  const [userName, setUserName] = useState(status?.userName ?? "");
  const [bootstrapSecret, setBootstrapSecret] = useState("");
  const [pending, setPending] = useState<"register" | "login" | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (status?.userName) {
      setUserName((current) => current || status.userName || "");
    }
  }, [status?.userName]);

  useEffect(() => {
    setLocalError(systemError ?? null);
  }, [systemError]);

  const handleRegister = async () => {
    setPending("register");
    setLocalError(null);
    try {
      const options = await createPasskeyRegistrationOptions({
        userName: userName.trim(),
        bootstrapSecret: bootstrapSecret.trim(),
      });
      const response = await startRegistration({ optionsJSON: options.options });
      const nextStatus = await verifyPasskeyRegistration({
        flowId: options.flowId,
        response,
      });
      onAuthenticated(nextStatus);
    } catch (error) {
      setLocalError(getErrorMessage(error));
    } finally {
      setPending(null);
    }
  };

  const handleLogin = async () => {
    setPending("login");
    setLocalError(null);
    try {
      const options = await createPasskeyLoginOptions();
      const response = await startAuthentication({ optionsJSON: options.options });
      const nextStatus = await verifyPasskeyLogin({
        flowId: options.flowId,
        response,
      });
      onAuthenticated(nextStatus);
    } catch (error) {
      setLocalError(getErrorMessage(error));
    } finally {
      setPending(null);
    }
  };

  if (!status) {
    return (
      <div className="auth-shell">
        <section className="auth-card">
          <div className="auth-hero">
            <span className="tag">系统连接</span>
            <h1 className="auth-title">人生逆袭系统</h1>
            <p className="auth-lead">
              认证后，网页和 Safari Web App 都会在自己的容器里保存会话。我们先把连接状态恢复好，再继续做 Passkey 登录。
            </p>
          </div>
          <div className="card auth-panel">
            <div className="card-header">
              <div>
                <div className="card-title">暂时连不上后台</div>
                <div className="card-subtitle">通常是 API 地址、CORS 或部署还没完全对齐。</div>
              </div>
            </div>
            <p className="auth-error">{localError || "无法获取认证状态。"}</p>
            <div className="auth-actions">
              <button type="button" className="btn btn-primary" onClick={onRetry}>
                重新检测
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <div className="auth-hero">
          <span className="tag">{status.hasPasskey ? "Passkey 登录" : "首次设置"}</span>
          <h1 className="auth-title">人生逆袭系统</h1>
          <p className="auth-lead">
            这套认证现在完全走你自己的站内会话：用 Passkey 验证身份，Worker 下发会话 Cookie，不再依赖 Cloudflare Access。
          </p>
        </div>

        <div className="auth-columns">
          <div className="card auth-panel">
            <div className="card-header">
              <div>
                <div className="card-title">
                  {status.hasPasskey ? "欢迎回来" : "创建你的专属 Passkey"}
                </div>
                <div className="card-subtitle">
                  {status.hasPasskey
                    ? "在当前浏览器或 Safari 网页 App 里完成一次验证，就会保存独立登录状态。"
                    : "第一次注册时需要 Bootstrap Secret，避免陌生人抢先绑定账号。"}
                </div>
              </div>
            </div>

            {!supportsPasskey ? (
              <p className="auth-error">
                当前环境不支持 Passkey/WebAuthn。请改用 Safari、Chrome 或 Edge 的较新版本。
              </p>
            ) : status.hasPasskey ? (
              <div className="auth-stack">
                <div className="auth-note">
                  <strong>{status.userName || "已配置用户"}</strong>
                  <span>使用 Touch ID、Face ID 或系统钥匙串即可完成登录。</span>
                </div>
                <div className="auth-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleLogin}
                    disabled={pending !== null}
                  >
                    {pending === "login" ? "正在唤起 Passkey..." : "使用 Passkey 登录"}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={onRetry} disabled={pending !== null}>
                    重新检测状态
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-stack">
                <label className="auth-field">
                  <span>显示名称</span>
                  <input
                    className="input"
                    value={userName}
                    onChange={(event) => setUserName(event.target.value)}
                    placeholder="例如：Clay"
                    autoComplete="username webauthn"
                  />
                </label>
                <label className="auth-field">
                  <span>Bootstrap Secret</span>
                  <input
                    className="input"
                    type="password"
                    value={bootstrapSecret}
                    onChange={(event) => setBootstrapSecret(event.target.value)}
                    placeholder="输入你配置在 Worker 里的密钥"
                  />
                </label>
                <div className="auth-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleRegister}
                    disabled={pending !== null}
                  >
                    {pending === "register" ? "正在创建 Passkey..." : "创建我的 Passkey"}
                  </button>
                </div>
              </div>
            )}

            {localError ? <p className="auth-error">{localError}</p> : null}
          </div>

          <div className="card auth-panel auth-side">
            <div className="card-header">
              <div>
                <div className="card-title">这次认证会发生什么</div>
                <div className="card-subtitle">流程清楚了，后面就会很顺。</div>
              </div>
            </div>
            <div className="auth-stack">
              <div className="auth-note">
                <strong>1. 浏览器弹出系统验证</strong>
                <span>Safari 会调用 Touch ID / Face ID / iCloud 钥匙串里的 Passkey。</span>
              </div>
              <div className="auth-note">
                <strong>2. Worker 校验签名</strong>
                <span>服务端会验证挑战值、来源域名和凭证计数器。</span>
              </div>
              <div className="auth-note">
                <strong>3. 下发会话 Cookie</strong>
                <span>当前浏览器或这个 Safari Web App 会单独保存登录状态。</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
