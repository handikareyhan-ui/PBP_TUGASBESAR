import React, { useEffect } from 'react';

const Toast = ({ show, message, type = 'success', onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const styles = {
    success: {
      bg: 'bg-[#213145] text-white border-green-500/30',
      icon: 'check_circle',
      iconColor: 'text-green-400'
    },
    error: {
      bg: 'bg-red-950 text-red-200 border-red-500/30',
      icon: 'error',
      iconColor: 'text-red-400'
    },
    info: {
      bg: 'bg-primary text-white border-secondary/30',
      icon: 'info',
      iconColor: 'text-secondary-container'
    }
  };

  const activeStyle = styles[type] || styles.success;

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-xl animate-fade-in-up ${activeStyle.bg}`}>
      <span className={`material-symbols-outlined text-lg ${activeStyle.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {activeStyle.icon}
      </span>
      <p className="text-xs font-semibold tracking-wide">{message}</p>
      <button 
        onClick={onClose} 
        className="text-white/60 hover:text-white ml-2 flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
};

export default Toast;
