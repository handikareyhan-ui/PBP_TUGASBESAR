import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import BlockchainBadge from '../components/BlockchainBadge';
import Toast from '../components/Toast';

const ValidasiZKP = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toast States
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastShow(true);
  };

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const data = await api.getVerifications();
      setVerifications(data);
    } catch (err) {
      triggerToast('Gagal memuat log verifikasi ZKP', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
    const interval = setInterval(fetchVerifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Compute Metrics
  const totalProofs = verifications.length;
  const validProofs = verifications.filter(v => v.status === 'VERIFIED').length;
  const invalidProofs = verifications.filter(v => v.status === 'REJECTED').length;
  const pendingProofs = verifications.filter(v => v.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary">Monitoring Validasi ZKP</h2>
        <p className="text-xs text-on-surface-variant">
          Pantau status pembuktian Zero-Knowledge Proof (ZKP) yang berjalan secara otomatis pada sirkuit kriptografi.
        </p>
      </div>

      {/* Explanatory Protocol Header Banner */}
      <section className="relative overflow-hidden bg-[#1a365d] rounded-2xl p-6 text-white shadow-md">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
          <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified_user
          </span>
        </div>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-[#a2c9ff]">
            <span className="material-symbols-outlined text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_with_heart
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a2c9ff]">AUTOMATED ZK-SNARKs PROTOCOL</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white leading-snug">
            Proses Verifikasi Otomatis Terintegrasi
          </h3>
          <p className="text-xs text-white/80 leading-relaxed">
            Setiap pengajuan bantuan sosial dari warga diproses secara real-time off-chain untuk menghasilkan mathematical proof. 
            Sistem kemudian memverifikasi proof tersebut secara otomatis tanpa intervensi manual dari administrator untuk menjamin asas keadilan bebas konflik kepentingan.
          </p>
        </div>
      </section>

      {/* ZKP Metrics Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-sm text-center">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Proof</p>
          <h4 className="text-3xl font-extrabold text-primary">{totalProofs}</h4>
        </div>

        <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-sm text-center">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Proof Valid</p>
          <h4 className="text-3xl font-extrabold text-green-600">{validProofs}</h4>
        </div>

        <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-sm text-center">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Proof Invalid</p>
          <h4 className="text-3xl font-extrabold text-red-600">{invalidProofs}</h4>
        </div>

        <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-sm text-center">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Proof Pending</p>
          <h4 className="text-3xl font-extrabold text-amber-500">{pendingProofs}</h4>
        </div>
      </section>

      {/* Verification Logs Table */}
      <section className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-surface-container border-b border-outline-variant/60 flex justify-between items-center">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Log Pembuktian & Verifikasi Sirkuit</h3>
          <span className="bg-[#002045] text-white font-bold text-[9px] px-2 py-0.5 rounded font-mono">ZK-Verifier: Active</span>
        </div>

        {loading && verifications.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-3xl animate-spin block mb-3">sync</span>
            <p className="text-xs">Mengambil data log verifikasi...</p>
          </div>
        ) : verifications.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-3xl block mb-3">info</span>
            <p className="text-xs">Belum ada aktivitas verifikasi proof ZKP saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-outline-variant text-[10px] font-bold text-primary uppercase tracking-wider">
                  <th className="p-4">Nama Pengaju (Masked)</th>
                  <th className="p-4">Hash Proof</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Waktu Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {verifications.map((v) => {
                  const nameParts = v.recipient?.nama?.split(' ') || ['Warga'];
                  const maskedName = nameParts.length >= 2 
                    ? `${nameParts[0][0]}. ${nameParts[1][0]}.` 
                    : `${nameParts[0][0]}.`;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-primary">{maskedName}</td>
                      <td className="p-4 font-mono">
                        {v.status === 'ZKP_FAILED' ? (
                          <span className="text-red-500 font-bold text-[10px] break-all">{v.proofHash}</span>
                        ) : (
                          <BlockchainBadge hash={v.proofHash} />
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider ${
                          v.status === 'VERIFIED' ? 'bg-green-500/10 text-green-700' :
                          v.status === 'REJECTED' ? 'bg-red-500/10 text-red-700' :
                          v.status === 'ZKP_FAILED' ? 'bg-rose-500/10 text-rose-700 font-bold' :
                          'bg-amber-500/10 text-amber-700'
                        }`}>
                          {v.status === 'VERIFIED' ? 'Valid' :
                           v.status === 'REJECTED' ? 'Invalid' :
                           v.status === 'ZKP_FAILED' ? 'ZKP Gagal' :
                           'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant/80">
                        {v.verifiedAt 
                          ? new Date(v.verifiedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
                          : '-'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Toast 
        show={toastShow} 
        message={toastMsg} 
        type={toastType} 
        onClose={() => setToastShow(false)} 
      />
    </div>
  );
};

export default ValidasiZKP;
