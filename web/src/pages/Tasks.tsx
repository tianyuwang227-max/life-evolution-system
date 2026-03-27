import { useCallback, useEffect, useState } from "react";
import PageTransition from "../components/PageTransition";
import Topbar from "../components/Topbar";
import { formatDateLabel, todayISO } from "../lib/date";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  listSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../lib/api";
import type { Task, ScheduleBlock } from "../lib/types";

export default function Tasks() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [taskPriority, setTaskPriority] = useState(2);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [editingTaskNote, setEditingTaskNote] = useState("");
  const [editingTaskPriority, setEditingTaskPriority] = useState(2);
  const [blockTitle, setBlockTitle] = useState("");
  const [blockStart, setBlockStart] = useState("08:00");
  const [blockEnd, setBlockEnd] = useState("09:00");
  const [blockNote, setBlockNote] = useState("");
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [editingBlockTitle, setEditingBlockTitle] = useState("");
  const [editingBlockStart, setEditingBlockStart] = useState("08:00");
  const [editingBlockEnd, setEditingBlockEnd] = useState("09:00");
  const [editingBlockNote, setEditingBlockNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([listTasks(selectedDate), listSchedule(selectedDate)])
      .then(([taskRes, scheduleRes]) => {
        setTasks(taskRes.items);
        setSchedule(scheduleRes.items);
      })
      .catch((err) => setError(String(err)));
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  const addTask = async () => {
    if (!taskTitle.trim()) return;
    await createTask({ date: selectedDate, title: taskTitle, note: taskNote, priority: taskPriority });
    setTaskTitle("");
    setTaskNote("");
    setTaskPriority(2);
    load();
  };

  const toggleTask = async (task: Task) => {
    await updateTask(task.id, { done: task.done ? 0 : 1 });
    load();
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
    setEditingTaskNote(task.note || "");
    setEditingTaskPriority(task.priority);
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTaskTitle("");
    setEditingTaskNote("");
    setEditingTaskPriority(2);
  };

  const saveEditTask = async () => {
    if (!editingTaskId) return;
    await updateTask(editingTaskId, {
      title: editingTaskTitle,
      note: editingTaskNote,
      priority: editingTaskPriority,
    });
    cancelEditTask();
    load();
  };

  const removeTask = async (task: Task) => {
    await deleteTask(task.id);
    load();
  };

  const addBlock = async () => {
    if (!blockTitle.trim()) return;
    await createSchedule({
      date: selectedDate,
      title: blockTitle,
      start_time: blockStart,
      end_time: blockEnd,
      note: blockNote,
    });
    setBlockTitle("");
    setBlockNote("");
    load();
  };

  const removeBlock = async (block: ScheduleBlock) => {
    await deleteSchedule(block.id);
    load();
  };

  const startEditBlock = (block: ScheduleBlock) => {
    setEditingBlockId(block.id);
    setEditingBlockTitle(block.title);
    setEditingBlockStart(block.start_time);
    setEditingBlockEnd(block.end_time);
    setEditingBlockNote(block.note || "");
  };

  const cancelEditBlock = () => {
    setEditingBlockId(null);
    setEditingBlockTitle("");
    setEditingBlockStart("08:00");
    setEditingBlockEnd("09:00");
    setEditingBlockNote("");
  };

  const saveEditBlock = async () => {
    if (!editingBlockId) return;
    await updateSchedule(editingBlockId, {
      title: editingBlockTitle,
      start_time: editingBlockStart,
      end_time: editingBlockEnd,
      note: editingBlockNote,
    });
    cancelEditBlock();
    load();
  };

  return (
    <PageTransition>
      <div className="page">
        <Topbar
          title="今日任务"
          subtitle="打卡清单 + 时间安排"
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

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">今日打卡</div>
                <div className="card-subtitle">可随时增删</div>
              </div>
              <span className="tag">行动清单</span>
            </div>
            <div className="form-row">
              <input
                className="input"
                placeholder="任务标题"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
              <select
                className="select"
                value={taskPriority}
                onChange={(e) => setTaskPriority(Number(e.target.value))}
              >
                <option value={1}>高优先</option>
                <option value={2}>中优先</option>
                <option value={3}>低优先</option>
              </select>
            </div>
            <div style={{ marginTop: 12 }}>
              <input
                className="input"
                placeholder="备注（可选）"
                value={taskNote}
                onChange={(e) => setTaskNote(e.target.value)}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary" onClick={addTask}>
                添加任务
              </button>
            </div>

            <div style={{ marginTop: 18 }} className="list">
              {tasks.length === 0 ? (
                <div className="muted">今天还没有任务，先定一个小目标。</div>
              ) : null}
              {tasks.map((task) => (
                editingTaskId === task.id ? (
                  <div key={task.id} className="list-item" style={{ alignItems: "flex-start" }}>
                    <div style={{ flex: 1, display: "grid", gap: 8 }}>
                      <div className="form-row">
                        <input
                          className="input"
                          value={editingTaskTitle}
                          onChange={(e) => setEditingTaskTitle(e.target.value)}
                        />
                        <select
                          className="select"
                          value={editingTaskPriority}
                          onChange={(e) => setEditingTaskPriority(Number(e.target.value))}
                        >
                          <option value={1}>高优先</option>
                          <option value={2}>中优先</option>
                          <option value={3}>低优先</option>
                        </select>
                      </div>
                      <input
                        className="input"
                        value={editingTaskNote}
                        onChange={(e) => setEditingTaskNote(e.target.value)}
                        placeholder="备注"
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-primary" onClick={saveEditTask}>
                        保存
                      </button>
                      <button className="btn btn-ghost" onClick={cancelEditTask}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={task.id} className="list-item">
                    <div>
                      <strong>{task.title}</strong>
                      {task.note ? <div className="muted">{task.note}</div> : null}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-ghost" onClick={() => toggleTask(task)}>
                        {task.done ? "已完成" : "打卡"}
                      </button>
                      <button className="btn btn-ghost" onClick={() => startEditTask(task)}>
                        编辑
                      </button>
                      <button className="btn btn-ghost" onClick={() => removeTask(task)}>
                        删除
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">时间安排</div>
                <div className="card-subtitle">可自定义时间段</div>
              </div>
              <span className="tag">节奏</span>
            </div>
            <div className="form-row">
              <input
                className="input"
                type="time"
                value={blockStart}
                onChange={(e) => setBlockStart(e.target.value)}
              />
              <input
                className="input"
                type="time"
                value={blockEnd}
                onChange={(e) => setBlockEnd(e.target.value)}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <input
                className="input"
                placeholder="安排标题"
                value={blockTitle}
                onChange={(e) => setBlockTitle(e.target.value)}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <input
                className="input"
                placeholder="备注（可选）"
                value={blockNote}
                onChange={(e) => setBlockNote(e.target.value)}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary" onClick={addBlock}>
                添加安排
              </button>
            </div>

            <div style={{ marginTop: 18 }} className="list">
              {schedule.length === 0 ? (
                <div className="muted">还没有安排，先规划第一个时间块。</div>
              ) : null}
              {schedule.map((block) => (
                editingBlockId === block.id ? (
                  <div key={block.id} className="list-item" style={{ alignItems: "flex-start" }}>
                    <div style={{ flex: 1, display: "grid", gap: 8 }}>
                      <div className="form-row">
                        <input
                          className="input"
                          type="time"
                          value={editingBlockStart}
                          onChange={(e) => setEditingBlockStart(e.target.value)}
                        />
                        <input
                          className="input"
                          type="time"
                          value={editingBlockEnd}
                          onChange={(e) => setEditingBlockEnd(e.target.value)}
                        />
                      </div>
                      <input
                        className="input"
                        value={editingBlockTitle}
                        onChange={(e) => setEditingBlockTitle(e.target.value)}
                        placeholder="安排标题"
                      />
                      <input
                        className="input"
                        value={editingBlockNote}
                        onChange={(e) => setEditingBlockNote(e.target.value)}
                        placeholder="备注"
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-primary" onClick={saveEditBlock}>
                        保存
                      </button>
                      <button className="btn btn-ghost" onClick={cancelEditBlock}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={block.id} className="list-item">
                    <div>
                      <strong>
                        {block.start_time} - {block.end_time}
                      </strong>
                      <div>{block.title}</div>
                      {block.note ? <div className="muted">{block.note}</div> : null}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-ghost" onClick={() => startEditBlock(block)}>
                        编辑
                      </button>
                      <button className="btn btn-ghost" onClick={() => removeBlock(block)}>
                        删除
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
