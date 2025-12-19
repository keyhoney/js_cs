
import { RulesData, ScoreTableData, ExcelRow, ConversionTableData } from "./types";

export const APP_VERSION = "2026.12.17";
export const STORAGE_KEY_STUDENTS = "jeongsi_students_v1";
export const SECRET_KEY = "honey"; // User Login Key
// New: Key for obfuscating JSON data. Must match the key in scripts/encrypt.cjs
export const DATA_KEY = "HoneyCounseling2025!@#Secure"; 

export const RULE_URL = `${import.meta.env.BASE_URL}data/univ_rules.json`; 
export const SCORE_TABLE_URL = `${import.meta.env.BASE_URL}data/score_table.json`;
export const ADMISSION_URL = `${import.meta.env.BASE_URL}data/admission_data.json`;
export const CONVERSION_TABLE_URL = `${import.meta.env.BASE_URL}data/conversion_table.json`;

// Subject Options
export const SUBJECT_OPTS_KOR = ["화법과작문", "언어와매체"];
export const SUBJECT_OPTS_MATH = ["기하", "미적분", "확률과통계"];
export const SUBJECT_OPTS_EXP = [
  "경제", "동아시아사", "사회문화", "생활과윤리", "세계사", "세계지리", 
  "윤리와사상", "정치와법", "한국지리", 
  "물리학1", "화학1", "생명과학1", "지구과학1", 
  "물리학2", "화학2", "생명과학2", "지구과학2"
];

// Fallback empty data structures (Used only if JSON fetch fails)
export const DEFAULT_SCORE_TABLE: ScoreTableData = {
  version: "2025.SAT.Fallback",
  tables: {}
};

export const DEFAULT_RULES: RulesData = {
  version: "2025.1-Fallback",
  rules: {}
};

export const DEFAULT_ADMISSION_DATA: ExcelRow[] = [];

export const DEFAULT_CONVERSION_TABLE: ConversionTableData = {
    version: "2025.Conversion.Fallback",
    tables: {}
};
