import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import BlockchainBadge from '../components/BlockchainBadge';
import Toast from '../components/Toast';

const DashboardPengguna = () => {
  const navigate = useNavigate();
  const [claimStep, setClaimStep] = useState(1);
  const [greeting, setGreeting] = useState('Selamat Datang');
  const [recipient, setRecipient] = useState(null);
  const [distributions, setDistributions] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);

  // Toast notifications
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setToastShow(true);
  };

  const loadDashboardData = async () => {
    try {
      const profile = await api.getUserProfile();
      setRecipient(profile);

      // Fetch recipient distribution logs (aid history)
      const allDists = await api.getDistributions();
      const myDists = allDists.filter(d => d.recipientId === profile.id);
      setDistributions(myDists);

      // Fetch claim step
      const step = await api.getClaimStep();
      setClaimStep(step);

      // Fetch blockchain telemetry status
      const tel = await api.getTelemetry();
      setTelemetry(tel);
    } catch (err) {
      console.error('Error fetching user dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Dynamic greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 11) setGreeting('Selamat Pagi');
    else if (hour < 15) setGreeting('Selamat Siang');
    else if (hour < 19) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');

    loadDashboardData();
  }, []);



  if (loading) {
    return (
      <div className="text-center py-20 text-on-surface-variant/60">
        <span className="material-symbols-outlined text-4xl animate-spin block mb-3">sync</span>
        <p className="text-xs">Sinkronisasi data portal dari ledger...</p>
      </div>
    );
  }

  // Calculate total aid received dynamically
  const totalReceived = distributions.reduce((sum, item) => sum + item.nominal, 0);

  // Status mapping styling
  const getStatusConfig = (status) => {
    switch (status) {
      case 'PENDING':
        return {
          bg: 'bg-amber-600',
          badge: 'bg-amber-100 text-amber-700 border-amber-300',
          title: 'Akun Anda Sedang Dalam Tahap Validasi ZKP',
          desc: 'Identitas sosioekonomi Anda sedang ditinjau off-chain secara privat menggunakan sirkuit ZKP.'
        };
      case 'LAYAK':
        return {
          bg: 'bg-primary',
          badge: 'bg-green-100 text-green-700 border-green-300',
          title: 'Kriteria Kelayakan Anda Terverifikasi',
          desc: 'Sistem telah menyelesaikan pencocokan silang data demografi Anda secara aman via zk-SNARKs.'
        };
      case 'TERSALURKAN':
        return {
          bg: 'bg-emerald-800',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          title: 'Dana Bantuan Sosial Anda Telah Disalurkan',
          desc: 'Transaksi disbursement telah dikonfirmasi dan dicatat secara permanen di blockchain ledger.'
        };
      case 'TIDAK LAYAK':
      case 'DITOLAK':
        return {
          bg: 'bg-rose-900',
          badge: 'bg-red-100 text-red-700 border-red-300',
          title: 'Otorisasi Kelayakan Bantuan Ditolak',
          desc: 'Data demografi KTP Anda tidak memenuhi kriteria penerima bantuan sosial berdasarkan aturan konsensus.'
        };
      case 'DIBLOKIR':
        return {
          bg: 'bg-purple-900',
          badge: 'bg-purple-100 text-purple-700 border-purple-300',
          title: 'Akses Akun Terkait Ditangguhkan',
          desc: 'Akses tanda tangan digital wallet Anda ditangguhkan sementara untuk kebutuhan audit ledger.'
        };
      default:
        return {
          bg: 'bg-slate-700',
          badge: 'bg-slate-100 text-slate-700 border-slate-300',
          title: 'Status Akun Nonaktif',
          desc: 'Akun Anda dinonaktifkan secara permanen pada log ledger.'
        };
    }
  };

  const statusConfig = getStatusConfig(recipient?.status);

  return (
    <div className="space-y-6">
      
      {/* Greetings Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">{greeting}, {recipient?.name || 'Penerima'}</h2>
          <p className="text-xs text-on-surface-variant">
            Infrastruktur desentralisasi bansos aktif. Data privasi Anda terlindungi.
          </p>
        </div>
        
        {/* Dynamic Badges Block */}
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 bg-primary/10 text-primary border border-outline-variant rounded-md font-mono text-[9px] font-bold uppercase tracking-wider">
            ⛓ Hyperledger Fabric
          </span>
          <span className="px-2.5 py-1 bg-secondary-container/20 text-secondary border border-outline-variant rounded-md font-mono text-[9px] font-bold uppercase tracking-wider">
            🗳 Raft Consensus
          </span>
          <span className="px-2.5 py-1 bg-green-500/10 text-green-700 border border-green-300/30 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider">
            ✓ ZKP Verified
          </span>
        </div>
      </div>

      {/* Hero ZKP Verification Card Banner */}
      <section className={`relative overflow-hidden ${statusConfig.bg} text-white rounded-2xl p-6 shadow-lg`}>
        {/* Background icon accent */}
        <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none select-none">
          <span className="material-symbols-outlined text-[140px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified_user
          </span>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${statusConfig.badge}`}>
              STATUS KELAYAKAN: {recipient?.status || 'PENDING'}
            </span>
          </div>

          <div className="max-w-2xl space-y-2 text-xs">
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight leading-snug">
              {statusConfig.title}
            </h3>
            <p className="text-white/80 leading-relaxed text-[11px]">
              {statusConfig.desc}
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              onClick={() => navigate('/user/status')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 text-xs font-bold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">security</span>
              <span>Pemeriksaan Status</span>
            </button>
            
            <button 
              onClick={() => navigate('/user/profile')}
              className="px-4 py-2 bg-[#eff4ff] text-primary text-xs font-bold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all hover:bg-slate-200"
            >
              <span className="material-symbols-outlined text-sm">person</span>
              <span>Buka Profil Detail</span>
            </button>
          </div>
        </div>
      </section>

      {/* Stats Mini Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Bantuan */}
        <div className="bg-white border border-outline-variant p-4 rounded-xl relative overflow-hidden shadow-sm flex items-center gap-4">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-green-500"></div>
          <div className="bg-[#eff4ff] p-3 rounded-full text-secondary">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          </div>
          <div className="text-xs">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Bantuan Diterima</p>
            <p className="text-lg font-bold text-primary mt-0.5">Rp {totalReceived.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Blockchain Status */}
        <div className="bg-white border border-outline-variant p-4 rounded-xl relative overflow-hidden shadow-sm flex items-center gap-4">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-500"></div>
          <div className="bg-[#eff4ff] p-3 rounded-full text-secondary">
            <span className="material-symbols-outlined text-lg">dns</span>
          </div>
          <div className="text-xs">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Status Blockchain</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 block animate-pulse"></span>
              <p className="text-sm font-bold text-primary uppercase">
                {telemetry ? telemetry.fabricStatus : 'HEALTHY'}
              </p>
            </div>
          </div>
        </div>

        {/* Active Nodes */}
        <div className="bg-white border border-outline-variant p-4 rounded-xl relative overflow-hidden shadow-sm flex items-center gap-4">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-purple-500"></div>
          <div className="bg-[#eff4ff] p-3 rounded-full text-secondary">
            <span className="material-symbols-outlined text-lg">hub</span>
          </div>
          <div className="text-xs">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Node Fabric Aktif</p>
            <p className="text-lg font-bold text-primary mt-0.5">
              {telemetry ? `${telemetry.nodes.filter(n=>n.status==='ACTIVE').length}/${telemetry.nodes.length}` : '3/4'} Node
            </p>
          </div>
        </div>
      </section>

      {/* Claim Assistance Banner / Quick Action Button */}
      {recipient?.status === 'LAYAK' && (
        <section>
          <button
            onClick={() => navigate('/user/claim')}
            disabled={claimStep === 3}
            className={`w-full p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 active:scale-[0.99] shadow-md border ${
              claimStep === 3 
                ? 'bg-green-500/10 border-green-500/30 text-green-700 cursor-not-allowed'
                : 'bg-[#002045] hover:bg-secondary text-white border-transparent'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                claimStep === 3 ? 'bg-green-500/20' : 'bg-white/10'
              }`}>
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  account_balance_wallet
                </span>
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-85">
                  {claimStep === 3 ? 'Penyaluran Batch Selesai' : 'Bansos Sembako Tahap Baru Tersedia'}
                </p>
                <h4 className="text-md font-bold">
                  {claimStep === 3 ? 'Dana Bantuan Telah Diklaim' : 'Klaim Dana Bantuan Sosial'}
                </h4>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 self-end sm:self-auto font-bold text-xs uppercase tracking-wider">
              <span>{claimStep === 3 ? 'Bantuan Tersalurkan' : 'Mulai Klaim'}</span>
              <span className="material-symbols-outlined text-sm">
                {claimStep === 3 ? 'check_circle' : 'arrow_forward'}
              </span>
            </div>
          </button>
        </section>
      )}

      {/* Recent Activity Table Grid (Riwayat Bantuan) */}
      <section className="bg-white border border-outline-variant rounded-2xl p-6 space-y-4 shadow-sm text-xs">
        <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest border-b border-outline-variant/60 pb-2">
          RIWAYAT BANTUAN TERBARU
        </h4>
        
        {distributions.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-3xl block mb-2">history</span>
            <p>Belum ada riwayat transaksi penyaluran bantuan dana untuk akun Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {distributions.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-outline-variant/30 pb-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-500/10 text-green-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">Pencairan Dana Bansos - Rp {item.nominal.toLocaleString('id-ID')}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[9px] text-on-surface-variant font-medium">Status: {item.status}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-green-700 bg-green-500/10 px-2.5 py-0.5 rounded uppercase">Tersalurkan</span>
                  <p className="text-[10px] text-on-surface-variant/80 mt-1 font-semibold">
                    {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 text-center">
          <button 
            onClick={() => navigate('/user/history')}
            className="text-secondary font-bold text-xs hover:underline"
          >
            LIHAT SEMUA RIWAYAT TRANSAKSI
          </button>
        </div>
      </section>

      <Toast 
        show={toastShow} 
        message={toastMsg} 
        type="success" 
        onClose={() => setToastShow(false)} 
      />
    </div>
  );
};

export default DashboardPengguna;
