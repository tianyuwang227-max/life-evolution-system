import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import Topbar from "../components/Topbar";
import PageTransition from "../components/PageTransition";
import { formatMonthLabel, todayISO } from "../lib/date";
import { getSummary, getTrends, listTasks, listSchedule, getReport } from "../lib/api";
import type { Summary, Trends, Task, ScheduleBlock, ReportSummary } from "../lib/types";

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [weekReport, setWeekReport] = useState<ReportSummary | null>(null);
  const [monthReport, setMonthReport] = useState<ReportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = () => {
    const date = todayISO();
    Promise.all([
      getSummary(date),
      getTrends(30),
      listTasks(date),
      listSchedule(date),
      getReport(7, date),
      getReport(30, date),
    ])
      .then(([summaryData, trendsData, taskRes, scheduleRes, weekData, monthData]) => {
        setSummary(summaryData);
        setTrends(trendsData);
        setTasks(taskRes.items);
        setSchedule(scheduleRes.items);
        setWeekReport(weekData);
        setMonthReport(monthData);
      })
      .catch((err) => setError(String(err)));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const chartData = useMemo(() => {
    if (!trends) return [] as Array<Record<string, unknown>>;
    const map = new Map<string, Record<string, unknown>>();

    trends.finance.forEach((item) => {
      map.set(item.date, {
        date: item.date,
        expense: Number(item.expense || 0),
        income: Number(item.income || 0),
      });
    });

    trends.reviews.forEach((item) => {
      const current = map.get(item.date) || { date: item.date };
      map.set(item.date, {
        ...current,
        mood: item.mood_score ?? null,
        study: item.study_minutes ?? null,
      });
    });

    trends.tasks.forEach((item) => {
      const current = map.get(item.date) || { date: item.date };
      const rate = item.total ? Math.round((item.done / item.total) * 100) : 0;
      map.set(item.date, {
        ...current,
        completion: rate,
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
  }, [trends]);

  const insights = useMemo(() => {
    if (!summary) return [];
    const items: string[] = [];
    const rate = summary.tasks.total
      ? Math.round((summary.tasks.done / summary.tasks.total) * 100)
      : 0;

    if (rate < 60) {
      items.push("任务完成率偏低，建议把今日任务控制在 3-5 件核心事项。");
    } else {
      items.push("今日执行力不错，保持任务颗粒度和节奏。");
    }

    const study = summary.review?.study_minutes || 0;
    if (study < 60) {
      items.push("学习时长不足 60 分钟，试试为明天预留一个固定时间块。");
    }

    const mood = summary.review?.mood_score || 0;
    if (mood <= 2) {
      items.push("情绪偏低，建议回顾触发点并安排一次恢复性活动。");
    }

    const pro = summary.review?.procrastinated || 0;
    if (pro >= 2) {
      items.push("拖延明显，尝试把任务拆成 25 分钟可完成的小步。");
    }

    if (items.length === 0) {
      items.push("状态稳定，继续保持记录与复盘节奏。");
    }
    return items;
  }, [summary]);



  const focusTasks = tasks.filter((item) => !item.done).slice(0, 3);
  const nextBlocks = schedule.slice(0, 4);

  const taskRate = summary?.tasks.total
    ? Math.round((summary.tasks.done / summary.tasks.total) * 100)
    : 0;

  return (
    <PageTransition>
      <div className="page">
        <Topbar title="总览" subtitle="今日动作与长期趋势一目了然" />

        {error ? (
          <div className="card">连接失败：{error}</div>
        ) : null}

        <div className="grid grid-3">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">今日完成率</div>
                <div className="card-subtitle">任务完成情况</div>
              </div>
              <span className="tag">行动</span>
            </div>
            <div className="stat-value">{taskRate}%</div>
            <div className="stat-label">
              完成 {summary?.tasks.done || 0} / {summary?.tasks.total || 0}
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">学习时长</div>
                <div className="card-subtitle">今日累计</div>
              </div>
              <span className="tag">成长</span>
            </div>
            <div className="stat-value">{summary?.review?.study_minutes || 0} 分钟</div>
            <div className="stat-label">保持复利节奏</div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">情绪状态</div>
                <div className="card-subtitle">今日评分</div>
              </div>
              <span className="tag">情绪</span>
            </div>
            <div className="stat-value">{summary?.review?.mood_score || 0} / 5</div>
            <div className="stat-label">识别触发源，保持稳定</div>
          </div>
        </div>

        <div className="grid grid-3">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">今日支出</div>
                <div className="card-subtitle">人民币</div>
              </div>
              <span className="badge">现金流</span>
            </div>
            <div className="stat-value">¥ {summary?.finance.todayExpense || 0}</div>
            <div className="stat-label">今日收入 ¥ {summary?.finance.todayIncome || 0}</div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">本月花费</div>
                <div className="card-subtitle">{formatMonthLabel(todayISO().slice(0, 7))}</div>
              </div>
              <span className="badge">月度</span>
            </div>
            <div className="stat-value">¥ {summary?.finance.monthExpense || 0}</div>
            <div className="stat-label">本月收入 ¥ {summary?.finance.monthIncome || 0}</div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">总存款</div>
                <div className="card-subtitle">含初始存款</div>
              </div>
              <span className="badge">储蓄率</span>
            </div>
            <div className="stat-value">¥ {summary?.finance.savings || 0}</div>
            <div className="stat-label">
              储蓄率 {summary?.finance.savingsRate === null ? "--" : summary?.finance.savingsRate.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="hero-panel">
          <div className="card-title">行为改进闭环</div>
          <div className="flow">
            <div className="flow-step">用户行动</div>
            <div className="flow-step">记录数据</div>
            <div className="flow-step">每日复盘</div>
            <div className="flow-step">长期统计</div>
            <div className="flow-step">行为改进</div>
          </div>
        </div>


        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">今日聚焦</div>
                <div className="card-subtitle">最重要的 3 件事</div>
              </div>
              <span className="tag">行动</span>
            </div>
            <div className="list">
              {focusTasks.length === 0 ? (
                <div className="muted">暂无未完成任务。</div>
              ) : (
                focusTasks.map((task) => (
                  <div key={task.id} className="list-item">
                    <strong>{task.title}</strong>
                    <span className="badge">优先级 {task.priority}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">今日节奏</div>
                <div className="card-subtitle">时间块预览</div>
              </div>
              <span className="tag">节奏</span>
            </div>
            <div className="list">
              {nextBlocks.length === 0 ? (
                <div className="muted">还没有时间安排。</div>
              ) : (
                nextBlocks.map((block) => (
                  <div key={block.id} className="list-item">
                    <strong>
                      {block.start_time} - {block.end_time}
                    </strong>
                    <span className="muted">{block.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">自动建议（规则版）</div>
                <div className="card-subtitle">基于今日与近期数据</div>
              </div>
              <span className="tag">行动建议</span>
            </div>
            <div className="list">
              {insights.map((item, index) => (
                <div key={index} className="list-item">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">周 / 月总结（规则版）</div>
                <div className="card-subtitle">最近 7 天 & 30 天</div>
              </div>
              <span className="tag">趋势</span>
            </div>
              <div className="list">
              <div className="list-item">
                <div>
                  <strong>近 7 天</strong>
                  <div className="muted">
                    平均情绪 {weekReport?.review.avgMood || 0} / 5 · 平均学习 {weekReport?.review.avgStudy || 0} 分钟 · 完成率 {weekReport?.tasks.avgCompletion || 0}% · 支出 ¥ {weekReport?.finance.totalExpense || 0}
                  </div>
                </div>
              </div>
              <div className="list-item">
                <div>
                  <strong>近 30 天</strong>
                  <div className="muted">
                    平均情绪 {monthReport?.review.avgMood || 0} / 5 · 平均学习 {monthReport?.review.avgStudy || 0} 分钟 · 完成率 {monthReport?.tasks.avgCompletion || 0}% · 支出 ¥ {monthReport?.finance.totalExpense || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">情绪 · 学习趋势</div>
                <div className="card-subtitle">最近 30 天</div>
              </div>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="mood" stroke="#0f766e" strokeWidth={2} />
                  <Line type="monotone" dataKey="study" stroke="#c2410c" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">财务趋势</div>
                <div className="card-subtitle">最近 30 天</div>
              </div>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="income" stroke="#0f4c81" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" stroke="#b91c1c" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">AI 复盘分析（占位）</div>
              <div className="card-subtitle">基于记录自动生成行为建议</div>
            </div>
            <span className="tag">待接入</span>
          </div>
          <div className="muted">
            当前阶段将通过规则模板输出：拖延高峰、情绪波动原因、时间消耗热点与改进建议。
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
