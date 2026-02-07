export enum PunishmentLevel {
  NONE = 'None',
  BAP_COACHING = 'BAP/Coaching', // Level paling bawah (New)
  SURAT_TEGURAN = 'Surat Teguran', // 1 month
  SP1 = 'SP 1', // 3 months
  SP2 = 'SP 2', // 6 months
  SP3 = 'SP 3', // Final
  PHK = 'PHK' // Termination
}

export interface Location {
  id: string;
  name: string;
}

export interface ViolationType {
  id: string;
  name: string;
  isCustom?: boolean;
}

export interface AMT {
  id: string;
  name: string;
  role: string; // Added role property
  employeeId: string;
  locationId: string;
}

export interface Case {
  id: string;
  amtId: string;
  amtName: string; // Denormalized for display ease
  amtRole?: string; // Denormalized role
  amtLocation: string; // Denormalized
  violationTypeId: string;
  violationName: string; // Denormalized
  status: 'BLOCKED' | 'UNBLOCKED';
  blockDate: string; // ISO String
  unblockDate?: string; // ISO String
  
  // BAP Details
  bapDate?: string;
  punishmentLevel?: PunishmentLevel;
  punishmentEndDate?: string; // Calculated based on level duration
  notes?: string;
}

export const PUNISHMENT_DURATION_DAYS: Record<PunishmentLevel, number> = {
  [PunishmentLevel.NONE]: 0,
  [PunishmentLevel.BAP_COACHING]: 30, // Assuming 30 days monitoring for coaching
  [PunishmentLevel.SURAT_TEGURAN]: 30,
  [PunishmentLevel.SP1]: 90,
  [PunishmentLevel.SP2]: 180,
  [PunishmentLevel.SP3]: 0, // Indefinite warning until next check
  [PunishmentLevel.PHK]: 0 // Permanent
};