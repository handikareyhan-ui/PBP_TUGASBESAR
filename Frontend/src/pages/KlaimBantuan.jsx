import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import BlockchainBadge from '../components/BlockchainBadge';
import Toast from '../components/Toast';

const KlaimBantuan = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [signingActive, setSigningActive] = useState(false);
  const [signed, setSigned] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [recipient, setRecipient] = useState(null);

  // Toast alerts
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setToastShow(true);
  };

  useEffect(() => {
    const loadRecipient = async () => {
      try {
        const profile = await api.getUserProfile();
        setRecipient(profile);
      } catch (err) {
        console.error('Error fetching recipient profile in KlaimBantuan:', err);
      }
    };
    loadRecipient();

    api.getClaimStep().then(step => {
      setCurrentStep(step);
    });
  }, []);

  const handleNextStep = async () => {
    setLoading(true);
    try {
      if (currentStep === 1) {
        const nextStep = 2;
        await api.setClaimStep(nextStep);
        setCurrentStep(nextStep);
        triggerToast('Identitas terverifikasi via ZKP. Silakan lakukan tanda tangan digital.');
      } else if (currentStep === 2) {
        if (!signed) {
          triggerToast('Silakan ketuk kotak tanda tangan untuk melengkapi otorisasi klaim', 'info');
          return;
        }
        const nextStep = 3;
        await api.setClaimStep(nextStep);
        setCurrentStep(nextStep);
        
        // Deterministic mock block/transaction receipt hash based on the recipient's primary key
        const hashVal = '0x' + (recipient?.id ? recipient.id.replace(/-/g, '').substring(0, 26) : '00000000000000000000000000');
        setTxHash(hashVal);
        triggerToast('Tanda tangan digital berhasil diverifikasi secara on-chain!');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Gagal memproses langkah klaim.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignBoxClick = () => {
    if (signed) return;
    setSigningActive(true);
    setSigned(true);
    setSigningActive(false);
    triggerToast('Tanda tangan digital dibubuhkan secara kriptografis.');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary">Klaim Dana Bantuan</h2>
        <p className="text-xs text-on-surface-variant">
          Verifikasi identitas anonim Anda dan otorisasi pengiriman saldo dana bantuan sosial.
        </p>
      </div>

      {/* STEPPER PROGRESS TRACKER */}
      <section className="bg-white border border-outline-variant p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-6 max-w-md mx-auto">
          {/* Step 1 Circle */}
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all duration-300 ${
              currentStep >= 1 ? 'bg-secondary text-white' : 'bg-slate-100 text-on-surface-variant'
            }`}>
              {currentStep > 1 ? (
                <span className="material-symbols-outlined text-sm font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              ) : '1'}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              currentStep >= 1 ? 'text-secondary font-extrabold' : 'text-on-surface-variant'
            }`}>ZKP Verif</span>
          </div>

          <div className={`flex-1 h-0.5 mx-3 mb-5 transition-all duration-500 ${
            currentStep > 1 ? 'bg-secondary' : 'bg-outline-variant/60'
          }`}></div>

          {/* Step 2 Circle */}
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all duration-300 ${
              currentStep >= 2 ? 'bg-secondary text-white' : 'bg-slate-100 text-on-surface-variant'
            }`}>
              {currentStep > 2 ? (
                <span className="material-symbols-outlined text-sm font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              ) : '2'}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              currentStep >= 2 ? 'text-secondary font-extrabold' : 'text-on-surface-variant'
            }`}>Sign Claim</span>
          </div>

          <div className={`flex-1 h-0.5 mx-3 mb-5 transition-all duration-500 ${
            currentStep > 2 ? 'bg-secondary' : 'bg-outline-variant/60'
          }`}></div>

          {/* Step 3 Circle */}
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all duration-300 ${
              currentStep >= 3 ? 'bg-secondary text-white' : 'bg-slate-100 text-on-surface-variant'
            }`}>
              3
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              currentStep >= 3 ? 'text-secondary font-extrabold' : 'text-on-surface-variant'
            }`}>Selesai</span>
          </div>
        </div>
      </section>

      {/* STEP CONTENTS WRAPPER */}
      <section className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm min-h-64 flex flex-col justify-between">
        
          <>
            {/* STEP 1: IDENTITY VERIFICATION VIEW */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-md font-bold text-primary">Tahap 1: Verifikasi Menggunakan ZKP</h3>
                  <p className="text-xs text-on-surface-variant">Generasi bukti kriptografis kelayakan tanpa mempublikasikan berkas kependudukan.</p>
                </div>
                
                <div className="bg-[#f8f9ff] border border-outline-variant/60 rounded-xl p-4 relative overflow-hidden space-y-3">
                  <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Protocol: zk-SNARKs (Circom)</span>
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">PROVED DATA HASH (INPUT ENKRIPSI)</span>
                      <code className="font-mono text-primary font-bold break-all bg-white p-1 rounded border block">
                        {recipient?.nik ? `${recipient.nik.substring(0, 6)}**********` : 'Belum Terverifikasi'}
                      </code>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">HASIL VERIFIKASI SIRKUIT</span>
                      <div className="flex items-center gap-1.5 text-green-700 font-bold">
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span>Penerima Layak Terverifikasi (Eligible)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#eff4ff] border border-outline-variant/30 p-3 rounded-xl flex gap-3 text-xs">
                  <span className="material-symbols-outlined text-primary">info</span>
                  <p className="text-primary leading-relaxed">
                    Bukti zero-knowledge proof dienkripsi secara lokal di peramban Anda untuk memastikan data kependudukan pribadi Anda tetap aman.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: DIGITAL SIGNATURE VIEW */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-md font-bold text-primary">Tahap 2: Pembubuhan Tanda Tangan Kunci Digital</h3>
                  <p className="text-xs text-on-surface-variant">Konfirmasi penyaluran dana bansos ke akun penerima terdaftar.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="border border-outline-variant/60 p-4 rounded-xl space-y-3 bg-[#f8f9ff]">
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Nilai Saldo Bantuan</p>
                      <p className="text-xl font-bold text-primary mt-1">Rp 600.000</p>
                    </div>
                    <div className="space-y-2 text-xs border-t border-outline-variant/40 pt-2 text-on-surface-variant">
                      <div className="flex justify-between">
                        <span>Program</span>
                        <span className="font-semibold text-primary">Sembako Tahap 4</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Biaya Gas</span>
                        <span className="font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded">FREE (Subsidi)</span>
                      </div>
                    </div>
                  </div>

                  {/* Tap to sign interactive canvas box */}
                  <div 
                    onClick={handleSignBoxClick}
                    className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none transition-all duration-200 ${
                      signed 
                        ? 'border-green-500 bg-green-500/5 text-green-700'
                        : 'border-outline hover:border-secondary hover:bg-slate-50 text-on-surface-variant'
                    }`}
                  >
                    {signingActive ? (
                      <>
                        <span className="material-symbols-outlined text-3xl animate-spin text-secondary mb-2">sync</span>
                        <p className="text-[9px] font-bold uppercase tracking-wider">Menandatangani...</p>
                      </>
                    ) : signed ? (
                      <>
                        <span className="material-symbols-outlined text-4xl text-green-600 mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>draw</span>
                        <p className="text-[9px] font-bold uppercase tracking-wider">Tanda Tangan Tersemat ✓</p>
                        <p className="text-[8px] opacity-75 mt-1 font-mono">
                          {recipient?.nik ? `NIK: ${recipient.nik.substring(0, 6)}...${recipient.nik.substring(12)}` : 'Belum Terhubung'}
                        </p>
                      </>

                    ) : (
                      <>
                        <span className="material-symbols-outlined text-4xl text-outline mb-2">draw</span>
                        <p className="text-[9px] font-bold uppercase tracking-widest">KETUK UNTUK MENANDATANGANI</p>
                        <p className="text-[8px] opacity-60 mt-1">Konfirmasi Identitas Penerima</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS / DONE VIEW */}
            {currentStep === 3 && (
              <div className="flex flex-col items-center text-center py-6 space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-green-500/10 text-green-700 rounded-full flex items-center justify-center animate-bounce-slow">
                  <span className="material-symbols-outlined text-3xl font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-primary">Klaim Dana Bantuan Berhasil!</h3>
                  <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                    Klaim Anda sukses ditandatangani dan diverifikasi oleh konsensus Raft ledger jaringan. Dana bantuan telah berhasil disalurkan ke akun Anda.
                  </p>
                </div>

                <div className="bg-[#f8f9ff] border border-outline-variant p-4 rounded-xl text-left text-xs max-w-md w-full space-y-2 font-semibold text-on-surface-variant">
                  <div className="flex justify-between items-center border-b border-outline-variant/30 pb-1.5">
                    <span>NOMOR BLOK KONSENSUS</span>
                    <span className="font-bold text-primary font-mono">#18,204,912</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-outline-variant/30 pb-1.5">
                    <span>STAMP WAKTU LEDGER</span>
                    <span className="text-primary font-medium">15 Okt 2024, 14:02 UTC</span>
                  </div>
                  <div className="flex flex-col gap-1 pt-1.5">
                    <span className="text-[9px] text-on-surface-variant/80 uppercase">TRANSACTION HASH RECEIPT</span>
                    <BlockchainBadge hash={txHash || '0x7f4e82c11029384812a21c4b82d'} />
                  </div>
                </div>
              </div>
            )}

            {/* Main CTA button */}
            <div className="pt-6 border-t border-outline-variant/40 mt-6">
              <button
                onClick={handleNextStep}
                disabled={loading || (currentStep === 2 && !signed)}
                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  currentStep === 2 && !signed 
                    ? 'bg-slate-200 text-on-surface-variant/60 cursor-not-allowed border' 
                    : 'bg-primary text-white hover:bg-secondary'
                }`}
              >
                {loading ? (
                  <span className="material-symbols-outlined text-base animate-spin">sync</span>
                ) : (
                  <>
                    <span>
                      {currentStep === 1
                        ? 'Klaim Sekarang'
                        : currentStep === 2
                        ? 'Tanda Tangani & Selesaikan Klaim'
                        : 'Kembali ke Dashboard'}
                    </span>
                    <span className="material-symbols-outlined text-sm">
                      {currentStep === 3 ? 'home' : 'arrow_forward'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </>

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

export default KlaimBantuan;
