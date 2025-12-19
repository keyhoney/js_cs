
import { Student, UnivRule, ExcelRow, AnalysisResult, ScoreDetail, ScoreTableData, ScoringFormula, ConversionTableData } from "../types";

/**
 * [기능 설명] 특정 과목의 최대 표준점수를 가져오는 함수
 * 
 * 어떤 일을 하나요?
 * - 점수표(score_table.json)에서 해당 과목의 가장 높은 표준점수를 찾아서 반환합니다.
 * 
 * 왜 필요한가요?
 * - 일부 대학은 "정규화된 표준점수" 방식을 사용합니다.
 * - 이 방식은 (내 점수 / 최대 점수)로 계산하므로 최대 점수가 필요합니다.
 * - 예: 내가 80점이고 최대가 100점이면 0.8이 됩니다.
 * 
 * @param tableName - 과목 이름 (예: "국어", "수학", "물리학1" 등)
 * @param scoreTable - 점수표 데이터 전체
 * @returns 해당 과목의 최대 표준점수 (찾지 못하면 100 반환)
 */
const getMaxStdScore = (tableName: string, scoreTable: ScoreTableData): number => {
    // 점수표에서 해당 과목의 표를 찾습니다
    const table = scoreTable.tables[tableName];
    
    if (!table) {
        // 표를 찾지 못한 경우 처리
        // 탐구 과목의 경우 'exp'라는 일반 표를 사용할 수 있습니다
        if (tableName !== '국어' && tableName !== '수학' && scoreTable.tables['exp']) {
            const keys = Object.keys(scoreTable.tables['exp']).map(Number);
            return Math.max(...keys);
        }
        // 완전히 찾지 못하면 안전을 위해 100을 반환 (0으로 나누는 것을 방지)
        return 100;
    }
    
    // 표에서 모든 점수 키를 숫자로 변환하고 그 중 최대값을 찾습니다
    const keys = Object.keys(table).map(Number);
    return Math.max(...keys);
};

/**
 * [기능 설명] 특정 과목의 표준점수에 해당하는 백분위를 가져오는 함수
 * 
 * 어떤 일을 하나요?
 * - 학생의 표준점수를 입력받아서, 그 점수에 해당하는 백분위를 찾아 반환합니다.
 * - 백분위는 0~100 사이의 값으로, 내가 상위 몇 %인지를 나타냅니다.
 * - 예: 백분위 95 = 상위 5% = 하위 95%보다 높은 점수
 * 
 * 왜 필요한가요?
 * - 일부 대학은 백분위를 사용하여 점수를 계산합니다.
 * - 표준점수는 직접 사용하지 않고 백분위로 변환해서 사용합니다.
 * 
 * @param tableName - 과목 이름 (예: "국어", "수학", "물리학1" 등)
 * @param stdScore - 학생의 표준점수
 * @param scoreTable - 점수표 데이터 전체
 * @returns 해당 표준점수의 백분위 (0~100, 찾지 못하면 0)
 */
const getPercentile = (tableName: string, stdScore: number, scoreTable: ScoreTableData): number => {
    // 점수표에서 해당 과목의 표를 찾습니다
    const table = scoreTable.tables[tableName];
    
    if (!table) {
        // 표를 찾지 못한 경우 처리
        // 탐구 과목의 경우 'exp'라는 일반 표를 사용할 수 있습니다
        if (tableName !== '국어' && tableName !== '수학' && scoreTable.tables['exp']) {
             const fallbackEntry = scoreTable.tables['exp'][stdScore];
             return fallbackEntry ? fallbackEntry.pct : 0;
        }
        return 0;
    }
    
    // 표에서 해당 표준점수의 백분위 값을 찾아 반환합니다
    return table[stdScore]?.pct || 0;
};

/**
 * [기능 설명] 특정 과목의 표준점수에 해당하는 등급을 가져오는 함수
 * 
 * 어떤 일을 하나요?
 * - 학생의 표준점수를 입력받아서, 그 점수에 해당하는 등급을 찾아 반환합니다.
 * - 등급은 1등급(최고)부터 9등급(최저)까지 있습니다.
 * 
 * 왜 필요한가요?
 * - 일부 대학은 수능최저학력기준(최저)을 적용합니다.
 * - 예: "수학 2등급 이내, 탐구 2과목 평균 3등급 이내" 같은 조건을 확인할 때 사용합니다.
 * 
 * @param tableName - 과목 이름 (예: "국어", "수학", "물리학1" 등)
 * @param stdScore - 학생의 표준점수
 * @param scoreTable - 점수표 데이터 전체
 * @returns 해당 표준점수의 등급 (1~9, 찾지 못하면 9등급 반환)
 */
const getGrade = (tableName: string, stdScore: number, scoreTable: ScoreTableData): number => {
    // 점수표에서 해당 과목의 표를 찾습니다
    const table = scoreTable.tables[tableName];
    
    // 표를 찾지 못하거나 등급 정보가 없으면 최악의 등급인 9등급을 반환합니다
    if (!table) return 9;
    
    // 표에서 해당 표준점수의 등급 값을 찾아 반환합니다
    return table[stdScore]?.grade || 9;
}

/**
 * [기능 설명] 대학별 공식에 따라 과목별 점수를 계산하는 함수
 * 
 * 어떤 일을 하나요?
 * - 대학마다 점수를 계산하는 방식이 다릅니다.
 * - 이 함수는 대학의 공식 타입에 따라 표준점수, 백분위, 변환점수 등을 계산합니다.
 * 
 * 공식 타입 종류:
 * 1. 'standard': 표준점수를 그대로 사용 (가장 단순한 방식)
 * 2. 'percentile': 표준점수를 백분위로 변환해서 사용
 * 3. 'mixed_converted': 국어/수학은 표준점수, 탐구는 변환표를 통해 변환된 점수 사용
 * 4. 'normalized_std': 정규화된 표준점수 (내 점수 / 최대 점수) 사용
 * 
 * @param subject - 과목 구분 ('kor': 국어, 'math': 수학, 'exp': 탐구)
 * @param tableName - 실제 과목 이름 (예: "물리학1", "화학2" 등) 또는 일반적인 "exp"
 * @param stdScore - 학생의 표준점수
 * @param formula - 대학의 점수 계산 공식 정보
 * @param scoreTable - 점수표 데이터 (표준점수 → 백분위/등급 변환표)
 * @param conversionTable - 변환표 데이터 (탐구 과목별 변환표준점수표)
 * @returns 계산된 점수 값
 */
const calculateSubjectValue = (
    subject: 'kor' | 'math' | 'exp',
    tableName: string, // Actual subject name (e.g. "물리1") or generic "exp"
    stdScore: number,
    formula: ScoringFormula,
    scoreTable: ScoreTableData,
    conversionTable: ConversionTableData | null
): number => {
    // 1. 표준점수 그대로 사용하는 방식
    // 예: 내 표준점수가 80점이면 80점 그대로 사용
    if (formula.type === 'standard') {
        return stdScore;
    }

    // 2. 백분위로 변환해서 사용하는 방식
    // 예: 내 표준점수 80점이 백분위 95%에 해당하면 95를 사용
    if (formula.type === 'percentile') {
        return getPercentile(tableName, stdScore, scoreTable);
    }

    // 3. 혼합 변환 방식 (국어/수학은 표준점수, 탐구는 변환표 사용)
    // 예: 국어는 표준점수 80점 그대로, 탐구는 백분위를 변환표를 통해 변환된 점수 사용
    if (formula.type === 'mixed_converted') {
        if (subject === 'exp') {
            // 탐구 과목인 경우: 먼저 백분위를 구하고, 변환표를 통해 변환
            const pct = getPercentile(tableName, stdScore, scoreTable);
            
            // 변환표가 없으면 백분위를 그대로 사용
            if (!formula.conversion_table_id || !conversionTable) {
                console.warn("Missing conversion table data for mixed_converted formula");
                return pct;
            }

            // 변환표 그룹 찾기
            const tableGroup = conversionTable.tables[formula.conversion_table_id];
            if (!tableGroup) {
                 console.warn(`Conversion table ID '${formula.conversion_table_id}' not found`);
                 return pct;
            }

            // 특정 과목 이름으로 먼저 찾고, 없으면 'default' 사용
            const map = tableGroup[tableName] || tableGroup['default'];
            if (!map) {
                return pct;
            }

            // 백분위를 정수로 반올림해서 변환표에서 찾기
            const roundedPct = Math.round(pct);
            return map[roundedPct] ?? pct;
        }
        // 국어/수학은 표준점수 그대로 사용
        return stdScore;
    }

    // 4. 정규화된 표준점수 방식 (내 점수 / 최대 점수)
    // 예: 내가 80점, 최대가 100점이면 0.8을 사용
    if (formula.type === 'normalized_std') {
        const maxScore = getMaxStdScore(tableName, scoreTable);
        return maxScore > 0 ? (stdScore / maxScore) : 0;
    }

    // 알 수 없는 공식 타입이면 0 반환
    return 0;
};

/**
 * [기능 설명] 학생이 대학의 응시 조건과 수능최저학력기준을 만족하는지 확인하는 함수
 * 
 * 어떤 일을 하나요?
 * - 대학마다 특정 과목을 필수로 응시해야 하거나, 최저 등급 조건이 있습니다.
 * - 이 함수는 학생이 그 조건들을 만족하는지 확인합니다.
 * - 조건을 만족하지 못하면 불합격 처리됩니다.
 * 
 * 확인하는 조건들:
 * 1. 과목 제한: 특정 과목을 응시했는지 확인
 *    - 예: "수학은 미적분만 인정", "탐구는 과학탐구 2과목 필수"
 * 2. 수능최저학력기준: 최소 등급 조건을 만족하는지 확인
 *    - 예: "수학 2등급 이내 + 탐구 평균 3등급 이내"
 * 
 * @param student - 학생 정보 (점수, 선택과목 등)
 * @param formula - 대학의 점수 계산 공식 (제한 조건 포함)
 * @param scoreTable - 점수표 데이터 (등급 확인용)
 * @returns { valid: true/false, reason?: "실패 이유" }
 */
const checkRestrictions = (
    student: Student, 
    formula: ScoringFormula, 
    scoreTable: ScoreTableData
): { valid: boolean; reason?: string } => {
    const { subjectOptions, scores } = student;
    
    // 학생의 선택과목 정보가 없으면 불합격
    if (!subjectOptions) return { valid: false, reason: "선택과목 정보 없음" };

    // 1. 과목 제한 조건 확인
    if (formula.restrictions) {
        // 수학 과목 제한 확인
        // 예: "미적분만 인정"인데 학생이 "기하"를 선택했다면 불합격
        if (formula.restrictions.math) {
            if (!formula.restrictions.math.includes(subjectOptions.math)) {
                return { valid: false, reason: `수학 필수 응시 조건 미충족 (${formula.restrictions.math.join(', ')})` };
            }
        }

        // 탐구 과목 제한 확인
        // 예: "과학탐구 2과목 필수"인데 학생이 사회탐구만 선택했다면 불합격
        if (formula.restrictions.exp && formula.restrictions.expCount) {
            let matchCount = 0;
            // 탐구1과목이 허용된 과목 목록에 있는지 확인
            if (formula.restrictions.exp.includes(subjectOptions.exp1)) matchCount++;
            // 탐구2과목이 허용된 과목 목록에 있는지 확인
            if (formula.restrictions.exp.includes(subjectOptions.exp2)) matchCount++;
            
            // 필요한 과목 수보다 적으면 불합격
            if (matchCount < formula.restrictions.expCount) {
                return { valid: false, reason: `탐구 필수 응시 조건 미충족 (과학탐구 2과목 등)` };
            }
        }
    }

    // 2. 수능최저학력기준 확인 (최저)
    if (formula.minGradeRequirement) {
        const { type, limit } = formula.minGradeRequirement;
        
        // 경북대 모바일공학과 방식: 수학 등급 + 탐구 평균 등급 <= 기준값
        // 예: 수학 2등급 + 탐구 평균 3등급 = 5, 기준이 5 이하면 합격
        if (type === 'sum_math_exp_avg_trunc') {
            // 수학 등급 가져오기
            const mathGrade = getGrade('수학', scores.math, scoreTable);
            
            // 탐구1, 탐구2 등급 가져오기
            const exp1Name = subjectOptions.exp1;
            const exp2Name = subjectOptions.exp2;
            const exp1Grade = getGrade(exp1Name, scores.exp1, scoreTable);
            const exp2Grade = getGrade(exp2Name, scores.exp2, scoreTable);
            
            // 탐구 평균 등급 계산 (소수점 버림)
            const expAvg = Math.floor((exp1Grade + exp2Grade) / 2);
            // 수학 등급 + 탐구 평균 등급
            const sum = mathGrade + expAvg;
            
            // 기준값을 초과하면 불합격
            if (sum > limit) {
                return { 
                    valid: false, 
                    reason: `수능최저 미충족 (수학${mathGrade} + 과탐평균${expAvg} = ${sum}, 기준 ${limit})` 
                };
            }
        }
    }

    // 모든 조건을 만족하면 합격
    return { valid: true };
};

/**
 * [기능 설명] 하나의 점수 계산 공식을 사용하여 학생의 최종 점수를 계산하는 핵심 함수
 * 
 * 어떤 일을 하나요?
 * - 학생의 점수와 대학의 공식을 받아서 최종 환산 점수를 계산합니다.
 * - 단계별로:
 *   1. 응시 조건 확인 (불합격이면 0점 반환)
 *   2. 각 과목별 점수 계산 (표준점수 → 공식에 맞는 값으로 변환)
 *   3. 가산점 적용 (특정 과목 선택 시 추가 점수)
 *   4. 가중치 적용 (과목별 반영 비율)
 *   5. 특수 규칙 적용 (예: 수학/탐구 중 유리한 쪽만 반영)
 *   6. 영어/한국사 점수 계산
 *   7. 최종 점수 합산
 * 
 * @param student - 학생 정보 (점수, 선택과목 등)
 * @param formula - 대학의 점수 계산 공식
 * @param scoreTable - 점수표 데이터
 * @param conversionTable - 변환표 데이터
 * @returns 계산된 상세 점수 정보 (과목별 점수, 가중치, 최종 점수 등)
 */
const calculateSingleFormula = (
  student: Student, 
  formula: ScoringFormula, 
  scoreTable: ScoreTableData,
  conversionTable: ConversionTableData | null
): ScoreDetail => {
  // 0단계: 응시 조건 확인
  // 학생이 대학의 필수 과목 조건이나 최저 등급 조건을 만족하는지 확인
  const restrictionResult = checkRestrictions(student, formula, scoreTable);
  if (!restrictionResult.valid) {
      // 조건을 만족하지 못하면 불합격 처리 (0점 반환)
      return {
          formulaLabel: `[불합격] ${restrictionResult.reason}`,
          kor: { raw: 0, weight: 0, calc: 0 },
          math: { raw: 0, weight: 0, calc: 0 },
          exp: { raw: 0, weight: 0, calc: 0 },
          eng: { grade: student.scores.eng, score: 0 },
          hist: { grade: student.scores.hist, score: 0 },
          total: 0
      };
  }

  // 학생 정보와 공식 정보 가져오기
  const { scores, subjectOptions } = student;
  const { weights, english_table, history_table, label, bonus, restrictions } = formula;
  // 보너스 타입 확인 (일부 대학은 가산점을 다르게 적용)
  const bonusType = (formula as unknown as { bonusType?: string }).bonusType;

  // 점수표에서 사용할 과목 키 결정
  // 점수표는 한글 키를 사용하므로 '국어', '수학'으로 설정
  const korTableKey = '국어'; 
  const mathTableKey = '수학';
  const exp1TableKey = subjectOptions?.exp1 || 'exp';
  const exp2TableKey = subjectOptions?.exp2 || 'exp';

  // 1단계: 각 과목별 점수 계산
  // 표준점수를 대학 공식에 맞게 변환 (표준점수 그대로, 백분위, 변환점수 등)
  let korVal = calculateSubjectValue('kor', korTableKey, scores.kor, formula, scoreTable, conversionTable);
  let mathVal = calculateSubjectValue('math', mathTableKey, scores.math, formula, scoreTable, conversionTable);
  let exp1Val = calculateSubjectValue('exp', exp1TableKey, scores.exp1, formula, scoreTable, conversionTable);
  let exp2Val = calculateSubjectValue('exp', exp2TableKey, scores.exp2, formula, scoreTable, conversionTable);

  // 2단계: 가산점 적용
  // 일부 대학은 특정 과목을 선택하면 추가 점수를 줍니다
  // 예: "미적분 선택 시 5% 가산점", "물리학2 선택 시 3% 가산점"
  let mathBonusVal = 0;
  let expBonusVal = 0;

  if (bonusType === 'pknu_additive') {
    // 부경대 방식: 가산점을 "추가 점수"로 별도 계산
    // - 기본 점수는 그대로 두고, 가산점만 따로 계산해서 나중에 더함
    if (bonus?.math && subjectOptions?.math && bonus.math.subjects.includes(subjectOptions.math)) {
      // 수학 가산점 = 표준점수 × 가산 비율
      mathBonusVal = scores.math * bonus.math.ratio;
    }

    if (bonus?.exp) {
      // 탐구1 가산점 계산
      if (subjectOptions?.exp1 && bonus.exp.subjects.includes(subjectOptions.exp1)) {
        // 부경대 방식: II 과목(물리학2 등)은 5%, I 과목(물리학1 등)은 3%
        const ratio = subjectOptions.exp1.includes('2') ? 0.05 : 0.03;
        expBonusVal += scores.exp1 * ratio;
      }
      // 탐구2 가산점 계산
      if (subjectOptions?.exp2 && bonus.exp.subjects.includes(subjectOptions.exp2)) {
        const ratio = subjectOptions.exp2.includes('2') ? 0.05 : 0.03;
        expBonusVal += scores.exp2 * ratio;
      }
    }
  } else {
    // 기본 방식: 가산점을 기본 점수에 곱해서 반영
    // 예: 기본 점수 80점, 가산 5% → 80 × 1.05 = 84점
    if (bonus?.math && subjectOptions?.math && bonus.math.subjects.includes(subjectOptions.math)) {
      mathVal = mathVal * (1 + bonus.math.ratio);
    }
    if (bonus?.exp) {
      if (subjectOptions?.exp1 && bonus.exp.subjects.includes(subjectOptions.exp1)) {
        exp1Val = exp1Val * (1 + bonus.exp.ratio);
      }
      if (subjectOptions?.exp2 && bonus.exp.subjects.includes(subjectOptions.exp2)) {
        exp2Val = exp2Val * (1 + bonus.exp.ratio);
      }
    }
  }

  // 탐구 반영 점수 결정
  // - 탐구 1과목만 반영: 두 과목 중 높은 점수 사용
  // - 탐구 2과목 반영: 두 과목 점수 합산
  const expValToReflect = (restrictions?.expCount === 1) ? Math.max(exp1Val, exp2Val) : (exp1Val + exp2Val);

  // 3단계: 가중치 적용
  // 각 과목의 점수에 반영 비율(가중치)을 곱합니다
  // 예: 국어 점수 80점, 가중치 0.2 → 80 × 0.2 = 16점
  // 주의: normalized_std 방식의 경우 가중치는 총점 기준입니다 (예: 국어 200점, 수학 300점)
  let korCalc = korVal * weights.kor;
  let mathCalc = mathVal * weights.math;
  let expCalc = expValToReflect * weights.exp;
  
  // 부경대 방식 가산점: 가중치 적용 후 추가 점수로 더함
  if (bonusType === 'pknu_additive') {
    mathCalc += mathBonusVal * weights.math;
    expCalc += expBonusVal * weights.exp;
  }
  
  // 영어 점수 계산 (특수 규칙에서도 사용되므로 미리 계산)
  // 영어 등급(1~9)을 점수표를 통해 점수로 변환
  const engIdx = Math.max(0, Math.min(scores.eng - 1, english_table.length - 1));
  const rawEngScore = english_table[engIdx] || 0;
  let engScore = rawEngScore * weights.eng;

  // 4단계: 특수 규칙 적용
  // 일부 대학은 특별한 점수 계산 방식을 사용합니다
  
  // 특수 규칙 1: 예체능 계열 - 수학과 탐구 중 유리한 쪽만 반영
  // 예: 수학 30% 또는 탐구 30% 중 하나만 선택
  // 이미 계산된 mathCalc와 expCalc를 비교하여 더 높은 점수를 반영
  if (formula.specialRule === 'math_or_exp_better') {
    if (expCalc > mathCalc) {
      // 탐구가 더 유리한 경우 - 수학은 0점 처리 (반영 안 함)
      mathCalc = 0;
    } else {
      // 수학이 더 유리한 경우 - 탐구는 0점 처리 (반영 안 함)
      expCalc = 0;
    }
  }

  // 특수 규칙 2: 우수 영역 n개 선택 방식
  // 여러 과목 중 점수가 높은 순서대로 n개를 선택하여 각각 다른 비율로 반영
  // 예: 국어, 수학, 영어, 탐구 중 상위 3개를 선택하여 각각 40%, 30%, 30% 반영
  if (formula.specialRule === 'top_n_subjects' && formula.specialRuleConfig?.topN) {
    const config = formula.specialRuleConfig.topN;
    // 총점 기준 결정 (백분위 방식이면 100점, 표준점수 방식이면 200점)
    const totalScore = formula.type === 'percentile' ? 100 : 200;
    const expCount = 1; // 탐구 반영 수 (CSV 기준)
    
    // 반영 가능한 과목들의 점수를 수집
    const subjectScores: Array<{ name: string; value: number }> = [];
    
    // 국어, 수학, 영어, 탐구 점수를 수집 (설정에 포함된 과목만)
    if (config.subjects.includes('kor')) {
      subjectScores.push({ name: 'kor', value: korVal });
    }
    if (config.subjects.includes('math')) {
      subjectScores.push({ name: 'math', value: mathVal });
    }
    if (config.subjects.includes('eng')) {
      subjectScores.push({ name: 'eng', value: rawEngScore });
    }
    if (config.subjects.includes('exp')) {
      subjectScores.push({ name: 'exp', value: expValToReflect });
    }
    
    // 점수가 높은 순서대로 정렬 (내림차순)
    subjectScores.sort((a, b) => b.value - a.value);
    
    // 기존 계산값 초기화
    korCalc = 0;
    mathCalc = 0;
    expCalc = 0;
    engScore = 0;
    
    // 상위 n개 선택하여 각각 설정된 비율로 반영
    for (let i = 0; i < Math.min(config.n, subjectScores.length); i++) {
      const ratio = config.ratios[i] || 0; // i번째 과목의 반영 비율
      const subject = subjectScores[i];
      // 가중치 계산 (총점 기준으로 비율 적용)
      const weight = (totalScore * ratio / 100) / (subject.name === 'exp' ? (totalScore * expCount) : totalScore);
      
      // 각 과목별로 계산값 설정
      if (subject.name === 'kor') {
        korCalc = subject.value * weight;
      } else if (subject.name === 'math') {
        mathCalc = subject.value * weight;
      } else if (subject.name === 'eng') {
        engScore = subject.value * weight;
      } else if (subject.name === 'exp') {
        expCalc = subject.value * weight;
      }
    }
  }

  // 특수 규칙 3: 국어/수학 우수한 순으로 반영
  // 국어와 수학 중 점수가 높은 쪽을 우선 반영하고, 각각 다른 비율 적용
  // 예: 국어가 더 높으면 국어 40%, 수학 20% / 수학이 더 높으면 국어 20%, 수학 40%
  if (formula.specialRule === 'top_kor_math' && formula.specialRuleConfig?.topKorMath) {
    const config = formula.specialRuleConfig.topKorMath;
    const totalScore = formula.type === 'percentile' ? 100 : 200;
    const expCount = 1; // 탐구 반영 수
    
    // 국어와 수학 중 어느 쪽이 더 높은지 결정
    const korFirst = korVal >= mathVal;
    
    // 우수한 쪽에 더 높은 비율을 적용하여 가중치 계산
    const korWeight = (totalScore * (korFirst ? config.korRatio : config.mathRatio) / 100) / totalScore;
    const mathWeight = (totalScore * (korFirst ? config.mathRatio : config.korRatio) / 100) / totalScore;
    const engWeight = (totalScore * config.engRatio / 100) / totalScore;
    const expWeight = (totalScore * config.expRatio / 100) / (totalScore * expCount);
    
    // 각 과목별 점수 계산
    korCalc = korVal * korWeight;
    mathCalc = mathVal * mathWeight;
    engScore = rawEngScore * engWeight;
    expCalc = expValToReflect * expWeight;
    
    // 동덕여대 방식: 수학이 국어보다 우수할 경우 추가 가산점
    if (config.mathBonus && mathVal > korVal) {
      mathCalc = mathCalc * (1 + config.mathBonus);
    }
  }

  // 5단계: 한국사 점수 계산 및 최종 합산
  // 영어는 이미 위에서 계산했으므로, 한국사만 계산합니다
  
  // 한국사 등급(1~9)을 점수표를 통해 점수로 변환
  const histIdx = Math.max(0, Math.min(scores.hist - 1, history_table.length - 1));
  const histScore = history_table[histIdx] || 0;
  
  // 기본 점수 (일부 대학은 기본 점수를 더함)
  const baseScore = formula.baseScore || 0; 

  // 최종 점수 = 기본점수 + 국어 + 수학 + 탐구 + 영어 + 한국사
  const total = baseScore + korCalc + mathCalc + expCalc + engScore + histScore;

  // 계산 결과 반환 (과목별 상세 정보 포함)
  return {
    formulaLabel: label, // 공식 이름 (예: "인문계열", "자연계열")
    kor: { raw: korVal, weight: weights.kor, calc: korCalc }, // 국어: 원점수, 가중치, 계산값
    math: { raw: mathVal, weight: weights.math, calc: mathCalc }, // 수학: 원점수, 가중치, 계산값
    exp: { raw: expValToReflect, weight: weights.exp, calc: expCalc }, // 탐구: 원점수, 가중치, 계산값
    eng: { grade: scores.eng, score: engScore }, // 영어: 등급, 계산된 점수
    hist: { grade: scores.hist, score: histScore }, // 한국사: 등급, 계산된 점수
    total: parseFloat(total.toFixed(2)) // 최종 환산 점수 (소수점 둘째 자리까지)
  };
};

/**
 * [기능 설명] 대학별 점수를 계산하는 메인 함수 (입시 데이터에서 지정된 공식 ID 사용)
 * 
 * 어떤 일을 하나요?
 * - 입시 데이터(admission_data.json)에서 각 모집단위마다 사용할 공식 ID가 지정되어 있습니다.
 * - 이 함수는 그 ID에 해당하는 공식을 찾아서 점수를 계산합니다.
 * - 일부 대학은 여러 공식을 모두 계산해서 가장 높은 점수를 사용합니다.
 * 
 * 특수 규칙 처리:
 * 1. 건국대 자유전공학부: 언어중심과 수리중심 둘 다 계산해서 높은 점수 사용
 * 2. 두 공식 중 높은 점수: 두 가지 공식을 모두 계산해서 높은 점수 사용
 * 3. 인문/자연 각각 계산: 인문계열과 자연계열을 각각 계산해서 높은 점수 사용
 * 
 * @param student - 학생 정보
 * @param rule - 대학의 점수 계산 규칙 (여러 공식 포함)
 * @param scoreTable - 점수표 데이터
 * @param conversionTable - 변환표 데이터
 * @param formulaId - 입시 데이터에서 지정된 공식 ID (없으면 첫 번째 공식 사용)
 * @returns 계산된 상세 점수 정보
 */
export const calculateUnivScore = (
  student: Student, 
  rule: UnivRule, 
  scoreTable: ScoreTableData,
  conversionTable: ConversionTableData | null,
  formulaId?: string
): ScoreDetail => {
  // 입시 데이터에서 지정된 공식 ID로 공식 찾기
  let targetFormula = rule.formulas.find(f => f.id === formulaId);

  // 공식을 찾지 못한 경우 처리
  if (!targetFormula) {
    if (formulaId) console.warn(`Formula ID '${formulaId}' not found. Using default.`);
    // 첫 번째 공식을 기본값으로 사용
    targetFormula = rule.formulas[0];
  }

  // 공식이 전혀 없으면 에러
  if (!targetFormula) {
    throw new Error("No scoring formulas available for this university.");
  }

  // 특수 규칙 1: 건국대 자유전공학부 - 언어중심과 수리중심 둘 다 계산
  // 두 공식을 모두 계산해서 더 높은 점수를 사용합니다
  if (targetFormula.specialRule === 'max_of_language_and_math') {
    const languageFormula = rule.formulas.find(f => f.id === '건국대_언어중심');
    const mathFormula = rule.formulas.find(f => f.id === '건국대_수리중심');
    
    if (languageFormula && mathFormula) {
      // 언어중심 공식으로 계산
      const languageResult = calculateSingleFormula(student, languageFormula, scoreTable, conversionTable);
      // 수리중심 공식으로 계산
      const mathResult = calculateSingleFormula(student, mathFormula, scoreTable, conversionTable);
      
      // 더 높은 점수를 반환
      if (mathResult.total > languageResult.total) {
        return {
          ...mathResult,
          formulaLabel: `${targetFormula.label} (수리중심 적용)`
        };
      } else {
        return {
          ...languageResult,
          formulaLabel: `${targetFormula.label} (언어중심 적용)`
        };
      }
    }
  }

  // 특수 규칙 2: 두 가지 공식 중 높은 점수 반영
  // 설정에서 지정된 두 공식을 모두 계산해서 높은 점수 사용
  if (targetFormula.specialRule === 'max_of_two_formulas' && targetFormula.specialRuleConfig?.twoFormulas) {
    const config = targetFormula.specialRuleConfig.twoFormulas;
    const formulaA = rule.formulas.find(f => f.id === config.formulaA);
    const formulaB = rule.formulas.find(f => f.id === config.formulaB);
    
    if (formulaA && formulaB) {
      // 공식 A로 계산
      const resultA = calculateSingleFormula(student, formulaA, scoreTable, conversionTable);
      // 공식 B로 계산
      const resultB = calculateSingleFormula(student, formulaB, scoreTable, conversionTable);
      
      // 더 높은 점수를 반환
      if (resultB.total > resultA.total) {
        return {
          ...resultB,
          formulaLabel: `${targetFormula.label} (${formulaB.label} 적용)`
        };
      } else {
        return {
          ...resultA,
          formulaLabel: `${targetFormula.label} (${formulaA.label} 적용)`
        };
      }
    }
  }

  // 특수 규칙 3: 인문계열과 자연계열 각각 계산하여 높은 점수 반영
  // 인문계열 공식과 자연계열 공식을 모두 계산해서 높은 점수 사용
  if (targetFormula.specialRule === 'max_of_humanities_natural' && targetFormula.specialRuleConfig?.humanitiesNatural) {
    const config = targetFormula.specialRuleConfig.humanitiesNatural;
    const humanitiesFormula = rule.formulas.find(f => f.id === config.humanitiesFormula);
    const naturalFormula = rule.formulas.find(f => f.id === config.naturalFormula);
    
    if (humanitiesFormula && naturalFormula) {
      // 인문계열 공식으로 계산
      const humanitiesResult = calculateSingleFormula(student, humanitiesFormula, scoreTable, conversionTable);
      // 자연계열 공식으로 계산
      const naturalResult = calculateSingleFormula(student, naturalFormula, scoreTable, conversionTable);
      
      // 더 높은 점수를 반환
      if (naturalResult.total > humanitiesResult.total) {
        return {
          ...naturalResult,
          formulaLabel: `${targetFormula.label} (자연계열 적용)`
        };
      } else {
        return {
          ...humanitiesResult,
          formulaLabel: `${targetFormula.label} (인문계열 적용)`
        };
      }
    }
  }

  // 특수 규칙이 없으면 지정된 공식으로 일반 계산
  return calculateSingleFormula(student, targetFormula, scoreTable, conversionTable);
};

export const calculateBestUnivScore = calculateUnivScore; 

/**
 * [기능 설명] 대학 이름을 정규화하는 함수 (현재는 사용하지 않음)
 * 
 * 입시 데이터와 대학 규칙 데이터에서 대학 이름이 다를 수 있어서
 * 여러 형태로 변환해서 매칭을 시도합니다.
 */
const normalizeUnivName = (name: string): string => {
  if (!name) return name;
  
  // 일반적인 변형 형태들
  const variations = [
    name,
    name.replace('학교', ''),
    name + '학교',
    name.replace('대학교', '대'),
    name.replace('대', '대학교')
  ];
  
  return name; // 원본 반환 (실제로는 findRule에서 여러 형태로 시도)
};

/**
 * [기능 설명] 대학 이름으로 규칙을 찾는 함수 (여러 형태로 시도)
 * 
 * 어떤 일을 하나요?
 * - 입시 데이터의 대학 이름과 규칙 데이터의 대학 이름이 다를 수 있습니다.
 * - 예: "경북대학교" vs "경북대", "국립금오공과대학교" vs "금오공대"
 * - 여러 형태로 변환해서 규칙을 찾습니다.
 * 
 * @param univName - 입시 데이터의 대학 이름
 * @param rules - 모든 대학의 규칙 데이터
 * @returns 찾은 규칙 (없으면 null)
 */
const findRule = (univName: string, rules: Record<string, UnivRule>): UnivRule | null => {
  // 1단계: 정확히 일치하는 이름으로 찾기
  if (rules[univName]) return rules[univName];
  
  // 2단계: 여러 형태로 변환해서 찾기
  const variations = [
    univName.replace('학교', ''), // "경북대학교" → "경북대"
    univName + '학교', // "경북대" → "경북대학교"
    univName.replace('대학교', '대'), // "경북대학교" → "경북대"
    univName.replace('대', '대학교'), // "경북대" → "경북대학교"
    // 특수 케이스: 공과대학교 관련
    univName.replace('국립', '').replace('공과대학교', '공대'),
    univName.replace('국립', '').replace('공과대', '공대'),
    univName.replace('공과대학교', '공대'),
    univName.replace('공과대', '공대')
  ];
  
  // 각 변형 형태로 규칙 찾기
  for (const variant of variations) {
    if (variant && variant !== univName && rules[variant]) {
      console.log(`findRule: Matched "${univName}" to "${variant}"`);
      return rules[variant];
    }
  }
  
  // 찾지 못한 경우 디버그 정보 출력
  if (!rules[univName]) {
    const availableKeys = Object.keys(rules);
    const similarKeys = availableKeys.filter(k => 
      k.includes('금오') || k.includes('공대') || 
      univName.includes(k) || k.includes(univName)
    );
    console.warn(`findRule: Could not find rule for "${univName}"`, {
      searchedVariations: variations,
      similarKeys: similarKeys.length > 0 ? similarKeys : 'none',
      allKeys: availableKeys
    });
  }
  
  return null;
};

/**
 * [기능 설명] 모든 모집단위에 대해 학생의 합격 가능성을 분석하는 메인 함수
 * 
 * 어떤 일을 하나요?
 * - 입시 데이터의 모든 모집단위(대학/학과)에 대해 학생의 점수를 계산합니다.
 * - 계산된 점수를 기준으로 합격 가능성을 4단계로 판단합니다:
 *   1. 안정 (Safe): 내 점수 >= 안정컷 → 합격 가능성 매우 높음
 *   2. 소신 (Match): 안정컷 > 내 점수 >= 소신컷 → 합격 가능성 보통
 *   3. 상향 (Upward): 소신컷 > 내 점수 >= 상향컷 → 합격 가능성 낮음
 *   4. 위험 (Danger): 내 점수 < 상향컷 → 합격 가능성 매우 낮음
 * 
 * 판단 기준:
 * - 내 점수와 소신컷의 차이(diff)를 계산합니다.
 * - 차이를 백분율(gapPercent)로 변환하여 정규화합니다.
 * - 점수가 0이면 불합격 처리(응시 조건 미충족 등)로 위험으로 분류합니다.
 * 
 * @param student - 학생 정보 (점수, 선택과목 등)
 * @param rows - 입시 데이터의 모든 모집단위 정보
 * @param rules - 모든 대학의 점수 계산 규칙
 * @param scoreTable - 점수표 데이터
 * @param conversionTable - 변환표 데이터
 * @returns 각 모집단위별 분석 결과 배열
 */
export const analyzeAdmission = (
  student: Student,
  rows: ExcelRow[],
  rules: Record<string, UnivRule>,
  scoreTable: ScoreTableData,
  conversionTable: ConversionTableData | null
): AnalysisResult[] => {
  console.log('analyzeAdmission: Starting', { 
    studentName: student.name, 
    rowsCount: rows.length, 
    rulesCount: Object.keys(rules).length,
    hasScoreTable: !!scoreTable,
    hasConversionTable: !!conversionTable,
    studentScores: student.scores,
    sampleRuleKeys: Object.keys(rules).slice(0, 5)
  });
  
  // 각 모집단위에 대해 분석 수행
  return rows.map((row) => {
    // 1단계: 대학 이름으로 규칙 찾기
    const rule = findRule(row.univName, rules);
    
    // 규칙을 찾지 못한 경우 처리
    if (!rule) {
      console.warn('analyzeAdmission: Rule not found', { univName: row.univName, availableKeys: Object.keys(rules).slice(0, 10) });
      return {
        ...row,
        initialRecruitmentCount: row.initialRecruitmentCount ?? row.recruitmentCount ?? 0,
        earlyAdmissionCarryover: row.earlyAdmissionCarryover ?? 0,
        finalRecruitmentCount: (row.initialRecruitmentCount ?? row.recruitmentCount ?? 0) + (row.earlyAdmissionCarryover ?? 0),
        lastYearCompetitionRate: row.lastYearCompetitionRate ?? 0,
        myScore: 0,
        diff: 0,
        gapPercent: 0,
        status: 'danger', // 규칙이 없으면 위험으로 분류
        formulaLabel: '데이터 없음'
      };
    }

    try {
        // 2단계: 학생의 점수 계산
        // 입시 데이터에서 지정된 공식 ID(scoringClass)를 사용하여 계산
        const result = calculateUnivScore(student, rule, scoreTable, conversionTable, row.scoringClass);
        

        
        // 3단계: 상향컷과의 차이 계산
        const diff = parseFloat((result.total - row.upwardCut).toFixed(2));
        
        // 4단계: 백분율 차이 계산 (정규화)
        // 대학마다 총점이 다르므로, 백분율로 변환하여 비교 가능하게 만듭니다
        // 예: 100점 만점에서 5점 차이 = 5%, 200점 만점에서 5점 차이 = 2.5%
        let gapPercent = 0;
        if (row.upwardCut > 0) {
            gapPercent = (diff / row.upwardCut) * 100;
        }

        // 5단계: 합격 가능성 판단
        let status: 'safe' | 'match' | 'upward' | 'danger' = 'danger';
        
        // 점수가 0이면 불합격 처리 (응시 조건 미충족 등)
        if (result.total === 0) {
            status = 'danger';
        } else {
            // 우선순위: 안정 > 소신 > 상향 > 위험
            if (result.total >= row.safeCut) {
                // 내 점수가 안정컷 이상이면 안정
                status = 'safe';
            } else if (result.total >= row.matchCut) {
                // 내 점수가 소신컷 이상이면 소신
                status = 'match';
            } else if (result.total >= row.upwardCut) {
                // 내 점수가 상향컷 이상이면 상향
                status = 'upward';
            } else {
                // 내 점수가 상향컷 미만이면 위험
                status = 'danger';
            }
        }

        // 모집 인원 정보 계산
        const initialRecruitment = row.initialRecruitmentCount ?? row.recruitmentCount ?? 0; // 최초 모집 인원
        const earlyCarryover = row.earlyAdmissionCarryover ?? 0; // 수시 이월 인원
        const finalRecruitment = initialRecruitment + earlyCarryover; // 최종 모집 인원

        // 분석 결과 반환
        return {
          univName: row.univName, // 대학 이름
          deptName: row.deptName, // 모집단위 이름
          scoringClass: row.scoringClass, // 사용된 공식 ID
          group: row.group, // 군 (가/나/다)
          recruitmentCount: row.recruitmentCount || 0, // 하위 호환성 유지
          initialRecruitmentCount: initialRecruitment, // 최초 모집 인원
          earlyAdmissionCarryover: earlyCarryover, // 수시 이월 인원
          finalRecruitmentCount: finalRecruitment, // 최종 모집 인원
          lastYearCompetitionRate: row.lastYearCompetitionRate ?? 0, // 전년도 경쟁률
          safeCut: row.safeCut, // 안정컷
          matchCut: row.matchCut, // 소신컷
          upwardCut: row.upwardCut, // 상향컷
          myScore: result.total, // 내 점수
          diff, // 소신컷과의 차이
          gapPercent: parseFloat(gapPercent.toFixed(2)), // 백분율 차이
          status, // 합격 가능성 (안정/소신/상향/위험)
          formulaLabel: result.formulaLabel // 사용된 공식 이름
        };
    } catch (e) {
        // 계산 중 에러 발생 시 처리
        const initialRecruitment = row.initialRecruitmentCount ?? row.recruitmentCount ?? 0;
        const earlyCarryover = row.earlyAdmissionCarryover ?? 0;
        const finalRecruitment = initialRecruitment + earlyCarryover;
        
        return {
            ...row,
            initialRecruitmentCount: initialRecruitment,
            earlyAdmissionCarryover: earlyCarryover,
            finalRecruitmentCount: finalRecruitment,
            lastYearCompetitionRate: row.lastYearCompetitionRate ?? 0,
            myScore: 0,
            diff: 0,
            gapPercent: 0,
            status: 'danger', // 에러 발생 시 위험으로 분류
            formulaLabel: '산출 불가'
        };
    }
  });
};
