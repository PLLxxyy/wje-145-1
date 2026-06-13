import React, { useEffect, useState } from 'react';
import { api, type GroupInvitation } from '../api';

export default function MyGroups() {
  const [groups, setGroups] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyGroups()
      .then(({ groups }) => setGroups(groups))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#808098' }}>加载中...</div>;

  return (
    <div>
      <h1 className="page-title">我的组局</h1>
      <p className="page-subtitle">我发起的和参与的组局</p>

      {groups.length === 0 ? (
        <div className="empty-state">
          <p>暂无组局记录</p>
          <span style={{ fontSize: '0.9rem' }}>去组局广场看看，或发起一个新组局</span>
        </div>
      ) : (
        groups.map(group => (
          <div key={group.id} className="group-card">
            <div className="group-info">
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '0.4rem' }}>
                {group.script_title || '自由组局'}
                {group.status === 'full' && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: 'rgba(40,167,69,0.15)', color: '#28a745', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                    已满员
                  </span>
                )}
                {group.status === 'closed' && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', color: '#808098', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                    已结束
                  </span>
                )}
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
            <div className="group-players">
              {group.current_players}/{group.needed_players} 人
            </div>
          </div>
        ))
      )}
    </div>
  );
}
