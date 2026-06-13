import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import Header from './components/Header';
import Login from './pages/Login';
import RoomList from './pages/RoomList';
import RoomDetail from './pages/RoomDetail';
import ScriptList from './pages/ScriptList';
import ScriptDetail from './pages/ScriptDetail';
import GroupSquare from './pages/GroupSquare';
import MyBookings from './pages/MyBookings';
import MyGroups from './pages/MyGroups';
import AdminDashboard from './pages/AdminDashboard';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#808098' }}>
        加载中...
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={user ? <RoomList /> : <Navigate to="/login" />} />
          <Route path="/login" element={!user ? <Login mode="login" /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Login mode="register" /> : <Navigate to="/" />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/scripts" element={<ScriptList />} />
          <Route path="/scripts/:id" element={<ScriptDetail />} />
          <Route path="/groups" element={<GroupSquare />} />
          <Route path="/my-bookings" element={user ? <MyBookings /> : <Navigate to="/login" />} />
          <Route path="/my-groups" element={user ? <MyGroups /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
