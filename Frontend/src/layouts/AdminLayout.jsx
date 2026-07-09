import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    { name: 'Data Penerima', path: '/admin/recipients', icon: 'groups' },
    { name: 'Validasi ZKP', path: '/admin/verify', icon: 'verified_user' },
    { name: 'Monitoring Ledger', path: '/admin/monitoring', icon: 'analytics' },
    { name: 'Audit Trail', path: '/admin/audit', icon: 'account_balance_wallet' },
  ];

  const handleLogout = () => {
    api.logout();
    navigate('/');
  };

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
                <span className="material-symbols-outlined text-secondary-container text-xl font-bold">shield</span>
                <span className="font-bold text-base tracking-wide uppercase">BansosChain</span>
              </div>
            )}
            {!sidebarOpen && (
              <span className="material-symbols-outlined text-secondary-container text-2xl font-bold mx-auto">shield</span>
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
            <div className="bg-[#1a365d] p-3 rounded-xl border border-white/5">
              <p className="text-[10px] text-on-primary-container font-semibold uppercase tracking-wider">Operational Node</p>
              <p className="text-xs text-white mt-1 font-mono">Org1-Peer01</p>
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
            <span className="text-sm font-semibold bg-green-500/10 text-green-700 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 biometric-active"></span>
              <span className="text-xs font-semibold">Hyperledger Fabric: Healthy</span>
            </span>
            <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
              v2.5-STABLE
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-primary text-xl">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full"></span>
            </button>
            <div className="w-px h-6 bg-outline-variant/60"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-sm shadow-sm">
                AD
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-primary">System Admin</p>
                <p className="text-[9px] text-on-surface-variant font-mono">ID: 0x9812A2</p>
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

export default AdminLayout;
