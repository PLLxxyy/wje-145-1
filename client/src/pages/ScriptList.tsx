import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Script } from '../api';
import { Stars, DifficultyTag } from '../components/Shared';
import { useAuth } from '../components/AuthProvider';

export default function ScriptList() {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Pick<Script, 'title' | 'description' | 'difficulty' | 'duration' | 'min_players' | 'max_players'>>({
    title: '',
    description: '',
    difficulty: 'medium',
    duration: 150,
    min_players: 4,
    max_players: 6,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getScripts().then(({ scripts }) => setScripts(scripts)).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    try {
      await api.createScript(form);
      setShowForm(false);
      const { scripts } = await api.getScripts();
      setScripts(scripts);
    } catch {}
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#808098' }}>加载中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h1 className="page-title">剧本列表</h1>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ 新增剧本</button>
        )}
      </div>
      <p className="page-subtitle">挑选你感兴趣的剧本，开始一场推理之旅</p>

      <div className="card-grid">
        {scripts.map(script => (
          <Link key={script.id} to={`/scripts/${script.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card">
              <div className="card-title">{script.title}</div>
              <div className="card-info">
                <DifficultyTag difficulty={script.difficulty} />
                <span className="card-tag">{script.duration}分钟</span>
                <span className="card-tag">{script.min_players}-{script.max_players}人</span>
              </div>
              <Stars score={script.avg_score} count={script.rating_count} />
              <p className="card-desc" style={{ marginTop: '0.6rem' }}>{script.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {scripts.length === 0 && <div className="empty-state"><p>暂无剧本</p></div>}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">新增剧本</h3>
            <div className="form-group">
              <label className="form-label">剧本标题</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例：消失的证人" />
            </div>
            <div className="form-group">
              <label className="form-label">简介</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="剧情简介..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">难度</label>
                <select className="form-select" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as Script['difficulty'] })}>
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">时长（分钟）</label>
                <input className="form-input" type="number" value={form.duration} onChange={e => setForm({ ...form, duration: +e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">最少人数</label>
                <input className="form-input" type="number" value={form.min_players} onChange={e => setForm({ ...form, min_players: +e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">最多人数</label>
                <input className="form-input" type="number" value={form.max_players} onChange={e => setForm({ ...form, max_players: +e.target.value })} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
