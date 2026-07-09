import React from 'react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-mesh flex flex-col justify-between" style={{
      backgroundColor: '#f8f9ff',
      backgroundImage: 'radial-gradient(at 0% 0%, hsla(214,100%,95%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(214,100%,98%,1) 0, transparent 50%)'
    }}>
      {/* Top Brand Banner */}
      <header className="w-full flex justify-between items-center px-6 py-4 bg-white/70 backdrop-blur-md border-b border-outline-variant/30">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl font-bold">shield</span>
          <span className="font-bold text-lg text-primary tracking-wide">BansosChain</span>
        </div>
        <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-widest bg-primary-fixed/20 px-3 py-1 rounded-full">
          <span className="material-symbols-outlined text-sm">verified_user</span>
          <span>Secured Endpoint</span>
        </div>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
        <div className="w-full text-center mb-6">
          <div className="inline-flex items-center justify-center p-4 bg-primary/5 rounded-full mb-3 text-primary">
            <span className="material-symbols-outlined text-3xl font-semibold">account_balance</span>
          </div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">{title}</h2>
          <p className="text-sm text-on-surface-variant mt-1">{subtitle}</p>
        </div>

        {/* Inner Card Container */}
        <div className="w-full bg-white rounded-2xl border border-outline-variant/60 shadow-xl shadow-slate-100/50 p-6">
          {children}
        </div>
      </main>

      {/* Official Footings with Gov Crests */}
      <footer className="w-full bg-white p-6 border-t border-outline-variant/30 flex flex-col items-center gap-3">
        <div className="flex items-center gap-4">
          <div className="text-xs font-semibold text-primary/80 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">domain</span>
            <span>KEMENTERIAN SOSIAL RI</span>
          </div>
          <div className="w-px h-4 bg-outline-variant"></div>
          <div className="text-xs font-semibold text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-base">hub</span>
            <span>FABRIC LEDGER</span>
          </div>
        </div>
        <p className="text-[10px] text-on-surface-variant/60 text-center uppercase tracking-wider">
          © 2024 BansosChain Infrastructure • Secure Cryptographic Access
        </p>
      </footer>
    </div>
  );
};

export default AuthLayout;
