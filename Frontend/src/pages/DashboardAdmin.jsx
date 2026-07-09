import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import ActivityList from '../components/ActivityList';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [stats, setStats] = useState({
    totalAnggaran: 0,
    danaTersalurkan: 0,
    sisaAnggaran: 0,
    programAktif: 0,
    totalProgram: 0,
    penerimaLayak: 0,
    totalDistribusi: 0
  });

  const [weeklyData, setWeeklyData] = useState([
    { name: 'SENIN', value: 0 },
    { name: 'SELASA', value: 0 },
    { name: 'RABU', value: 0 },
    { name: 'KAMIS', value: 0 },
    { name: 'JUMAT', value: 0 },
    { name: 'SABTU', value: 0 },
    { name: 'MINGGU', value: 0 }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const txs = await api.getTransactions();
        setTransactions(txs);

        const dbStats = await api.getDashboardStats();
        setStats({
          totalAnggaran: dbStats.totalAnggaran,
          danaTersalurkan: dbStats.danaTersalurkan,
          sisaAnggaran: dbStats.sisaAnggaran,
          programAktif: dbStats.programAktif,
          totalProgram: dbStats.totalProgram,
          penerimaLayak: dbStats.penerimaLayak,
          totalDistribusi: dbStats.totalDistribusi
        });

        const tel = await api.getTelemetry();
        setTelemetry(tel);

        // Fetch real distributions and group by day of week
        const dists = await api.getDistributions();
        const daysMap = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
        const grouped = {
          'SENIN': 0, 'SELASA': 0, 'RABU': 0, 'KAMIS': 0, 'JUMAT': 0, 'SABTU': 0, 'MINGGU': 0
        };

        dists.forEach(d => {
          const date = new Date(d.createdAt);
          const dayName = daysMap[date.getDay()];
          if (dayName && grouped[dayName] !== undefined) {
            grouped[dayName] += d.nominal / 1000000; // sum in millions of Rupiah
          }
        });

        const newWeeklyData = Object.keys(grouped).map(key => ({
          name: key,
          value: parseFloat(grouped[key].toFixed(2))
        }));
        setWeeklyData(newWeeklyData);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Admin Overview</h2>
          <p className="text-xs text-on-surface-variant">
            Sistem pemantauan distribusi bantuan sosial berbasis ledger terdistribusi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/recipients')}
            className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 hover:bg-secondary transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>Kelola Penerima</span>
          </button>
          <button 
            onClick={() => navigate('/admin/distribution')}
            className="px-4 py-2 bg-secondary text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 hover:bg-blue-600 transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            <span>Disbursement</span>
          </button>
        </div>
      </div>

      {/* Overview Statistics Grid (Bento cards layout) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Anggaran"
          value={`Rp ${stats.totalAnggaran.toLocaleString('id-ID')}`}
          icon="payments"
          statusBarColor="bg-blue-600"
          trend={`Total ${stats.totalProgram} program`}
          trendType="up"
          interactive
          onClick={() => navigate('/admin/recipients')}
        />
        <StatCard
          title="Sisa Anggaran"
          value={`Rp ${stats.sisaAnggaran.toLocaleString('id-ID')}`}
          icon="account_balance_wallet"
          statusBarColor="bg-amber-500"
          trend="Anggaran tersedia"
          trendType="down"
          interactive
          onClick={() => navigate('/admin/recipients')}
        />
        <StatCard
          title="Penerima Layak"
          value={stats.penerimaLayak.toLocaleString('id-ID')}
          icon="verified"
          statusBarColor="bg-green-600"
          trend="Lolos seleksi ZKP"
          trendType="up"
          interactive
          onClick={() => navigate('/admin/recipients')}
        />
        <StatCard
          title="Dana Tersalurkan"
          value={`Rp ${stats.danaTersalurkan.toLocaleString('id-ID')}`}
          icon="payments"
          statusBarColor="bg-emerald-600"
          trend="Telah didistribusikan"
          trendType="up"
          interactive
          onClick={() => navigate('/admin/recipients')}
        />
        <StatCard
          title="Program Aktif"
          value={`${stats.programAktif} / ${stats.totalProgram}`}
          icon="campaign"
          statusBarColor="bg-purple-600"
          trend="Program berjalan"
          trendType="up"
          interactive
          onClick={() => navigate('/admin/recipients')}
        />
        <StatCard
          title="Total Distribusi"
          value={stats.totalDistribusi.toLocaleString('id-ID')}
          icon="history"
          statusBarColor="bg-slate-500"
          trend="Transaksi blockchain"
          trendType="up"
          interactive
          onClick={() => navigate('/admin/recipients')}
        />
      </section>

      {/* Grid for Chart and Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Weekly Chart Container (left col-span-2) */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-outline-variant p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-primary">Penyaluran Bantuan Sosial</h3>
              <p className="text-xs text-on-surface-variant">Grafik mingguan penyaluran dana (Juta Rp)</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded-md">Live Ledger Feed</span>
            </div>
          </div>

          {/* High Fidelity Recharts Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `Rp ${val}jt`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ background: '#002045', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(value) => [`Rp ${value} Juta`, 'Dana Disalurkan']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === 'RABU' ? '#1960a3' : '#a2c9ff'} 
                      className="transition-colors hover:fill-secondary"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Telemetry Consensus Quickview (right col-1) */}
        <section className="bg-white rounded-2xl border border-outline-variant p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-outline-variant pb-2">
              Status Konsensus
            </h3>
            
            <div className="bg-[#eff4ff] p-4 rounded-2xl border border-outline-variant/60 relative overflow-hidden">
              <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-primary-fixed-dim/20 text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                security
              </span>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Mekanisme Konsensus</p>
              <h4 className="text-sm font-extrabold text-primary mt-1">
                Raft Leader: {telemetry ? telemetry.activeLeader : 'Offline'}
              </h4>
              <p className="text-[10px] text-on-surface-variant font-mono mt-1 break-all bg-white/60 px-2 py-1 rounded">
                Hash: {telemetry ? telemetry.activeLeaderHash : '0x0000000000000000'}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs py-1 border-b border-outline-variant/30">
                <span className="text-on-surface-variant font-medium">Blok Jaringan Saat Ini</span>
                <span className="font-mono font-bold text-primary">
                  #{telemetry ? telemetry.blockHeight : '0'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-outline-variant/30">
                <span className="text-on-surface-variant font-medium">Kecepatan Transaksi</span>
                <span className="font-mono font-bold text-primary">
                  {telemetry ? telemetry.tps : 0} TPS
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-1">
                <span className="text-on-surface-variant font-medium">Algoritma Kriptografi</span>
                <span className="font-mono font-bold text-secondary">zk-SNARKs</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/admin/monitoring')}
            className="w-full py-2.5 mt-6 border border-outline text-primary font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
          >
            Buka Topologi Jaringan
          </button>
        </section>

      </div>

      {/* Recent Ledger Entries Container */}
      <section className="bg-white rounded-2xl border border-outline-variant p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-primary">Ledger Aktivitas Terkini</h3>
            <p className="text-xs text-on-surface-variant">Transaksi yang dicatat secara permanen di blockchain ledger.</p>
          </div>
          <button 
            onClick={() => navigate('/admin/audit')}
            className="text-secondary font-bold text-xs hover:underline flex items-center gap-1"
          >
            <span>TAMPILKAN SEMUA</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
        </div>

        <div className="pt-2">
          <ActivityList transactions={transactions} limit={3} />
        </div>
      </section>

    </div>
  );
};

export default DashboardAdmin;
