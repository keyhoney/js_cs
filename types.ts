export type Subject = 'kor' | 'math' | 'eng' | 'hist' | 'exp1' | 'exp2';

export interface StudentScores {
  kor: number; // Standard Score
  math: number; // Standard Score
  eng: number; // Grade (1-9)
  hist: number; // Grade (1-9)
  exp1: number; // Standard Score
  exp2: number; // Standard Score
}

export interface Student {
  id: string;
  name: string;
  scores: StudentScores;
}

// Score Lookup Table Structure
export interface ScoreMeta {
  std: number; // Standard Score
  pct: number; // Percentile (0-100)
  grade: number; // Grade (1-9)
}

export interface ScoreTableData {
  version: string;
  // key: 'kor' | 'math' | 'exp'
  // value: Record<StandardScore, ScoreMeta>
  tables: Record<string, Record<number, ScoreMeta>>; 
}

// Advanced Rule Structure
export interface ScoringFormula {
  id: string; // e.g., "type_a", "type_b"
  label: string; // e.g., "표준점수형", "백분위형"
  type: 'standard' | 'percentile'; 
  weights: {
    kor: number;
    math: number;
    eng: number; // Weight multiplier (if 0, typically uses add/deduct table)
    exp: number; 
  };
  // Tables for Add/Deduct logic. 
  // Positive values = Add points, Negative values = Deduct points.
  english_table: number[]; 
  history_table: number[]; 
}

export interface UnivRule {
  // A university can have multiple calculation methods (strategies).
  // The system will pick the best score among them.
  formulas: ScoringFormula[];
}

export interface RulesData {
  version: string;
  rules: Record<string, UnivRule>;
}

export interface ExcelRow {
  univName: string;
  deptName: string;
  group: string; 
  cutoff: number; 
}

export interface SubjectDetail {
  raw: number; // The raw value used (Std or Pct)
  weight: number;
  calc: number;
}

export interface ScoreDetail {
  formulaLabel: string; // Which formula was used
  kor: SubjectDetail;
  math: SubjectDetail;
  exp: SubjectDetail;
  eng: { grade: number; score: number };
  hist: { grade: number; score: number };
  total: number;
}

export interface AnalysisResult {
  univName: string;
  deptName: string;
  group: string;
  myScore: number;
  cutoff: number;
  diff: number;
  status: 'safe' | 'match' | 'risk';
  formulaLabel: string; // To show which method was optimal
}

// History Tracking Types
export interface CounselingSession {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: Date;
  scores: StudentScores;
  results: AnalysisResult[];
  notes?: string;
}

export interface ScoreChangeHistory {
  id: string;
  studentId: string;
  timestamp: Date;
  oldScores: StudentScores;
  newScores: StudentScores;
  changedFields: (keyof StudentScores)[];
}
