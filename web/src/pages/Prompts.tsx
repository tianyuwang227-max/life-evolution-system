import { useEffect, useState } from "react";
import PageTransition from "../components/PageTransition";
import Topbar from "../components/Topbar";
import { listPrompts, createPrompt, updatePrompt, deletePrompt } from "../lib/api";
import type { PromptItem } from "../lib/types";

export default function Prompts() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [question, setQuestion] = useState("");
  const [group, setGroup] = useState("每日复盘");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState("");
  const [editingGroup, setEditingGroup] = useState("");

  const load = () => {
    listPrompts().then((res) => setPrompts(res.items));
  };

  useEffect(() => {
    load();
  }, []);

  const addPrompt = async () => {
    if (!question.trim()) return;
    await createPrompt({ question, group_name: group, enabled: 1, order_index: prompts.length + 1 });
    setQuestion("");
    load();
  };

  const togglePrompt = async (prompt: PromptItem) => {
    await updatePrompt(prompt.id, { enabled: prompt.enabled ? 0 : 1 });
    load();
  };

  const startEdit = (prompt: PromptItem) => {
    setEditingId(prompt.id);
    setEditingQuestion(prompt.question);
    setEditingGroup(prompt.group_name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingQuestion("");
    setEditingGroup("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updatePrompt(editingId, { question: editingQuestion, group_name: editingGroup });
    cancelEdit();
    load();
  };

  const removePrompt = async (prompt: PromptItem) => {
    await deletePrompt(prompt.id);
    load();
  };

  return (
    <PageTransition>
      <div className="page">
        <Topbar title="引导问题" subtitle="管理你的问题库" />

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">新增问题</div>
              <div className="card-subtitle">可用于复盘/自省</div>
            </div>
            <button className="btn btn-primary" onClick={addPrompt}>
              添加问题
            </button>
          </div>
          <div className="form-row">
            <input
              className="input"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="分组"
            />
            <input
              className="input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="问题内容"
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">问题清单</div>
              <div className="card-subtitle">共 {prompts.length} 条</div>
            </div>
            <span className="tag">可启用/禁用</span>
          </div>
          <div className="list">
            {prompts.map((prompt) => (
              editingId === prompt.id ? (
                <div key={prompt.id} className="list-item" style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: 1, display: "grid", gap: 8 }}>
                    <input
                      className="input"
                      value={editingGroup}
                      onChange={(e) => setEditingGroup(e.target.value)}
                    />
                    <input
                      className="input"
                      value={editingQuestion}
                      onChange={(e) => setEditingQuestion(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary" onClick={saveEdit}>
                      保存
                    </button>
                    <button className="btn btn-ghost" onClick={cancelEdit}>
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div key={prompt.id} className="list-item">
                  <div>
                    <strong>{prompt.question}</strong>
                    <div className="muted">{prompt.group_name}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-ghost" onClick={() => togglePrompt(prompt)}>
                      {prompt.enabled ? "禁用" : "启用"}
                    </button>
                    <button className="btn btn-ghost" onClick={() => startEdit(prompt)}>
                      编辑
                    </button>
                    <button className="btn btn-ghost" onClick={() => removePrompt(prompt)}>
                      删除
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
