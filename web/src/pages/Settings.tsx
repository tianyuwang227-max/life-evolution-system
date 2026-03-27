import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import PageTransition from "../components/PageTransition";
import Topbar from "../components/Topbar";
import { exportData, importData } from "../lib/api";
import type { ExportPayload } from "../lib/types";

export default function Settings() {
  const [exporting, setExporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"overwrite" | "merge">("overwrite");
  const [pendingImport, setPendingImport] = useState<ExportPayload | null>(null);
  const [pendingStats, setPendingStats] = useState<{
    tasks: number;
    schedule: number;
    reviews: number;
    prompts: number;
    rewards: number;
    punishments: number;
    finance: number;
    exercise: number;
    diet: number;
    settings: number;
  } | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImportMessage(null);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const payload = await exportData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `life-evolution-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const escapeCsv = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, "\"\"")}"`;
    }
    return text;
  };

  const downloadCsv = (filename: string, header: string[], rows: Array<Array<string | number | null>>) => {
    const csv = [header.join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportFinanceCsv = async () => {
    setExportingCsv(true);
    try {
      const payload = await exportData();
      const rows = payload.data.finance_records || [];
      const header = ["id", "date", "type", "amount", "category", "note"];
      const data = rows.map((row) => [
        row.id,
        row.date,
        row.type,
        row.amount,
        row.category,
        row.note || "",
      ]);
      downloadCsv(
        `life-evolution-finance-${new Date().toISOString().slice(0, 10)}.csv`,
        header,
        data
      );
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportTasksCsv = async () => {
    setExportingCsv(true);
    try {
      const payload = await exportData();
      const rows = payload.data.tasks || [];
      const header = ["id", "date", "title", "done", "priority", "note"];
      const data = rows.map((row) => [
        row.id,
        row.date,
        row.title,
        row.done,
        row.priority,
        row.note || "",
      ]);
      downloadCsv(
        `life-evolution-tasks-${new Date().toISOString().slice(0, 10)}.csv`,
        header,
        data
      );
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportScheduleCsv = async () => {
    setExportingCsv(true);
    try {
      const payload = await exportData();
      const rows = payload.data.schedule_blocks || [];
      const header = ["id", "date", "start_time", "end_time", "title", "note"];
      const data = rows.map((row) => [
        row.id,
        row.date,
        row.start_time,
        row.end_time,
        row.title,
        row.note || "",
      ]);
      downloadCsv(
        `life-evolution-schedule-${new Date().toISOString().slice(0, 10)}.csv`,
        header,
        data
      );
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportReviewsCsv = async () => {
    setExportingCsv(true);
    try {
      const payload = await exportData();
      const rows = payload.data.daily_reviews || [];
      const header = [
        "id",
        "date",
        "did_what",
        "tasks_done",
        "study_minutes",
        "procrastinated",
        "mood_score",
        "good_things",
        "why_good",
        "repeat_next",
        "biggest_problem",
        "root_cause",
        "tomorrow_plan",
        "happiest_moment",
        "lowest_moment",
        "triggers",
        "spent_amount",
        "spent_value",
      ];
      const data = rows.map((row) => [
        row.id,
        row.date,
        row.did_what || "",
        row.tasks_done || "",
        row.study_minutes || "",
        row.procrastinated || "",
        row.mood_score || "",
        row.good_things || "",
        row.why_good || "",
        row.repeat_next || "",
        row.biggest_problem || "",
        row.root_cause || "",
        row.tomorrow_plan || "",
        row.happiest_moment || "",
        row.lowest_moment || "",
        row.triggers || "",
        row.spent_amount || "",
        row.spent_value || "",
      ]);
      downloadCsv(
        `life-evolution-reviews-${new Date().toISOString().slice(0, 10)}.csv`,
        header,
        data
      );
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportExerciseCsv = async () => {
    setExportingCsv(true);
    try {
      const payload = await exportData();
      const rows = payload.data.exercise_logs || [];
      const header = ["id", "date", "duration_minutes", "type", "note"];
      const data = rows.map((row) => [
        row.id,
        row.date,
        row.duration_minutes,
        row.type || "",
        row.note || "",
      ]);
      downloadCsv(
        `life-evolution-exercise-${new Date().toISOString().slice(0, 10)}.csv`,
        header,
        data
      );
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportDietCsv = async () => {
    setExportingCsv(true);
    try {
      const payload = await exportData();
      const rows = payload.data.diet_logs || [];
      const header = ["id", "date", "meal", "calories", "note"];
      const data = rows.map((row) => [
        row.id,
        row.date,
        row.meal,
        row.calories,
        row.note || "",
      ]);
      downloadCsv(
        `life-evolution-diet-${new Date().toISOString().slice(0, 10)}.csv`,
        header,
        data
      );
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportAllCsv = async () => {
    setExportingCsv(true);
    try {
      const payload = await exportData();
      const sections: Array<{ name: string; header: string[]; rows: Array<Array<string | number | null>> }> = [
        {
          name: "tasks",
          header: ["id", "date", "title", "done", "priority", "note"],
          rows: (payload.data.tasks || []).map((row) => [
            row.id,
            row.date,
            row.title,
            row.done,
            row.priority,
            row.note || "",
          ]),
        },
        {
          name: "schedule",
          header: ["id", "date", "start_time", "end_time", "title", "note"],
          rows: (payload.data.schedule_blocks || []).map((row) => [
            row.id,
            row.date,
            row.start_time,
            row.end_time,
            row.title,
            row.note || "",
          ]),
        },
        {
          name: "reviews",
          header: [
            "id",
            "date",
            "did_what",
            "tasks_done",
            "study_minutes",
            "procrastinated",
            "mood_score",
            "good_things",
            "why_good",
            "repeat_next",
            "biggest_problem",
            "root_cause",
            "tomorrow_plan",
            "happiest_moment",
            "lowest_moment",
            "triggers",
            "spent_amount",
            "spent_value",
          ],
          rows: (payload.data.daily_reviews || []).map((row) => [
            row.id,
            row.date,
            row.did_what || "",
            row.tasks_done || "",
            row.study_minutes || "",
            row.procrastinated || "",
            row.mood_score || "",
            row.good_things || "",
            row.why_good || "",
            row.repeat_next || "",
            row.biggest_problem || "",
            row.root_cause || "",
            row.tomorrow_plan || "",
            row.happiest_moment || "",
            row.lowest_moment || "",
            row.triggers || "",
            row.spent_amount || "",
            row.spent_value || "",
          ]),
        },
        {
          name: "finance",
          header: ["id", "date", "type", "amount", "category", "note"],
          rows: (payload.data.finance_records || []).map((row) => [
            row.id,
            row.date,
            row.type,
            row.amount,
            row.category,
            row.note || "",
          ]),
        },
        {
          name: "exercise",
          header: ["id", "date", "duration_minutes", "type", "note"],
          rows: (payload.data.exercise_logs || []).map((row) => [
            row.id,
            row.date,
            row.duration_minutes,
            row.type || "",
            row.note || "",
          ]),
        },
        {
          name: "diet",
          header: ["id", "date", "meal", "calories", "note"],
          rows: (payload.data.diet_logs || []).map((row) => [
            row.id,
            row.date,
            row.meal,
            row.calories,
            row.note || "",
          ]),
        },
      ];

      const content = sections
        .map((section) => {
          const header = section.header.join(",");
          const rows = section.rows.map((row) => row.map(escapeCsv).join(","));
          return [`# ${section.name}`, header, ...rows].join("\n");
        })
        .join("\n\n");

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `life-evolution-all-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleImportClick = () => {
    setImportMessage(null);
    fileRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!payload?.data) {
        throw new Error("备份格式不正确");
      }
      const data = payload.data;
      setPendingImport(payload);
      setPendingStats({
        tasks: data.tasks?.length || 0,
        schedule: data.schedule_blocks?.length || 0,
        reviews: data.daily_reviews?.length || 0,
        prompts: data.prompts?.length || 0,
        rewards: data.rewards?.length || 0,
        punishments: data.punishments?.length || 0,
        finance: data.finance_records?.length || 0,
        exercise: data.exercise_logs?.length || 0,
        diet: data.diet_logs?.length || 0,
        settings: data.settings?.length || 0,
      });
      setPendingName(file.name);
      setImportMessage("备份已读取，请确认是否覆盖导入。");
    } catch (err) {
      setImportMessage(`导入失败：${String(err)}`);
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    setImporting(true);
    setImportMessage(null);
    try {
      await importData(pendingImport, importMode);
      setImportMessage(
        importMode === "merge"
          ? "合并导入完成，建议回到总览查看。"
          : "覆盖导入完成，建议回到总览查看。"
      );
      setPendingImport(null);
      setPendingStats(null);
      setPendingName(null);
    } catch (err) {
      setImportMessage(`导入失败：${String(err)}`);
    } finally {
      setImporting(false);
    }
  };

  const cancelImport = () => {
    setPendingImport(null);
    setPendingStats(null);
    setPendingName(null);
    setImportMessage("已取消导入。");
  };

  return (
    <PageTransition>
      <div className="page">
        <Topbar title="设置" subtitle="数据管理与备份" />

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">数据导出</div>
                <div className="card-subtitle">JSON 备份 + CSV 快速分析</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
                  {exporting ? "导出中..." : "导出 JSON"}
                </button>
                <button className="btn btn-ghost" onClick={handleExportFinanceCsv} disabled={exportingCsv}>
                  {exportingCsv ? "生成中..." : "理财 CSV"}
                </button>
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={handleExportTasksCsv} disabled={exportingCsv}>
                {exportingCsv ? "生成中..." : "任务 CSV"}
              </button>
              <button className="btn btn-ghost" onClick={handleExportScheduleCsv} disabled={exportingCsv}>
                {exportingCsv ? "生成中..." : "时间安排 CSV"}
              </button>
              <button className="btn btn-ghost" onClick={handleExportReviewsCsv} disabled={exportingCsv}>
                {exportingCsv ? "生成中..." : "复盘 CSV"}
              </button>
              <button className="btn btn-ghost" onClick={handleExportExerciseCsv} disabled={exportingCsv}>
                {exportingCsv ? "生成中..." : "锻炼 CSV"}
              </button>
              <button className="btn btn-ghost" onClick={handleExportDietCsv} disabled={exportingCsv}>
                {exportingCsv ? "生成中..." : "饮食 CSV"}
              </button>
              <button className="btn btn-ghost" onClick={handleExportAllCsv} disabled={exportingCsv}>
                {exportingCsv ? "生成中..." : "一键导出"}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">数据导入</div>
                <div className="card-subtitle">恢复历史备份</div>
              </div>
              <button className="btn btn-ghost" onClick={handleImportClick} disabled={importing}>
                {importing ? "导入中..." : "选择备份"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                style={{ display: "none" }}
                onChange={handleImportFile}
              />
            </div>
            <div className="form-row" style={{ marginTop: 8 }}>
              <select
                className="select"
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as "overwrite" | "merge")}
              >
                <option value="overwrite">覆盖导入（清空现有数据）</option>
                <option value="merge">合并导入（追加/更新）</option>
              </select>
              <div className="muted" style={{ padding: "8px 4px" }}>
                覆盖会清空现有数据，合并将保留已有记录。
              </div>
            </div>
          </div>
        </div>

        {importMessage ? <div className="card">{importMessage}</div> : null}

        {pendingStats ? (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">导入预览</div>
                <div className="card-subtitle">备份文件：{pendingName}</div>
              </div>
              <span className="tag">{importMode === "merge" ? "合并导入" : "覆盖导入"}</span>
            </div>
            <div className="grid grid-3">
              <div className="list-item"><strong>任务</strong><span>{pendingStats.tasks}</span></div>
              <div className="list-item"><strong>时间安排</strong><span>{pendingStats.schedule}</span></div>
              <div className="list-item"><strong>复盘</strong><span>{pendingStats.reviews}</span></div>
              <div className="list-item"><strong>引导问题</strong><span>{pendingStats.prompts}</span></div>
              <div className="list-item"><strong>激励</strong><span>{pendingStats.rewards}</span></div>
              <div className="list-item"><strong>惩罚</strong><span>{pendingStats.punishments}</span></div>
              <div className="list-item"><strong>收支记录</strong><span>{pendingStats.finance}</span></div>
              <div className="list-item"><strong>锻炼</strong><span>{pendingStats.exercise}</span></div>
              <div className="list-item"><strong>饮食</strong><span>{pendingStats.diet}</span></div>
              <div className="list-item"><strong>设置项</strong><span>{pendingStats.settings}</span></div>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={confirmImport} disabled={importing}>
                确认导入
              </button>
              <button className="btn btn-ghost" onClick={cancelImport} disabled={importing}>
                取消
              </button>
              <span className="muted" style={{ alignSelf: "center" }}>
                导入将覆盖现有数据，请确认。
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </PageTransition>
  );
}
