import { useEffect, useState } from "react";
import PageTransition from "../components/PageTransition";
import Topbar from "../components/Topbar";
import { formatDateLabel, todayISO } from "../lib/date";
import { getReview, createReview, updateReview } from "../lib/api";
import { moodOptions, procrastinationOptions } from "../lib/constants";
import type { DailyReview } from "../lib/types";

const defaultReview: Partial<DailyReview> = {
  did_what: "",
  tasks_done: "",
  study_minutes: 0,
  procrastinated: 0,
  mood_score: 3,
  good_things: "",
  why_good: "",
  repeat_next: "",
  biggest_problem: "",
  root_cause: "",
  tomorrow_plan: "",
  happiest_moment: "",
  lowest_moment: "",
  triggers: "",
  spent_amount: 0,
  spent_value: "投资自己",
};

export default function Review() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [review, setReview] = useState<Partial<DailyReview>>(defaultReview);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getReview(selectedDate).then((res) => {
      if (res.review) {
        setReview(res.review);
        setReviewId(res.review.id);
      } else {
        setReview({ ...defaultReview });
        setReviewId(null);
      }
    });
  }, [selectedDate]);

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setMessage(null);
  };

  const updateField = (key: keyof DailyReview, value: unknown) => {
    setReview((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setMessage(null);
    if (reviewId) {
      await updateReview(reviewId, { ...review, date: selectedDate });
      setMessage("已更新今日复盘");
    } else {
      const res = await createReview({ ...review, date: selectedDate });
      setReviewId((res as { id: number }).id);
      setMessage("已保存今日复盘");
    }
  };

  return (
    <PageTransition>
      <div className="page">
        <Topbar
          title="每日复盘"
          subtitle="用问题驱动深度反思"
          dateLabel={`当前日期 ${formatDateLabel(selectedDate)}`}
          action={
            <input
              className="input"
              style={{ width: 150 }}
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          }
        />

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">今日复盘问题</div>
              <div className="card-subtitle">请尽量写具体、可执行</div>
            </div>
            <button className="btn btn-primary" onClick={save}>
              保存复盘
            </button>
          </div>

          <div className="form-row">
            <textarea
              className="textarea"
              rows={3}
              placeholder="今天我做了什么？"
              value={review.did_what || ""}
              onChange={(e) => updateField("did_what", e.target.value)}
            />
            <textarea
              className="textarea"
              rows={3}
              placeholder="完成了哪些任务？"
              value={review.tasks_done || ""}
              onChange={(e) => updateField("tasks_done", e.target.value)}
            />
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <input
              className="input"
              type="number"
              placeholder="学习时长（分钟）"
              value={review.study_minutes ?? 0}
              onChange={(e) => updateField("study_minutes", Number(e.target.value))}
            />
            <select
              className="select"
              value={review.procrastinated ?? 0}
              onChange={(e) => updateField("procrastinated", Number(e.target.value))}
            >
              {procrastinationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  拖延程度：{option.label}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={review.mood_score ?? 3}
              onChange={(e) => updateField("mood_score", Number(e.target.value))}
            >
              {moodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  情绪：{option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <textarea
              className="textarea"
              rows={3}
              placeholder="今天哪三件事做得不错？"
              value={review.good_things || ""}
              onChange={(e) => updateField("good_things", e.target.value)}
            />
            <textarea
              className="textarea"
              rows={3}
              placeholder="为什么做得好？"
              value={review.why_good || ""}
              onChange={(e) => updateField("why_good", e.target.value)}
            />
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <textarea
              className="textarea"
              rows={3}
              placeholder="下次如何重复？"
              value={review.repeat_next || ""}
              onChange={(e) => updateField("repeat_next", e.target.value)}
            />
            <textarea
              className="textarea"
              rows={3}
              placeholder="今天最大的问题是什么？"
              value={review.biggest_problem || ""}
              onChange={(e) => updateField("biggest_problem", e.target.value)}
            />
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <textarea
              className="textarea"
              rows={3}
              placeholder="真正原因是什么？不是表面原因。"
              value={review.root_cause || ""}
              onChange={(e) => updateField("root_cause", e.target.value)}
            />
            <textarea
              className="textarea"
              rows={3}
              placeholder="明天我具体要怎么做？（必须能执行）"
              value={review.tomorrow_plan || ""}
              onChange={(e) => updateField("tomorrow_plan", e.target.value)}
            />
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <textarea
              className="textarea"
              rows={3}
              placeholder="今天什么时候最开心？触发原因？"
              value={review.happiest_moment || ""}
              onChange={(e) => updateField("happiest_moment", e.target.value)}
            />
            <textarea
              className="textarea"
              rows={3}
              placeholder="什么时候最低落？触发原因？"
              value={review.lowest_moment || ""}
              onChange={(e) => updateField("lowest_moment", e.target.value)}
            />
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <textarea
              className="textarea"
              rows={2}
              placeholder="触发原因（情绪波动）"
              value={review.triggers || ""}
              onChange={(e) => updateField("triggers", e.target.value)}
            />
            <input
              className="input"
              type="number"
              placeholder="今天花了多少钱？"
              value={review.spent_amount ?? 0}
              onChange={(e) => updateField("spent_amount", Number(e.target.value))}
            />
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <select
              className="select"
              value={review.spent_value || "投资自己"}
              onChange={(e) => updateField("spent_value", e.target.value)}
            >
              <option value="投资自己">投资自己</option>
              <option value="必要">必要</option>
              <option value="冲动">冲动</option>
            </select>
            <div className="muted" style={{ padding: "8px 4px" }}>
              资金判断：该花的钱 vs 冲动消费
            </div>
          </div>

          {message ? <div className="muted" style={{ marginTop: 12 }}>{message}</div> : null}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">AI 复盘分析（占位）</div>
              <div className="card-subtitle">自动识别拖延、情绪与瓶颈</div>
            </div>
            <span className="tag">待接入</span>
          </div>
          <div className="muted">
            系统将根据复盘数据自动生成建议：识别高效时段、情绪触发源以及改进实验。
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
