import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

export default function Login({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, password, nickname);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">{isRegister ? '注册账号' : '欢迎回来'}</h2>
      <p className="form-subtitle">{isRegister ? '创建账号开始探索剧本杀世界' : '登录你的谜境推理账号'}</p>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">用户名</label>
          <input
            className="form-input"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="请输入用户名"
            required
          />
        </div>
        {isRegister && (
          <div className="form-group">
            <label className="form-label">昵称</label>
            <input
              className="form-input"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="请输入昵称"
              required
            />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">密码</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="请输入密码"
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
          {loading ? '请稍候...' : isRegister ? '注册' : '登录'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button
          className="nav-link"
          onClick={() => navigate(isRegister ? '/login' : '/register')}
          style={{ fontSize: '0.9rem' }}
        >
          {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
        </button>
      </div>
      {!isRegister && (
        <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.8rem', color: '#808098' }}>
          <div style={{ marginBottom: '0.3rem' }}>测试账号：</div>
          <div>店长：admin / 123456</div>
          <div>玩家：player / 123456</div>
        </div>
      )}
    </div>
  );
}
