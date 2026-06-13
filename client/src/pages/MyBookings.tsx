import React, { useEffect, useState } from 'react';
import { api, type Booking } from '../api';

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const load = async () => {
    try {
      const { bookings } = await api.getMyBookings();
      setBookings(bookings);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id: number) => {
    if (!confirm('确定要取消这条预约吗？')) return;
    setCancellingId(id);
    try {
      await api.cancelBooking(id);
      load();
    } catch {} finally { setCancellingId(null); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#808098' }}>加载中...</div>;

  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const cancelled = bookings.filter(b => b.status === 'cancelled');

  return (
    <div>
      <h1 className="page-title">我的预约</h1>
      <p className="page-subtitle">管理你的房间预约记录</p>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <p>暂无预约记录</p>
          <span style={{ fontSize: '0.9rem' }}>去首页浏览房间，开始预约吧</span>
        </div>
      ) : (
        <>
          {confirmed.length > 0 && (
            <div className="detail-section">
              <h3>当前预约 ({confirmed.length})</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>房间</th>
                    <th>剧本</th>
                    <th>日期</th>
                    <th>时段</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmed.map(b => (
                    <tr key={b.id}>
                      <td style={{ color: '#fff' }}>{b.room_name}</td>
                      <td>{b.script_title || '未指定'}</td>
                      <td>{b.date}</td>
                      <td>{b.time_slot}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-small"
                          disabled={cancellingId === b.id}
                          onClick={() => handleCancel(b.id)}
                        >
                          {cancellingId === b.id ? '取消中...' : '取消预约'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {cancelled.length > 0 && (
            <div className="detail-section" style={{ opacity: 0.6 }}>
              <h3>已取消 ({cancelled.length})</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>房间</th>
                    <th>剧本</th>
                    <th>日期</th>
                    <th>时段</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelled.map(b => (
                    <tr key={b.id}>
                      <td>{b.room_name}</td>
                      <td>{b.script_title || '未指定'}</td>
                      <td>{b.date}</td>
                      <td>{b.time_slot}</td>
                      <td style={{ color: '#dc3545' }}>已取消</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
