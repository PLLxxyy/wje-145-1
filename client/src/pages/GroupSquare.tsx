import React, { useEffect, useState } from 'react';
import { api, type GroupInvitation, type Script } from '../api';
import { useAuth } from '../components/AuthProvider';

export default function GroupSquare() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupInvitation[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ script_id: '' as number | '', needed_players: 3, date: new Date().toISOString().split('T')[0], time_slot: '14:00-17:00', description: '' });
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const load = async () => {
    try {
      const [groupsData, scriptsData] = await Promise.all([api.getGroups(), api.getScripts()]);
      setGroups(groupsData.groups);
      setScripts(scriptsData.scripts);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      await api.createGroup({
        script_id: form.script_id || undefined,
        needed_players: form.needed_players,
        date: form.date,
        time_slot: form.time_slot,
        description: form.description,
      });
      setShowForm(false);
      load();
    } catch {}
  };

  const handleJoin = async (groupId: number) => {
    setJoiningId(groupId);
    try {
      await api.joinGroup(groupId);
      load();
    } catch {} finally { setJoiningId(null); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#808098' }}>加载中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h1 className="page-title">组局广场</h1>
        {user && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ 发起组局</button>
        )}
      </div>
      <p className="page-subtitle">找到志同道合的队友，一起开启推理冒险</p>

      {groups.length === 0 ? (
        <div className="empty-state"><p>暂无组局邀请，快来发起一个吧</p></div>
      ) : (
        groups.map(group => {
          const isFull = group.current_players >= group.needed_players;
          const isMember = false;
          return (
            <div key={group.id} className="group-card">
              <div className="group-info">
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '0.4rem' }}>
                  {group.script_title || '自由组局'}
                </div>
                <div style={{ color: '#a0a0b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {group.description || `${group.creator_name} 发起的组局`}
                </div>
                <div className="group-meta">
                  <span className="card-tag">{group.date}</span>
                  <span className="card-tag">{group.time_slot}</span>
                  <span className="card-tag">发起人：{group.creator_name}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div className="group-players">
                  {group.current_players}/{group.needed_players} 人
                </div>
                {user && (
                  <button
                    className={`btn ${isFull ? 'btn-secondary' : 'btn-success'}`}
                    disabled={isFull || joiningId === group.id}
                    onClick={() => handleJoin(group.id)}
                  >
                    {isFull ? '已满员' : joiningId === group.id ? '加入中...' : '报名加入'}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">发起组局</h3>
            <div className="form-group">
              <label className="form-label">选择剧本（可选）</label>
              <select className="form-select" value={form.script_id} onChange={e => setForm({ ...form, script_id: e.target.value ? +e.target.value : '' })}>
                <option value="">不指定剧本</option>
                {scripts.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">需要人数</label>
              <input className="form-input" type="number" min={1} max={20} value={form.needed_players} onChange={e => setForm({ ...form, needed_players: +e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">日期</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">时段</label>
                <input className="form-input" value={form.time_slot} onChange={e => setForm({ ...form, time_slot: e.target.value })} placeholder="例：14:00-17:00" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">组局说明</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="例：老手优先，新手也欢迎~" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>发布组局</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
