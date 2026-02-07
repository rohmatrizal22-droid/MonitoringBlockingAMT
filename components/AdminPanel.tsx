import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { AMT, Case, Location, ViolationType, PunishmentLevel } from '../types';
import { StatsCharts } from './StatsCharts';

export const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<'DASHBOARD' | 'DATA_VIEW' | 'BLOCK_ENTRY' | 'UNBLOCK_PROCESS' | 'MASTER_DATA'>('DASHBOARD');
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [violations, setViolations] = useState<ViolationType[]>([]);
  const [amts, setAmts] = useState<AMT[]>([]);
  const [cases, setCases] = useState<Case[]>([]);

  // Form States for Block Entry
  const [newAmtName, setNewAmtName] = useState('');
  const [newAmtRole, setNewAmtRole] = useState('AMT 1');
  const [selectedLoc, setSelectedLoc] = useState('');
  const [selectedVio, setSelectedVio] = useState('');
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split('T')[0]);

  // Unblock / BAP States
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [unblockDate, setUnblockDate] = useState(new Date().toISOString().split('T')[0]);
  const [suggestedLevel, setSuggestedLevel] = useState<PunishmentLevel>(PunishmentLevel.NONE);
  const [finalLevel, setFinalLevel] = useState<PunishmentLevel>(PunishmentLevel.NONE);
  const [bapNotes, setBapNotes] = useState('');
  
  // Edit Punishment States
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [editPunishmentLevel, setEditPunishmentLevel] = useState<string>('None');
  const [editEndDate, setEditEndDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Master Data States
  const [newViolation, setNewViolation] = useState('');

  // --- FILTER BERTINGKAT STATES ---
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

  useEffect(() => {
    refreshData();
  }, []);

  // Reset filter saat pindah tab agar tidak membingungkan
  useEffect(() => {
    resetFilters();
  }, [tab]);

  // --- HELPER: FORMAT NAMA STANDAR ---
  // Fungsi ini memastikan:
  // 1. Tidak ada spasi di awal/akhir (.trim())
  // 2. Spasi ganda diubah jadi satu
  // 3. Huruf Kapital di setiap awal kata
  const formatAmtName = (name: string) => {
    return name
      .replace(/\s+/g, ' ') // Ubah spasi ganda jadi satu
      .trim()               // Hapus spasi depan/belakang
      .toLowerCase()        // Kecilkan semua dulu
      .replace(/\b\w/g, l => l.toUpperCase()); // Kapital setiap kata
  };

  const handleBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmtName || !newAmtRole || !selectedLoc || !selectedVio) {
      alert("Please fill all fields");
      return;
    }

    // 1. Terapkan Formatting pada Nama sebelum diproses
    const fixedName = formatAmtName(newAmtName);

    // 2. Cek duplikasi berdasarkan nama yang sudah diformat
    let amt = amts.find(a => a.name === fixedName && a.role === newAmtRole);
    if (!amt) {
      amt = db.addAMT(fixedName, newAmtRole, selectedLoc);
    } 

    db.createBlockCase(amt.id, selectedVio, blockDate);
    
    setNewAmtName('');
    setSelectedVio('');
    alert(`AMT ${fixedName} Berhasil Diblokir`);
    refreshData();
    setTab('DASHBOARD');
  };

  const openUnblockModal = (c: Case) => {
    const suggestion = db.suggestPunishment(c.amtId);
    setSelectedCase(c);
    setSuggestedLevel(suggestion);
    setFinalLevel(suggestion); 
    setUnblockDate(new Date().toISOString().split('T')[0]);
    setBapNotes('');
  };

  const handleUnblockSubmit = () => {
    if (!selectedCase) return;
    db.processUnblock(selectedCase.id, unblockDate, finalLevel, bapNotes);
    alert("Unblock Processed & BAP Recorded");
    setSelectedCase(null);
    refreshData();
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
    if(editPunishmentLevel === PunishmentLevel.PHK) {
        finalEndDate = 'Permanent';
    }
    db.updateCase(editingCase.id, {
        punishmentLevel: editPunishmentLevel as PunishmentLevel,
        punishmentEndDate: finalEndDate,
        notes: editNotes
    });
    alert("Data Updated Successfully");
    setEditingCase(null);
    refreshData();
  };

  const handleAddViolation = () => {
    if(!newViolation) return;
    db.addViolationType(newViolation);
    setNewViolation('');
    refreshData();
  };

  const handleDeleteViolation = (id: string) => {
    if(confirm("Are you sure?")) {
        db.deleteViolationType(id);
        refreshData();
    }
  };

  // Helper Logic for Filtering Data View
  const getFilteredCases = () => {
    return cases.filter(c => {
        // 1. Filter Lokasi (Exact Match)
        const matchLoc = filterLocation === '' || c.amtLocation === filterLocation;
        // 2. Filter Nama (Partial Match, Case Insensitive)
        const matchName = filterName === '' || c.amtName.toLowerCase().includes(filterName.toLowerCase());
        // 3. Filter Jabatan (Exact Match)
        const matchRole = filterRole === '' || c.amtRole === filterRole;
        // 4. Filter Status (Exact Match)
        const matchStatus = filterStatus === '' || c.status === filterStatus;

        return matchLoc && matchName && matchRole && matchStatus;
    });
  };

  // Helper Logic for Filtering Blocked Cases (Unblock Process)
  const getFilteredBlockedCases = () => {
    return cases.filter(c => {
        const isBlocked = c.status === 'BLOCKED';
        const matchLoc = filterLocation === '' || c.amtLocation === filterLocation;
        const matchName = filterName === '' || c.amtName.toLowerCase().includes(filterName.toLowerCase());
        const matchRole = filterRole === '' || c.amtRole === filterRole;
        return isBlocked && matchLoc && matchName && matchRole;
    });
  };

  // --- Export Functionality (Tracing List) ---
  const handleExportCSV = () => {
    // 1. Determine data source using the shared filter logic
    const dataToExport = getFilteredCases();

    if (dataToExport.length === 0) {
        alert("Tidak ada data untuk diekspor sesuai filter saat ini.");
        return;
    }

    // 2. Define Headers matching "Tracing List Riwayat Pelanggaran"
    const headers = [
        "No",
        "Nama AMT",
        "Jabatan",
        "Lokasi", 
        "Jenis Pelanggaran",
        "Status", 
        "Tanggal Blokir", 
        "Tanggal Unblock", 
        "Level Punishment", 
        "Tanggal Berakhir Sanksi", 
        "Catatan BAP"
    ];

    // 3. Convert Data to CSV String
    const csvRows = [
        headers.join(","), // Header Row
        ...dataToExport.map((c, index) => {
            // Helper to escape quotes and wrap fields
            const safe = (str: string | undefined) => `"${(str || "").replace(/"/g, '""')}"`;
            
            return [
                index + 1,
                safe(c.amtName),
                safe(c.amtRole),
                safe(c.amtLocation),
                safe(c.violationName),
                safe(c.status),
                safe(c.blockDate),
                safe(c.unblockDate || "-"),
                safe(c.punishmentLevel || "-"),
                safe(c.punishmentEndDate || "-"),
                safe(c.notes)
            ].join(",");
        })
    ];
    
    const csvContent = csvRows.join("\n");

    // 4. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Tracing_List_AMT_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Export Functionality for Unblock Process (Blocked List) ---
  const handleExportBlockedCSV = () => {
    const dataToExport = getFilteredBlockedCases();
    if (dataToExport.length === 0) {
        alert("Tidak ada data AMT terblokir untuk diekspor sesuai filter.");
        return;
    }

    const headers = [
        "No",
        "Nama AMT",
        "Jabatan",
        "Lokasi", 
        "Jenis Pelanggaran", 
        "Tanggal Blokir", 
        "Status"
    ];

    const csvRows = [
        headers.join(","),
        ...dataToExport.map((c, index) => {
            const safe = (str: string | undefined) => `"${(str || "").replace(/"/g, '""')}"`;
            return [
                index + 1,
                safe(c.amtName),
                safe(c.amtRole),
                safe(c.amtLocation),
                safe(c.violationName),
                safe(c.blockDate),
                "BLOCKED"
            ].join(",");
        })
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Blocked_AMT_List_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setFilterLocation('');
    setFilterName('');
    setFilterRole('');
    setFilterStatus('');
  };

  // --- UI Helpers ---
  const NavButton = ({ id, label, icon }: { id: typeof tab, label: string, icon: React.ReactNode }) => (
    <button 
        onClick={() => setTab(id)} 
        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 mb-1 ${
            tab === id 
            ? 'bg-blue-600 text-white shadow-md font-semibold' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
        {icon}
        {label}
    </button>
  );

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto">
        <h2 className="text-2xl font-bold text-slate-800">Admin Executive Summary</h2>
        <StatsCharts cases={cases} />
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h3 className="font-bold mb-4 text-lg text-slate-800 border-b border-slate-100 pb-3">Recent Activities</h3>
            <div className="space-y-2">
                {cases.slice(-5).reverse().map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-full ${c.status === 'BLOCKED' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                <div className="w-2.5 h-2.5 rounded-full bg-current"></div>
                             </div>
                             <div>
                                 <div className="font-bold text-sm text-slate-800">{c.amtName}</div>
                                 <div className="text-xs text-slate-500">{c.violationName} @ <span className="font-medium">{c.amtLocation}</span></div>
                             </div>
                        </div>
                        <div className="text-xs font-mono text-slate-400">
                            {c.status === 'BLOCKED' ? c.blockDate : c.unblockDate}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderDataView = () => {
    const filteredCases = getFilteredCases();

    return (
        <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto">
             <div className="flex flex-col justify-between items-start gap-4">
                <div className="w-full flex justify-between items-end border-b border-slate-200 pb-4">
                   <div>
                       <h2 className="text-2xl font-bold text-slate-800">Manajemen Data AMT</h2>
                       <p className="text-sm text-slate-500">Tracing Riwayat Pelanggaran dengan Filter Bertingkat</p>
                   </div>
                   <button 
                        onClick={handleExportCSV}
                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap"
                        title="Download Tracing List (Excel/CSV)"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Data (Excel)
                    </button>
                </div>
                
                {/* FILTER BERTINGKAT SECTION */}
                <div className="w-full bg-white p-5 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                     {/* 1. Filter Lokasi */}
                     <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">1. Lokasi (Area)</label>
                        <div className="relative">
                            <select 
                                value={filterLocation} 
                                onChange={(e) => setFilterLocation(e.target.value)}
                                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
                            >
                                <option value="">Semua Lokasi</option>
                                {locations.map(l => (
                                    <option key={l.id} value={l.name}>{l.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                     </div>

                     {/* 2. Filter Nama */}
                     <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">2. Nama AMT</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Cari Nama..." 
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pl-9 outline-none font-medium"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        </div>
                     </div>

                     {/* 3. Filter Jabatan */}
                     <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">3. Jabatan</label>
                        <div className="relative">
                             <select 
                                value={filterRole} 
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
                            >
                                <option value="">Semua Jabatan</option>
                                <option value="AMT 1">AMT 1 (Driver)</option>
                                <option value="AMT 2">AMT 2 (Kernet)</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                     </div>

                     {/* 4. Filter Status */}
                     <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">4. Status</label>
                        <div className="relative">
                             <select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
                            >
                                <option value="">Semua Status</option>
                                <option value="BLOCKED">Blocked</option>
                                <option value="UNBLOCKED">Unblocked</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                     </div>

                     {/* Reset Button */}
                     <div>
                        <button 
                            onClick={resetFilters}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 border border-slate-300"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Reset
                        </button>
                     </div>
                </div>
             </div>

             <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-320px)]">
                    <table className="w-full text-left text-sm text-slate-600 relative">
                        <thead className="bg-slate-900 text-slate-300 uppercase font-bold text-xs tracking-wider sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">Nama AMT</th>
                                <th className="px-6 py-4">Jabatan</th>
                                <th className="px-6 py-4">Lokasi</th>
                                <th className="px-6 py-4">Pelanggaran</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Punishment Details</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCases.map((c, idx) => (
                                <tr key={c.id} className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                    <td className="px-6 py-4 font-bold text-slate-800">{c.amtName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${c.amtRole === 'AMT 1' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                            {c.amtRole}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{c.amtLocation}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 font-medium text-xs">
                                            {c.violationName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${c.status === 'BLOCKED' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'BLOCKED' ? 'bg-red-600' : 'bg-emerald-600'}`}></span>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.status === 'UNBLOCKED' ? (
                                            <div className="flex flex-col">
                                                <span className="font-bold text-blue-800 text-sm">{c.punishmentLevel}</span>
                                                <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                    {c.punishmentLevel === 'PHK' ? 'Permanent' : `Ends: ${c.punishmentEndDate}`}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic text-xs">Waiting for BAP</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {c.status === 'UNBLOCKED' && (
                                            <button 
                                                onClick={() => openEditModal(c)}
                                                className="text-amber-500 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 p-2 rounded-lg transition-colors"
                                                title="Edit Punishment (SP Susulan)"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredCases.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                        <p className="font-medium">Tidak ada data ditemukan sesuai filter.</p>
                                        <button onClick={resetFilters} className="text-blue-600 hover:text-blue-800 text-xs font-bold mt-2 hover:underline">Reset Filter</button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
             </div>
             
             {/* Edit Modal */}
             {editingCase && (
                 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                     <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-scale-up overflow-hidden">
                         <div className="bg-amber-500 p-4 text-white flex items-center gap-2">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                             <h3 className="text-lg font-bold">Edit Punishment (Susulan)</h3>
                         </div>
                         <div className="p-6">
                             <div className="mb-4 text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
                                 <p><strong className="text-slate-800">Nama:</strong> {editingCase.amtName}</p>
                                 <p><strong className="text-slate-800">Kasus:</strong> {editingCase.violationName}</p>
                             </div>

                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Level Punishment Baru</label>
                             <select value={editPunishmentLevel} onChange={e => setEditPunishmentLevel(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 mb-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                                 {Object.values(PunishmentLevel).filter(l => l !== 'None').map(l => <option key={l} value={l}>{l}</option>)}
                             </select>
                             
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tanggal Berakhir (Pemutihan)</label>
                             <input 
                                type="date" 
                                value={editEndDate} 
                                onChange={e => setEditEndDate(e.target.value)} 
                                className="w-full border border-slate-300 rounded-lg p-2.5 mb-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                disabled={editPunishmentLevel === PunishmentLevel.PHK}
                             />
                             {editPunishmentLevel === PunishmentLevel.PHK && <p className="text-xs text-red-500 mb-4 font-bold">* Permanent Punishment</p>}
                             
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2 mt-4">Alasan Perubahan</label>
                             <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 mb-6 text-sm focus:ring-2 focus:ring-amber-500 outline-none" rows={3}></textarea>
                             
                             <div className="flex gap-3">
                                 <button onClick={() => setEditingCase(null)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-lg font-bold hover:bg-slate-200 transition-colors">Batal</button>
                                 <button onClick={handleEditSubmit} className="flex-1 bg-amber-500 text-white py-2.5 rounded-lg font-bold hover:bg-amber-600 shadow-md transition-colors">Simpan</button>
                             </div>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
  };

  const renderBlockEntry = () => (
    <div className="max-w-3xl mx-auto animate-fade-in py-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
        <div className="bg-red-700 p-6 text-white flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Input Pelanggaran</h2>
                    <p className="text-red-100 text-sm">Formulir Pemblokiran AMT</p>
                </div>
             </div>
        </div>
        
        <form onSubmit={handleBlockSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama AMT</label>
                    <input 
                        type="text" 
                        required 
                        value={newAmtName} 
                        onChange={e => setNewAmtName(e.target.value)}
                        onBlur={() => setNewAmtName(formatAmtName(newAmtName))} // Auto-format on click away
                        className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all shadow-sm" 
                        placeholder="Nama Lengkap (Otomatis Kapital)" 
                    />
                    <p className="text-[10px] text-slate-400 mt-1 italic">*Format nama akan otomatis disesuaikan (Title Case) dan spasi berlebih dihapus.</p>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jabatan / Posisi</label>
                    <select required value={newAmtRole} onChange={e => setNewAmtRole(e.target.value)}
                         className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all shadow-sm font-medium">
                        <option value="AMT 1">AMT 1 (Supir)</option>
                        <option value="AMT 2">AMT 2 (Kernet)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lokasi Kerja</label>
                    <select required value={selectedLoc} onChange={e => setSelectedLoc(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all shadow-sm">
                        <option value="">-- Pilih Lokasi --</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jenis Pelanggaran</label>
                    <select required value={selectedVio} onChange={e => setSelectedVio(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all shadow-sm">
                        <option value="">-- Pilih Pelanggaran --</option>
                        {violations.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Kejadian</label>
                <input type="date" required value={blockDate} onChange={e => setBlockDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all shadow-sm" />
            </div>

            <div className="pt-6 border-t border-slate-100">
                <button type="submit" className="w-full bg-red-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-red-700 hover:shadow-xl shadow-red-600/20 transition-all transform hover:-translate-y-0.5">
                    EKSEKUSI BLOKIR
                </button>
            </div>
        </form>
      </div>
    </div>
  );

  const renderUnblockProcess = () => {
    // Logic filtering khusus untuk Unblock Process (Status must be BLOCKED)
    const filteredBlockedCases = getFilteredBlockedCases();

    return (
        <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto">
            <div className="flex flex-col justify-between items-start gap-4">
                 <div className="w-full flex justify-between items-end border-b border-slate-200 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Permintaan Unblock (BAP)</h2>
                        <p className="text-sm text-slate-500">Proses pembukaan blokir dan penetapan sanksi dengan Filter.</p>
                    </div>
                    {/* EXPORT BUTTON - For Blocked Data */}
                    <button 
                        onClick={handleExportBlockedCSV}
                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap"
                        title="Download Blocked List (Excel/CSV)"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Data (Excel)
                    </button>
                 </div>

                 {/* FILTER SECTION (Khusus Unblock Process - Tanpa Status karena pasti BLOCKED) */}
                 <div className="w-full bg-white p-5 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                     {/* 1. Filter Lokasi */}
                     <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">1. Lokasi</label>
                        <div className="relative">
                            <select 
                                value={filterLocation} 
                                onChange={(e) => setFilterLocation(e.target.value)}
                                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
                            >
                                <option value="">Semua Lokasi</option>
                                {locations.map(l => (
                                    <option key={l.id} value={l.name}>{l.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                     </div>

                     {/* 2. Filter Nama */}
                     <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">2. Nama AMT</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Cari Nama..." 
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        </div>
                     </div>

                     {/* 3. Filter Jabatan */}
                     <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">3. Jabatan</label>
                        <div className="relative">
                            <select 
                                value={filterRole} 
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
                            >
                                <option value="">Semua Jabatan</option>
                                <option value="AMT 1">AMT 1</option>
                                <option value="AMT 2">AMT 2</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                     </div>

                     {/* Reset Button */}
                     <button 
                        onClick={resetFilters}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-lg transition-colors text-sm border border-slate-300 h-[42px]"
                     >
                        Reset Filter
                     </button>
                </div>
            </div>
            
            {filteredBlockedCases.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center">
                    <div className="bg-slate-200 p-4 rounded-full mb-4">
                        <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div className="text-slate-600 font-bold text-xl">Tidak ada data ditemukan</div>
                    <p className="text-slate-500 mt-2">Coba sesuaikan filter atau memang tidak ada AMT terblokir.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredBlockedCases.map(c => (
                        <div key={c.id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-lg transition-all">
                            <div className="flex items-start gap-4 w-full">
                                <div className="bg-red-50 p-3 rounded-lg hidden md:block">
                                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-slate-800">{c.amtName}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${c.amtRole === 'AMT 1' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>{c.amtRole}</span>
                                        <span className="text-sm text-slate-600 font-medium">{c.amtLocation}</span>
                                    </div>
                                    <p className="text-sm text-red-600 font-bold mt-2">Pelanggaran: {c.violationName}</p>
                                    <p className="text-xs text-slate-400 mt-1">Diblokir sejak: {c.blockDate}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => openUnblockModal(c)}
                                className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all whitespace-nowrap"
                            >
                                Proses BAP
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {selectedCase && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-up">
                        <div className="bg-blue-800 p-5 text-white flex items-center gap-3">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <h3 className="text-xl font-bold">Proses BAP & Unblock</h3>
                        </div>
                        
                        <div className="p-6 space-y-5">
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex gap-4 items-start">
                                <div className="bg-yellow-100 p-2 rounded-full">
                                    <svg className="w-6 h-6 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <strong className="text-yellow-800 block text-xs uppercase tracking-wide">Rekomendasi Sistem</strong>
                                    <span className="text-2xl font-black text-yellow-700 block my-1">{suggestedLevel}</span>
                                    <p className="text-xs text-yellow-800/80">Berdasarkan riwayat sanksi sebelumnya.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Keputusan Sanksi (Punishment)</label>
                                <select 
                                    value={finalLevel} 
                                    onChange={(e) => setFinalLevel(e.target.value as PunishmentLevel)}
                                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none bg-white text-slate-800 font-medium"
                                >
                                    {Object.values(PunishmentLevel).filter(l => l !== 'None').map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tanggal Buka Blokir</label>
                                <input type="date" value={unblockDate} onChange={e => setUnblockDate(e.target.value)} 
                                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none text-slate-800"/>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Catatan BAP</label>
                                <textarea 
                                    value={bapNotes} 
                                    onChange={e => setBapNotes(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                                    rows={3}
                                    placeholder="Masukkan detail BAP..."
                                ></textarea>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setSelectedCase(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                                <button onClick={handleUnblockSubmit} className="flex-1 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/30 transition-colors">Konfirmasi</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const renderMasterData = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in max-w-[1600px] mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h3 className="font-bold text-lg mb-6 text-slate-800 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                Manage Violations
            </h3>
            <div className="flex gap-2 mb-6">
                <input 
                    type="text" 
                    value={newViolation} 
                    onChange={e => setNewViolation(e.target.value)}
                    placeholder="Nama Pelanggaran Baru"
                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                />
                <button onClick={handleAddViolation} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md">Add</button>
            </div>
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {violations.map(v => (
                    <div key={v.id} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-lg border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                        <span className="text-sm font-medium text-slate-700">{v.name}</span>
                        {v.isCustom && (
                            <button onClick={() => handleDeleteViolation(v.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
             <h3 className="font-bold text-lg mb-6 text-slate-800 flex items-center gap-2">
                <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                Locations Data
             </h3>
             <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                 <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                         <tr>
                             <th className="p-3 rounded-l-lg">ID</th>
                             <th className="p-3 rounded-r-lg">Location Name</th>
                         </tr>
                     </thead>
                     <tbody>
                         {locations.map((l, i) => (
                             <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                 <td className="p-3 text-slate-400 font-mono text-xs">#{i+1}</td>
                                 <td className="p-3 text-slate-700 font-medium">{l.name}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col h-full shadow-2xl z-20">
         <div className="p-6 border-b border-slate-800">
             <div className="flex items-center gap-3">
                 <div className="bg-white/10 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                 </div>
                 <div>
                    <h1 className="text-white font-bold text-lg leading-tight">ADMIN PANEL</h1>
                    <p className="text-xs text-slate-500">Monitoring AMT</p>
                 </div>
             </div>
         </div>

         <div className="p-4 flex-1 overflow-y-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 px-4">Main Menu</div>
            <nav className="space-y-1">
                <NavButton 
                    id="DASHBOARD" 
                    label="Dashboard" 
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} 
                />
                <NavButton 
                    id="DATA_VIEW" 
                    label="Data AMT" 
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} 
                />
                <div className="pt-4 pb-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-4">Actions</div>
                </div>
                <NavButton 
                    id="BLOCK_ENTRY" 
                    label="Input Block" 
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} 
                />
                <NavButton 
                    id="UNBLOCK_PROCESS" 
                    label="Unblock Process" 
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
                />
                <div className="pt-4 pb-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-4">Settings</div>
                </div>
                <NavButton 
                    id="MASTER_DATA" 
                    label="Master Data" 
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>} 
                />
            </nav>
         </div>

         <div className="p-4 border-t border-slate-800 bg-slate-900">
             <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3 border border-slate-700">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <div>
                     <p className="text-xs text-slate-400">System Status</p>
                     <p className="text-sm font-bold text-white">Online & Secure</p>
                 </div>
             </div>
         </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
         {/* Top bar for admin content */}
         <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
             <h2 className="text-lg font-bold text-slate-700 uppercase tracking-tight">
                {tab.replace('_', ' ')}
             </h2>
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs border border-blue-200">
                    AD
                 </div>
                 <span className="text-sm font-medium text-slate-600">Administrator</span>
             </div>
         </div>

         <div className="flex-1 overflow-y-auto p-8 bg-slate-100 scroll-smooth">
            {tab === 'DASHBOARD' && renderDashboard()}
            {tab === 'DATA_VIEW' && renderDataView()}
            {tab === 'BLOCK_ENTRY' && renderBlockEntry()}
            {tab === 'UNBLOCK_PROCESS' && renderUnblockProcess()}
            {tab === 'MASTER_DATA' && renderMasterData()}
         </div>
      </div>
    </div>
  );
};