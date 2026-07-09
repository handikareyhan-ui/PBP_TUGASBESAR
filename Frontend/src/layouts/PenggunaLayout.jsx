import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const PenggunaLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { name: 'Dashboard', path: '/user/dashboard', icon: 'dashboard' },
    { name: 'Pengajuan Bantuan', path: '/user/apply', icon: 'note_add' },
    { name: 'Status Kelayakan', path: '/user/status', icon: 'verified_user' },
    { name: 'Klaim Bantuan', path: '/user/claim', icon: 'account_balance_wallet' },
    { name: 'Riwayat Bantuan', path: '/user/history', icon: 'history' },
    { name: 'Profil Saya', path: '/user/profile', icon: 'person' },
  ];

  const handleLogout = () => {
    api.logout();
    navigate('/');
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'BD';
  };

  const [recipientData, setRecipientData] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await api.getUserProfile();
        setRecipientData(profile);
      } catch (err) {
        console.error('Failed to load user profile in layout:', err);
      }
    };
    loadProfile();

    window.addEventListener('recipient_profile_refreshed', loadProfile);
    return () => {
      window.removeEventListener('recipient_profile_refreshed', loadProfile);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex text-on-surface">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className={`bg-[#002045] text-white flex flex-col justify-between transition-all duration-300 z-50 flex-shrink-0 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        <div>
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-container text-xl font-bold">verified_user</span>
                <span className="font-bold text-base tracking-wide uppercase">BansosChain</span>
              </div>
            )}
            {!sidebarOpen && (
              <span className="material-symbols-outlined text-secondary-container text-2xl font-bold mx-auto">verified_user</span>
            )}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors ml-auto"
            >
              <span className="material-symbols-outlined text-lg">
                {sidebarOpen ? 'menu_open' : 'menu'}
              </span>
            </button>
          </div>
 
          {/* Navigation Links */}
          <nav className="p-3 space-y-2 mt-4">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-secondary text-white font-semibold shadow-md shadow-secondary/20'
                      : 'text-on-primary-container hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    {item.icon}
                  </span>
                  {sidebarOpen && <span className="text-sm">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
 
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {sidebarOpen && (
            <div className="bg-[#1a365d] p-3 rounded-xl border border-white/5 text-center">
              <p className="text-[10px] text-secondary-container font-semibold uppercase tracking-wider">ZKP Privacy Shield</p>
              <p className="text-[10px] text-white/70 mt-0.5">Circom + snarkjs Active</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all font-semibold"
          >
            <span className="material-symbols-outlined text-red-400">logout</span>
            {sidebarOpen && <span className="text-sm">Log Out</span>}
          </button>
        </div>
      </aside>
 
      {/* RIGHT MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar Header */}
        <header className="h-16 bg-white border-b border-outline-variant/30 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">domain</span>
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Kementerian Sosial Republik Indonesia</span>
            </span>
          </div>
 
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-semibold text-green-700 bg-green-500/10 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 biometric-active"></span>
              <span>Encrypted Node Connected</span>
            </span>
            <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-primary text-xl">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full"></span>
            </button>
            <div className="w-px h-6 bg-outline-variant/60"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {getInitials(recipientData?.name)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-primary">{recipientData?.name || 'Penerima'}</p>
                <p className="text-[9px] text-on-surface-variant font-mono">
                  {recipientData?.walletId 
                    ? `Wallet: ${recipientData.walletId.substring(0, 7)}...${recipientData.walletId.substring(recipientData.walletId.length - 4)}` 
                    : 'Belum Terhubung'}
                </p>
              </div>
            </div>
          </div>
        </header>


        {/* Main Content Area */}
        <main className="p-6 md:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PenggunaLayout;
