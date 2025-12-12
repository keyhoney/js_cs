import { Student, UnivRule, ExcelRow, AnalysisResult, ScoreDetail, ScoreTableData, ScoringFormula } from "../types";

/**
 * Retrieves the score metric (Standard Score or Percentile) for a subject.
 */
const getSubjectValue = (
  mode: 'standard' | 'percentile',
  subjectKey: 'kor' | 'math' | 'exp',
  stdScore: number,
  scoreTable: ScoreTableData
): number => {
  if (mode === 'standard') return stdScore;
  
  // Percentile Lookup
  // Fallback to table 'exp' for exp1/exp2 if specific tables aren't present
  const table = scoreTable.tables[subjectKey] || scoreTable.tables['exp'];
  if (!table || !table[stdScore]) {
    // Fallback if data missing: Estimate or return 0
    console.warn(`Missing score table data for ${subjectKey} score ${stdScore}`);
    return 0; 
  }
  return table[stdScore].pct;
};

/**
 * Calculates score for a single formula.
 */
const calculateSingleFormula = (
  student: Student, 
  formula: ScoringFormula, 
  scoreTable: ScoreTableData
): ScoreDetail => {
  const { scores } = student;
  const { type, weights, english_table, history_table, label } = formula;

  // 1. Get Values (Standard or Percentile)
  const korVal = getSubjectValue(type, 'kor', scores.kor, scoreTable);
  const mathVal = getSubjectValue(type, 'math', scores.math, scoreTable);
  const exp1Val = getSubjectValue(type, 'exp', scores.exp1, scoreTable);
  const exp2Val = getSubjectValue(type, 'exp', scores.exp2, scoreTable);
  const expValSum = exp1Val + exp2Val;

  // 2. Apply Weights
  const korCalc = korVal * weights.kor;
  const mathCalc = mathVal * weights.math;
  const expCalc = expValSum * weights.exp; // (Sub1 + Sub2) * Weight

  // 3. Additive Points (English / History)
  // Grade 1 is index 0
  const engIdx = Math.max(0, Math.min(scores.eng - 1, english_table.length - 1));
  const engScore = english_table[engIdx] || 0;

  const histIdx = Math.max(0, Math.min(scores.hist - 1, history_table.length - 1));
  const histScore = history_table[histIdx] || 0;

  const total = korCalc + mathCalc + expCalc + engScore + histScore;

  return {
    formulaLabel: label,
    kor: { raw: korVal, weight: weights.kor, calc: korCalc },
    math: { raw: mathVal, weight: weights.math, calc: mathCalc },
    exp: { raw: expValSum, weight: weights.exp, calc: expCalc },
    eng: { grade: scores.eng, score: engScore },
    hist: { grade: scores.hist, score: histScore },
    total: parseFloat(total.toFixed(2))
  };
};

/**
 * Calculates the BEST conversion score for a specific university.
 * Iterates through all available formulas and picks the highest score.
 */
export const calculateBestUnivScore = (
  student: Student, 
  rule: UnivRule, 
  scoreTable: ScoreTableData
): ScoreDetail => {
  let bestDetail: ScoreDetail | null = null;
  let maxScore = -Infinity;

  for (const formula of rule.formulas) {
    const detail = calculateSingleFormula(student, formula, scoreTable);
    if (detail.total > maxScore) {
      maxScore = detail.total;
      bestDetail = detail;
    }
  }

  if (!bestDetail) {
    throw new Error("No calculation formula available");
  }

  return bestDetail;
};

export const calculateScoreDetails = calculateBestUnivScore; // Alias for compatibility

/**
 * Analyzes admission probability using the best formula.
 */
export const analyzeAdmission = (
  student: Student,
  rows: ExcelRow[],
  rules: Record<string, UnivRule>,
  scoreTable: ScoreTableData
): AnalysisResult[] => {
  return rows.map((row) => {
    const rule = rules[row.univName];
    
    if (!rule) {
      return {
        ...row,
        myScore: 0,
        diff: 0,
        status: 'risk',
        formulaLabel: '데이터 없음'
      };
    }

    const bestResult = calculateBestUnivScore(student, rule, scoreTable);
    const diff = parseFloat((bestResult.total - row.cutoff).toFixed(2));

    let status: 'safe' | 'match' | 'risk' = 'risk';
    if (diff >= 5) status = 'safe';
    else if (diff >= -2) status = 'match';
    
    return {
      univName: row.univName,
      deptName: row.deptName,
      group: row.group,
      cutoff: row.cutoff,
      myScore: bestResult.total,
      diff,
      status,
      formulaLabel: bestResult.formulaLabel
    };
  });
};
