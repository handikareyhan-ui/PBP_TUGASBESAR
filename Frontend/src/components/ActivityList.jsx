import React from 'react';
import BlockchainBadge from './BlockchainBadge';

const ActivityList = ({ transactions = [], limit }) => {
  const displayed = limit ? transactions.slice(0, limit) : transactions;

  const getTypeStyle = (type) => {
    switch (type.toLowerCase()) {
      case 'disbursement':
        return {
          icon: 'payments',
          bg: 'bg-green-500/10 text-green-700',
          indicator: 'border-green-500'
        };
      case 'verification':
        return {
          icon: 'how_to_reg',
          bg: 'bg-blue-500/10 text-blue-700',
          indicator: 'border-blue-500'
        };
      case 'registration':
        return {
          icon: 'person_add',
          bg: 'bg-purple-500/10 text-purple-700',
          indicator: 'border-purple-500'
        };
      default:
        return {
          icon: 'analytics',
          bg: 'bg-slate-500/10 text-slate-700',
          indicator: 'border-slate-500'
        };
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-on-surface-variant/60">
        <span className="material-symbols-outlined text-4xl block mb-2">history</span>
        <p className="text-sm">Tidak ada aktivitas transaksi saat ini.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 before:content-[''] before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/60">
      {displayed.map((tx) => {
        const style = getTypeStyle(tx.type);
        return (
          <div key={tx.id} className="relative pl-12 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
            {/* Timeline Node Icon */}
            <div className="absolute left-0 top-1 w-10 h-10 bg-white rounded-full border-2 border-primary flex items-center justify-center z-10 shadow-sm transition-transform duration-200 group-hover:scale-105">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                {style.icon}
              </span>
            </div>

            {/* Inner Content Card */}
            <div className={`flex-1 bg-white border-l-4 ${style.indicator} border-outline-variant/40 rounded-r-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.bg}`}>
                    {tx.type}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-medium">{tx.time}</span>
                </div>
                <h4 className="text-sm font-bold text-primary">{tx.recipient}</h4>
              </div>

              <div className="flex flex-col sm:items-end gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-green-700 font-semibold text-[10px] uppercase bg-green-500/10 px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span>Immutable</span>
                </div>
                <BlockchainBadge hash={tx.hash} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityList;
