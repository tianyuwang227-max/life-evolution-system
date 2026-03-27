import type { ReactNode } from "react";
import { formatDateLabel, todayISO } from "../lib/date";

type TopbarProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  dateLabel?: string;
};

export default function Topbar({ title, subtitle, action, dateLabel }: TopbarProps) {
  const label = dateLabel ?? `今天 ${formatDateLabel(todayISO())}`;
  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle ? <div className="topbar-meta">{subtitle}</div> : null}
      </div>
      <div className="topbar-meta">
        <span>{label}</span>
        {action}
      </div>
    </div>
  );
}
