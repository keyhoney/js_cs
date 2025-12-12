import { RulesData, ScoreTableData } from "./types";

export const APP_VERSION = "2025.2.0";
export const STORAGE_KEY_STUDENTS = "jeongsi_students_v1";
export const RULE_URL = "/data/univ_rules.json"; 
export const SCORE_TABLE_URL = "/data/score_table.json";

// Mock Score Table (Standard Score -> Percentile/Grade)
// In reality, this would contain all scores (0~140+). Here we mock a range around the demo values.
const generateMockTable = () => {
  const table: Record<number, { std: number, pct: number, grade: number }> = {};
  for (let i = 0; i <= 200; i++) {
    // Rough approximation for demo: Higher score = Higher percentile
    // Pct ~= (Score / 145) * 100 (Clamped)
    let pct = Math.min(99, Math.max(0, (i - 60) * 1.2));
    let grade = 9;
    if (pct >= 96) grade = 1;
    else if (pct >= 89) grade = 2;
    else if (pct >= 77) grade = 3;
    else if (pct >= 60) grade = 4;
    else if (pct >= 40) grade = 5;
    
    table[i] = { std: i, pct: parseFloat(pct.toFixed(1)), grade };
  }
  return table;
};

export const DEFAULT_SCORE_TABLE: ScoreTableData = {
  version: "2025.SAT.Final",
  tables: {
    kor: generateMockTable(),
    math: generateMockTable(),
    exp: generateMockTable(), // Shared for all exploration subjects for demo
  }
};

export const DEFAULT_RULES: RulesData = {
  version: "2025.1-Advanced",
  rules: {
    "한국대학교": {
      formulas: [
        {
          id: "std_general",
          label: "일반전형(표점)",
          type: "standard",
          weights: { kor: 1.0, math: 1.2, eng: 0, exp: 0.8 },
          english_table: [100, 95, 90, 85, 80, 70, 60, 50, 0], // Add points
          history_table: [10, 10, 10, 9, 9, 8, 8, 7, 5]
        }
      ]
    },
    "서울미래대": {
      formulas: [
        {
          id: "std_heavy_math",
          label: "공학계열(수학집중)",
          type: "standard",
          weights: { kor: 0.8, math: 1.5, eng: 0, exp: 1.0 },
          english_table: [200, 190, 180, 170, 160, 150, 140, 130, 100],
          history_table: [0, 0, 0, 0, 0, 0, 0, 0, 0] 
        }
      ]
    },
    "경기기술대": {
      formulas: [
        {
          id: "pct_balanced",
          label: "일반전형(백분위)",
          type: "percentile",
          weights: { kor: 1.0, math: 1.0, eng: 0, exp: 1.0 },
          english_table: [10, 9, 8, 7, 6, 5, 4, 3, 0], 
          history_table: [5, 5, 5, 4, 4, 3, 3, 2, 1]
        }
      ]
    },
    "변환대학교": {
      // Example of A/B selection: Standard Score vs Percentile
      formulas: [
        {
          id: "type_a",
          label: "A형(표준점수)",
          type: "standard",
          weights: { kor: 1.0, math: 1.0, eng: 0, exp: 1.0 },
          english_table: [10, 8, 6, 4, 2, 0, -2, -4, -6], // Deduction example
          history_table: [10, 10, 10, 10, 10, 10, 10, 10, 10]
        },
        {
          id: "type_b",
          label: "B형(백분위)",
          type: "percentile",
          weights: { kor: 1.2, math: 0.8, eng: 0, exp: 1.0 },
          english_table: [20, 18, 16, 14, 12, 10, 8, 6, 4], 
          history_table: [0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
      ]
    }
  }
};

export const MOCK_EXCEL_DATA = [
  { univName: "한국대학교", deptName: "컴퓨터공학과", group: "가", cutoff: 510.5 },
  { univName: "한국대학교", deptName: "경영학과", group: "가", cutoff: 505.2 },
  { univName: "서울미래대", deptName: "전자공학과", group: "나", cutoff: 520.0 },
  { univName: "경기기술대", deptName: "AI소프트웨어", group: "다", cutoff: 380.0 },
  { univName: "변환대학교", deptName: "자율전공", group: "다", cutoff: 400.0 }, // Supports A/B logic
];
