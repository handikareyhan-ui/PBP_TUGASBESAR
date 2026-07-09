import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginAdmin from '../pages/LoginAdmin';
import LoginPengguna from '../pages/LoginPengguna';
import DashboardAdmin from '../pages/DashboardAdmin';
import DataPenerima from '../pages/DataPenerima';
import ValidasiZKP from '../pages/ValidasiZKP';
import DistribusiBantuan from '../pages/DistribusiBantuan';
import AuditTrail from '../pages/AuditTrail';
import MonitoringBlockchain from '../pages/MonitoringBlockchain';
import DashboardPengguna from '../pages/DashboardPengguna';
import StatusKelayakan from '../pages/StatusKelayakan';
import KlaimBantuan from '../pages/KlaimBantuan';
import RiwayatBantuan from '../pages/RiwayatBantuan';
import ProfilPengguna from '../pages/ProfilPengguna';


import AdminLayout from '../layouts/AdminLayout';
import PenggunaLayout from '../layouts/PenggunaLayout';

// Simple Route Protection Guard
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('bc_auth_token');
  const role = localStorage.getItem('bc_role');

  if (!token) {
    const redirectPath = allowedRole === 'admin' ? '/admin/login' : '/user/login';
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ACCESS CHANNELS */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<LoginAdmin />} />
        <Route path="/user/login" element={<LoginPengguna />} />

        {/* ADMIN PRIVATE PORTAL */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <DashboardAdmin />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/recipients"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <DataPenerima />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/verify"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <ValidasiZKP />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/distribution"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <DistribusiBantuan />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/monitoring"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <MonitoringBlockchain />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <AuditTrail />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* USER PRIVATE PORTAL */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute allowedRole="user">
              <PenggunaLayout>
                <DashboardPengguna />
              </PenggunaLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/user/status"
          element={
            <ProtectedRoute allowedRole="user">
              <PenggunaLayout>
                <StatusKelayakan />
              </PenggunaLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/claim"
          element={
            <ProtectedRoute allowedRole="user">
              <PenggunaLayout>
                <KlaimBantuan />
              </PenggunaLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/history"
          element={
            <ProtectedRoute allowedRole="user">
              <PenggunaLayout>
                <RiwayatBantuan />
              </PenggunaLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/profile"
          element={
            <ProtectedRoute allowedRole="user">
              <PenggunaLayout>
                <ProfilPengguna />
              </PenggunaLayout>
            </ProtectedRoute>
          }
        />

        {/* CATCHALL REDIRECTOR */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
