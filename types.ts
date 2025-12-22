
export type Subject = 'kor' | 'math' | 'eng' | 'hist' | 'exp1' | 'exp2';

export interface StudentScores {
  kor: number; // Standard Score
  math: number; // Standard Score
  eng: number; // Grade (1-9)
  hist: number; // Grade (1-9)
  exp1: number; // Standard Score
  exp2: number; // Standard Score
}

export interface StudentOptionalSubjects {
    kor: string;
    math: string;
    exp1: string;
    exp2: string;
}

export interface Student {
  id: string;
  name: string;
  classNum?: number;   // New: 반
  studentNum?: number; // New: 번호
  subjectOptions?: StudentOptionalSubjects; // New: 선택 과목
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
  // key: 'kor' | 'math' | 'exp' or specific subject name
  // value: Record<StandardScore, ScoreMeta>
  tables: Record<string, Record<number, ScoreMeta>>; 
}

// New: Conversion Table Structure
export interface ConversionTable {
    // Key: Subject Name (e.g. "물리1") or "default"
    // Value: Record<Percentile(string), Score(number)>
    [subjectName: string]: Record<number, number>;
}

export interface ConversionTableData {
    version: string;
    // Key: Table ID defined in univ_rules.json (e.g., "univ_A_natural")
    tables: Record<string, ConversionTable>; 
}

// Bonus Configuration Structure
export interface BonusConfig {
    subjects: string[]; // List of subject names (e.g., ["미적분", "기하"])
    ratio: number;      // Multiplier (e.g., 0.05 for 5% bonus)
}

// Advanced Rule Structure
export interface ScoringFormula {
  id: string; // Matched with ExcelRow.scoringClass
  label: string; // e.g., "인문계열(표점)", "자연계열(표점)"
  /**
   * standard: Use Standard Score directly
   * percentile: Use Percentile directly
   * mixed_converted: Kor/Math use Standard, Exp uses Conversion Table based on Percentile
   * normalized_std: Use Standard Score / Max Standard Score of the subject
   */
  type: 'standard' | 'percentile' | 'mixed_converted' | 'normalized_std'; 

  baseScore?: number; // Added for CBNU (e.g., 800 base score)
  
  weights: {
    kor: number;
    math: number;
    eng: number; // Weight multiplier
    exp: number; 
  };
  // Tables for Add/Deduct logic. 
  english_table: number[]; 
  history_table: number[]; 
  
  // New: Reference ID for the external conversion table file
  conversion_table_id?: string;

  // New: Bonus logic for specific subjects (applied to raw score before weight)
  bonus?: {
    math?: BonusConfig;
    exp?: BonusConfig;
  };
  
  // New: Bonus application type
  // - pknu_additive: 부경대 방식(표준점수 * 비율)을 "추가 점수"로 더함
  bonusType?: 'pknu_additive';

  // New: Subject Restrictions (e.g. Must take Geometry)
  restrictions?: {
      math?: string[]; // Allowed math subjects
      exp?: string[]; // Allowed exp subjects
      expCount?: number; // How many from the allowed list are required (usually 2)
  };
  
  // New: Minimum Grade Requirement (Choijeo)
  minGradeRequirement?: {
      type: 'sum_math_exp_avg_trunc'; // Logic: Math + floor(avg(exp1, exp2)) <= limit
      limit: number;
  };
  
  // New: Special calculation rules
  specialRule?: 'math_or_exp_better' | 'max_of_language_and_math' | 'top_n_subjects' | 'top_kor_math' | 'max_of_two_formulas' | 'max_of_humanities_natural' | 'exp_top1';
  
  // Configuration for special rules (optional)
  specialRuleConfig?: {
    // For top_n_subjects: { n: 3, ratios: [0.4, 0.35, 0.25], subjects: ['kor', 'math', 'eng', 'exp'] }
    topN?: { n: number; ratios: number[]; subjects: string[] };
    // For top_kor_math: { korRatio: 0.35, mathRatio: 0.25, engRatio: 0.2, expRatio: 0.2, mathBonus?: number }
    topKorMath?: { korRatio: number; mathRatio: number; engRatio: number; expRatio: number; mathBonus?: number };
    // For max_of_two_formulas: { formulaA: string, formulaB: string }
    twoFormulas?: { formulaA: string; formulaB: string };
    // For max_of_humanities_natural: { humanitiesFormula: string, naturalFormula: string }
    humanitiesNatural?: { humanitiesFormula: string; naturalFormula: string };
  };
}

export interface UnivRule {
  // List of available formulas for the university
  formulas: ScoringFormula[];
}

export interface RulesData {
  version: string;
  rules: Record<string, UnivRule>;
}

export interface ExcelRow {
  univName: string;
  deptName: string;
  scoringClass: string; // The specific formula ID to use (e.g. "type_a", "eng_heavy")
  group: string; 
  // New: 3-tier cutoffs
  recruitmentCount: number; // 최초 모집 인원 (deprecated, initialRecruitmentCount 사용)
  initialRecruitmentCount: number; // 최초 모집 인원
  earlyAdmissionCarryover: number; // 수시 이월 모집 인원
  finalRecruitmentCount: number; // 최종 모집 인원 (initialRecruitmentCount + earlyAdmissionCarryover)
  lastYearCompetitionRate: number; // 전년도 경쟁률
  safeCut: number;   // 안정 점수
  matchCut: number;  // 소신 점수
  upwardCut: number; // 상향 점수
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
  scoringClass: string; // To track which formula was used
  group: string;
  recruitmentCount: number; // 최초 모집인원 (deprecated, initialRecruitmentCount 사용)
  initialRecruitmentCount: number; // 최초 모집 인원
  earlyAdmissionCarryover: number; // 수시 이월 모집 인원
  finalRecruitmentCount: number; // 최종 모집 인원
  lastYearCompetitionRate: number; // 전년도 경쟁률
  myScore: number;
  safeCut: number;
  matchCut: number;
  upwardCut: number;
  diff: number; // Absolute difference from Match Cut
  gapPercent: number; // Percentage difference from Match Cut (better for sorting across different total scores)
  status: 'safe' | 'match' | 'upward' | 'danger';
  formulaLabel: string; 
}
