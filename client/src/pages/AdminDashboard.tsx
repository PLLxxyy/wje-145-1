import React, { useEffect, useState } from 'react';
import { api, type AdminStats } from '../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const load = async (d?: string) => {
    setLoading(true);
    try {
      const data = await api.getAdminBookings(d || date);
      setStats(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [date]);

  if (loading && !stats) return <div style={{ textAlign: 'center', padding: '4rem', color: '#808098' }}>加载中...</div>;

  return (
    <div>
      <h1 className="page-title">店长后台</h1>
      <p className="page-subtitle">查看预约管理和房间使用情况</p>

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <label className="form-label" style={{ margin: 0 }}>查看日期：</label>
        <input
          className="form-input"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ maxWidth: '200px' }}
        />
      </div>

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.total_rooms}</div>
              <div className="stat-label">可用房间总数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.booked_rooms}</div>
              <div className="stat-label">已预约房间数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.usage_rate}%</div>
              <div className="stat-label">房间使用率</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.bookings.length}</div>
              <div className="stat-label">当日预约数</div>
            </div>
          </div>

          <div className="detail-section">
            <h3>房间使用状况</h3>
            <div className="usage-bar">
              {stats.room_usage.map(room => (
                <div key={room.id} className="usage-item">
                  <span className={`usage-dot ${room.is_booked ? 'booked' : 'free'}`} />
                  <span style={{ color: room.is_booked ? '#e94560' : '#28a745' }}>
                    {room.name}
                  </span>
                  <span style={{ color: '#808098', fontSize: '0.8rem' }}>
                    {room.is_booked ? '已约' : '空闲'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h3>今日预约列表 ({stats.bookings.length})</h3>
            {stats.bookings.length === 0 ? (
              <p style={{ color: '#808098' }}>当日暂无预约</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>玩家</th>
                    <th>房间</th>
                    <th>剧本</th>
                    <th>时段</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.bookings.map(b => (
                    <tr key={b.id}>
                      <td style={{ color: '#fff' }}>{b.user_nickname || '-'}</td>
                      <td>{b.room_name}</td>
                      <td>{b.script_title || '未指定'}</td>
                      <td>{b.time_slot}</td>
                      <td>
                        <span style={{ color: '#28a745' }}>已确认</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
