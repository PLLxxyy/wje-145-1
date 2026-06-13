import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Room } from '../api';
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

  const handleSave = async () => {
    try {
      if (editRoom) {
        await api.updateRoom(editRoom.id, form);
      } else {
        await api.createRoom(form);
      }
      setShowForm(false);
      loadRooms();
    } catch {}
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#808098' }}>加载中...</div>;

  return (
    <div>
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
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
