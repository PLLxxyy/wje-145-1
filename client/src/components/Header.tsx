import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <header className="header">
      <Link to="/" className="header-logo" style={{ textDecoration: 'none' }}>
        谜境推理
      </Link>
      <nav className="header-nav">
        {user ? (
          <>
            <Link to="/" className={isActive('/')}>首页</Link>
            <Link to="/scripts" className={isActive('/scripts')}>剧本列表</Link>
            <Link to="/groups" className={isActive('/groups')}>组局广场</Link>
            {user.role === 'player' && (
              <>
                <Link to="/my-bookings" className={isActive('/my-bookings')}>我的预约</Link>
                <Link to="/my-groups" className={isActive('/my-groups')}>我的组局</Link>
              </>
            )}
            {user.role === 'admin' && (
              <Link to="/admin" className={isActive('/admin')}>店长后台</Link>
            )}
            <span style={{ color: '#808098', fontSize: '0.85rem', padding: '0 0.5rem' }}>
              {user.nickname} ({user.role === 'admin' ? '店长' : '玩家'})
            </span>
            <button className="btn btn-secondary btn-small" onClick={logout}>退出</button>
          </>
        ) : (
          <>
            <Link to="/login" className={isActive('/login')}>登录</Link>
            <Link to="/register" className={isActive('/register')}>注册</Link>
          </>
        )}
      </nav>
    </header>
  );
}
