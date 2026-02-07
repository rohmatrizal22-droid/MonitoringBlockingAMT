import { AMT, Case, Location, ViolationType, PunishmentLevel, PUNISHMENT_DURATION_DAYS } from '../types';
import { INITIAL_LOCATIONS, INITIAL_VIOLATIONS } from '../constants';

// Keys for LocalStorage
const STORAGE_KEYS = {
  AMTS: 'amt_app_amts',
  CASES: 'amt_app_cases',
  VIOLATIONS: 'amt_app_violations',
  LOCATIONS: 'amt_app_locations'
};

class MockDatabase {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.LOCATIONS)) {
      const locs = INITIAL_LOCATIONS.map((name, idx) => ({ id: `loc_${idx}`, name }));
      localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locs));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VIOLATIONS)) {
      const vios = INITIAL_VIOLATIONS.map((name, idx) => ({ id: `vio_${idx}`, name }));
      localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(vios));
    }
    
    // SEED DUMMY DATA IF EMPTY
    if (!localStorage.getItem(STORAGE_KEYS.AMTS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.AMTS) || '[]').length === 0) {
       this.seedInitialData();
    }
  }

  private seedInitialData() {
    console.log("Seeding Dummy Data...");
    const locs: Location[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCATIONS) || '[]');
    const vios: ViolationType[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.VIOLATIONS) || '[]');
    
    // Helper to get random item
    const rnd = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    
    // 1. Create Dummy AMTs
    const dummyNames = [
        "Budi Santoso", "Agus Pratama", "Dedi Kurniawan", "Eko Prasetyo", "Fajar Nugroho",
        "Guntur Wibowo", "Heri Susanto", "Iwan Setiawan", "Joko Widodo", "Kurniawan Dwi",
        "Lukman Hakim", "Muhammad Rizky", "Nanang Suherman", "Oki Saputra", "Pandu Wijaya",
        "Rian Hidayat", "Slamet Riyadi", "Tono Sutono", "Wahyu Illahi", "Zainal Abidin"
    ];

    const generatedAMTs: AMT[] = dummyNames.map((name, idx) => ({
        id: `amt_seed_${idx}`,
        name: name,
        role: idx % 2 === 0 ? 'AMT 1' : 'AMT 2',
        employeeId: `EPN-${1000 + idx}`,
        locationId: rnd(locs).id
    }));
    
    localStorage.setItem(STORAGE_KEYS.AMTS, JSON.stringify(generatedAMTs));

    // 2. Create Dummy Cases (History & Active)
    const cases: Case[] = [];

    // Case A: Active Blocks (Red) - Indices 0-4
    for(let i=0; i<5; i++) {
        const amt = generatedAMTs[i];
        const vio = rnd(vios);
        const loc = locs.find(l => l.id === amt.locationId);
        cases.push({
            id: `case_blk_${i}`,
            amtId: amt.id,
            amtName: amt.name,
            amtRole: amt.role,
            amtLocation: loc?.name || 'Unknown',
            violationTypeId: vio.id,
            violationName: vio.name,
            status: 'BLOCKED',
            blockDate: new Date(Date.now() - Math.floor(Math.random() * 5) * 86400000).toISOString().split('T')[0], // 0-5 days ago
            notes: "Indikasi pelanggaran terekam sistem."
        });
    }

    // Case B: Unblocked with Active Punishment (Green/Running) - Indices 5-14
    for(let i=5; i<15; i++) {
        const amt = generatedAMTs[i];
        const vio = rnd(vios);
        const loc = locs.find(l => l.id === amt.locationId);
        
        // Random Punishment (Active)
        const levels = [PunishmentLevel.BAP_COACHING, PunishmentLevel.SURAT_TEGURAN, PunishmentLevel.SP1, PunishmentLevel.SP2, PunishmentLevel.SP3];
        const level = rnd(levels);
        const blockDaysAgo = Math.floor(Math.random() * 10) + 1; // Baru saja terjadi
        const unblockDaysAgo = 0; // Hari ini unblock
        
        const blockDate = new Date(Date.now() - blockDaysAgo * 86400000);
        const unblockDate = new Date(Date.now() - unblockDaysAgo * 86400000);
        
        // Calc end date (Future)
        const endDate = new Date(unblockDate);
        endDate.setDate(endDate.getDate() + PUNISHMENT_DURATION_DAYS[level]);

        cases.push({
            id: `case_hist_${i}`,
            amtId: amt.id,
            amtName: amt.name,
            amtRole: amt.role,
            amtLocation: loc?.name || 'Unknown',
            violationTypeId: vio.id,
            violationName: vio.name,
            status: 'UNBLOCKED',
            blockDate: blockDate.toISOString().split('T')[0],
            unblockDate: unblockDate.toISOString().split('T')[0],
            bapDate: unblockDate.toISOString().split('T')[0],
            punishmentLevel: level,
            punishmentEndDate: endDate.toISOString().split('T')[0],
            notes: "BAP Processed via System (Active Punishment)."
        });
    }

    // Case C: PEMUTIHAN (Expired Punishment) - Indices 15-18
    // Kita buat sanksinya Surat Teguran (30 hari) tapi kejadiannya 2 bulan lalu.
    for(let i=15; i<18; i++) {
        const amt = generatedAMTs[i];
        const vio = rnd(vios);
        const loc = locs.find(l => l.id === amt.locationId);
        
        const duration = 30; // Surat Teguran
        const daysAgo = 60; // Kejadian 60 hari lalu
        
        const blockDate = new Date(Date.now() - daysAgo * 86400000);
        const unblockDate = new Date(Date.now() - (daysAgo - 2) * 86400000);
        
        const endDate = new Date(unblockDate);
        endDate.setDate(endDate.getDate() + duration); // Expired sekitar 30 hari lalu

        cases.push({
            id: `case_pemutihan_${i}`,
            amtId: amt.id,
            amtName: amt.name + " (Contoh Pemutihan)", // Penanda visual
            amtRole: amt.role,
            amtLocation: loc?.name || 'Unknown',
            violationTypeId: vio.id,
            violationName: vio.name,
            status: 'UNBLOCKED',
            blockDate: blockDate.toISOString().split('T')[0],
            unblockDate: unblockDate.toISOString().split('T')[0],
            bapDate: unblockDate.toISOString().split('T')[0],
            punishmentLevel: PunishmentLevel.SURAT_TEGURAN,
            punishmentEndDate: endDate.toISOString().split('T')[0],
            notes: "Sanksi telah berakhir. Masuk masa pemutihan."
        });
    }

    // Case D: PHK (Termination) - Index 19
    const phkAmt = generatedAMTs[19];
    const phkLoc = locs.find(l => l.id === phkAmt.locationId);
    cases.push({
        id: `case_phk_1`,
        amtId: phkAmt.id,
        amtName: phkAmt.name,
        amtRole: phkAmt.role,
        amtLocation: phkLoc?.name || 'Unknown',
        violationTypeId: vios.find(v => v.name.includes("Fraud"))?.id || vios[0].id,
        violationName: "Fraud / Pencurian",
        status: 'UNBLOCKED',
        blockDate: '2023-10-01',
        unblockDate: '2023-10-05',
        punishmentLevel: PunishmentLevel.PHK,
        punishmentEndDate: 'Permanent',
        notes: "Pelanggaran berat (Fraud Ownuse). Diputuskan PHK."
    });

    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
  }

  // --- Getters ---
  getLocations(): Location[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCATIONS) || '[]');
  }

  getViolations(): ViolationType[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.VIOLATIONS) || '[]');
  }

  getAMTs(): AMT[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AMTS) || '[]');
  }

  getCases(): Case[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
  }

  // --- Actions ---

  addAMT(name: string, role: string, locationId: string, employeeId?: string): AMT {
    const amts = this.getAMTs();
    const newAMT: AMT = {
      id: `amt_${Date.now()}`,
      name,
      role,
      employeeId: employeeId || `EPN-${Date.now().toString().slice(-4)}`,
      locationId
    };
    amts.push(newAMT);
    localStorage.setItem(STORAGE_KEYS.AMTS, JSON.stringify(amts));
    return newAMT;
  }

  addViolationType(name: string): ViolationType {
    const vios = this.getViolations();
    const newVio = { id: `vio_${Date.now()}`, name, isCustom: true };
    vios.push(newVio);
    localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(vios));
    return newVio;
  }

  deleteViolationType(id: string) {
    const vios = this.getViolations().filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(vios));
  }

  // BLOCK AMT - Updated to accept NOTES
  createBlockCase(amtId: string, violationTypeId: string, blockDate: string, notes?: string): Case {
    const amts = this.getAMTs();
    const vios = this.getViolations();
    const locs = this.getLocations();
    
    const amt = amts.find(a => a.id === amtId);
    const vio = vios.find(v => v.id === violationTypeId);
    const loc = locs.find(l => l.id === amt?.locationId);

    if (!amt || !vio) throw new Error("Invalid AMT or Violation");

    const newCase: Case = {
      id: `case_${Date.now()}`,
      amtId,
      amtName: amt.name,
      amtRole: amt.role,
      amtLocation: loc?.name || 'Unknown',
      violationTypeId,
      violationName: vio.name,
      status: 'BLOCKED',
      blockDate,
      notes: notes || ''
    };

    const cases = this.getCases();
    cases.push(newCase);
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    return newCase;
  }

  // UNBLOCK / BAP
  processUnblock(caseId: string, unblockDate: string, punishmentLevel: PunishmentLevel, notes: string) {
    const cases = this.getCases();
    const idx = cases.findIndex(c => c.id === caseId);
    if (idx === -1) return;

    const duration = PUNISHMENT_DURATION_DAYS[punishmentLevel];
    const endDate = new Date(unblockDate);
    endDate.setDate(endDate.getDate() + duration);

    cases[idx] = {
      ...cases[idx],
      status: 'UNBLOCKED',
      unblockDate,
      bapDate: unblockDate,
      punishmentLevel,
      punishmentEndDate: punishmentLevel === PunishmentLevel.PHK ? 'Permanent' : endDate.toISOString().split('T')[0],
      notes
    };

    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
  }

  updateCase(caseId: string, updates: Partial<Case>) {
    const cases = this.getCases();
    const idx = cases.findIndex(c => c.id === caseId);
    if (idx === -1) return;
    
    cases[idx] = { ...cases[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
  }

  // --- Intelligence ---

  // Determine current active punishment for an AMT to calculate escalation
  getActivePunishment(amtId: string): { level: PunishmentLevel, endDate: string } | null {
    const cases = this.getCases().filter(c => c.amtId === amtId && c.status === 'UNBLOCKED');
    if (cases.length === 0) return null;

    // Sort by unblock date desc
    cases.sort((a, b) => new Date(b.unblockDate!).getTime() - new Date(a.unblockDate!).getTime());
    
    const lastCase = cases[0];
    const today = new Date();
    
    if (lastCase.punishmentLevel === PunishmentLevel.PHK) {
         return { level: PunishmentLevel.PHK, endDate: 'Permanent' };
    }

    const endDate = lastCase.punishmentEndDate ? new Date(lastCase.punishmentEndDate) : new Date(0);

    // FIX LOGIC: Return active only if EndDate >= Today.
    // If EndDate < Today, it means it's expired (Pemutihan), so return null (clean slate).
    if (endDate >= today) {
        return { level: lastCase.punishmentLevel!, endDate: lastCase.punishmentEndDate! };
    }
    
    return null;
  }

  suggestPunishment(amtId: string): PunishmentLevel {
    const active = this.getActivePunishment(amtId);
    // If no active punishment (either never punished or expired/pemutihan), suggest lowest level
    if (!active) return PunishmentLevel.BAP_COACHING; 

    // Escalation logic
    switch(active.level) {
      case PunishmentLevel.BAP_COACHING: return PunishmentLevel.SURAT_TEGURAN;
      case PunishmentLevel.SURAT_TEGURAN: return PunishmentLevel.SP1;
      case PunishmentLevel.SP1: return PunishmentLevel.SP2;
      case PunishmentLevel.SP2: return PunishmentLevel.SP3;
      case PunishmentLevel.SP3: return PunishmentLevel.PHK;
      default: return PunishmentLevel.BAP_COACHING;
    }
  }
}

export const db = new MockDatabase();