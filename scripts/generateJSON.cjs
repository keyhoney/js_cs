const fs = require('fs');
const path = require('path');

// 파싱된 데이터 읽기
const parsedDataPath = path.join(__dirname, 'parsed_data.json');
const univData = JSON.parse(fs.readFileSync(parsedDataPath, 'utf-8'));

// 기존 JSON 파일 읽기
const rulesPath = path.join(__dirname, '..', 'public', 'data', 'univ_rules.json');
const admissionPath = path.join(__dirname, '..', 'public', 'data', 'admission_data.json');

const existingRules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
const existingAdmission = JSON.parse(fs.readFileSync(admissionPath, 'utf-8'));

// 공식 타입 결정 함수
function determineFormulaType(활용점수) {
  if (활용점수.includes('표준점수+(탐구-변표)') || 활용점수.includes('표준점수+변표')) {
    return 'mixed_converted';
  } else if (활용점수.includes('백분위')) {
    return 'percentile';
  } else if (활용점수.includes('표준점수')) {
    return 'standard';
  }
  return 'standard'; // 기본값
}

// 가중치 계산 함수
function calculateWeights(row) {
  const korRatio = parseFloat(row['국어반영 비율']) || 0;
  const mathRatio = parseFloat(row['수학 반영 비율']) || 0;
  const engRatio = parseFloat(row['영어 반영 비율']) || 0;
  const expRatio = parseFloat(row['탐구반영 비율']) || 0;
  
  // 비율이 비어있는 경우 전형특이사항에서 추출 시도
  if (!korRatio && !mathRatio && row['전형특이사항']) {
    // 예: "국, 수 중 더 우수한 성적 순으로 40%,30% 반영, 영10%, 탐20%"
    const match = row['전형특이사항'].match(/(\d+)%[,\s]*(\d+)%[,\s]*영(\d+)%[,\s]*탐(\d+)%/);
    if (match) {
      return {
        kor: parseFloat(match[1]) / 100,
        math: parseFloat(match[2]) / 100,
        eng: parseFloat(match[3]) / 100,
        exp: parseFloat(match[4]) / 100
      };
    }
  }
  
  const total = korRatio + mathRatio + engRatio + expRatio;
  if (total === 0) {
    // 기본값 (균등)
    return { kor: 0.25, math: 0.25, eng: 0.25, exp: 0.25 };
  }
  
  return {
    kor: korRatio / 100,
    math: mathRatio / 100,
    eng: engRatio / 100,
    exp: expRatio / 100
  };
}

// 영어 테이블 생성
function createEnglishTable(row) {
  const table = [];
  for (let i = 1; i <= 9; i++) {
    const value = parseFloat(row[`영어${i}등급점수`]) || 0;
    table.push(value);
  }
  return table;
}

// 한국사 테이블 생성
function createHistoryTable(row) {
  const table = [];
  for (let i = 1; i <= 9; i++) {
    const value = parseFloat(row[`한국사${i}등급점수`]) || 0;
    table.push(value);
  }
  return table;
}

// 가산점 정보 추출
function extractBonus(row) {
  const bonus = {};
  
  // 수학 가산점
  if (row['미적가산점'] || row['기하 가산점'] || row['확통 가산점']) {
    const subjects = [];
    if (row['미적가산점']) subjects.push('미적분');
    if (row['기하 가산점']) subjects.push('기하');
    if (row['확통 가산점']) subjects.push('확률과통계');
    
    if (subjects.length > 0) {
      // 가산점 비율 추정 (일반적으로 3-5%)
      bonus.math = {
        subjects: subjects,
        ratio: 0.05 // 기본값, 실제로는 CSV에서 추출 필요
      };
    }
  }
  
  // 탐구 가산점
  if (row['과탐가산점'] || row['사탐가산점']) {
    const subjects = [
      "물리1", "화학1", "생명과학1", "지구과학1",
      "물리2", "화학2", "생명과학2", "지구과학2"
    ];
    bonus.exp = {
      subjects: subjects,
      ratio: 0.05 // 기본값
    };
  }
  
  return Object.keys(bonus).length > 0 ? bonus : undefined;
}

// 제한사항 추출
function extractRestrictions(row) {
  const restrictions = {};
  
  // 수학 제한
  if (row['수학선택과목']) {
    const mathSubjects = row['수학선택과목'].split('/').map(s => s.trim());
    if (mathSubjects.length > 0 && mathSubjects[0] !== '') {
      restrictions.math = mathSubjects;
    }
  }
  
  // 탐구 제한
  if (row['탐구선택과목']) {
    const expType = row['탐구선택과목'];
    if (expType.includes('과')) {
      restrictions.exp = [
        "물리1", "화학1", "생명과학1", "지구과학1",
        "물리2", "화학2", "생명과학2", "지구과학2"
      ];
      restrictions.expCount = 2;
    }
  }
  
  return Object.keys(restrictions).length > 0 ? restrictions : undefined;
}

// 최저학력기준 추출
function extractMinGradeRequirement(row) {
  if (!row['최저학력기준'] || row['최저학력기준'] === '') {
    return undefined;
  }
  
  // 간단한 패턴 매칭 (실제로는 더 복잡할 수 있음)
  const requirement = row['최저학력기준'];
  
  // 예: "수학+과탐평균 <= 3" 같은 패턴
  if (requirement.includes('수학') && requirement.includes('과탐')) {
    const match = requirement.match(/(\d+)/);
    if (match) {
      return {
        type: 'sum_math_exp_avg_trunc',
        limit: parseInt(match[1])
      };
    }
  }
  
  return undefined;
}

// 공식 그룹화 키 생성
function createFormulaKey(row) {
  const 활용점수 = row['수능활용점수'];
  const 영역조합 = row['실제 반영수능 영역 조합'];
  const korRatio = row['국어반영 비율'] || '';
  const mathRatio = row['수학 반영 비율'] || '';
  const engRatio = row['영어 반영 비율'] || '';
  const expRatio = row['탐구반영 비율'] || '';
  const 영어기준 = row['영어적용기준'] || '';
  const 한국사기준 = row['한국사적용기준'] || '';
  
  return `${활용점수}|${영역조합}|${korRatio}|${mathRatio}|${engRatio}|${expRatio}|${영어기준}|${한국사기준}`;
}

// 대학명 정규화 (학교명에 "학교" 추가)
function normalizeUnivName(name) {
  if (!name.endsWith('학교') && !name.endsWith('대학')) {
    return name + '학교';
  }
  return name;
}

// 대학별 공식 생성
function generateFormulasForUniv(univName, rows) {
  const formulas = [];
  const formulaGroups = {};
  
  // 공식 그룹화
  rows.forEach(row => {
    const key = createFormulaKey(row);
    if (!formulaGroups[key]) {
      formulaGroups[key] = [];
    }
    formulaGroups[key].push(row);
  });
  
  // 각 그룹별로 공식 생성
  let formulaIndex = 1;
  Object.keys(formulaGroups).forEach(key => {
    const groupRows = formulaGroups[key];
    const sampleRow = groupRows[0];
    
    const formulaType = determineFormulaType(sampleRow['수능활용점수']);
    const weights = calculateWeights(sampleRow);
    const englishTable = createEnglishTable(sampleRow);
    const historyTable = createHistoryTable(sampleRow);
    const bonus = extractBonus(sampleRow);
    const restrictions = extractRestrictions(sampleRow);
    const minGradeRequirement = extractMinGradeRequirement(sampleRow);
    
    // 공식 ID 생성 (대학명_타입_인덱스)
    const univCode = univName.replace(/대학교?/g, '').toLowerCase().replace(/\s/g, '_');
    const typeCode = formulaType === 'mixed_converted' ? 'mixed' : 
                     formulaType === 'percentile' ? 'pct' : 'std';
    const formulaId = `${univCode}_${typeCode}_${formulaIndex}`;
    
    const formula = {
      id: formulaId,
      label: formulaType === 'mixed_converted' ? '표준점수+변표' :
             formulaType === 'percentile' ? '백분위' : '표준점수',
      type: formulaType,
      weights: weights,
      english_table: englishTable,
      history_table: historyTable
    };
    
    if (formulaType === 'mixed_converted') {
      // conversion_table_id 생성 (대학별로 다를 수 있음)
      formula.conversion_table_id = `${univCode}_2025`;
    }
    
    if (bonus) {
      formula.bonus = bonus;
    }
    
    if (restrictions) {
      formula.restrictions = restrictions;
    }
    
    if (minGradeRequirement) {
      formula.minGradeRequirement = minGradeRequirement;
    }
    
    formulas.push(formula);
    formulaIndex++;
  });
  
  return formulas;
}

// admission_data 생성
function generateAdmissionData(univName, rows, formulaMap) {
  const admissionData = [];
  
  rows.forEach(row => {
    // 해당 행에 맞는 공식 찾기
    const key = createFormulaKey(row);
    const formula = formulaMap[key];
    
    if (!formula) {
      console.log(`    ⚠️  공식 없음: ${row['모집단위']}`);
      return;
    }
    
    admissionData.push({
      univName: normalizeUnivName(univName),
      deptName: row['모집단위'],
      scoringClass: formula.id,
      group: row['군'],
      safeCut: 0,
      matchCut: 0,
      upwardCut: 0
    });
  });
  
  return admissionData;
}

// 메인 처리
const newRules = JSON.parse(JSON.stringify(existingRules));
const newAdmission = [...existingAdmission];

// 모든 배치
const allBatches = [
  ['건국대', '경국대', '경상국립대', '경성대', '경운대', '경인교대', '경일대', '경희대', '계명대'],
  ['고려대', '공주교대', '광운대', '광주교대', '국민대', '금오공대', '단국대', '대구가톨릭대', '대구교대', '대구대'],
  ['대구한의대', '덕성여대', '동국대', '동덕여대', '동아대', '동의대', '부경대', '부산교대', '부산대', '상명대'],
  ['서강대', '서울과학기술대', '서울교대', '서울대', '서울시립대', '서울여대', '성균관대', '성신여대', '숙명여대', '아주대'],
  ['연세대', '영남대', '울산대', '이화여대', '인하대', '전남대', '전북대', '전주교대', '중앙대', '진주교대'],
  ['청주교대', '춘천교대', '충남대', '충북대', '한국공학대', '한국기술교대', '한국외대', '한국외대(글로벌)', '한국항공대', '한국해양대'],
  ['한동대', '한양대', '홍익대']
];

allBatches.forEach((batch, batchIndex) => {
  console.log(`\n=== ${batchIndex + 1}차 배치 처리 시작 ===`);
  
  batch.forEach(univName => {
  if (!univData[univName] || univData[univName].length === 0) {
    console.log(`⚠️  ${univName}: 데이터 없음`);
    return;
  }
  
  console.log(`\n처리 중: ${univName} (${univData[univName].length}개 모집단위)`);
  
  // 기존 데이터가 있으면 스킵 (경북대, 영남대, 계명대만)
  const normalizedName = normalizeUnivName(univName);
  if (newRules.rules[normalizedName]) {
    console.log(`  ⏭️  기존 데이터 있음, 스킵`);
    // 기존 데이터가 있어도 admission_data는 추가 (중복 체크 필요)
    const existingAdmission = newAdmission.filter(a => a.univName === normalizedName);
    if (existingAdmission.length === 0) {
      // admission_data가 없으면 추가
      const formulaGroups = {};
      univData[univName].forEach(row => {
        const key = createFormulaKey(row);
        if (!formulaGroups[key]) {
          formulaGroups[key] = [];
        }
        formulaGroups[key].push(row);
      });
      
      const formulas = newRules.rules[normalizedName].formulas;
      const formulaMap = {};
      let formulaIndex = 0;
      Object.keys(formulaGroups).forEach(key => {
        if (formulaIndex < formulas.length) {
          formulaMap[key] = formulas[formulaIndex];
          formulaIndex++;
        }
      });
      
      const admissionData = generateAdmissionData(univName, univData[univName], formulaMap);
      newAdmission.push(...admissionData);
      console.log(`  ✅ ${admissionData.length}개 모집단위 추가`);
    }
    return;
  }
  
  // 공식 그룹화 맵 생성
  const formulaGroups = {};
  univData[univName].forEach(row => {
    const key = createFormulaKey(row);
    if (!formulaGroups[key]) {
      formulaGroups[key] = [];
    }
    formulaGroups[key].push(row);
  });
  
  const formulas = generateFormulasForUniv(univName, univData[univName]);
  
  // 공식 ID 맵 생성
  const formulaMap = {};
  let formulaIndex = 0;
  Object.keys(formulaGroups).forEach(key => {
    if (formulaIndex < formulas.length) {
      formulaMap[key] = formulas[formulaIndex];
      formulaIndex++;
    }
  });
  
  const admissionData = generateAdmissionData(univName, univData[univName], formulaMap);
  
  newRules.rules[normalizeUnivName(univName)] = { formulas: formulas };
  newAdmission.push(...admissionData);
  
  console.log(`  ✅ ${formulas.length}개 공식 생성, ${admissionData.length}개 모집단위 추가`);
  });
});

// 파일 저장
fs.writeFileSync(rulesPath, JSON.stringify(newRules, null, 2), 'utf-8');
fs.writeFileSync(admissionPath, JSON.stringify(newAdmission, null, 2), 'utf-8');

console.log('\n=== 모든 배치 완료 ===');
console.log(`총 ${Object.keys(newRules.rules).length}개 대학`);
console.log(`총 ${newAdmission.length}개 모집단위`);

