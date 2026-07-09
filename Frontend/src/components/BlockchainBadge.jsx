import React, { useState } from 'react';

const BlockchainBadge = ({ hash, showCopy = true }) => {
  const [copied, setCopied] = useState(false);

  const shortenHash = (str) => {
    if (!str) return '';
    if (str.length <= 16) return str;
    return `${str.slice(0, 8)}...${str.slice(-6)}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-2 bg-surface-container border border-outline-variant/60 rounded-xl px-3 py-1 font-mono text-xs text-secondary-container text-secondary select-all relative group max-w-full">
      <span className="material-symbols-outlined text-sm font-semibold">link</span>
      <span className="truncate" title={hash}>{shortenHash(hash)}</span>
      
      {showCopy && (
        <button
          onClick={handleCopy}
          type="button"
          className="hover:text-primary active:scale-95 transition-all text-on-surface-variant/70 ml-1 flex items-center justify-center p-0.5 rounded hover:bg-slate-200"
          title="Salin Hash"
        >
          <span className="material-symbols-outlined text-[14px]">
            {copied ? 'check' : 'content_copy'}
          </span>
        </button>
      )}

      {/* Tooltip containing full hash */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-primary text-white text-[10px] rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-lg whitespace-nowrap z-50 font-mono">
        {hash}
      </span>
    </div>
  );
};

export default BlockchainBadge;
