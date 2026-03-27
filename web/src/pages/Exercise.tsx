import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import PageTransition from "../components/PageTransition";
import Topbar from "../components/Topbar";
import { formatDateLabel, todayISO } from "../lib/date";
import {
  listExercise,
  createExercise,
  updateExercise,
  deleteExercise,
  listDiet,
  createDiet,
  updateDiet,
  deleteDiet,
  getExerciseSummary,
  listSettings,
  updateSetting,
  getTrends,
} from "../lib/api";
import { defaultExerciseMet, exerciseMetMap, exerciseTypeOptions } from "../lib/constants";
import type { DietLog, ExerciseLog, ExerciseSummary } from "../lib/types";

export default function Exercise() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [dietLogs, setDietLogs] = useState<DietLog[]>([]);
  const [summary, setSummary] = useState<ExerciseSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weightKg, setWeightKg] = useState(70);
  const [exerciseMin, setExerciseMin] = useState(20);
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [weightMessage, setWeightMessage] = useState<string | null>(null);
  const [trendExercise, setTrendExercise] = useState<Array<{ date: string; duration_minutes: number }>>([]);
  const [trendDiet, setTrendDiet] = useState<Array<{ date: string; calories: number }>>([]);

  const [duration, setDuration] = useState(30);
  const [exerciseType, setExerciseType] = useState("力量训练");
  const [exerciseNote, setExerciseNote] = useState("");
  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);

  const [meal, setMeal] = useState("早餐");
  const [calories, setCalories] = useState(400);
  const [dietNote, setDietNote] = useState("");
  const [editingDietId, setEditingDietId] = useState<number | null>(null);

  const load = useCallback(() => {
    Promise.all([
      listExercise(selectedDate),
      listDiet(selectedDate),
      getExerciseSummary(4, selectedDate),
      listSettings(),
    ])
      .then(([exerciseRes, dietRes, summaryRes, settingsRes]) => {
        setExerciseLogs(exerciseRes.items);
        setDietLogs(dietRes.items);
        setSummary(summaryRes);
        const weightSetting = settingsRes.items.find((item) => item.key === "body_weight_kg");
        setWeightKg(Number(weightSetting?.value || 70));
        const minSetting = settingsRes.items.find((item) => item.key === "exercise_daily_min");
        setExerciseMin(Number(minSetting?.value || 20));
        const targetSetting = settingsRes.items.find((item) => item.key === "calorie_target");
        setCalorieTarget(Number(targetSetting?.value || 2000));
      })
      .catch((err) => setError(String(err)));
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getTrends(30).then((trend) => {
      setTrendExercise(trend.exercise || []);
      setTrendDiet(trend.diet || []);
    });
  }, []);

  const totalExercise = useMemo(
    () => exerciseLogs.reduce((sum, item) => sum + (item.duration_minutes || 0), 0),
    [exerciseLogs]
  );

  const calcBurned = useCallback((log: ExerciseLog) => {
    const met = exerciseMetMap[log.type || ""] || defaultExerciseMet;
    return Math.round((met * weightKg * (log.duration_minutes / 60)) * 10) / 10;
  }, [weightKg]);

  const totalBurned = useMemo(
    () => exerciseLogs.reduce((sum, item) => sum + calcBurned(item), 0),
    [exerciseLogs, calcBurned]
  );

  const totalCalories = useMemo(
    () => dietLogs.reduce((sum, item) => sum + (item.calories || 0), 0),
    [dietLogs]
  );

  const netCalories = Math.round((totalCalories - totalBurned) * 10) / 10;
  const exerciseProgress = exerciseMin > 0 ? Math.min(100, Math.round((totalExercise / exerciseMin) * 100)) : 0;
  const exerciseStatus = totalExercise >= exerciseMin ? "达标" : "未达标";
  const calorieProgress = calorieTarget > 0 ? Math.min(100, Math.round((totalCalories / calorieTarget) * 100)) : 0;
  const calorieStatus = totalCalories <= calorieTarget ? "未超标" : "已超标";

  const addExercise = async () => {
    if (!duration) return;
    if (editingExerciseId) {
      await updateExercise(editingExerciseId, {
        date: selectedDate,
        duration_minutes: duration,
        type: exerciseType,
        note: exerciseNote,
      });
      setEditingExerciseId(null);
    } else {
      await createExercise({
        date: selectedDate,
        duration_minutes: duration,
        type: exerciseType,
        note: exerciseNote,
      });
    }
    setDuration(30);
    setExerciseType("力量训练");
    setExerciseNote("");
    load();
  };

  const startEditExercise = (log: ExerciseLog) => {
    setEditingExerciseId(log.id);
    setDuration(log.duration_minutes);
    setExerciseType(log.type || "训练");
    setExerciseNote(log.note || "");
  };

  const cancelEditExercise = () => {
    setEditingExerciseId(null);
    setDuration(30);
    setExerciseType("力量训练");
    setExerciseNote("");
  };

  const removeExercise = async (log: ExerciseLog) => {
    await deleteExercise(log.id);
    load();
  };

  const addDiet = async () => {
    if (!meal || !calories) return;
    if (editingDietId) {
      await updateDiet(editingDietId, {
        date: selectedDate,
        meal,
        calories,
        note: dietNote,
      });
      setEditingDietId(null);
    } else {
      await createDiet({
        date: selectedDate,
        meal,
        calories,
        note: dietNote,
      });
    }
    setMeal("早餐");
    setCalories(400);
    setDietNote("");
    load();
  };

  const startEditDiet = (log: DietLog) => {
    setEditingDietId(log.id);
    setMeal(log.meal);
    setCalories(log.calories);
    setDietNote(log.note || "");
  };

  const cancelEditDiet = () => {
    setEditingDietId(null);
    setMeal("早餐");
    setCalories(400);
    setDietNote("");
  };

  const removeDiet = async (log: DietLog) => {
    await deleteDiet(log.id);
    load();
  };

  const updateWeight = async () => {
    await updateSetting("body_weight_kg", weightKg);
    setWeightMessage("体重已更新，用于计算消耗热量。");
  };

  const updateCalorieTarget = async () => {
    await updateSetting("calorie_target", calorieTarget);
    setWeightMessage("热量目标已更新。");
  };

  return (
    <PageTransition>
      <div className="page">
        <Topbar
          title="锻炼管理"
          subtitle="运动时长 + 饮食热量"
          dateLabel={`当前日期 ${formatDateLabel(selectedDate)}`}
          action={
            <input
              className="input"
              style={{ width: 150 }}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          }
        />

        {error ? <div className="card">连接失败：{error}</div> : null}

        <div className="grid grid-3">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">今日锻炼时长</div>
                <div className="card-subtitle">分钟</div>
              </div>
              <span className="tag">运动</span>
            </div>
            <div className="stat-value">{totalExercise}</div>
            <div className="stat-label">估算消耗 {totalBurned} kcal</div>
            <div className="progress" style={{ marginTop: 10 }}>
              <div className="progress-bar" style={{ width: `${exerciseProgress}%` }} />
            </div>
            <div className="stat-label">目标 {exerciseMin} 分钟 · {exerciseStatus}</div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">今日饮食摄入</div>
                <div className="card-subtitle">kcal</div>
              </div>
              <span className="tag">饮食</span>
            </div>
            <div className="stat-value">{totalCalories}</div>
            <div className="stat-label">净摄入 {netCalories} kcal</div>
            <div className="progress" style={{ marginTop: 10 }}>
              <div className="progress-bar" style={{ width: `${calorieProgress}%` }} />
            </div>
            <div className="stat-label">目标 {calorieTarget} kcal · {calorieStatus}</div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">体重设置</div>
                <div className="card-subtitle">用于估算消耗</div>
              </div>
            </div>
            <div className="form-row">
              <input
                className="input"
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
              />
              <button className="btn btn-ghost" onClick={updateWeight}>
                更新
              </button>
            </div>
            {weightMessage ? <div className="muted" style={{ marginTop: 8 }}>{weightMessage}</div> : null}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">热量目标设置</div>
              <div className="card-subtitle">每日摄入上限</div>
            </div>
            <button className="btn btn-ghost" onClick={updateCalorieTarget}>
              保存目标
            </button>
          </div>
          <div className="form-row">
            <input
              className="input"
              type="number"
              value={calorieTarget}
              onChange={(e) => setCalorieTarget(Number(e.target.value))}
            />
            <div className="muted" style={{ padding: "8px 4px" }}>
              用于饮食达标判断与预警。
            </div>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">今日锻炼</div>
                <div className="card-subtitle">累计 {totalExercise} 分钟</div>
              </div>
              <button className="btn btn-primary" onClick={addExercise}>
                {editingExerciseId ? "保存修改" : "添加记录"}
              </button>
            </div>
            <div className="form-row">
              <input
                className="input"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                placeholder="时长（分钟）"
              />
              <input
                className="input"
                list="exercise-types"
                value={exerciseType}
                onChange={(e) => setExerciseType(e.target.value)}
                placeholder="运动类型"
              />
              <datalist id="exercise-types">
                {exerciseTypeOptions.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
            <div style={{ marginTop: 12 }}>
              <input
                className="input"
                value={exerciseNote}
                onChange={(e) => setExerciseNote(e.target.value)}
                placeholder="备注（可选）"
              />
            </div>
            {editingExerciseId ? (
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={cancelEditExercise}>
                  取消编辑
                </button>
              </div>
            ) : null}

            <div style={{ marginTop: 16 }} className="list">
              {exerciseLogs.length === 0 ? (
                <div className="muted">还没有锻炼记录。</div>
              ) : null}
              {exerciseLogs.map((log) => (
                <div key={log.id} className="list-item">
                  <div>
                    <strong>{log.type || "锻炼"}</strong>
                    <div className="muted">
                      {log.duration_minutes} 分钟 · 估算消耗 {calcBurned(log)} kcal
                    </div>
                    {log.note ? <div className="muted">{log.note}</div> : null}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-ghost" onClick={() => startEditExercise(log)}>
                      编辑
                    </button>
                    <button className="btn btn-ghost" onClick={() => removeExercise(log)}>
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">今日饮食</div>
                <div className="card-subtitle">摄入 {totalCalories} kcal</div>
              </div>
              <button className="btn btn-primary" onClick={addDiet}>
                {editingDietId ? "保存修改" : "添加记录"}
              </button>
            </div>
            <div className="form-row">
              <input
                className="input"
                value={meal}
                onChange={(e) => setMeal(e.target.value)}
                placeholder="餐次/食物"
              />
              <input
                className="input"
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                placeholder="热量 (kcal)"
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <input
                className="input"
                value={dietNote}
                onChange={(e) => setDietNote(e.target.value)}
                placeholder="备注（可选）"
              />
            </div>
            {editingDietId ? (
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={cancelEditDiet}>
                  取消编辑
                </button>
              </div>
            ) : null}

            <div style={{ marginTop: 16 }} className="list">
              {dietLogs.length === 0 ? <div className="muted">还没有饮食记录。</div> : null}
              {dietLogs.map((log) => (
                <div key={log.id} className="list-item">
                  <div>
                    <strong>{log.meal}</strong>
                    <div className="muted">{log.calories} kcal</div>
                    {log.note ? <div className="muted">{log.note}</div> : null}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-ghost" onClick={() => startEditDiet(log)}>
                      编辑
                    </button>
                    <button className="btn btn-ghost" onClick={() => removeDiet(log)}>
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">每周每天平均锻炼时长</div>
              <div className="card-subtitle">过去 4 周</div>
            </div>
            <span className="tag">平均时长</span>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.weekdays || []}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avg_minutes" fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">近 30 天锻炼趋势</div>
                <div className="card-subtitle">分钟</div>
              </div>
              <span className="tag">趋势</span>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendExercise}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="duration_minutes" stroke="#0f766e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">近 30 天饮食热量</div>
                <div className="card-subtitle">kcal</div>
              </div>
              <span className="tag">趋势</span>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendDiet}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="calories" stroke="#c2410c" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
