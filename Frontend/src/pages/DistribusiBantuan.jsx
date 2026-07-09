import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Toast from '../components/Toast';

const DistribusiBantuan = () => {
  const [distributeLoading, setDistributeLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalStage, setModalStage] = useState('processing'); // 'processing' or 'success'
  const [txHash, setTxHash] = useState('');
  
  const [pendingRelease, setPendingRelease] = useState([]);
  const [stats, setStats] = useState({
    progressVal: 0,
    recipientsDisbursed: 0,
    totalRecipients: 0
  });

  // Toast notifications
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setToastShow(true);
  };

  const fetchPendingRelease = async () => {
    try {
      const data = await api.getRecipients();
      const layak = data.filter(r => r.status === 'LAYAK');
      const disbursed = data.filter(r => r.status === 'TERSALURKAN').length;
      const total = layak.length + disbursed;
      const progress = total > 0 ? Math.round((disbursed / total) * 100) : 0;
      
      setStats({
        progressVal: progress,
        recipientsDisbursed: disbursed,
        totalRecipients: total
      });

      setPendingRelease(layak.map(r => {
        const nameParts = r.name.split(' ');
        const avatar = nameParts.map(n => n[0]).join('').slice(0, 2).toUpperCase();
        return {
          id: r.id,
          name: r.name,
          nik: r.nik,
          amount: 'Rp 600,000',
          avatar
        };
      }));
    } catch (err) {
      console.error('Failed to load pending release list:', err);
    }
  };

  useEffect(() => {
    fetchPendingRelease();
  }, []);

  const handleDistributeAll = async () => {
    setDistributeLoading(true);
    try {
      setShowModal(true);
      setModalStage('processing');
      
      const res = await api.distributeAll();
      setTxHash(res.hash);

      await fetchPendingRelease();
      setModalStage('success');
      triggerToast('Dana bantuan berhasil disalurkan secara massal!');
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal memproses penyaluran');
      setShowModal(false);
    } finally {
      setDistributeLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary">Distribusi Bantuan Sosial</h2>
        <p className="text-xs text-on-surface-variant">
          Penyaluran dana ke alamat smart contract bantuan sosial secara terjadwal.
        </p>
      </div>

      {/* Release Progress Panel */}
      <section className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Batch Disbursement</p>
            <h3 className="text-lg font-bold text-primary mt-1">Penyaluran Bantuan Sembako Tahap Baru</h3>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-secondary">{stats.progressVal}%</span>
          </div>
        </div>

        {/* Progress Release Bar */}
        <div className="w-full bg-[#eff4ff] h-3.5 rounded-full overflow-hidden relative">
          <div 
            className="bg-secondary h-full rounded-full transition-all duration-[1500ms] ease-out relative"
            style={{ width: `${stats.progressVal}%` }}
          >
            <div className="absolute inset-0 bg-white/25 biometric-active"></div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 pt-1 font-semibold text-on-surface-variant">
          <p>{stats.recipientsDisbursed}/{stats.totalRecipients} Penerima Terbayar</p>
          <p className="font-mono text-[10px]">Live Ledger Verification Active</p>
        </div>
      </section>

      {/* RELEASE CTA BUTTON TRIGGER */}
      <div className="max-w-md">
        <button
          onClick={handleDistributeAll}
          disabled={stats.progressVal === 100 || distributeLoading || pendingRelease.length === 0}
          className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 ${
            stats.progressVal === 100 || pendingRelease.length === 0
              ? 'bg-green-500/10 text-green-700 cursor-not-allowed border border-green-500/20' 
              : 'bg-primary text-white hover:bg-secondary'
          }`}
        >
          <span className="material-symbols-outlined text-base">send</span>
          <span>{stats.progressVal === 100 || pendingRelease.length === 0 ? 'Penyaluran Selesai / Kosong' : 'Salurkan Dana Bantuan Massal'}</span>
        </button>
      </div>

      {/* READY RECIPIENTS SECTION */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Daftar Penerima Siap Kirim</h3>
          <span className="text-[10px] font-bold text-[#006e1c] bg-green-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
            {pendingRelease.length} Penerima Ready
          </span>
        </div>

        {pendingRelease.length === 0 ? (
          <div className="bg-white border border-outline-variant rounded-2xl text-center py-12 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-3xl text-green-500 block mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <p className="text-xs">Seluruh dana bantuan telah sukses disalurkan ke blockchain / tidak ada yang siap salur.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {pendingRelease.map((rec, i) => (
              <div 
                key={i} 
                className="bg-white border border-outline-variant rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute top-0 right-0 w-1 bg-secondary h-full"></div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 font-bold text-xs flex items-center justify-center text-primary-container">
                    {rec.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary">{rec.name}</h4>
                    <p className="text-[10px] text-on-surface-variant font-mono">ID: {rec.id}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-5 pt-3 border-t border-dashed border-outline-variant/60">
                  <span className="text-sm font-bold text-secondary">{rec.amount}</span>
                  <div className="flex items-center gap-1 text-green-700 bg-green-500/10 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter">
                    <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>Ready</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BLOCKCHAIN CONFIRMATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md border border-outline-variant p-6 shadow-2xl animate-scale-up text-center">
            
            {modalStage === 'processing' ? (
              <div className="space-y-6 py-4">
                <div className="w-16 h-16 bg-[#eff4ff] text-secondary rounded-full flex items-center justify-center mx-auto biometric-active">
                  <span className="material-symbols-outlined text-3xl animate-spin">cyclone</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">Memproses Transaksi</h3>
                  <p className="text-xs text-on-surface-variant mt-2 px-4 leading-relaxed">
                    Mengirimkan dana bantuan sosial ke Smart Contract Distribusi Jaringan. Mohon tunggu konfirmasi block consensus.
                  </p>
                </div>
                <div className="space-y-3 max-w-xs mx-auto">
                  <div className="flex justify-between items-center text-[10px] py-1.5 border-b border-outline-variant/40">
                    <span className="text-on-surface-variant font-medium">Jaringan</span>
                    <span className="font-bold text-green-700">ACTIVE & SECURE</span>
                  </div>
                  <div className="text-left bg-[#f8f9ff] border border-outline-variant/60 p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Blockchain Receipt Receipt</p>
                    <p className="text-[9px] font-mono text-primary mt-1 break-all bg-white p-1 rounded border">
                      TX: 0x9b7e412a87d6982cc44109f8a21...
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="w-16 h-16 bg-green-500/10 text-green-700 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">Disbursement Sukses!</h3>
                  <p className="text-xs text-on-surface-variant mt-2 px-4 leading-relaxed">
                    Transaksi penyaluran dana telah dicatat secara permanen pada Blok Jaringan Hyperledger Fabric.
                  </p>
                </div>
                <div className="bg-[#f8f9ff] border border-outline-variant/60 p-4 rounded-xl text-left max-w-sm mx-auto">
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Blok Penyaluran</p>
                  <p className="text-[10px] font-mono text-primary mt-1 break-all">
                    Tx Hash: {txHash}
                  </p>
                  <p className="text-[9px] text-on-surface-variant mt-1">Blok Terkonfirmasi: #18,204,912</p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full py-3 bg-primary hover:bg-secondary text-white font-bold text-xs rounded-xl transition-colors active:scale-95"
                >
                  Tutup & Pantau Distribusi
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      <Toast 
        show={toastShow} 
        message={toastMsg} 
        type="success" 
        onClose={() => setToastShow(false)} 
      />
    </div>
  );
};

export default DistribusiBantuan;
