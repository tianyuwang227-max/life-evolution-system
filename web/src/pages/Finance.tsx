import { useCallback, useEffect, useState } from "react";
import PageTransition from "../components/PageTransition";
import Topbar from "../components/Topbar";
import { todayISO, monthISO, formatMonthLabel, formatDateLabel } from "../lib/date";
import { expenseCategories, incomeCategory } from "../lib/constants";
import {
  listFinance,
  createFinance,
  updateFinance,
  deleteFinance,
  getSummary,
  listSettings,
  updateSetting,
} from "../lib/api";
import type { FinanceRecord, Summary } from "../lib/types";

export default function Finance() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedMonth, setSelectedMonth] = useState(monthISO(selectedDate));
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState(expenseCategories[0]);
  const [note, setNote] = useState("");
  const [recordDate, setRecordDate] = useState(selectedDate);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [initialSavings, setInitialSavings] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      listFinance(undefined, selectedMonth),
      getSummary(selectedDate),
      listSettings(),
    ]).then(
      ([financeRes, summaryRes, settingsRes]) => {
        setRecords(financeRes.items);
        setSummary(summaryRes);
        const initial = settingsRes.items.find((item) => item.key === "initial_savings");
        setInitialSavings(Number(initial?.value || 0));
      }
    );
  }, [selectedMonth, selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  const saveRecord = async () => {
    if (!amount) return;
    if (editingId) {
      await updateFinance(editingId, {
        date: recordDate,
        type,
        amount,
        category: type === "income" ? incomeCategory : category,
        note,
      });
      setEditingId(null);
    } else {
      await createFinance({
        date: recordDate,
        type,
        amount,
        category: type === "income" ? incomeCategory : category,
        note,
      });
    }
    setAmount(0);
    setNote("");
    setRecordDate(selectedDate);
    load();
  };

  const remove = async (record: FinanceRecord) => {
    await deleteFinance(record.id);
    load();
  };

  const startEdit = (record: FinanceRecord) => {
    setEditingId(record.id);
    setType(record.type);
    setAmount(record.amount);
    setCategory(record.category);
    setNote(record.note || "");
    setRecordDate(record.date);
    setSelectedDate(record.date);
    setSelectedMonth(record.date.slice(0, 7));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount(0);
    setNote("");
    setType("expense");
    setCategory(expenseCategories[0]);
    setRecordDate(selectedDate);
  };

  const updateInitial = async () => {
    await updateSetting("initial_savings", initialSavings);
    setMessage("已更新初始存款");
    load();
  };

  return (
    <PageTransition>
      <div className="page">
        <Topbar
          title="理财管理"
          subtitle="支出 + 收入 + 储蓄率"
          dateLabel={`当前日期 ${formatDateLabel(selectedDate)}`}
          action={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="input"
                style={{ width: 150 }}
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedDate(value);
                  setSelectedMonth(value.slice(0, 7));
                  if (!editingId) {
                    setRecordDate(value);
                  }
                }}
              />
              <input
                className="input"
                style={{ width: 140 }}
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          }
        />

        <div className="grid grid-3">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">今日花费</div>
                <div className="card-subtitle">人民币</div>
              </div>
              <span className="badge">支出</span>
            </div>
            <div className="stat-value">¥ {summary?.finance.todayExpense || 0}</div>
            <div className="stat-label">今日收入 ¥ {summary?.finance.todayIncome || 0}</div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">本月花费</div>
                <div className="card-subtitle">{formatMonthLabel(selectedMonth)}</div>
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

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">新增收支</div>
                <div className="card-subtitle">记录每一笔流向</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {editingId ? (
                  <button className="btn btn-ghost" onClick={cancelEdit}>
                    取消编辑
                  </button>
                ) : null}
                <button className="btn btn-primary" onClick={saveRecord}>
                  {editingId ? "保存修改" : "添加记录"}
                </button>
              </div>
            </div>
            <div className="form-row">
              <select
                className="select"
                value={type}
                onChange={(e) => setType(e.target.value as "expense" | "income")}
              >
                <option value="expense">支出</option>
                <option value="income">收入</option>
              </select>
              <input
                className="input"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="金额"
              />
            </div>
            <div className="form-row" style={{ marginTop: 12 }}>
              <input
                className="input"
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
              />
              {type === "expense" ? (
                <select
                  className="select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {expenseCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <input className="input" value={incomeCategory} disabled />
              )}
            </div>
            <div className="form-row" style={{ marginTop: 12 }}>
              <input
                className="input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="备注（可选）"
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">初始存款</div>
                <div className="card-subtitle">影响总存款计算</div>
              </div>
              <button className="btn btn-ghost" onClick={updateInitial}>
                更新
              </button>
            </div>
            <div className="form-row">
              <input
                className="input"
                type="number"
                value={initialSavings}
                onChange={(e) => setInitialSavings(Number(e.target.value))}
              />
              <div className="muted" style={{ padding: "8px 4px" }}>
                仅需设置一次，随时可调整。
              </div>
            </div>
            {message ? <div className="muted" style={{ marginTop: 8 }}>{message}</div> : null}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">本月记录</div>
              <div className="card-subtitle">共 {records.length} 笔（{selectedMonth}）</div>
            </div>
            <span className="tag">流水</span>
          </div>
          <div className="list">
            {records.length === 0 ? (
              <div className="muted">本月还没有记录，先记一笔。</div>
            ) : null}
            {records.map((record) => (
              <div key={record.id} className="list-item">
                <div>
                  <strong>
                    {record.type === "income" ? "收入" : "支出"} · {record.category}
                  </strong>
                  <div className="muted">{record.date}</div>
                  {record.note ? <div className="muted">{record.note}</div> : null}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="badge">¥ {record.amount}</span>
                  <button className="btn btn-ghost" onClick={() => startEdit(record)}>
                    编辑
                  </button>
                  <button className="btn btn-ghost" onClick={() => remove(record)}>
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
