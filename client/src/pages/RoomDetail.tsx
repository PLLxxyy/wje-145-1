import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Room, type Script } from '../api';
import { StatusTag } from '../components/Shared';
import { useAuth } from '../components/AuthProvider';

const TIME_SLOTS = [
  '10:00-12:00', '12:00-14:00', '14:00-16:00',
  '16:00-18:00', '18:00-20:00', '20:00-22:00',
];

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [showBooking, setShowBooking] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('');
  const [scriptId, setScriptId] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    api.getRooms().then(({ rooms }) => {
      const found = rooms.find(r => r.id === Number(id));
      if (found) setRoom(found);
    });
    api.getScripts().then(({ scripts }) => setScripts(scripts));
  }, [id]);

  const handleBook = async () => {
    if (!timeSlot) { setError('请选择时段'); return; }
    setError('');
    try {
      await api.createBooking({
        room_id: Number(id),
        script_id: scriptId || undefined,
        date,
        time_slot: timeSlot,
      });
      setSuccess('预约成功！');
      setTimeout(() => { setShowBooking(false); setSuccess(''); }, 1500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!room) return <div style={{ textAlign: 'center', padding: '4rem', color: '#808098' }}>加载中...</div>;

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginBottom: '1.5rem' }}>
        &larr; 返回列表
      </button>

      <div className="detail-header">
        <div>
          <h1 className="page-title">{room.name}</h1>
          <div className="detail-meta">
            <span className="card-tag">{room.capacity}人</span>
            <span className="card-tag">{room.duration}分钟</span>
            <span className="card-tag tag-price">¥{room.price}/场</span>
            <StatusTag status={room.status} />
          </div>
        </div>
        {user?.role === 'player' && room.status === 'available' && (
          <button className="btn btn-primary" onClick={() => setShowBooking(true)}>
            立即预约
          </button>
        )}
      </div>

      <div className="detail-section">
        <h3>房间介绍</h3>
        <p style={{ color: '#a0a0b8', lineHeight: 1.7 }}>{room.description || '暂无描述'}</p>
      </div>

      {showBooking && (
        <div className="modal-overlay" onClick={() => { setShowBooking(false); setError(''); setSuccess(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">预约房间 - {room.name}</h3>
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}
            <div className="form-group">
              <label className="form-label">选择日期</label>
              <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">选择时段</label>
              <select className="form-select" value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
                <option value="">请选择时段</option>
                {TIME_SLOTS.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">选择剧本（可选）</label>
              <select className="form-select" value={scriptId} onChange={e => setScriptId(e.target.value ? +e.target.value : '')}>
                <option value="">不指定剧本</option>
                {scripts.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setShowBooking(false); setError(''); }}>取消</button>
              <button className="btn btn-primary" onClick={handleBook}>确认预约</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
