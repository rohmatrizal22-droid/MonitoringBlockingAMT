import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/mockDb';
import { AMT, Case, Location, ViolationType, PunishmentLevel } from '../types';
import { StatsCharts } from './StatsCharts';

// Declare Swal globally
declare const Swal: any;

export const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<'DASHBOARD' | 'DATA_VIEW' | 'BLOCK_ENTRY' | 'UNBLOCK_PROCESS' | 'PEMUTIHAN' | 'MASTER_DATA'>('DASHBOARD');
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [violations, setViolations] = useState<ViolationType[]>([]);
  const [amts, setAmts] = useState<AMT[]>([]);
  const [cases, setCases] = useState<Case[]>([]);

  // Form States
  const [newAmtName, setNewAmtName] = useState('');
  const [newAmtRole, setNewAmtRole] = useState('AMT 1');
  const [selectedLoc, setSelectedLoc] = useState('');
  const [selectedVio, setSelectedVio] = useState('');
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split('T')[0]);
  const [blockNote, setBlockNote] = useState(''); // New State for Block Note

  // Unblock States
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [unblockDate, setUnblockDate] = useState(new Date().toISOString().split('T')[0]);
  const [suggestedLevel, setSuggestedLevel] = useState<PunishmentLevel>(PunishmentLevel.NONE);
  const [finalLevel, setFinalLevel] = useState<PunishmentLevel>(PunishmentLevel.NONE);
  const [bapNotes, setBapNotes] = useState('');
  
  // Edit States
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [editPunishmentLevel, setEditPunishmentLevel] = useState<string>('None');
  const [editEndDate, setEditEndDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Master Data
  const [newViolation, setNewViolation] = useState('');

  // Filters
  const [filterLocation, setFilterLocation] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const refreshData = () => {
    setLocations(db.getLocations());
    setViolations(db.getViolations());
    setAmts(db.getAMTs());
    setCases(db.getCases());
  };

  useEffect(() => { refreshData(); }, []);
  useEffect(() => { resetFilters(); }, [tab]);

  // Unique Names for Dropdown/Datalist if needed
  const uniqueAmtNames = useMemo(() => {
      const names = cases.map(c => c.amtName);
      return [...new Set(names)].sort();
  }, [cases]);

  const formatAmtName = (name: string) => {
    return name.replace(/\s+/g, ' ').trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // --- LOGIC PEMUTIHAN ---
  const isPemutihan = (c: Case) => {
      if (c.status === 'BLOCKED' || !c.punishmentEndDate || c.punishmentEndDate === 'Permanent' || c.punishmentLevel === PunishmentLevel.PHK) return false;
      const today = new Date().toISOString().split('T')[0];
      return c.punishmentEndDate < today;
  };

  // --- VIEW NOTE HANDLER ---
  const handleViewNote = (c: Case) => {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: `Catatan: ${c.amtName}`,
            html: `
                <div class="text-left bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700">
                    <p class="mb-2"><strong>Kasus:</strong> ${c.violationName} (${c.status})</p>
                    <hr class="my-2 border-slate-300"/>
                    <p class="italic font-medium">"${c.notes || 'Tidak ada catatan.'}"</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Tutup'
        });
    } else {
        alert(`Catatan: ${c.notes || 'Tidak ada.'}`);
    }
  };

  const handleBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmtName || !newAmtRole || !selectedLoc || !selectedVio) {
      if (typeof Swal !== 'undefined') Swal.fire({ icon: 'error', title: 'Data Tidak Lengkap', text: 'Mohon isi semua field.' });
      else alert("Please fill all fields");
      return;
    }

    const fixedName = formatAmtName(newAmtName);
    let amt = amts.find(a => a.name === fixedName && a.role === newAmtRole);
    if (!amt) { amt = db.addAMT(fixedName, newAmtRole, selectedLoc); } 

    // PASS BLOCK NOTE TO DB
    db.createBlockCase(amt.id, selectedVio, blockDate, blockNote);
    
    setNewAmtName(''); 
    setSelectedVio('');
    setBlockNote(''); // Reset note
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({ icon: 'success', title: 'Berhasil', text: `AMT ${fixedName} telah diblokir.`, timer: 1500, showConfirmButton: false });
    } else alert(`AMT ${fixedName} Berhasil Diblokir`);

    refreshData(); setTab('DASHBOARD');
  };

  const openUnblockModal = (c: Case) => {
    const suggestion = db.suggestPunishment(c.amtId);
    setSelectedCase(c);
    setSuggestedLevel(suggestion);
    setFinalLevel(suggestion); 
    setUnblockDate(new Date().toISOString().split('T')[0]);
    // Pre-fill notes with existing notes (from Block) or empty
    setBapNotes(c.notes ? `${c.notes}\n\n[BAP]: ` : '');
  };

  const handleUnblockSubmit = () => {
    if (!selectedCase) return;
    db.processUnblock(selectedCase.id, unblockDate, finalLevel, bapNotes);
    if (typeof Swal !== 'undefined') Swal.fire({ icon: 'success', title: 'Unblock Sukses', text: 'Data BAP tersimpan.', timer: 1500, showConfirmButton: false });
    setSelectedCase(null); refreshData();
  };

  const openEditModal = (c: Case) => {
    setEditingCase(c);
    setEditPunishmentLevel(c.punishmentLevel || 'None');
    setEditEndDate(c.punishmentEndDate === 'Permanent' ? '' : (c.punishmentEndDate || ''));
    setEditNotes(c.notes || '');
  };

  const handleEditSubmit = () => {
    if(!editingCase) return;
    let finalEndDate = editEndDate;
    if(editPunishmentLevel === PunishmentLevel.PHK) finalEndDate = 'Permanent';
    db.updateCase(editingCase.id, { punishmentLevel: editPunishmentLevel as PunishmentLevel, punishmentEndDate: finalEndDate, notes: editNotes });
    if (typeof Swal !== 'undefined') Swal.fire({ icon: 'success', title: 'Update Berhasil', text: 'Data diperbarui.', timer: 1500, showConfirmButton: false });
    setEditingCase(null); refreshData();
  };

  const handleAddViolation = () => { if(newViolation) { db.addViolationType(newViolation); setNewViolation(''); refreshData(); } };
  
  const handleDeleteViolation = (id: string) => {
    if (typeof Swal !== 'undefined') {
        Swal.fire({ title: 'Yakin hapus?', text: "Data hilang permanen!", icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Hapus!' }).then((result: any) => {
            if (result.isConfirmed) { db.deleteViolationType(id); refreshData(); Swal.fire('Terhapus!', '', 'success'); }
        })
    } else { if(confirm("Are you sure?")) { db.deleteViolationType(id); refreshData(); } }
  };

  // --- FILTERS ---
  const checkFilter = (c: Case) => {
      const matchLoc = filterLocation === '' || c.amtLocation.toLowerCase().includes(filterLocation.toLowerCase());
      const matchName = filterName === '' || c.amtName.toLowerCase().includes(filterName.toLowerCase());
      const matchRole = filterRole === '' || c.amtRole === filterRole;
      const matchStatus = filterStatus === '' || c.status === filterStatus;
      return matchLoc && matchName && matchRole && matchStatus;
  }

  const getFilteredCases = () => cases.filter(c => checkFilter(c));

  const getFilteredBlockedCases = () => cases.filter(c => c.status === 'BLOCKED' && checkFilter(c));

  // Filter khusus untuk Pemutihan (Status UNBLOCKED, Bukan PHK, dan Tanggal End < Hari Ini)
  const getFilteredPemutihanCases = () => cases.filter(c => {
      return c.status === 'UNBLOCKED' && isPemutihan(c) && checkFilter(c);
  });

  const handleExportCSV = () => { /* Export logic remains same */
    const dataToExport = getFilteredCases();
    if (dataToExport.length === 0) { if (typeof Swal !== 'undefined') Swal.fire({icon: 'info', title: 'Data Kosong'}); return; }
    const headers = ["No", "Nama AMT", "Jabatan", "Lokasi", "Jenis Pelanggaran", "Status", "Tanggal Blokir", "Tanggal Unblock", "Level Punishment", "Tanggal Berakhir Sanksi", "Status Pemutihan", "Catatan BAP"];
    const csvRows = [headers.join(","), ...dataToExport.map((c, i) => [i+1, `"${c.amtName}"`, `"${c.amtRole}"`, `"${c.amtLocation}"`, `"${c.violationName}"`, c.status, c.blockDate, c.unblockDate||"-", c.punishmentLevel||"-", c.punishmentEndDate||"-", isPemutihan(c) ? "YA (CLEARED)" : "AKTIF", `"${c.notes||""}"`].join(","))];
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "Tracing_List.csv"; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleExportBlockedCSV = () => { /* Export logic */
    const dataToExport = getFilteredBlockedCases();
    if (dataToExport.length === 0) { if (typeof Swal !== 'undefined') Swal.fire({icon: 'info', title: 'Data Kosong'}); return; }
    const headers = ["No", "Nama AMT", "Jabatan", "Lokasi", "Jenis Pelanggaran", "Tanggal Blokir", "Status"];
    const csvRows = [headers.join(","), ...dataToExport.map((c, i) => [i+1, `"${c.amtName}"`, `"${c.amtRole}"`, `"${c.amtLocation}"`, `"${c.violationName}"`, c.blockDate, "BLOCKED"].join(","))];
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "Blocked_List.csv"; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const resetFilters = () => { setFilterLocation(''); setFilterName(''); setFilterRole(''); setFilterStatus(''); };

  // --- UI COMPONENTS ---
  
  // Standardized Classes for Pixel-Perfect Alignment
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1";
  const inputClass = "w-full h-[42px] border border-slate-300 rounded-lg px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 shadow-sm transition-all";

  const renderFilterBar = () => (
    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* 1. LOKASI */}
            <div className="w-full flex flex-col gap-1.5">
                <label className={labelClass}>1. Lokasi</label>
                <input 
                    list="adminLocationOptions" 
                    type="text" 
                    placeholder="Pilih Lokasi..." 
                    value={filterLocation} 
                    onChange={(e) => setFilterLocation(e.target.value)} 
                    className={inputClass}
                />
                <datalist id="adminLocationOptions">{locations.map(l => <option key={l.id} value={l.name} />)}</datalist>
            </div>

            {/* 2. NAMA AMT */}
            <div className="w-full flex flex-col gap-1.5">
                <label className={labelClass}>2. Nama AMT</label>
                <input 
                    type="text" 
                    placeholder="Ketik Nama..." 
                    value={filterName} 
                    onChange={(e) => setFilterName(e.target.value)} 
                    className={inputClass}
                />
            </div>

            {/* 3. JABATAN */}
            <div className="w-full flex flex-col gap-1.5">
                <label className={labelClass}>3. Jabatan</label>
                <select 
                    value={filterRole} 
                    onChange={(e) => setFilterRole(e.target.value)} 
                    className={`${inputClass} cursor-pointer`}
                >
                    <option value="">Semua Jabatan</option>
                    <option value="AMT 1">AMT 1</option>
                    <option value="AMT 2">AMT 2</option>
                </select>
            </div>

            {/* 4. STATUS */}
            <div className="w-full flex flex-col gap-1.5">
                <label className={labelClass}>4. Status</label>
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)} 
                    className={`${inputClass} cursor-pointer`}
                >
                    <option value="">Semua Status</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="UNBLOCKED">Unblocked</option>
                </select>
            </div>

            {/* RESET BUTTON (ICON ONLY - SPINNING LOGO & ALIGNED) */}
            <div className="w-full flex flex-col gap-1.5">
                {/* Invisible Label for spacing */}
                <label className={labelClass + " text-transparent select-none"}>Reset</label>
                <button 
                    onClick={resetFilters} 
                    title="Reset Filter"
                    className="w-full h-[42px] bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 rounded-lg flex items-center justify-center transition-all shadow-sm group"
                >
                    <svg className="w-6 h-6 group-hover:animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
  );

  const NavButton = ({ id, label, icon }: { id: typeof tab, label: string, icon: React.ReactNode }) => (
    <button onClick={() => setTab(id)} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 mb-1 ${tab === id ? 'bg-blue-600 text-white shadow-md font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
        {icon}{label}
    </button>
  );

  // --- RENDER CONTENT BLOCKS ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Admin Executive Summary</h2>
        <StatsCharts cases={cases} />
        {/* Simple Recent List for Mobile */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-slate-200">
            <h3 className="font-bold mb-3 text-lg text-slate-800 border-b pb-2">Recent Activities</h3>
            <div className="space-y-2">
                {cases.slice(-5).reverse().map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-full ${c.status === 'BLOCKED' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}><div className="w-2 h-2 rounded-full bg-current"></div></div>
                             <div><div className="font-bold text-sm text-slate-800">{c.amtName}</div><div className="text-[10px] md:text-xs text-slate-500">{c.violationName}</div></div>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{c.status === 'BLOCKED' ? c.blockDate : c.unblockDate}</div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderDataView = () => (
    <div className="space-y-4 animate-fade-in max-w-[1600px] mx-auto">
         <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end border-b pb-2">
               <div><h2 className="text-xl font-bold text-slate-800">Data AMT</h2><p className="text-xs text-slate-500">Tracing Riwayat</p></div>
               <button onClick={handleExportCSV} className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded shadow">Export Excel</button>
            </div>
            {renderFilterBar()}
         </div>
         <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left text-xs md:text-sm text-slate-600">
                    <thead className="bg-slate-900 text-slate-300 uppercase font-bold text-[10px] sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3">Nama AMT</th>
                            <th className="px-4 py-3">Jabatan</th>
                            <th className="px-4 py-3">Lokasi</th>
                            <th className="px-4 py-3">Pelanggaran</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Punishment Info</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {getFilteredCases().map((c, idx) => {
                            const cleared = isPemutihan(c);
                            return (
                            <tr key={c.id} className={`hover:bg-blue-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{c.amtName}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{c.amtRole}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{c.amtLocation}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{c.violationName}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'BLOCKED' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{c.status}</span></td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {c.status === 'UNBLOCKED' ? (
                                        cleared ? 
                                        <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 text-[10px] font-bold">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            PEMUTIHAN (SP SELESAI)
                                        </div>
                                        :
                                        <span>{c.punishmentLevel} <span className='text-[10px] text-slate-400'>({c.punishmentEndDate})</span></span> 
                                    ) : '-'}
                                </td>
                                <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                                    {/* SHOW VIEW NOTE FOR EVERYONE */}
                                    <button onClick={() => handleViewNote(c)} className="text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 p-1.5 rounded" title="Lihat Catatan">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </button>
                                    
                                    {c.status === 'UNBLOCKED' && (
                                        <button onClick={() => openEditModal(c)} className="text-amber-500 hover:text-amber-700 bg-amber-50 p-1.5 rounded" title="Edit Data">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
         </div>
    </div>
  );

  const renderBlockEntry = () => (
    <div className="max-w-2xl mx-auto animate-fade-in py-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
        <div className="bg-red-700 p-4 text-white flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
            <h2 className="text-xl font-bold">Input Block Baru</h2>
        </div>
        <form onSubmit={handleBlockSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500">NAMA AMT</label><input type="text" value={newAmtName} onChange={e => setNewAmtName(e.target.value)} className="border p-3 rounded w-full mt-1" required placeholder="Nama Lengkap"/></div>
                <div><label className="text-xs font-bold text-slate-500">JABATAN</label><select value={newAmtRole} onChange={e => setNewAmtRole(e.target.value)} className="border p-3 rounded w-full mt-1 font-bold"><option value="AMT 1">AMT 1 (Supir)</option><option value="AMT 2">AMT 2 (Kernet)</option></select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500">LOKASI</label><select value={selectedLoc} onChange={e => setSelectedLoc(e.target.value)} className="border p-3 rounded w-full mt-1" required><option value="">-- Pilih --</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                <div><label className="text-xs font-bold text-slate-500">PELANGGARAN</label><select value={selectedVio} onChange={e => setSelectedVio(e.target.value)} className="border p-3 rounded w-full mt-1" required><option value="">-- Pilih --</option>{violations.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
            </div>
            <div>
                <label className="text-xs font-bold text-slate-500">TANGGAL BLOCK</label>
                <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)} className="border p-3 rounded w-full mt-1" required />
            </div>
            {/* NEW NOTE INPUT */}
            <div>
                <label className="text-xs font-bold text-slate-500">KETERANGAN / CATATAN TAMBAHAN</label>
                <textarea 
                    value={blockNote} 
                    onChange={e => setBlockNote(e.target.value)} 
                    className="border p-3 rounded w-full mt-1" 
                    rows={3}
                    placeholder="Masukkan detail kejadian atau keterangan tambahan..."
                />
            </div>
            <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 shadow-lg mt-2">EKSEKUSI BLOKIR</button>
        </form>
      </div>
    </div>
  );

  const renderUnblockProcess = () => (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto">
      <div className="flex justify-between items-end border-b pb-2">
        <div>
           <h2 className="text-xl font-bold text-slate-800">Proses BAP & Unblock</h2>
           <p className="text-xs text-slate-500">Manajemen pemulihan status AMT</p>
        </div>
        <button onClick={handleExportBlockedCSV} className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded shadow">Export Data</button>
      </div>

      {renderFilterBar()}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm text-slate-600">
            <thead className="bg-red-900 text-white uppercase font-bold text-[10px]">
              <tr>
                <th className="px-4 py-3">Nama AMT</th>
                <th className="px-4 py-3">Jabatan</th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3">Pelanggaran</th>
                <th className="px-4 py-3">Tgl Blokir</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {getFilteredBlockedCases().map((c, idx) => (
                <tr key={c.id} className={`hover:bg-red-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-3 font-bold text-slate-800">{c.amtName}</td>
                  <td className="px-4 py-3">{c.amtRole}</td>
                  <td className="px-4 py-3">{c.amtLocation}</td>
                  <td className="px-4 py-3"><span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold border">{c.violationName}</span></td>
                  <td className="px-4 py-3 font-mono text-xs">{c.blockDate}</td>
                  <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                     <button onClick={() => handleViewNote(c)} className="text-slate-500 hover:text-blue-600 bg-white border hover:bg-blue-50 p-1.5 rounded" title="Lihat Catatan">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                     </button>
                    <button 
                      onClick={() => openUnblockModal(c)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                    >
                      Proses BAP
                    </button>
                  </td>
                </tr>
              ))}
               {getFilteredBlockedCases().length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">Tidak ada data blocked yang sesuai filter.</td></tr>
               )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL UNBLOCK */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
               <h3 className="text-lg font-bold">Formulir BAP & Unblock</h3>
               <button onClick={() => setSelectedCase(null)} className="text-white/80 hover:text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 space-y-4">
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                     <div><span className="text-xs text-slate-400 uppercase">Nama</span><div className="font-bold text-slate-800">{selectedCase.amtName}</div></div>
                     <div><span className="text-xs text-slate-400 uppercase">Lokasi</span><div className="font-bold text-slate-800">{selectedCase.amtLocation}</div></div>
                  </div>
                  <div><span className="text-xs text-slate-400 uppercase">Pelanggaran</span><div className="font-bold text-red-600">{selectedCase.violationName}</div></div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tanggal Unblock</label>
                    <input type="date" value={unblockDate} onChange={e => setUnblockDate(e.target.value)} className="w-full border p-2.5 rounded-lg text-sm font-bold text-slate-700"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Saran System</label>
                    <div className="w-full bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-sm font-bold text-blue-800">{suggestedLevel}</div>
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Keputusan Punishment</label>
                  <select value={finalLevel} onChange={e => setFinalLevel(e.target.value as PunishmentLevel)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500">
                     {Object.values(PunishmentLevel).filter(l => l !== 'None').map(l => (
                        <option key={l} value={l}>{l}</option>
                     ))}
                  </select>
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catatan BAP / Komitmen</label>
                  <textarea 
                    value={bapNotes} 
                    onChange={e => setBapNotes(e.target.value)} 
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" 
                    rows={3}
                    placeholder="Masukkan hasil BAP atau poin komitmen..."
                  ></textarea>
               </div>

               <button 
                  onClick={handleUnblockSubmit}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-lg transform active:scale-95 transition-all"
               >
                  SIMPAN & BUKA BLOKIR
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white fixed h-full z-10 shadow-xl transition-all">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
           <div className="bg-white p-1 rounded"><div className="w-6 h-6 bg-red-600 rounded-sm"></div></div>
           <div>
             <h1 className="font-bold text-lg leading-none tracking-tight">Admin Panel</h1>
             <span className="text-[10px] text-slate-400 uppercase tracking-widest">Elnusa Petrofin</span>
           </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
           <div className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Main Menu</div>
           <NavButton id="DASHBOARD" label="Dashboard" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} />
           <NavButton id="DATA_VIEW" label="Data Trace" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
           
           <div className="px-3 mb-2 mt-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Management</div>
           <NavButton id="BLOCK_ENTRY" label="Input Block" icon={<svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>} />
           <NavButton id="UNBLOCK_PROCESS" label="BAP & Unblock" icon={<svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-red-900/30 w-full px-4 py-3 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 text-white h-16 flex items-center justify-between px-4 sticky top-0 z-20 shadow-md">
            <div className="font-bold text-lg">Admin Panel</div>
            <button className="p-2" onClick={() => {
                const el = document.getElementById('mobile-menu');
                if(el) el.classList.toggle('hidden');
            }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
        </header>
        
        {/* Mobile Menu Dropdown */}
        <div id="mobile-menu" className="hidden md:hidden bg-slate-800 text-white border-b border-slate-700 shadow-xl fixed top-16 left-0 w-full z-10 p-2">
            <NavButton id="DASHBOARD" label="Dashboard" icon={<span className="w-4"/>} />
            <NavButton id="DATA_VIEW" label="Data Trace" icon={<span className="w-4"/>} />
            <NavButton id="BLOCK_ENTRY" label="Input Block" icon={<span className="w-4"/>} />
            <NavButton id="UNBLOCK_PROCESS" label="BAP & Unblock" icon={<span className="w-4"/>} />
            <button onClick={() => window.location.reload()} className="w-full text-left px-4 py-3 text-red-400 font-bold border-t border-slate-700 mt-2">Sign Out</button>
        </div>

        <div className="p-4 md:p-8 overflow-y-auto flex-1">
            {/* Page Title */}
            <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {tab === 'DASHBOARD' && 'Dashboard Overview'}
                        {tab === 'DATA_VIEW' && 'Data Monitoring'}
                        {tab === 'BLOCK_ENTRY' && 'Input Pelanggaran'}
                        {tab === 'UNBLOCK_PROCESS' && 'Proses BAP & Unblock'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Sistem Monitoring Pelanggaran AMT</p>
                </div>
                <div className="hidden md:block">
                    <span className="bg-white border border-slate-200 px-4 py-2 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Render Active Tab */}
            {tab === 'DASHBOARD' && renderDashboard()}
            {tab === 'DATA_VIEW' && renderDataView()}
            {tab === 'BLOCK_ENTRY' && renderBlockEntry()}
            {tab === 'UNBLOCK_PROCESS' && renderUnblockProcess()}
        </div>
      </div>
    </div>
  );
};