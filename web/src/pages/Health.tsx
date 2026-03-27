import { useEffect, useMemo, useState } from "react";
import PageTransition from "../components/PageTransition";
import Topbar from "../components/Topbar";
import { getReport, getTrends, listSettings, updateSetting } from "../lib/api";
import { formatDateLabel, todayISO } from "../lib/date";
import type { ReportSummary, Trends } from "../lib/types";

function buildDateList(end: string, days: number) {
  const [y, m, d] = end.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const list: string[] = [];
  for (let i = 0; i < days; i += 1) {
    const current = new Date(date.getTime());
    current.setUTCDate(date.getUTCDate() - i);
    list.push(current.toISOString().slice(0, 10));
  }
  return list;
}

export default function Health() {
  const [trends, setTrends] = useState<Trends | null>(null);
  const [weekReport, setWeekReport] = useState<ReportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exerciseMin, setExerciseMin] = useState(20);
  const [exerciseDays, setExerciseDays] = useState(7);
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const days = 14;
  const endDate = todayISO();

  useEffect(() => {
    Promise.all([getTrends(30), getReport(7, endDate), listSettings()])
      .then(([trendData, reportData, settingsRes]) => {
        setTrends(trendData);
        setWeekReport(reportData);
        const minSetting = settingsRes.items.find((item) => item.key === "exercise_daily_min");
        const daysSetting = settingsRes.items.find((item) => item.key === "exercise_insufficient_days");
        setExerciseMin(Number(minSetting?.value || 20));
        setExerciseDays(Number(daysSetting?.value || 7));
        const calorieSetting = settingsRes.items.find((item) => item.key === "calorie_target");
        setCalorieTarget(Number(calorieSetting?.value || 2000));
      })
      .catch((err) => setError(String(err)));
  }, [endDate]);

  const health = useMemo(() => {
    if (!trends) return null;
    const dates = buildDateList(endDate, days);
    const reviewMap = new Map(trends.reviews.map((item) => [item.date, item]));
    const taskMap = new Map(trends.tasks.map((item) => [item.date, item]));
    const financeMap = new Map(trends.finance.map((item) => [item.date, item]));

    const missingReviews = dates.filter((date) => !reviewMap.has(date));
    const missingTasks = dates.filter((date) => !taskMap.has(date));
    const lowMood = dates.filter((date) => {
      const review = reviewMap.get(date);
      return review && typeof review.mood_score === "number" && review.mood_score <= 2;
    });
    const highProcrastination = dates.filter((date) => {
      const review = reviewMap.get(date);
      return review && typeof review.procrastinated === "number" && review.procrastinated >= 2;
    });
    const zeroStudy = dates.filter((date) => {
      const review = reviewMap.get(date);
      return review && (review.study_minutes === null || review.study_minutes === 0);
    });

    const expenses = dates.map((date) => Number(financeMap.get(date)?.expense || 0));
    const avgExpense = expenses.length
      ? expenses.reduce((sum, value) => sum + value, 0) / expenses.length
      : 0;
    const highExpenseDays = dates.filter((date) =>
      Number(financeMap.get(date)?.expense || 0) > avgExpense * 2 && avgExpense > 0
    );

    let streakNoReview = 0;
    for (const date of dates) {
      if (!reviewMap.has(date)) {
        streakNoReview += 1;
      } else {
        break;
      }
    }

    let exerciseShortStreak = 0;
    for (const date of dates) {
      const exercise = trends.exercise.find((item) => item.date === date);
      if (!exercise || Number(exercise.duration_minutes || 0) < exerciseMin) {
        exerciseShortStreak += 1;
      } else {
        break;
      }
    }

    return {
      missingReviewDays: missingReviews.length,
      missingTaskDays: missingTasks.length,
      lowMoodDays: lowMood.length,
      highProcrastinationDays: highProcrastination.length,
      zeroStudyDays: zeroStudy.length,
      highExpenseDays: highExpenseDays.length,
      streakNoReview,
      lastMissingReview: missingReviews[0],
      avgExpense: Math.round(avgExpense * 10) / 10,
      exerciseShortDays: dates.filter((date) => {
        const exercise = trends.exercise.find((item) => item.date === date);
        return !exercise || Number(exercise.duration_minutes || 0) < exerciseMin;
      }).length,
      exerciseShortStreak,
      calorieOverDays: dates.filter((date) => {
        const diet = trends.diet.find((item) => item.date === date);
        return diet && Number(diet.calories || 0) > calorieTarget;
      }).length,
    };
  }, [trends, endDate, exerciseMin, calorieTarget]);

  const insights = useMemo(() => {
    if (!health) return [] as string[];
    const items: string[] = [];
    if (health.missingReviewDays > 0) {
      items.push(`近 ${days} 天有 ${health.missingReviewDays} 天未复盘。`);
    }
    if (health.missingTaskDays > 0) {
      items.push(`近 ${days} 天有 ${health.missingTaskDays} 天无任务记录。`);
    }
    if (health.lowMoodDays > 0) {
      items.push(`情绪低谷出现 ${health.lowMoodDays} 天。`);
    }
    if (health.highProcrastinationDays > 0) {
      items.push(`拖延明显天数 ${health.highProcrastinationDays} 天。`);
    }
    if (health.zeroStudyDays > 0) {
      items.push(`学习时长为 0 的天数 ${health.zeroStudyDays} 天。`);
    }
    if (health.highExpenseDays > 0) {
      items.push(`高支出日 ${health.highExpenseDays} 天（高于平均两倍）。`);
    }
    if (health.exerciseShortDays > 0) {
      items.push(`锻炼不足天数 ${health.exerciseShortDays} 天（低于 ${exerciseMin} 分钟）。`);
    }
    if (exerciseDays > 0 && health.exerciseShortStreak >= exerciseDays) {
      items.push(`连续锻炼不足已达 ${health.exerciseShortStreak} 天，建议安排一次强化运动。`);
    }
    if (health.calorieOverDays > 0) {
      items.push(`饮食超标 ${health.calorieOverDays} 天（超过目标 ${calorieTarget} kcal）。`);
    }
    if (items.length === 0) {
      items.push("状态稳定，持续保持复盘节奏。");
    }
    return items;
  }, [health, exerciseMin, exerciseDays, calorieTarget]);

  const saveExerciseThreshold = async () => {
    await updateSetting("exercise_daily_min", exerciseMin);
    await updateSetting("exercise_insufficient_days", exerciseDays);
    await updateSetting("calorie_target", calorieTarget);
    setSettingsMessage("阈值已更新。");
  };

  return (
    <PageTransition>
      <div className="page">
        <Topbar title="系统健康" subtitle="检查你的执行节奏与风险" />

        {error ? <div className="card">连接失败：{error}</div> : null}

        <div className="grid grid-3">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">近 7 天平均完成率</div>
                <div className="card-subtitle">任务完成率</div>
              </div>
              <span className="tag">执行</span>
            </div>
            <div className="stat-value">{weekReport?.tasks.avgCompletion || 0}%</div>
            <div className="stat-label">总任务 {weekReport?.tasks.total || 0}</div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">近 7 天平均学习</div>
                <div className="card-subtitle">分钟/天</div>
              </div>
              <span className="tag">成长</span>
            </div>
            <div className="stat-value">{weekReport?.review.avgStudy || 0}</div>
            <div className="stat-label">平均情绪 {weekReport?.review.avgMood || 0} / 5</div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">近期支出</div>
                <div className="card-subtitle">近 7 天合计</div>
              </div>
              <span className="badge">现金流</span>
            </div>
            <div className="stat-value">¥ {weekReport?.finance.totalExpense || 0}</div>
            <div className="stat-label">平均每天 ¥ {weekReport?.finance.avgDailyExpense || 0}</div>
          </div>
        </div>

        {health ? (
          <div className="grid grid-2">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">风险提醒</div>
                  <div className="card-subtitle">最近 {days} 天</div>
                </div>
                <span className="tag">预警</span>
              </div>
              <div className="list">
                <div className="list-item"><strong>未复盘天数</strong><span>{health.missingReviewDays}</span></div>
                <div className="list-item"><strong>无任务天数</strong><span>{health.missingTaskDays}</span></div>
                <div className="list-item"><strong>拖延高峰</strong><span>{health.highProcrastinationDays}</span></div>
                <div className="list-item"><strong>情绪低谷</strong><span>{health.lowMoodDays}</span></div>
                <div className="list-item"><strong>学习为 0</strong><span>{health.zeroStudyDays}</span></div>
                <div className="list-item"><strong>高支出日</strong><span>{health.highExpenseDays}</span></div>
                <div className="list-item"><strong>锻炼不足</strong><span>{health.exerciseShortDays}</span></div>
                <div className="list-item"><strong>连续锻炼不足</strong><span>{health.exerciseShortStreak}</span></div>
                <div className="list-item"><strong>饮食超标</strong><span>{health.calorieOverDays}</span></div>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">行动建议</div>
                  <div className="card-subtitle">来自规则引擎</div>
                </div>
                <span className="tag">建议</span>
              </div>
              <div className="list">
                {insights.map((item, index) => (
                  <div key={index} className="list-item">
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              {health.lastMissingReview ? (
                <div className="muted" style={{ marginTop: 10 }}>
                  最近一次未复盘：{formatDateLabel(health.lastMissingReview)}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">锻炼阈值设置</div>
              <div className="card-subtitle">用于健康提醒</div>
            </div>
            <button className="btn btn-ghost" onClick={saveExerciseThreshold}>
              保存设置
            </button>
          </div>
          <div className="form-row">
            <input
              className="input"
              type="number"
              value={exerciseMin}
              onChange={(e) => setExerciseMin(Number(e.target.value))}
              placeholder="每日最低锻炼分钟"
            />
            <input
              className="input"
              type="number"
              value={exerciseDays}
              onChange={(e) => setExerciseDays(Number(e.target.value))}
              placeholder="连续不足天数阈值"
            />
            <input
              className="input"
              type="number"
              value={calorieTarget}
              onChange={(e) => setCalorieTarget(Number(e.target.value))}
              placeholder="每日热量目标"
            />
          </div>
          {settingsMessage ? <div className="muted" style={{ marginTop: 8 }}>{settingsMessage}</div> : null}
        </div>
      </div>
    </PageTransition>
  );
}
