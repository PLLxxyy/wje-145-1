import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Room, type Booking } from '../api';
import { StatusTag } from '../components/Shared';
import { useAuth } from '../components/AuthProvider';

export default function RoomList() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<Pick<Room, 'name' | 'capacity' | 'duration' | 'price' | 'status' | 'description'>>({
    name: '',
    capacity: 6,
    duration: 180,
    price: 128,
    status: 'available',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [affectedBookings, setAffectedBookings] = useState<Booking[]>([]);
  const [loadingAffected, setLoadingAffected] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadRooms = async () => {
    try {
      const { rooms } = await api.getRooms();
      setRooms(rooms);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadRooms(); }, []);

  const openCreate = () => {
    setEditRoom(null);
    setForm({ name: '', capacity: 6, duration: 180, price: 128, status: 'available', description: '' });
    setShowForm(true);
  };

  const openEdit = (room: Room, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditRoom(room);
    setForm({ name: room.name, capacity: room.capacity, duration: room.duration, price: room.price, status: room.status, description: room.description });
    setShowForm(true);
  };

  const doSave = async () => {
    try {
      if (editRoom) {
        const result = await api.updateRoom(editRoom.id, form);
        if (result.cancelled_count && result.cancelled_count > 0) {
          setSuccessMessage(`已将房间设为维护，并自动取消 ${result.cancelled_count} 条关联预约`);
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      } else {
        await api.createRoom(form);
      }
      setShowForm(false);
      setShowConfirm(false);
      setAffectedBookings([]);
      loadRooms();
    } catch {}
  };

  const handleSave = async () => {
    if (editRoom && form.status === 'maintenance' && editRoom.status !== 'maintenance') {
      setLoadingAffected(true);
      try {
        const { bookings } = await api.getRoomBookings(editRoom.id);
        if (bookings.length > 0) {
          setAffectedBookings(bookings);
          setShowConfirm(true);
        } else {
          doSave();
        }
      } catch {} finally { setLoadingAffected(false); }
    } else {
      doSave();
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#808098' }}>加载中...</div>;

  return (
    <div>
      {successMessage && (
        <div style={{
          padding: '0.8rem 1rem',
          backgroundColor: '#155724',
          color: '#d4edda',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #1e7e34',
        }}>
          {successMessage}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h1 className="page-title">房间列表</h1>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={openCreate}>+ 新建房间</button>
        )}
      </div>
      <p className="page-subtitle">选择一间房间，开启你的推理之旅</p>

      <div className="card-grid">
        {rooms.map(room => (
          <Link key={room.id} to={`/rooms/${room.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div className="card-title">{room.name}</div>
                {user?.role === 'admin' && (
                  <button className="btn btn-secondary btn-small" onClick={(e) => openEdit(room, e)}>编辑</button>
                )}
              </div>
              <div className="card-info">
                <span className="card-tag">{room.capacity}人</span>
                <span className="card-tag">{room.duration}分钟</span>
                <span className="card-tag tag-price">¥{room.price}/场</span>
                <StatusTag status={room.status} />
              </div>
              {room.description && <p className="card-desc">{room.description}</p>}
            </div>
          </Link>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="empty-state"><p>暂无房间</p></div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editRoom ? '编辑房间' : '新建房间'}</h3>
            <div className="form-group">
              <label className="form-label">房间名称</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例：古堡密室" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">容纳人数</label>
                <input className="form-input" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: +e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">时长（分钟）</label>
                <input className="form-input" type="number" value={form.duration} onChange={e => setForm({ ...form, duration: +e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">价格（元/场）</label>
                <input className="form-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">状态</label>
                <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Room['status'] })}>
                  <option value="available">可用</option>
                  <option value="maintenance">维护中</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">描述</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="房间描述..." />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={loadingAffected}>取消</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loadingAffected}>
                {loadingAffected ? '检查中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay" onClick={() => { setShowConfirm(false); setAffectedBookings([]); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3 className="modal-title">确认设为维护状态</h3>
            <p style={{ color: '#e94560', marginBottom: '1rem' }}>
              该房间当前有 <strong>{affectedBookings.length}</strong> 条已确认的预约，设为维护后将自动取消这些预约：
            </p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>玩家</th>
                    <th>剧本</th>
                    <th>日期</th>
                    <th>时段</th>
                  </tr>
                </thead>
                <tbody>
                  {affectedBookings.map(b => (
                    <tr key={b.id}>
                      <td style={{ color: '#fff' }}>{b.user_nickname || '-'}</td>
                      <td>{b.script_title || '未指定'}</td>
                      <td>{b.date}</td>
                      <td>{b.time_slot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ color: '#808098', fontSize: '0.85rem', marginBottom: '1rem' }}>
              请确认以上信息无误，操作后关联预约将被取消。
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setShowConfirm(false); setAffectedBookings([]); }}>返回修改</button>
              <button className="btn btn-primary" onClick={doSave} style={{ backgroundColor: '#e94560', borderColor: '#e94560' }}>
                确认设为维护并取消预约
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
