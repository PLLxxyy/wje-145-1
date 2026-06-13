import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Script, type Rating } from '../api';
import { Stars, DifficultyTag } from '../components/Shared';
import { useAuth } from '../components/AuthProvider';

export default function ScriptDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [script, setScript] = useState<Script | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [showRate, setShowRate] = useState(false);
  const [myScore, setMyScore] = useState(5);
  const [myComment, setMyComment] = useState('');

  const load = async () => {
    if (!id) return;
    try {
      const data = await api.getScript(Number(id));
      setScript(data.script);
      setRatings(data.ratings);
      setAvgScore(data.avg_score);
      setRatingCount(data.rating_count);
    } catch {}
  };

  useEffect(() => { load(); }, [id]);

  const handleRate = async () => {
    try {
      await api.rateScript(Number(id), myScore, myComment);
      setShowRate(false);
      setMyComment('');
      load();
    } catch {}
  };

  if (!script) return <div style={{ textAlign: 'center', padding: '4rem', color: '#808098' }}>加载中...</div>;

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate('/scripts')} style={{ marginBottom: '1.5rem' }}>
        &larr; 返回剧本列表
      </button>

      <div className="detail-header">
        <div>
          <h1 className="page-title">{script.title}</h1>
          <div className="detail-meta">
            <DifficultyTag difficulty={script.difficulty} />
            <span className="card-tag">{script.duration}分钟</span>
            <span className="card-tag">{script.min_players}-{script.max_players}人</span>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <Stars score={avgScore} count={ratingCount} />
          </div>
        </div>
        {user && (
          <button className="btn btn-primary" onClick={() => setShowRate(true)}>
            评分 / 写短评
          </button>
        )}
      </div>

      <div className="detail-section">
        <h3>剧本简介</h3>
        <p style={{ color: '#a0a0b8', lineHeight: 1.7 }}>{script.description}</p>
      </div>

      <div className="detail-section">
        <h3>玩家评价 ({ratingCount})</h3>
        {ratings.length === 0 ? (
          <p style={{ color: '#808098' }}>暂无评价，来写第一条评论吧</p>
        ) : (
          ratings.map(r => (
            <div key={r.id} className="review-item">
              <div className="review-header">
                <span className="review-user">{r.nickname}</span>
                <Stars score={r.score} />
              </div>
              {r.comment && <p className="review-comment">{r.comment}</p>}
            </div>
          ))
        )}
      </div>

      {showRate && (
        <div className="modal-overlay" onClick={() => setShowRate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">为「{script.title}」评分</h3>
            <div className="form-group">
              <label className="form-label">评分</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => setMyScore(s)}
                    style={{
                      background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer',
                      color: s <= myScore ? '#ffc107' : '#333', transition: 'color 0.2s',
                    }}
                  >
                    &#9733;
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">短评（可选）</label>
              <textarea className="form-textarea" value={myComment} onChange={e => setMyComment(e.target.value)} placeholder="说说你的感受..." />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowRate(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleRate}>提交评价</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
