import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { api } from '../services/api';
import Toast from '../components/Toast';

const LoginPengguna = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('otp'); // 'otp' or 'bio'
  const [loading, setLoading] = useState(false);

  // Toast States
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastShow(true);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier) {
      triggerToast('Silakan masukkan 16 digit NIK Anda', 'error');
      return;
    }

    if (identifier.length < 10) {
      triggerToast('Format NIK tidak valid', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.loginUser(identifier, verificationMethod);
      if (res.success) {
        triggerToast('Pemeriksaan Status Sukses. Mengalihkan ke Dashboard...', 'success');
        setTimeout(() => {
          navigate('/user/dashboard');
        }, 1000);
      }
    } catch (err) {
      triggerToast(err.message || 'Gagal masuk, periksa kembali data Anda', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Portal Penerima Manfaat"
      subtitle="Periksa dan klaim bantuan sosial Anda secara terenkripsi menggunakan zk-SNARKs."
    >
      <div className="space-y-6">
        {/* Input Identifier Section */}
        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Nomor Induk Kependudukan (NIK)
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant/70 text-lg">
                id_card
              </span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-sm font-mono"
                placeholder="Masukkan 16 digit NIK Anda"
              />
            </div>
          </div>

          {/* Verification Method Chooser */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Metode Verifikasi Login
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVerificationMethod('otp')}
                className={`flex flex-col items-center justify-center p-3.5 border-2 rounded-xl transition-all duration-200 ${
                  verificationMethod === 'otp'
                    ? 'border-secondary bg-secondary/5 text-secondary font-bold'
                    : 'border-outline-variant/60 hover:border-slate-400 text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-lg mb-1">sms_failed</span>
                <span className="text-[10px] uppercase tracking-wider">SMS OTP</span>
              </button>

              <button
                type="button"
                onClick={() => setVerificationMethod('bio')}
                className={`flex flex-col items-center justify-center p-3.5 border-2 rounded-xl transition-all duration-200 ${
                  verificationMethod === 'bio'
                    ? 'border-secondary bg-secondary/5 text-secondary font-bold'
                    : 'border-outline-variant/60 hover:border-slate-400 text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-lg mb-1">fingerprint</span>
                <span className="text-[10px] uppercase tracking-wider">Biometrik</span>
              </button>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary hover:bg-secondary text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="material-symbols-outlined text-base animate-spin">sync</span>
            ) : (
              <>
                <span>Cek Status Bantuan</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-on-surface-variant">
          Belum terdaftar? <a href="#" className="text-secondary font-semibold hover:underline">Hubungi Pendamping Bansos untuk didaftarkan oleh Admin</a>
        </p>

        {/* Security Badges Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/30">
          <div className="bg-[#f8f9ff] border border-outline-variant/40 p-3 rounded-xl flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-secondary text-lg mb-1.5" style={{ fontVariationSettings: "'FILL' 1" }}>
              security
            </span>
            <span className="text-[9px] font-bold text-primary uppercase">ZKP Shield Active</span>
            <span className="text-[8px] text-on-surface-variant mt-0.5 leading-tight">
              Privasi terjaga mutlak dengan sirkuit zk-SNARKs
            </span>
          </div>

          <div className="bg-[#f8f9ff] border border-outline-variant/40 p-3 rounded-xl flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-secondary text-lg mb-1.5" style={{ fontVariationSettings: "'FILL' 1" }}>
              account_balance_wallet
            </span>
            <span className="text-[9px] font-bold text-primary uppercase">Raft Consensus</span>
            <span className="text-[8px] text-on-surface-variant mt-0.5 leading-tight">
              Transaksi tercatat permanen di Fabric Ledger
            </span>
          </div>
        </div>
      </div>

      <Toast 
        show={toastShow} 
        message={toastMsg} 
        type={toastType} 
        onClose={() => setToastShow(false)} 
      />
    </AuthLayout>
  );
};

export default LoginPengguna;
