import { useEffect, useState } from "react";
import PageTransition from "../components/PageTransition";
import Topbar from "../components/Topbar";
import { listRewards, createReward, updateReward, deleteReward } from "../lib/api";
import type { RewardItem } from "../lib/types";

export default function Rewards() {
  const [items, setItems] = useState<RewardItem[]>([]);
  const [title, setTitle] = useState("");
  const [rule, setRule] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingRule, setEditingRule] = useState("");

  const load = () => {
    listRewards().then((res) => setItems(res.items));
  };

  useEffect(() => {
    load();
  }, []);

  const addReward = async () => {
    if (!title.trim()) return;
    await createReward({ title, rule, enabled: 1 });
    setTitle("");
    setRule("");
    load();
  };

  const toggle = async (item: RewardItem) => {
    await updateReward(item.id, { enabled: item.enabled ? 0 : 1 });
    load();
  };

  const startEdit = (item: RewardItem) => {
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
    await updateReward(editingId, { title: editingTitle, rule: editingRule });
    cancelEdit();
    load();
  };

  const remove = async (item: RewardItem) => {
    await deleteReward(item.id);
    load();
  };

  return (
    <PageTransition>
      <div className="page">
        <Topbar title="激励页面" subtitle="设置奖励机制" />

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">新增奖励</div>
              <div className="card-subtitle">完成目标即可解锁</div>
            </div>
            <button className="btn btn-primary" onClick={addReward}>
              添加奖励
            </button>
          </div>
          <div className="form-row">
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="奖励标题"
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
              <div className="card-title">奖励清单</div>
              <div className="card-subtitle">保持激励正循环</div>
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
