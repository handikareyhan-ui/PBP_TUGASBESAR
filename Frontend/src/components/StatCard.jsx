import React from 'react';

const StatCard = ({ title, value, icon, statusBarColor = 'bg-secondary', trend, trendType = 'up', interactive = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden p-5 rounded-2xl border border-outline-variant bg-white transition-all duration-200 ${
        interactive ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''
      }`}
    >
      {/* Dynamic Status Color bar */}
      <div className={`absolute top-0 bottom-0 left-0 w-1 ${statusBarColor}`}></div>

      <div className="flex justify-between items-start pl-2">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{title}</p>
          <h3 className="text-2xl font-bold text-primary tracking-tight">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-[11px] font-bold ${trendType === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                {trend}
              </span>
            </div>
          )}
        </div>
        <div className="bg-surface-container p-2.5 rounded-full flex items-center justify-center text-secondary">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
