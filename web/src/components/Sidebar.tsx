import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/", label: "总览", desc: "系统预览" },
  { path: "/tasks", label: "今日任务", desc: "打卡与日程" },
  { path: "/review", label: "每日复盘", desc: "复盘与记录" },
  { path: "/prompts", label: "引导问题", desc: "问题库" },
  { path: "/rewards", label: "激励页面", desc: "奖励机制" },
  { path: "/punishments", label: "惩罚页面", desc: "约束机制" },
  { path: "/finance", label: "理财管理", desc: "支出与收入" },
  { path: "/exercise", label: "锻炼管理", desc: "运动与饮食" },
  { path: "/settings", label: "设置", desc: "备份与恢复" },
  { path: "/health", label: "系统健康", desc: "风险提示" },
];

type SidebarProps = {
  userName?: string | null;
  loggingOut?: boolean;
  onLogout?: () => void;
};

export default function Sidebar({ userName, loggingOut = false, onLogout }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">人生逆袭系统</div>
        <div className="sidebar-subtitle">行为 → 复盘 → 统计 → 改进</div>
      </div>
      <nav className="nav-section">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <span>{item.label}</span>
            <small>{item.desc}</small>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <strong>{userName || "已登录用户"}</strong>
          <small>Passkey 会话已生效</small>
        </div>
        <button
          type="button"
          className="btn btn-ghost sidebar-logout"
          onClick={onLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "退出中..." : "退出登录"}
        </button>
      </div>
    </aside>
  );
}
