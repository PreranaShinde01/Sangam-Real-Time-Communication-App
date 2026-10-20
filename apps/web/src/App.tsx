import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { PrejoinPage } from './pages/PrejoinPage';
import { MeetingRoomPage } from './pages/MeetingRoomPage';
import { AdminPage } from './pages/AdminPage';
import { useAuthStore } from './store/useAuthStore';

export const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/room/:roomCode/prejoin" element={<PrejoinPage />} />
        <Route path="/join/:roomCode" element={<PrejoinRedirect />} />
        <Route path="/room/:roomCode" element={<MeetingRoomPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const PrejoinRedirect: React.FC = () => {
  const path = window.location.pathname.replace('/join/', '/room/') + '/prejoin';
  return <Navigate to={path} replace />;
};
