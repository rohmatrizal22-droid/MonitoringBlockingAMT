import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Case, Location, PunishmentLevel } from '../types';
import { StatsCharts } from './StatsCharts';

// Declare Swal globally for TypeScript
declare const Swal: any;

export const ViewMode: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // --- FILTER STATES ---
  const [filterLocation, setFilterLocation] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    // Load Locations
    setLocations(db.getLocations());

    const loadData = () => {
      const allCases = db.getCases();
      allCases.sort((a, b) => {
        if (a.status === 'BLOCKED' && b.status !== 'BLOCKED') return -1;
        if (a.status !== 'BLOCKED' && b.status === 'BLOCKED') return 1;
        return new Date(b.blockDate).getTime() - new Date(a.blockDate).getTime();
      });
      setCases(allCases);
    };
    loadData();
    const interval = setInterval(loadData, 5000); // Update every 5s is enough for view mode
    return () => clearInterval(interval);
  }, []);

  const blockedCount = cases.filter(c => c.status === 'BLOCKED').length;
  const unblockedCount = cases.filter(c => c.status === 'UNBLOCKED').length;
  const phkCount = cases.filter(c => c.punishmentLevel === 'PHK').length;

  // --- LOGIC PEMUTIHAN ---
  const isPemutihan = (c: Case) => {
      if (c.status === 'BLOCKED' || !c.punishmentEndDate || c.punishmentEndDate === 'Permanent' || c.punishmentLevel === PunishmentLevel.PHK) return false;
      const today = new Date().toISOString().split('T')[0];
      return c.punishmentEndDate < today;
  };

  // --- FILTER LOGIC ---
  const filteredCases = cases.filter(c => {
    // Flexible Location Filter (Type OR List via Datalist)
    const matchLoc = filterLocation === '' || c.amtLocation.toLowerCase().includes(filterLocation.toLowerCase());
    
    // Name Filter (Standard Text Input)
    const matchName = filterName === '' || c.amtName.toLowerCase().includes(filterName.toLowerCase());
    
    // 3. Filter Jabatan (Exact Match)
    const matchRole = filterRole === '' || c.amtRole === filterRole;
    // 4. Filter Status (Exact Match)
    const matchStatus = filterStatus === '' || c.status === filterStatus;

    return matchLoc && matchName && matchRole && matchStatus;
  });

  const resetFilters = () => {
    setFilterLocation('');
    setFilterName('');
    setFilterRole('');
    setFilterStatus('');
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
            confirmButtonText: 'Tutup',
            confirmButtonColor: '#0f172a'
        });
    } else {
        alert(`Catatan untuk ${c.amtName}:\n\n${c.notes || 'Tidak ada catatan.'}`);
    }
  };

  // --- EXPORT LOGIC ---
  const handleExportCSV = () => {
    if (filteredCases.length === 0) {
        alert("Tidak ada data untuk diekspor sesuai filter saat ini.");
        return;
    }

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
        "Status Pemutihan",
        "Catatan"
    ];

    const csvRows = [
        headers.join(","),
        ...filteredCases.map((c, index) => {
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
                isPemutihan(c) ? "YA (CLEARED)" : "AKTIF",
                safe(c.notes)
            ].join(",");
        })
    ];
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Public_View_AMT_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Standardized Classes for Pixel-Perfect Alignment
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1";
  const inputClass = "w-full h-[42px] border border-slate-300 rounded-lg px-3 text-xs md:text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 shadow-sm transition-all";

  return (
    <div className="p-3 md:p-6 max-w-[1600px] mx-auto space-y-6 md:space-y-8 animate-fade-in pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-4 md:pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Monitoring</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2 font-medium">Pemantauan Real-time Pelanggaran & Sanksi Awak Mobil Tangki.</p>
        </div>
        <div className="mt-3 md:mt-0 flex flex-col items-end w-full md:w-auto">
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block">Last Sync</span>
          <div className="bg-blue-50 text-blue-800 px-3 py-1 md:px-4 md:py-1.5 rounded-md text-xs md:text-sm font-mono font-bold border border-blue-100 w-full md:w-auto text-center md:text-right">
            Update: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Blocked Card */}
        <div className="bg-white rounded-xl shadow-md border-l-4 border-l-red-600 border-y border-r border-slate-200 p-4 md:p-6 flex items-center justify-between transition-transform hover:-translate-y-1">
            <div>
              <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">AMT Terblokir (Blocked)</p>
              <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800">{blockedCount}</h3>
              <p className="text-[10px] md:text-xs text-red-600 font-semibold mt-1 md:mt-2 flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> Requires Attention
              </p>
            </div>
            <div className="bg-red-50 p-2 md:p-3 rounded-lg text-red-600">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
        </div>

        {/* Unblocked Card */}
        <div className="bg-white rounded-xl shadow-md border-l-4 border-l-emerald-500 border-y border-r border-slate-200 p-4 md:p-6 flex items-center justify-between transition-transform hover:-translate-y-1">
            <div>
              <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Aktif / Unblocked</p>
              <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800">{unblockedCount}</h3>
              <p className="text-[10px] md:text-xs text-emerald-600 font-semibold mt-1 md:mt-2 flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Operational
              </p>
            </div>
            <div className="bg-emerald-50 p-2 md:p-3 rounded-lg text-emerald-600">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
        </div>

        {/* PHK Card */}
        <div className="bg-white rounded-xl shadow-md border-l-4 border-l-slate-800 border-y border-r border-slate-200 p-4 md:p-6 flex items-center justify-between transition-transform hover:-translate-y-1">
            <div>
              <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Total PHK</p>
              <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800">{phkCount}</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-semibold mt-1 md:mt-2">Terminated</p>
            </div>
            <div className="bg-slate-100 p-2 md:p-3 rounded-lg text-slate-700">
               <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            </div>
        </div>
      </div>

      {/* Visual Data Section */}
      <StatsCharts cases={cases} />

      {/* TABLE & FILTER SECTION */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        
        {/* FILTER BAR */}
        <div className="p-4 md:p-5 border-b border-slate-200 bg-slate-50">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 md:gap-0">
              <div>
                 <h2 className="text-base md:text-lg font-bold text-slate-800">Riwayat Kasus AMT</h2>
                 <p className="text-[10px] md:text-xs text-slate-500">Gunakan filter di bawah untuk mencari data spesifik</p>
              </div>
              <button 
                onClick={handleExportCSV}
                className="w-full md:w-auto flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm text-xs md:text-sm transition-colors"
              >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 Export Data
              </button>
           </div>

           {/* MULTI FILTER GRID - ALIGNED WITH ADMIN PANEL */}
           <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              {/* 1. Lokasi */}
              <div className="w-full">
                 <label className={labelClass}>1. Lokasi</label>
                 <input 
                    list="viewLocationOptions"
                    type="text" 
                    placeholder="Pilih Lokasi..." 
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className={inputClass}
                 />
                 <datalist id="viewLocationOptions">
                    {locations.map(l => <option key={l.id} value={l.name} />)}
                 </datalist>
              </div>

              {/* 2. Nama */}
              <div className="w-full">
                 <label className={labelClass}>2. Nama AMT</label>
                 <input 
                    type="text" 
                    placeholder="Ketik Nama..." 
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className={inputClass}
                 />
              </div>

              {/* 3. Jabatan */}
              <div className="w-full">
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

              {/* 4. Status */}
              <div className="w-full">
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

              {/* Reset Button (ICON STYLE & ALIGNED) */}
              <div className="w-full">
                 {/* Invisible label to align button with inputs */}
                 <label className={`${labelClass} text-transparent select-none`}>Reset</label>
                 <button 
                    onClick={resetFilters}
                    title="Reset Filter"
                    className="w-full h-[42px] bg-slate-100 hover:bg-slate-200 hover:text-red-600 border border-slate-300 text-slate-500 font-bold rounded-lg transition-all flex items-center justify-center shadow-sm group"
                 >
                    {/* Refresh / Reset Icon (Spinning on hover) */}
                    <svg className="w-6 h-6 text-slate-600 group-hover:animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                 </button>
              </div>
           </div>
        </div>
        
        {/* TABLE */}
        <div className="overflow-x-auto max-h-[500px] md:max-h-[600px]">
          <table className="w-full text-left text-xs md:text-sm text-slate-700 relative">
            <thead className="bg-blue-900 text-white uppercase font-bold text-[10px] md:text-xs tracking-wider sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-3 py-3 md:px-6 md:py-4">Status</th>
                <th className="px-3 py-3 md:px-6 md:py-4">Nama AMT</th>
                <th className="px-3 py-3 md:px-6 md:py-4">Jabatan</th>
                <th className="px-3 py-3 md:px-6 md:py-4">Lokasi</th>
                <th className="px-3 py-3 md:px-6 md:py-4">Pelanggaran</th>
                <th className="px-3 py-3 md:px-6 md:py-4">Tgl Blokir</th>
                <th className="px-3 py-3 md:px-6 md:py-4">Punishment</th>
                <th className="px-3 py-3 md:px-6 md:py-4 text-center">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((c, idx) => {
                const cleared = isPemutihan(c);
                return (
                <tr key={c.id} className={`hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold inline-flex items-center gap-1 shadow-sm ${c.status === 'BLOCKED' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                      <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${c.status === 'BLOCKED' ? 'bg-red-600' : 'bg-emerald-600'}`}></span>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 md:px-6 md:py-4 font-bold text-slate-800 whitespace-nowrap">{c.amtName}</td>
                  <td className="px-3 py-3 md:px-6 md:py-4">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${c.amtRole === 'AMT 1' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                        {c.amtRole}
                     </span>
                  </td>
                  <td className="px-3 py-3 md:px-6 md:py-4 text-slate-600 font-medium whitespace-nowrap">{c.amtLocation}</td>
                  <td className="px-3 py-3 md:px-6 md:py-4">
                      <span className="text-[10px] md:text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 whitespace-nowrap">
                        {c.violationName}
                      </span>
                  </td>
                  <td className="px-3 py-3 md:px-6 md:py-4 font-mono text-[10px] md:text-xs whitespace-nowrap">{c.blockDate}</td>
                  <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
                    {c.status === 'UNBLOCKED' ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-blue-800 text-[10px] md:text-sm">{c.punishmentLevel}</span>
                        {c.punishmentLevel !== 'PHK' && (
                           cleared ? (
                             <span className="text-[9px] md:text-[10px] text-emerald-700 font-bold mt-0.5 bg-emerald-100 inline-block px-1 rounded w-fit border border-emerald-200">
                               PEMUTIHAN (SELESAI)
                             </span>
                           ) : (
                             <span className="text-[9px] md:text-[10px] text-slate-500 font-medium mt-0.5 bg-slate-100 inline-block px-1 rounded w-fit">
                               Selesai: {c.punishmentEndDate}
                             </span>
                           )
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[10px] md:text-xs flex items-center gap-1">
                        <svg className="w-3 h-3 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Menunggu BAP
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                       {/* SHOW VIEW NOTE FOR ALL CASES */}
                       <button onClick={() => handleViewNote(c)} className="text-slate-500 hover:text-blue-600 transition-colors p-1.5 rounded-full hover:bg-blue-50" title="Lihat Catatan">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                       </button>
                  </td>
                </tr>
              )})}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                        <div className="bg-slate-50 p-4 rounded-full mb-3">
                           <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <p className="font-medium text-sm">Tidak ada data ditemukan.</p>
                        <p className="text-xs mt-1">Sesuaikan filter pencarian Anda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};