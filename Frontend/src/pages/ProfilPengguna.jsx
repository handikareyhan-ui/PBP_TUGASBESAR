import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Toast from '../components/Toast';

const ProfilPengguna = () => {
  const navigate = useNavigate();
  const [revealNik, setRevealNik] = useState(false);
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Toast Notification States
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastShow(true);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const profile = await api.getUserProfile();
      setRecipient(profile);
      window.dispatchEvent(new Event('recipient_profile_refreshed'));
    } catch (err) {
      console.error(err);
      triggerToast('Gagal memuat profil pengguna dari ledger.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      triggerToast('MetaMask tidak terdeteksi. Silakan pasang ekstensi MetaMask.', 'error');
      return;
    }

    try {
      // Trigger MetaMask account request
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
      
      if (accounts && accounts.length > 0) {
        const walletAddress = accounts[0];
        
        // Save walletAddress to database via PUT /api/user/connect-wallet
        const res = await api.connectWallet(walletAddress);
        if (res.success) {
          triggerToast('✓ Wallet MetaMask berhasil ditautkan!', 'success');
          fetchProfile(); // Reload profile details
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Batal menyambungkan wallet MetaMask.', 'error');
    }
  };

  const handleLogout = () => {
    api.logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-on-surface-variant/60">
        <span className="material-symbols-outlined text-4xl animate-spin block mb-3">sync</span>
        <p className="text-xs">Sinkronisasi data profil KTP dari blockchain...</p>
      </div>
    );
  }

  // Mask NIK for security
  const formatMaskedNik = (nik) => {
    if (!nik) return '';
    return revealNik ? nik : `${nik.substring(0, 4)}**********${nik.substring(12)}`;
  };

  // Truncate Ethereum address for display
  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const isWalletConnected = recipient?.walletId && /^0x[a-fA-F0-9]{40}$/.test(recipient.walletId);

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary">Profil Saya</h2>
        <p className="text-xs text-on-surface-variant">
          Informasi demografi terdaftar dan kunci tanda tangan digital blockchain Anda.
        </p>
      </div>

      {/* Grid: Profile Summary card and Details */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Side: Avatar Panel */}
        <section className="bg-white border border-outline-variant rounded-2xl p-6 flex flex-col items-center text-center shadow-sm h-fit">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#eff4ff] p-1 bg-white shadow-inner flex items-center justify-center">
              <span className="material-symbols-outlined text-primary/10 text-7xl select-none pointer-events-none">
                account_circle
              </span>
            </div>
            <button 
              onClick={() => triggerToast('Sinkronisasi foto profil memerlukan otorisasi Dinas Kependudukan.')}
              className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg active:scale-90 transition-transform flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-xs">edit</span>
            </button>
          </div>

          <h3 className="text-md font-bold text-primary mt-4">{recipient?.name || 'Penerima Bansos'}</h3>
          <div className="flex items-center gap-1.5 bg-green-500/10 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span>VERIFIED CITIZEN</span>
          </div>
        </section>

        {/* Right Side: Identity Details Panel (col-span-2) */}
        <section className="md:col-span-2 space-y-4 text-xs">
          
          {/* NIK Card */}
          <div className="bg-white border border-outline-variant p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Nomor Induk Kependudukan (NIK)</p>
              <p className="text-sm font-bold text-primary mt-1 font-mono tracking-wider">
                {formatMaskedNik(recipient?.nik)}
              </p>
            </div>
            <button 
              type="button"
              onClick={() => setRevealNik(!revealNik)}
              className="text-secondary hover:bg-slate-100 p-2 rounded-xl transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-lg">
                {revealNik ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>

          {/* Regional demographic details */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white border border-outline-variant p-4 rounded-xl shadow-sm">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Wilayah Domisili</p>
              <p className="text-sm font-bold text-primary mt-1">{recipient?.region || 'Jawa Barat'}</p>
            </div>
            <div className="bg-white border border-outline-variant p-4 rounded-xl shadow-sm">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pendapatan Terdaftar</p>
              <p className="text-sm font-bold text-primary mt-1">
                Rp {recipient?.pendapatan?.toLocaleString('id-ID') || '0'} / bulan
              </p>
            </div>
          </div>

          {/* Web3 Identity / MetaMask Card */}
          <div className="bg-[#eff4ff] border border-outline-variant p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">account_balance_wallet</span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">MetaMask Web3 Identity</p>
              </div>
              <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                isWalletConnected
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-amber-100 text-amber-700 border-amber-300'
              }`}>
                <span className="material-symbols-outlined text-[10px]">{isWalletConnected ? 'check_circle' : 'hourglass_empty'}</span>
                <span>{isWalletConnected ? 'Terhubung' : 'Belum Terhubung'}</span>
              </span>
            </div>

            {isWalletConnected ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Wallet Terkoneksi</p>
                  <p className="font-mono text-sm font-extrabold text-primary break-all">{truncateAddress(recipient.walletId)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(recipient.walletId);
                      triggerToast('✓ Wallet Address disalin ke clipboard!');
                    }}
                    className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl active:scale-95 transition-all hover:bg-secondary flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    <span>📋 Salin Wallet</span>
                  </button>
                  <button 
                    onClick={connectMetaMask}
                    className="px-4 py-2 bg-secondary text-white font-bold text-xs rounded-xl active:scale-95 transition-all hover:bg-primary flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">link</span>
                    <span>🔗 Ganti Wallet</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-amber-500/5 border border-amber-300/30 p-3 rounded-xl text-amber-800 text-[11px] leading-relaxed">
                  Identitas Web3 Anda belum ditautkan ke MetaMask. Menghubungkan MetaMask akan menautkan wallet address permanen ke profil Hyperledger Fabric Anda.
                </div>
                <button
                  onClick={connectMetaMask}
                  className="w-full py-3 bg-[#e87024] hover:bg-[#d65f13] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-md"
                >
                  <span className="material-symbols-outlined text-sm">link</span>
                  <span>🔗 Hubungkan Wallet</span>
                </button>
              </div>
            )}
          </div>

          {/* Residential Address Card */}
          <div className="bg-white border border-outline-variant p-4 rounded-xl shadow-sm space-y-2">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Alamat Lengkap KTP</p>
            <div className="flex gap-3 items-start">
              <span className="material-symbols-outlined text-secondary text-lg mt-0.5">location_on</span>
              <p className="text-xs text-primary leading-relaxed">
                {recipient?.region || 'Wilayah Terdaftar'}, Republik Indonesia
              </p>
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-6 flex justify-center">
            <button 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 px-4 py-2 hover:bg-red-50 rounded-xl transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span>Keluar dari Akun</span>
            </button>
          </div>

        </section>

      </div>

      <Toast 
        show={toastShow} 
        message={toastMsg} 
        type={toastType} 
        onClose={() => setToastShow(false)} 
      />
    </div>
  );
};

export default ProfilPengguna;
