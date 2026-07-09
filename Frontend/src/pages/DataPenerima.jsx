import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Toast from '../components/Toast';
import BlockchainBadge from '../components/BlockchainBadge';
import { regions } from '../data/regions';

const DataPenerima = () => {
  const [recipients, setRecipients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail Drawer State
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [statusToChange, setStatusToChange] = useState('PENDING');

  // Filter States
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form Tambah Pengajuan State
  const [showAddModal, setShowAddModal] = useState(false);
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [selectedProvinsi, setSelectedProvinsi] = useState('Jawa Barat');
  const [selectedKota, setSelectedKota] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [detailAlamat, setDetailAlamat] = useState('');
  const [income, setIncome] = useState(1500000);
  const [dependents, setDependents] = useState(3);
  const [assistanceType, setAssistanceType] = useState('Bansos Sembako');
  const [documentName, setDocumentName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Toast Notifications
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastShow(true);
  };

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      const data = await api.getRecipients();
      setRecipients(data);
    } catch (err) {
      triggerToast('Gagal memuat data pengajuan bantuan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, []);

  const handleStatusChange = async (id, name, targetStatus) => {
    try {
      await api.updateRecipientStatus(id, targetStatus);
      triggerToast(`Status pengajuan ${name} berhasil diubah ke ${targetStatus}.`, 'success');
      setShowDetailSheet(false);
      fetchRecipients();
    } catch (err) {
      triggerToast('Gagal mengubah status pengajuan', 'error');
    }
  };

  const handleRowClick = (rec) => {
    setSelectedRecipient(rec);
    setStatusToChange(rec.status);
    setShowDetailSheet(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentName(e.target.files[0].name);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!nik || !name || !selectedKota || !selectedKecamatan || !detailAlamat) {
      triggerToast('Mohon lengkapi NIK, Nama Lengkap, dan Alamat.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const fullAddress = `${detailAlamat}, Kec. ${selectedKecamatan}, ${selectedKota}, Prov. ${selectedProvinsi}`;
      const payload = {
        name,
        nik,
        region: fullAddress,
        pendapatan: parseFloat(income),
        jumlahTanggungan: parseInt(dependents),
        jenisBantuan: assistanceType,
        dokumen: documentName || 'dokumen_default.pdf'
      };
      const res = await api.addRecipient(payload);
      if (res) {
        triggerToast('✓ Pengajuan Warga Baru Berhasil Ditambahkan!', 'success');
        setShowAddModal(false);
        // Reset Form
        setNik('');
        setName('');
        setSelectedKota('');
        setSelectedKecamatan('');
        setDetailAlamat('');
        setIncome(1500000);
        setDependents(3);
        setDocumentName('');
        fetchRecipients();
      }
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Gagal mendaftarkan pengajuan warga.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter list based on search query and status filter
  const filteredRecipients = recipients.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nik.includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'LAYAK':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'TIDAK_LAYAK':
      case 'TIDAK LAYAK':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'TERSALURKAN':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'DITOLAK':
        return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'DIBLOKIR':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'NONAKTIF':
        return 'bg-slate-100 text-slate-600 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  // Metrics
  const totalPending = recipients.filter(r => r.status === 'PENDING').length;
  const totalLayak = recipients.filter(r => r.status === 'LAYAK').length;

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Daftar Pengajuan & Penerima Bantuan</h2>
          <p className="text-xs text-on-surface-variant">
            Daftar pengajuan sosial warga beserta status kelayakan ZKP dan distribusi bansos.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-primary hover:bg-secondary text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition-all active:scale-95 flex items-center justify-center gap-1.5 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          <span>Tambah Pengajuan Baru</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-outline-variant p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">TOTAL PENGAJUAN MASUK</p>
          <p className="text-2xl font-bold text-primary">{recipients.length} Pengajuan</p>
        </div>
        <div className="bg-white border border-outline-variant p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">PENDING REVIEW</p>
          <p className="text-2xl font-bold text-amber-500">{totalPending} Berkas</p>
        </div>
        <div className="bg-white border border-outline-variant p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">PENERIMA VERIFIED LAYAK</p>
          <p className="text-2xl font-bold text-green-600">{totalLayak} Penerima</p>
        </div>
      </section>

      {/* Filter and Search controls */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-grow">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-outline-variant rounded-xl text-xs focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none"
            placeholder="Cari Nama atau 16 digit NIK..."
          />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-on-surface-variant font-bold hidden sm:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-3 bg-white border border-outline-variant rounded-xl text-xs font-semibold outline-none focus:border-secondary transition-all"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">PENDING</option>
            <option value="LAYAK">LAYAK</option>
            <option value="TIDAK_LAYAK">TIDAK LAYAK</option>
            <option value="TERSALURKAN">TERSALURKAN</option>
            <option value="DITOLAK">DITOLAK</option>
            <option value="DIBLOKIR">DIBLOKIR</option>
            <option value="NONAKTIF">NONAKTIF</option>
          </select>
        </div>
      </div>

      {/* MAIN DATA TABLE / LIST */}
      <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-20 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-4xl animate-spin block mb-3">sync</span>
            <p className="text-xs">Memuat data dari database...</p>
          </div>
        ) : filteredRecipients.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-4xl block mb-3">search_off</span>
            <p className="text-xs">Pengajuan tidak ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant/60">
                  <th className="p-4 text-[10px] font-bold text-primary uppercase tracking-wider">Status</th>
                  <th className="p-4 text-[10px] font-bold text-primary uppercase tracking-wider">Nama Lengkap</th>
                  <th className="p-4 text-[10px] font-bold text-primary uppercase tracking-wider">NIK</th>
                  <th className="p-4 text-[10px] font-bold text-primary uppercase tracking-wider">Program Bantuan</th>
                  <th className="p-4 text-[10px] font-bold text-primary uppercase tracking-wider">Wilayah Domisili</th>
                  <th className="p-4 text-[10px] font-bold text-primary uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-xs">
                {filteredRecipients.map((rec) => {
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => handleRowClick(rec)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${getStatusBadgeStyle(rec.status)}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-primary group-hover:text-secondary transition-colors">
                        {rec.name}
                      </td>
                      <td className="p-4 font-mono font-medium text-on-surface-variant/80">
                        {rec.nik}
                      </td>
                      <td className="p-4 font-semibold text-primary">
                        {rec.jenisBantuan || 'Bansos Sembako'}
                      </td>
                      <td className="p-4 text-on-surface-variant">
                        {rec.region}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleRowClick(rec)}
                          className="p-1.5 text-on-surface-variant hover:text-primary rounded hover:bg-slate-200 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONTEXTUAL DETAIL DRAWER */}
      {showDetailSheet && selectedRecipient && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowDetailSheet(false)}>
          <div
            className="w-full max-w-md bg-white rounded-t-3xl p-6 shadow-2xl transform transition-transform duration-300 translate-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grabbar indicator */}
            <div className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-6"></div>

            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeStyle(selectedRecipient.status)}`}>
                  {selectedRecipient.status}
                </span>
                <h4 className="text-lg font-bold text-primary mt-1">{selectedRecipient.name}</h4>
                <p className="text-xs text-on-surface-variant font-mono mt-0.5">NIK: {selectedRecipient.nik}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">person</span>
              </div>
            </div>

            <div className="space-y-4 text-xs mb-8">
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Program Bantuan</span>
                <span className="font-semibold text-primary">{selectedRecipient.jenisBantuan || 'Bansos Sembako'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Dokumen KK / SKTM</span>
                <span className="font-semibold text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                  <span>{selectedRecipient.dokumen || 'default_dokumen.pdf'}</span>
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Wilayah Domisili</span>
                <span className="font-semibold text-primary text-right">{selectedRecipient.region}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Pendapatan Terdaftar</span>
                <span className="font-semibold text-primary">Rp {selectedRecipient.pendapatan?.toLocaleString('id-ID')} / bulan</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Jumlah Tanggungan</span>
                <span className="font-semibold text-primary">{selectedRecipient.jumlahTanggungan} Orang</span>
              </div>

              {selectedRecipient.status === 'TERSALURKAN' && selectedRecipient.distributions && selectedRecipient.distributions.length > 0 && (
                <div className="bg-[#eff4ff] border border-outline-variant/60 p-3 rounded-xl space-y-2 mt-2">
                  <label className="font-bold text-primary uppercase tracking-wider text-[10px] block">Informasi Penyaluran</label>
                  {selectedRecipient.distributions.map((dist, idx) => (
                    <div key={idx} className="space-y-1 text-[10px] text-on-surface-variant font-mono">
                      <div>Nominal: Rp {dist.nominal.toLocaleString('id-ID')}</div>
                      {dist.fundSource && (
                        <>
                          <div>Program: <span className="font-semibold text-primary">{dist.fundSource.programName}</span></div>
                          <div>Sumber Dana: <span className="font-semibold">{dist.fundSource.fundSource}</span></div>
                          <div>Instansi: <span className="font-semibold">{dist.fundSource.institution}</span></div>
                          <div>Tahun Anggaran: <span className="font-semibold">{dist.fundSource.fiscalYear}</span></div>
                          <div>Total Anggaran: <span className="font-semibold">Rp {dist.fundSource.allocatedBudget.toLocaleString('id-ID')}</span></div>
                          <div>Dana Tersalurkan: <span className="font-semibold">Rp {dist.fundSource.distributedBudget.toLocaleString('id-ID')}</span></div>
                          <div>Sisa Anggaran: <span className="font-semibold">Rp {dist.fundSource.remainingBudget.toLocaleString('id-ID')}</span></div>
                        </>
                      )}
                      {dist.txHash && (
                        <div className="mt-1.5 flex flex-col gap-1">
                          <span className="text-[9px] uppercase font-bold text-on-surface-variant/80">Tx Hash:</span>
                          <BlockchainBadge hash={dist.txHash} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Status Changing Dropdown Form */}
              <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20 mt-2">
                <label className="font-bold text-primary uppercase tracking-wider text-[10px]">Ubah Status Pengajuan (Ledger Change)</label>
                <div className="flex gap-2">
                  <select
                    value={statusToChange}
                    onChange={(e) => setStatusToChange(e.target.value)}
                    className="flex-grow px-3 py-2 bg-[#eff4ff] border border-outline-variant rounded-xl outline-none"
                  >
                    <option value="PENDING">PENDING (Tunda)</option>
                    <option value="LAYAK">LAYAK (Setujui)</option>
                    <option value="TIDAK_LAYAK">TIDAK LAYAK</option>
                    <option value="TERSALURKAN">TERSALURKAN</option>
                    <option value="DITOLAK">DITOLAK</option>
                    <option value="DIBLOKIR">DIBLOKIR</option>
                    <option value="NONAKTIF">NONAKTIF</option>
                  </select>
                  <button
                    onClick={() => handleStatusChange(selectedRecipient.id, selectedRecipient.name, statusToChange)}
                    className="px-4 py-2 bg-[#002045] hover:bg-secondary text-white font-bold rounded-xl active:scale-95 transition-all text-xs"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowDetailSheet(false)}
                className="w-full py-3 border border-outline text-primary rounded-xl font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PENGAJUAN BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 animate-fade-in text-left">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <h3 className="text-md font-bold text-primary">Tambah Pengajuan Bantuan (Admin)</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 rounded text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* NIK */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-wider" htmlFor="nik">
                    NIK Warga
                  </label>
                  <input
                    id="nik"
                    type="text"
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    maxLength={16}
                    className="w-full px-3 py-2 bg-[#eff4ff] border border-outline-variant rounded-lg focus:border-secondary outline-none text-xs"
                    placeholder="16 digit NIK"
                    required
                  />
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-wider" htmlFor="name">
                    Nama Lengkap
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#eff4ff] border border-outline-variant rounded-lg focus:border-secondary outline-none text-xs"
                    placeholder="Nama sesuai KTP"
                    required
                  />
                </div>
              </div>

              {/* Baris Dropdown Bertingkat */}
              <div className="grid grid-cols-3 gap-3">
                {/* Provinsi - Dikunci ke Jawa Barat */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-primary uppercase tracking-wider">
                    Provinsi
                  </label>
                  <select
                    value={selectedProvinsi}
                    disabled
                    className="w-full px-2 py-2 bg-slate-100 border border-outline-variant rounded-lg text-xs cursor-not-allowed opacity-80"
                  >
                    <option value="Jawa Barat">Jawa Barat</option>
                  </select>
                </div>

                {/* Kabupaten / Kota */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-primary uppercase tracking-wider">
                    Kota / Kabupaten
                  </label>
                  <select
                    value={selectedKota}
                    onChange={(e) => {
                      setSelectedKota(e.target.value);
                      setSelectedKecamatan(''); // Reset kecamatan saat kota berganti
                    }}
                    className="w-full px-2 py-2 bg-[#eff4ff] border border-outline-variant rounded-lg focus:border-secondary outline-none text-xs cursor-pointer"
                    required
                  >
                    <option value="">-- Pilih Kota/Kab --</option>
                    {Object.keys(regions).map((kota) => (
                      <option key={kota} value={kota}>
                        {kota}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kecamatan - Nonaktif sebelum Kota Dipilih */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-primary uppercase tracking-wider">
                    Kecamatan
                  </label>
                  <select
                    value={selectedKecamatan}
                    onChange={(e) => setSelectedKecamatan(e.target.value)}
                    disabled={!selectedKota}
                    className={`w-full px-2 py-2 border border-outline-variant rounded-lg focus:border-secondary outline-none text-xs cursor-pointer ${
                      !selectedKota ? 'bg-slate-100 opacity-60 cursor-not-allowed' : 'bg-[#eff4ff]'
                    }`}
                    required
                  >
                    <option value="">-- Pilih Kec --</option>
                    {selectedKota &&
                      regions[selectedKota].map((kec) => (
                        <option key={kec} value={kec}>
                          {kec}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Input Detail Alamat (Jalan / No. Rumah / RT / RW) */}
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-primary uppercase tracking-wider" htmlFor="detailAlamat">
                  Detail Alamat (Nama Jalan, No. Rumah, RT/RW)
                </label>
                <textarea
                  id="detailAlamat"
                  value={detailAlamat}
                  onChange={(e) => setDetailAlamat(e.target.value)}
                  rows={1.5}
                  className="w-full px-3 py-2 bg-[#eff4ff] border border-outline-variant rounded-lg focus:border-secondary outline-none text-xs resize-none"
                  placeholder="Contoh: Jl. Tambun Selatan No. 8, RT 01/RW 03"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Pendapatan */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-wider" htmlFor="income">
                    Penghasilan Bulanan (Rp)
                  </label>
                  <input
                    id="income"
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full px-3 py-2 bg-[#eff4ff] border border-outline-variant rounded-lg focus:border-secondary outline-none text-xs"
                    placeholder="Contoh: 1500000"
                    required
                  />
                  <span className="text-[9px] text-on-surface-variant/70 italic block">Kriteria ZKP: &lt; 2 Juta</span>
                </div>

                {/* Tanggungan */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-wider" htmlFor="dependents">
                    Jumlah Tanggungan
                  </label>
                  <input
                    id="dependents"
                    type="number"
                    value={dependents}
                    onChange={(e) => setDependents(e.target.value)}
                    className="w-full px-3 py-2 bg-[#eff4ff] border border-outline-variant rounded-lg focus:border-secondary outline-none text-xs"
                    placeholder="Jumlah orang"
                    required
                  />
                  <span className="text-[9px] text-on-surface-variant/70 italic block">Kriteria ZKP: &gt;= 3 Orang</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Program Bantuan */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-wider" htmlFor="assistanceType">
                    Program Bantuan
                  </label>
                  <select
                    id="assistanceType"
                    value={assistanceType}
                    onChange={(e) => setAssistanceType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#eff4ff] border border-outline-variant rounded-lg focus:border-secondary outline-none text-xs cursor-pointer"
                  >
                    <option value="Bansos Sembako">Bansos Sembako (BPNT)</option>
                    <option value="Program Keluarga Harapan">Program Keluarga Harapan (PKH)</option>
                    <option value="Bantuan Langsung Tunai">Bantuan Langsung Tunai (BLT)</option>
                  </select>
                </div>

                {/* Upload KK/KTP Mock */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-wider">
                    Dokumen Pendukung
                  </label>
                  <div className="border border-dashed border-outline-variant rounded-lg p-2 bg-[#f8f9ff] flex flex-col items-center justify-center text-center cursor-pointer relative hover:bg-[#eff4ff] transition-all">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    <span className="material-symbols-outlined text-md text-secondary mb-0.5">upload_file</span>
                    <p className="text-[9px] font-bold text-primary truncate max-w-full">
                      {documentName ? documentName : 'Pilih Berkas KK/KTP'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-outline-variant/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-outline rounded-xl font-bold text-xs text-primary hover:bg-slate-50 transition-all active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary hover:bg-secondary text-white font-bold rounded-xl active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xs">send</span>
                      <span>Kirim & Verifikasi ZKP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast 
        show={toastShow} 
        message={toastMsg} 
        type={toastType} 
        onClose={() => setToastShow(false)} 
      />
    </div>
  );
};

export default DataPenerima;
