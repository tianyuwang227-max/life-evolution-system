import { useEffect, useState } from "react";
import PageTransition from "../components/PageTransition";
import Topbar from "../components/Topbar";
import { listPunishments, createPunishment, updatePunishment, deletePunishment } from "../lib/api";
import type { PunishmentItem } from "../lib/types";

export default function Punishments() {
  const [items, setItems] = useState<PunishmentItem[]>([]);
  const [title, setTitle] = useState("");
  const [rule, setRule] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingRule, setEditingRule] = useState("");

  const load = () => {
    listPunishments().then((res) => setItems(res.items));
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!title.trim()) return;
    await createPunishment({ title, rule, enabled: 1 });
    setTitle("");
    setRule("");
    load();
  };

  const toggle = async (item: PunishmentItem) => {
    await updatePunishment(item.id, { enabled: item.enabled ? 0 : 1 });
    load();
  };

  const startEdit = (item: PunishmentItem) => {
    setEditingId(item.id);
    setEditingTitle(item.title);
    setEditingRule(item.rule || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
    setEditingRule("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updatePunishment(editingId, { title: editingTitle, rule: editingRule });
    cancelEdit();
    load();
  };

  const remove = async (item: PunishmentItem) => {
    await deletePunishment(item.id);
    load();
  };

  return (
    <PageTransition>
      <div className="page">
        <Topbar title="惩罚页面" subtitle="设置约束机制" />

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">新增惩罚</div>
              <div className="card-subtitle">对拖延保持边界</div>
            </div>
            <button className="btn btn-primary" onClick={add}>
              添加惩罚
            </button>
          </div>
          <div className="form-row">
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="惩罚标题"
            />
            <input
              className="input"
              value={rule}
              onChange={(e) => setRule(e.target.value)}
              placeholder="触发条件（可选）"
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">惩罚清单</div>
              <div className="card-subtitle">用规则守住节奏</div>
            </div>
            <span className="tag">可启用/禁用</span>
          </div>
          <div className="list">
            {items.map((item) => (
              editingId === item.id ? (
                <div key={item.id} className="list-item" style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: 1, display: "grid", gap: 8 }}>
                    <input
                      className="input"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                    />
                    <input
                      className="input"
                      value={editingRule}
                      onChange={(e) => setEditingRule(e.target.value)}
                      placeholder="触发条件"
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
                <div key={item.id} className="list-item">
                  <div>
                    <strong>{item.title}</strong>
                    {item.rule ? <div className="muted">{item.rule}</div> : null}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-ghost" onClick={() => toggle(item)}>
                      {item.enabled ? "禁用" : "启用"}
                    </button>
                    <button className="btn btn-ghost" onClick={() => startEdit(item)}>
                      编辑
                    </button>
                    <button className="btn btn-ghost" onClick={() => remove(item)}>
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
