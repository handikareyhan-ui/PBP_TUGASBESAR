import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import BlockchainBadge from '../components/BlockchainBadge';
import Toast from '../components/Toast';

const StatusKelayakan = () => {
  const [recipient, setRecipient] = useState(null);
  const [verification, setVerification] = useState(null);
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

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const profile = await api.getUserProfile();
      setRecipient(profile);

      // Fetch ZKP Verification history logs
      const verifications = await api.getVerifications();
      const myVerifications = verifications.filter(v => v.recipientId === profile.id);
      if (myVerifications.length > 0) {
        // Sort by creation date descending to get the latest
        myVerifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setVerification(myVerifications[0]);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Gagal memproses sinkronisasi data dari blockchain ledger.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-on-surface-variant/60">
        <span className="material-symbols-outlined text-4xl animate-spin block mb-3">sync</span>
        <p className="text-xs">Sinkronisasi status kelayakan dari blockchain ledger...</p>
      </div>
    );
  }

  // Resolve status states
  const status = recipient?.status || 'PENDING';
  const isLayak = status === 'LAYAK' || status === 'TERSALURKAN';
  const isTidakLayak = status === 'TIDAK LAYAK' || status === 'TIDAK_LAYAK' || status === 'DITOLAK';
  const isPending = !isLayak && !isTidakLayak;

  // Criteria thresholds checks
  const incomeVal = recipient?.pendapatan || 0;
  const incomePassed = incomeVal < 2000000;
  const dependentsVal = recipient?.jumlahTanggungan || 0;
  const dependentsPassed = dependentsVal >= 1;

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary">Detail Status Kelayakan</h2>
        <p className="text-xs text-on-surface-variant">
          Pemeriksaan kriteria kelayakan jaminan sosial dengan perlindungan privasi enkripsi.
        </p>
      </div>

      {/* Main Status Hero Card */}
      <section className="bg-white border border-outline-variant rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-sm relative overflow-hidden">
        {/* Background icon accent */}
        <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none select-none">
          <span className="material-symbols-outlined text-[100px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified_user
          </span>
        </div>

        {isLayak && (
          <div className="w-16 h-16 bg-green-500/10 text-green-700 rounded-full flex items-center justify-center animate-bounce-slow">
            <span className="material-symbols-outlined text-3xl font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
        )}

        {isTidakLayak && (
          <div className="w-16 h-16 bg-red-500/10 text-red-700 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>
              cancel
            </span>
          </div>
        )}

        {isPending && (
          <div className="w-16 h-16 bg-amber-500/10 text-amber-700 rounded-full flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-3xl font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>
              hourglass_empty
            </span>
          </div>
        )}

        <div>
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Status Penilaian Kelayakan</p>
          <h3 className={`text-3xl font-extrabold uppercase tracking-tight ${
            isLayak ? 'text-green-600' : isTidakLayak ? 'text-red-600' : 'text-amber-500'
          }`}>
            {isLayak ? 'LAYAK MENERIMA' : isTidakLayak ? 'TIDAK LAYAK' : 'MENUNGGU VERIFIKASI'}
          </h3>
          <p className="text-[10px] text-on-surface-variant/80 font-medium mt-1">
            {verification?.verifiedAt 
              ? `Terverifikasi On-Chain: ${new Date(verification.verifiedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • ${new Date(verification.verifiedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
              : 'Belum diverifikasi oleh admin'
            }
          </p>
        </div>
      </section>

      {/* ZK-Proof Criteria checklist */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* ZK-Proof details list */}
        <section className="md:col-span-2 bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-4 bg-surface-container border-b border-outline-variant/60 flex justify-between items-center">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Kriteria Bukti Enkripsi (ZKP)</h4>
              <span className="bg-[#002045] text-white font-bold text-[9px] px-2 py-0.5 rounded">Circom Sirkuit eligibility</span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-on-surface-variant leading-relaxed">
                Data sosioekonomi Anda dicocokkan dengan kriteria bantuan sosial secara Zero-Knowledge Proof. 
                Sirkuit ZKP menguji parameter kelayakan secara privat tanpa mengungkap data mentah Anda ke ledger blockchain publik:
              </p>
              
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                  <div>
                    <span className="text-on-surface-variant font-medium block">Kriteria Pendapatan Bulanan</span>
                    <span className="text-[10px] text-on-surface-variant/70">
                      Rp {incomeVal.toLocaleString('id-ID')} / bulan (Batas: &lt; Rp 2.000.000)
                    </span>
                  </div>
                  <span className={`font-bold flex items-center gap-1 text-[11px] ${incomePassed ? 'text-green-600' : 'text-red-500'}`}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {incomePassed ? 'check_circle' : 'cancel'}
                    </span>
                    <span>{incomePassed ? 'Memenuhi Syarat' : 'Melebihi Batas'}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                  <div>
                    <span className="text-on-surface-variant font-medium block">Ketergantungan Keluarga (Tanggungan)</span>
                    <span className="text-[10px] text-on-surface-variant/70">
                      {dependentsVal} Orang terdaftar (Batas: &gt;= 1)
                    </span>
                  </div>
                  <span className={`font-bold flex items-center gap-1 text-[11px] ${dependentsPassed ? 'text-green-600' : 'text-red-500'}`}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {dependentsPassed ? 'check_circle' : 'cancel'}
                    </span>
                    <span>{dependentsPassed ? 'Memenuhi Syarat' : 'Tanggungan Kurang'}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <div>
                    <span className="text-on-surface-variant font-medium block">Logika Evaluasi Aturan</span>
                    <span className="text-[10px] text-on-surface-variant/70">
                      Operator Logika: pendapatanBulanan &lt; 2jt AND jumlahTanggungan &gt;= 1
                    </span>
                  </div>
                  <span className={`font-bold flex items-center gap-1 text-[11px] ${isLayak ? 'text-green-600' : isTidakLayak ? 'text-red-500' : 'text-amber-500'}`}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isLayak ? 'check_circle' : isTidakLayak ? 'cancel' : 'hourglass_empty'}
                    </span>
                    <span>{isLayak ? 'LAYAK (AND Lolos)' : isTidakLayak ? 'TIDAK LAYAK' : 'MENUNGGU'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blockchain Seal Info */}
        <section className="bg-white border border-outline-variant rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-outline-variant pb-2">
              Segel Autentikasi ZKP
            </h4>
            <div className="space-y-3">
              <div className="bg-[#f8f9ff] border border-outline-variant/60 p-3 rounded-xl">
                <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Blockchain Verification Proof Hash</p>
                <div className="mt-1">
                  {verification?.proofHash ? (
                    <BlockchainBadge hash={verification.proofHash} />
                  ) : (
                    <span className="text-[10px] text-on-surface-variant italic">Belum terverifikasi (Pending)</span>
                  )}
                </div>
              </div>
              <div className="bg-[#f8f9ff] border border-outline-variant/60 p-3 rounded-xl">
                <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Status Keabsahan Proof</p>
                <span className={`text-[10px] font-bold uppercase ${verification?.proofVerified ? 'text-green-600' : 'text-red-500'}`}>
                  {verification?.proofVerified ? '✓ TERVERIFIKASI VALID' : '✗ TIDAK TERVERIFIKASI'}
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                Segel kriptografis ini membuktikan keabsahan verifikasi ZKP tanpa membocorkan data pribadi mentah Anda ke dalam ledger.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-6">
            <button 
              onClick={() => {
                if (verification) {
                  const proofData = JSON.stringify(verification, null, 2);
                  const blob = new Blob([proofData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `zkp-proof-${recipient?.name}.json`;
                  a.click();
                  triggerToast('✓ Sertifikat kelayakan ZKP diunduh!');
                } else {
                  triggerToast('Tidak ada data bukti verifikasi untuk diunduh.', 'error');
                }
              }}
              className="py-2.5 bg-secondary text-white font-bold text-[10px] rounded-lg active:scale-95 transition-all text-center uppercase tracking-wider hover:bg-primary shadow-sm"
            >
              Unduh Bukti
            </button>
            <button 
              onClick={() => triggerToast('Membuka riwayat log blockchain untuk alamat Anda.')}
              className="py-2.5 border border-outline text-primary font-bold text-[10px] rounded-lg active:scale-95 transition-all text-center uppercase tracking-wider hover:bg-slate-50"
            >
              Log Riwayat
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

export default StatusKelayakan;
