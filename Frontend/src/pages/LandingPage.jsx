import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col justify-between" style={{
      backgroundImage: 'radial-gradient(at 0% 0%, hsla(214,100%,96%,1) 0, transparent 40%), radial-gradient(at 100% 0%, hsla(214,100%,97%,1) 0, transparent 40%)'
    }}>
      {/* Header Banner */}
      <header className="px-6 md:px-12 py-4 bg-white/70 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-2xl font-bold">shield</span>
          <span className="font-bold text-lg text-primary tracking-wider uppercase">BansosChain</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-green-700 bg-green-500/10 px-3 py-1 rounded-full flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 biometric-active"></span>
            <span>Network Online</span>
          </span>
        </div>
      </header>

      {/* Main Landing Canvas */}
      <main className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 max-w-6xl mx-auto w-full gap-12">
        
        {/* Intro Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-secondary/10 px-3.5 py-1 rounded-full text-secondary text-xs font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm font-semibold">hub</span>
            <span>Decentralized Accountability Ledger</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-primary tracking-tight leading-tight">
            Transparansi Bantuan Sosial RI <br />
            <span className="text-secondary bg-gradient-to-r from-secondary to-blue-500 bg-clip-text text-transparent">
              Berbasis Cryptographic Blockchain
            </span>
          </h1>
          <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
            Portal resmi infrastruktur pertukaran data kesejahteraan nasional. Memanfaatkan komputasi desentralisasi 
            <strong> Hyperledger Fabric</strong> dengan protokol pengamanan privasi <strong>Zero-Knowledge Proof (ZKP)</strong>.
          </p>
        </section>

        {/* Dynamic Split Gateway Portal Selector Cards */}
        <section className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          {/* USER PORTAL SELECTOR CARD */}
          <div className="bg-white rounded-2xl border border-outline-variant/60 shadow-lg hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between group cursor-pointer"
               onClick={() => navigate('/user/login')}>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors duration-300">
                <span className="material-symbols-outlined text-2xl font-bold">person</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-primary">Portal Penerima Manfaat</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Bagi masyarakat penerima bantuan sosial (PKH, BPNT, BLT). Periksa kelayakan Anda secara anonim, tanda tangani klaim digital, dan pantau status pencairan langsung dari blockchain.
                </p>
              </div>
            </div>
            <button className="mt-8 w-full py-3 bg-primary text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 group-hover:bg-secondary transition-colors">
              <span>Masuk Portal Pengguna</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>

          {/* ADMIN PORTAL SELECTOR CARD */}
          <div className="bg-white rounded-2xl border border-outline-variant/60 shadow-lg hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between group cursor-pointer"
               onClick={() => navigate('/admin/login')}>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <span className="material-symbols-outlined text-2xl font-bold">admin_panel_settings</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-primary">Portal Administrator</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Bagi administrator Kementerian Sosial RI, Penilai Kelayakan, dan Auditor. Kelola basis data penerima, verifikasi ZKP, luncurkan distribusi bantuan, dan pantau status telemetri node jaringan.
                </p>
              </div>
            </div>
            <button className="mt-8 w-full py-3 bg-primary text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 group-hover:bg-[#0b1c30] transition-colors">
              <span>Masuk Portal Admin</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* Technology Highlights Grid */}
        <section className="bg-white rounded-2xl border border-outline-variant/60 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest text-center border-b border-outline-variant/40 pb-4">
            Teknologi Inti BansosChain
          </h3>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            
            {/* Hyperledger Fabric */}
            <div className="space-y-2">
              <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
                <span className="material-symbols-outlined text-xl">dns</span>
              </div>
              <h4 className="font-bold text-sm text-primary">Hyperledger Fabric</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed px-2">
                Infrastruktur jaringan blockchain privat dan berizin (permissioned), menjamin keamanan data terintegrasi antar lembaga negara.
              </p>
            </div>

            {/* Raft Consensus */}
            <div className="space-y-2">
              <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
                <span className="material-symbols-outlined text-xl">account_tree</span>
              </div>
              <h4 className="font-bold text-sm text-primary">Konsensus Raft</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed px-2">
                Algoritma konsensus yang efisien dengan toleransi kegagalan (CFT), menyusun transaksi secara berurutan secara berkala (block).
              </p>
            </div>

            {/* Zero-Knowledge Proof */}
            <div className="space-y-2">
              <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
                <span className="material-symbols-outlined text-xl">visibility_off</span>
              </div>
              <h4 className="font-bold text-sm text-primary">Zero-Knowledge Proof</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed px-2">
                Protokol zk-SNARKs (Circom + snarkjs) membuktikan kelayakan penerima tanpa membagikan NIK atau pendapatan di ledger publik.
              </p>
            </div>

          </div>
        </section>

      </main>

      {/* Footer gov credentials */}
      <footer className="w-full bg-white p-6 border-t border-outline-variant/30 text-center space-y-4">
        <div className="flex justify-center items-center gap-4">
          <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">domain</span>
            <span>Kementerian Sosial Republik Indonesia</span>
          </div>
          <div className="w-px h-4 bg-outline-variant"></div>
          <span className="text-[11px] text-on-surface-variant/70 font-mono">Hyperledger Fabric Network</span>
        </div>
        <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest">
          © 2024 BansosChain Infrastructure • Verified Governance Nodes
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
