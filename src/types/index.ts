export interface Student {
  id: string;
  stt?: number | string;
  name: string;
  gender?: 'Nam' | 'Nữ' | string;
  className?: string;
  note?: string;
  originalIndex: number;
}

export interface Group {
  id: string;
  name: string;
  members: Student[];
  leaderId?: string;
  color?: string;
}

export type GroupMode = 'by_size' | 'by_count';

export type RemainderStrategy = 'new_group' | 'distribute';

export type NamingTheme = 'numeric' | 'colors' | 'planets' | 'animals' | 'vietnam_landmarks';

export interface ShuffleConfig {
  mode: GroupMode;
  sizeOrCount: number; // e.g. 5, 10, 15 or custom number
  balanceGender: boolean;
  remainderStrategy: RemainderStrategy;
  namingTheme: NamingTheme;
}

export interface ShuffleHistoryItem {
  id: string;
  timestamp: number;
  title: string;
  totalStudents: number;
  groupCount: number;
  config: ShuffleConfig;
  groups: Group[];
  originalStudents: Student[];
}
