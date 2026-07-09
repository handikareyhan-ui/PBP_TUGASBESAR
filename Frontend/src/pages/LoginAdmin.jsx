import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { api } from '../services/api';
import Toast from '../components/Toast';

const LoginAdmin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Alert Toast States
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState(false);
  const [toastType, setToastType] = useState('success');

  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastShow(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      triggerToast('Silakan masukkan username dan password', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.loginAdmin(username, password);
      if (response.success) {
        triggerToast('Verifikasi Admin Berhasil. Mengalihkan ke Dashboard...', 'success');
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1000);
      }
    } catch (err) {
      triggerToast(err.message || 'Login gagal, periksa kembali kredensial Anda', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Portal Admin" 
      subtitle="Otorisasi administrator distribusi bantuan sosial berbasis Hyperledger Fabric."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Username input */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-primary uppercase tracking-widest" htmlFor="username">
            Username
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant/70 text-lg">person</span>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#eff4ff] border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-sm"
              placeholder="Masukkan username"
            />
          </div>
        </div>

        {/* Password input */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-primary uppercase tracking-widest" htmlFor="password">
            Password
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant/70 text-lg">lock</span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 bg-[#eff4ff] border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-sm"
              placeholder="Masukkan password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-on-surface-variant flex items-center justify-center p-1 rounded hover:bg-slate-200"
            >
              <span className="material-symbols-outlined text-lg">
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
        </div>

        {/* Checkbox controls */}
        <div className="flex items-center justify-between text-xs py-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 border-outline-variant rounded text-secondary focus:ring-secondary cursor-pointer"
            />
            <span className="text-on-surface-variant">Ingat saya</span>
          </label>
          <button type="button" className="text-secondary font-semibold hover:underline">
            Lupa Password?
          </button>
        </div>

        {/* Submit action */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#002045] hover:bg-secondary text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-lg active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="material-symbols-outlined text-base animate-spin">sync</span>
          ) : (
            <>
              <span>Masuk Portal</span>
              <span className="material-symbols-outlined text-sm">login</span>
            </>
          )}
        </button>
      </form>

      <Toast 
        show={toastShow} 
        message={toastMsg} 
        type={toastType} 
        onClose={() => setToastShow(false)} 
      />
    </AuthLayout>
  );
};

export default LoginAdmin;
