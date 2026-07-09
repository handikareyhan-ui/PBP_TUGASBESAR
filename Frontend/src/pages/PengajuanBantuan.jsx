import React, { useState } from 'react';
import { api } from '../services/api';
import Toast from '../components/Toast';

const PengajuanBantuan = () => {
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [income, setIncome] = useState(1500000);
  const [dependents, setDependents] = useState(3);
  const [assistanceType, setAssistanceType] = useState('Bansos Sembako');
  const [walletId, setWalletId] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [loading, setLoading] = useState(false);

  // Toast States
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastShow(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nik || !name || !region) {
      triggerToast('Mohon lengkapi NIK, Nama Lengkap, dan Alamat.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        nik,
        region,
        pendapatan: parseFloat(income),
        jumlahTanggungan: parseInt(dependents),
        jenisBantuan: assistanceType,
        walletId: walletId || null,
        dokumen: documentName || 'dokumen_default.pdf'
      };

      const res = await api.addApplication(payload);
      triggerToast('✓ Pengajuan Berhasil Terkirim! ZKP Verifikasi Otomatis Selesai.', 'success');
      
      // Clear form
      setNik('');
      setName('');
      setRegion('');
      setIncome(1500000);
      setDependents(3);
      setAssistanceType('Bansos Sembako');
      setWalletId('');
      setDocumentName('');
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Gagal memproses pengajuan bantuan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-primary">Form Pengajuan Bantuan Sosial</h2>
        <p className="text-xs text-on-surface-variant">
          Daftarkan pengajuan bantuan Anda. Sistem akan memverifikasi kriteria kelayakan Anda secara langsung menggunakan sirkuit ZKP (Zero-Knowledge Proof).
        </p>
      </div>

      <section className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            {/* NIK */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-primary uppercase tracking-widest" htmlFor="nik">
                Nomor Induk Kependudukan (NIK)
              </label>
              <input
                id="nik"
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                maxLength={16}
                className="w-full px-4 py-2.5 bg-[#eff4ff] border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-sm"
                placeholder="Masukkan 16 digit NIK"
                required
              />
            </div>

            {/* Nama Lengkap */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-primary uppercase tracking-widest" htmlFor="name">
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#eff4ff] border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-sm"
                placeholder="Masukkan nama sesuai KTP"
                required
              />
            </div>
          </div>

          {/* Wilayah / Alamat */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-primary uppercase tracking-widest" htmlFor="region">
              Wilayah / Alamat Lengkap
            </label>
            <textarea
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 bg-[#eff4ff] border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-sm resize-none"
              placeholder="Masukkan alamat lengkap tempat tinggal saat ini"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Penghasilan Bulanan */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-primary uppercase tracking-widest" htmlFor="income">
                Penghasilan Bulanan (Rupiah)
              </label>
              <input
                id="income"
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#eff4ff] border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-sm"
                placeholder="Contoh: 1500000"
                required
              />
              <span className="text-[10px] text-on-surface-variant/70 italic">Kriteria ZKP: &lt; Rp 2.000.000</span>
            </div>

            {/* Jumlah Tanggungan */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-primary uppercase tracking-widest" htmlFor="dependents">
                Jumlah Tanggungan Keluarga
              </label>
              <input
                id="dependents"
                type="number"
                value={dependents}
                onChange={(e) => setDependents(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#eff4ff] border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-sm"
                placeholder="Jumlah orang dalam tanggungan"
                required
              />
              <span className="text-[10px] text-on-surface-variant/70 italic">Kriteria ZKP: &gt;= 3 orang</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Jenis Bantuan */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-primary uppercase tracking-widest" htmlFor="assistanceType">
                Jenis Program Bantuan
              </label>
              <select
                id="assistanceType"
                value={assistanceType}
                onChange={(e) => setAssistanceType(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#eff4ff] border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-sm cursor-pointer"
              >
                <option value="Bansos Sembako">Bansos Sembako (BPNT)</option>
                <option value="Program Keluarga Harapan">Program Keluarga Harapan (PKH)</option>
                <option value="Bantuan Langsung Tunai">Bantuan Langsung Tunai (BLT)</option>
              </select>
            </div>

            {/* Wallet Address (Opsional) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-primary uppercase tracking-widest" htmlFor="walletId">
                Wallet Address Ethereum / MetaMask (Opsional)
              </label>
              <input
                id="walletId"
                type="text"
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#eff4ff] border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-sm"
                placeholder="Contoh: 0x..."
              />
            </div>
          </div>

          {/* Upload Dokumen Pendukung */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-primary uppercase tracking-widest">
              Dokumen Pendukung (KK / Surat Keterangan Tidak Mampu)
            </label>
            <div className="border border-dashed border-outline-variant rounded-xl p-4 bg-[#f8f9ff] flex flex-col items-center justify-center text-center cursor-pointer relative hover:bg-[#eff4ff] transition-all">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.png,.jpg,.jpeg"
              />
              <span className="material-symbols-outlined text-3xl text-secondary mb-1">upload_file</span>
              <p className="text-xs font-semibold text-primary">
                {documentName ? `Berkas terpilih: ${documentName}` : 'Klik atau seret dokumen ke sini untuk mengunggah'}
              </p>
              <p className="text-[10px] text-on-surface-variant/70 mt-1">Mendukung berkas PDF, PNG, JPG maks 5MB</p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#002045] hover:bg-secondary text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-lg active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined text-base animate-spin">sync</span>
              ) : (
                <>
                  <span>Kirim & Verifikasi ZKP</span>
                  <span className="material-symbols-outlined text-sm">send</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      <Toast
        show={toastShow}
        message={toastMsg}
        type={toastType}
        onClose={() => setToastShow(false)}
      />
    </div>
  );
};

export default PengajuanBantuan;
