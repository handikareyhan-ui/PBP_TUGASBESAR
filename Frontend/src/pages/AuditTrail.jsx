import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ActivityList from '../components/ActivityList';

const AuditTrail = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);

  const filters = ['All', 'Verification', 'Disbursement', 'Registration'];

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getTransactions();
      setTransactions(data);
      setFilteredTransactions(data);

      const tel = await api.getTelemetry();
      setTelemetry(tel);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions based on Search input AND Active Filter tab
  useEffect(() => {
    let result = transactions;

    if (activeFilter !== 'All') {
      result = result.filter(tx => tx.type.toLowerCase() === activeFilter.toLowerCase());
    }

    if (searchQuery) {
      result = result.filter(tx => tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) || tx.recipient.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    setFilteredTransactions(result);
  }, [searchQuery, activeFilter, transactions]);

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary">Audit Trail Blockchain</h2>
        <p className="text-xs text-on-surface-variant">
          Penyelusuran jejak audit bantuan sosial yang bersifat kekal (immutable) dan terenkripsi.
        </p>
      </div>

      {/* Stats and Info Banner */}
      <section className="bg-white border border-outline-variant p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden shadow-sm gap-4">
        {/* Decorative background element */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none">
          <span className="material-symbols-outlined text-[120px]">
            history_edu
          </span>
        </div>

        <div className="z-10 space-y-1">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Audited Events</p>
          <h3 className="text-3xl font-extrabold text-primary">{transactions.length} Transaksi Ledger</h3>
          <p className="text-xs text-secondary font-semibold">
            Tinggi Blok Jaringan Terakhir: #{telemetry ? telemetry.blockHeight : '...'}
          </p>
        </div>

        <div className="z-10 bg-primary-container/10 border border-primary-container/20 p-4 rounded-xl max-w-sm">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Kepatuhan Regulasi (CFT)</p>
          <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">
            Data transaksi yang telah dikonfirmasi oleh validator jaringan tidak dapat diubah atau dihapus oleh pihak manapun.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar Panel */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white border border-outline-variant rounded-xl text-xs focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none"
              placeholder="Cari berdasarkan Tx Hash atau Penerima..."
            />
          </div>

          {/* Filter Chips Container */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar max-w-full">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
                  activeFilter === filter
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white border border-outline-variant text-on-surface-variant hover:bg-slate-50'
                }`}
              >
                {filter === 'All' ? 'Semua Aktivitas' : filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* LEDGER TIMELINE EVENTS */}
      <section className="bg-white border border-outline-variant rounded-2xl p-6 space-y-6 shadow-sm">
        <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-outline-variant/60 pb-3">
          IMMUTABLE LEDGER STREAM
        </h3>

        {loading ? (
          <div className="text-center py-20 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-3xl animate-spin block mb-3">sync</span>
            <p className="text-xs">Memuat berkas audit dari ledger...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-3xl block mb-3">history</span>
            <p className="text-xs">Tidak ada riwayat transaksi yang cocok dengan filter saat ini.</p>
          </div>
        ) : (
          <ActivityList transactions={filteredTransactions} />
        )}
      </section>

    </div>
  );
};

export default AuditTrail;
