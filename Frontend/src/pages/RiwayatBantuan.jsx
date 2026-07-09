import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import BlockchainBadge from '../components/BlockchainBadge';

const RiwayatBantuan = () => {
  const [distributions, setDistributions] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const profile = await api.getUserProfile();
        setRecipient(profile);

        const allDists = await api.getDistributions();
        const myDists = allDists.filter(d => d.recipientId === profile.id);
        setDistributions(myDists);
      } catch (err) {
        console.error('Error fetching distributions history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);


  if (loading) {
    return (
      <div className="text-center py-20 text-on-surface-variant/60">
        <span className="material-symbols-outlined text-4xl animate-spin block mb-3">sync</span>
        <p className="text-xs">Sinkronisasi data riwayat dari blockchain...</p>
      </div>
    );
  }

  const totalReceived = distributions.reduce((sum, item) => sum + item.nominal, 0);
  const totalCount = distributions.length;

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary">Riwayat Penerimaan Bantuan</h2>
        <p className="text-xs text-on-surface-variant">
          Daftar riwayat bantuan sosial yang disalurkan kepada Anda secara transparan.
        </p>
      </div>

      {/* Bento Summary Panel */}
      <section className="bg-primary text-white p-6 rounded-2xl relative overflow-hidden shadow-lg">
        {/* Background icon accent */}
        <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none select-none">
          <span className="material-symbols-outlined text-[100px]">
            receipt_long
          </span>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-secondary-container uppercase tracking-widest">Total Bantuan Tahun 2026</p>
            <h3 className="text-3xl font-extrabold text-white">Rp {totalReceived.toLocaleString('id-ID')}</h3>

          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-white/10 border border-white/10 p-3 rounded-xl flex-1 md:w-28 text-center">
              <p className="text-[9px] uppercase text-white/70">Diterima</p>
              <p className="text-lg font-bold text-white mt-0.5">{totalCount} Kali</p>
            </div>
            <div className="bg-white/10 border border-white/10 p-3 rounded-xl flex-1 md:w-28 text-center">
              <p className="text-[9px] uppercase text-white/70">Penyaluran</p>
              <p className="text-lg font-bold text-white mt-0.5">100% Valid</p>
            </div>
          </div>
        </div>
      </section>

      {/* Chronological History Timeline */}
      <section className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Jejak Transaksi Ledger</h3>
          <span className="text-[10px] text-on-surface-variant font-semibold">Tahun Anggaran 2026</span>
        </div>

        {distributions.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-3xl block mb-2">history</span>
            <p>Belum ada riwayat transaksi penyaluran bantuan dana untuk akun Anda.</p>
          </div>
        ) : (
          <div className="relative space-y-6 before:content-[''] before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/60">
            {distributions.map((item) => {
              const isPending = item.status === 'PENDING';
              const dateStr = new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <div key={item.id} className="relative pl-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  {/* Timeline node icon */}
                  <div className={`absolute left-0 top-1 w-10 h-10 bg-white rounded-full border-2 ${
                    isPending ? 'border-amber-500' : 'border-primary'
                  } flex items-center justify-center z-10 shadow-sm transition-transform duration-200 group-hover:scale-105`}>
                    <span className={`material-symbols-outlined text-lg ${
                      isPending ? 'text-amber-500' : 'text-primary'
                    }`} style={{ fontVariationSettings: !isPending ? "'FILL' 1" : "'FILL' 0" }}>
                      {isPending ? 'hourglass_empty' : 'payments'}
                    </span>
                  </div>

                  {/* Timeline Card */}
                  <div className="flex-1 bg-white border border-outline-variant/60 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-on-surface-variant/80 block">{dateStr}</span>
                      <h4 className="text-sm font-bold text-primary">Pencairan Dana Bantuan Sosial</h4>
                      {item.fundSource && (
                        <div className="text-[10px] text-on-surface-variant/80 space-y-0.5 mt-1.5 font-mono">
                          <div>Program: <span className="font-semibold text-primary">{item.fundSource.programName}</span></div>
                          <div>Sumber Dana: <span className="font-semibold">{item.fundSource.fundSource} ({item.fundSource.institution})</span></div>
                          <div>Tahun Anggaran: <span className="font-semibold">{item.fundSource.fiscalYear}</span></div>
                          <div>Total Anggaran Program: <span className="font-semibold">Rp {item.fundSource.allocatedBudget.toLocaleString('id-ID')}</span></div>
                          <div>Dana Tersalurkan: <span className="font-semibold text-green-600">Rp {item.fundSource.distributedBudget.toLocaleString('id-ID')}</span></div>
                          <div>Sisa Anggaran: <span className="font-semibold">Rp {item.fundSource.remainingBudget.toLocaleString('id-ID')}</span></div>
                          <div>Status Verifikasi ZKP: <span className="font-semibold text-green-700 bg-green-500/10 px-1 rounded">VERIFIED</span></div>
                        </div>
                      )}
                      {isPending && (
                        <p className="text-[10px] text-amber-600 italic font-medium">Menunggu Validasi Block Konsensus</p>
                      )}
                    </div>

                    <div className="flex flex-col md:items-end gap-1.5 flex-shrink-0">
                      <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                        <span className="text-sm font-extrabold text-primary">Rp {item.nominal.toLocaleString('id-ID')}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          isPending ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      {!isPending && <BlockchainBadge hash={item.txHash || `0x${item.id.replace(/-/g, '').substring(0, 16)}`} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

export default RiwayatBantuan;

