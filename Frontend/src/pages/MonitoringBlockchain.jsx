import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MonitoringBlockchain = () => {
  const [telemetry, setTelemetry] = useState(null);
  const [latencyData, setLatencyData] = useState([
    { time: '12:00', value: 0 },
    { time: '12:05', value: 0 },
    { time: '12:10', value: 0 },
    { time: '12:15', value: 0 },
    { time: '12:20', value: 0 },
    { time: '12:25', value: 0 },
    { time: '12:30', value: 0 },
    { time: '12:35', value: 0 },
    { time: '12:40', value: 0 },
    { time: '12:45', value: 0 }
  ]);

  const fetchTelemetry = async () => {
    try {
      const data = await api.getTelemetry();
      setTelemetry(data);

      const isHealthy = data?.fabricStatus === 'HEALTHY';
      setLatencyData(prev => {
        const next = [...prev.slice(1)];
        const now = new Date();
        const nextTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const val = isHealthy ? (data.avgLatency || 18) : 0;
        return [...next, { time: nextTime, value: val }];
      });
    } catch (err) {
      console.error('Error fetching telemetry:', err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const telemetryInterval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(telemetryInterval);
  }, []);

  const isHealthy = telemetry?.fabricStatus === 'HEALTHY';

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Monitoring Blockchain</h2>
          <p className="text-xs text-on-surface-variant">
            Metrik performa kriptografis dan pemantauan topologi node Hyperledger Fabric.
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
          isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full ${
            isHealthy ? 'bg-green-500 biometric-active' : 'bg-red-500'
          }`}></span>
          <span>Ledger Status: {isHealthy ? 'Healthy' : 'Offline'}</span>
        </div>
      </div>

      {/* Offline Status Warning Banner */}
      {!isHealthy && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-700 p-4 rounded-2xl text-center font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-lg">cloud_off</span>
          <span>BLOCKCHAIN STATUS: OFFLINE</span>
        </div>
      )}

      {/* Overview stats layout */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Fabric version */}
        <div className="bg-white border border-outline-variant p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="bg-[#eff4ff] p-3 rounded-full text-secondary">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>dns</span>
          </div>
          <div>
            <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Fabric Engine</p>
            <p className="text-sm font-bold text-primary">{isHealthy ? (telemetry?.fabricVersion || 'v2.5.4 LTS') : 'N/A'}</p>
          </div>
        </div>

        {/* Current TPS */}
        <div className="bg-white border border-outline-variant p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="bg-[#eff4ff] p-3 rounded-full text-secondary">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>speed</span>
          </div>
          <div>
            <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Current TPS</p>
            <p className="text-sm font-bold text-primary">
              {isHealthy ? `${telemetry.tps} Transaksi/s` : '0 Transaksi/s'}
            </p>
          </div>
        </div>

        {/* consensus leader */}
        <div className="bg-white border border-outline-variant p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="bg-[#eff4ff] p-3 rounded-full text-secondary">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>account_tree</span>
          </div>
          <div>
            <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Raft Consensus Leader</p>
            <p className="text-sm font-bold text-primary">{isHealthy ? telemetry?.activeLeader : 'N/A'}</p>
          </div>
        </div>

        {/* Height */}
        <div className="bg-white border border-outline-variant p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="bg-[#eff4ff] p-3 rounded-full text-secondary">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>layers</span>
          </div>
          <div>
            <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Block Height</p>
            <p className="text-sm font-bold text-primary">#{telemetry?.blockHeight || '1'} Blocks</p>
          </div>
        </div>

      </section>

      {/* Grid: Latency Chart and Topology */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Latency Area Chart (col-span-2) */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-outline-variant p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-primary">Network Latency (RTT)</h3>
              <p className="text-xs text-on-surface-variant">Grafik latensi real-time antar peer node jaringan.</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-primary bg-[#eff4ff] px-2 py-1 rounded">
                Rata-rata: {isHealthy ? `${telemetry?.avgLatency}ms` : '0ms'}
              </span>
            </div>
          </div>

          {/* Glowing Recharts AreaChart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1960a3" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1960a3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'medium' }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `${val}ms`}
                />
                <Tooltip 
                  contentStyle={{ background: '#002045', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  formatter={(val) => [`${val} ms`, 'Latensi']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#1960a3" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorLatency)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Node Topology Status List (col-1) */}
        <section className="bg-white rounded-2xl border border-outline-variant p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-outline-variant pb-2">
              Jejaring Jaringan Node
            </h3>

            {telemetry ? (
              <div className="space-y-2.5">
                {telemetry.nodes.map((node, i) => {
                  const isActive = isHealthy && node.status === 'ACTIVE';
                  return (
                    <div 
                      key={i}
                      className="border border-outline-variant/60 rounded-xl p-3 flex justify-between items-center bg-[#f8f9ff]"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-lg ${isActive ? 'text-primary' : 'text-error'}`}>
                          {node.name.includes('Orderer') ? 'account_tree' : 'dns'}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-primary">{node.name}</p>
                          <p className="text-[9px] font-mono text-on-surface-variant">{node.ip}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {isActive ? 'ACTIVE' : 'DOWN'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant">Memuat status topologi node...</p>
            )}
          </div>

          <div className="pt-4 border-t border-outline-variant/40 mt-4 text-center">
            <p className="text-[10px] text-on-surface-variant font-mono">
              Hyperledger Fabric Ordering Raft Consensus Service
            </p>
          </div>
        </section>

      </div>

    </div>
  );
};

export default MonitoringBlockchain;
