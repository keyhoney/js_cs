const fs = require('fs');
const path = require('path');

// JSON 파일 읽기
const rulesPath = path.join(__dirname, '..', 'public', 'data', 'univ_rules.json');
const admissionPath = path.join(__dirname, '..', 'public', 'data', 'admission_data.json');

let errors = [];
let warnings = [];

try {
  const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
  const admission = JSON.parse(fs.readFileSync(admissionPath, 'utf-8'));
  
  console.log('=== JSON 파일 검증 ===\n');
  
  // 1. 기본 구조 검증
  if (!rules.version || !rules.rules) {
    errors.push('univ_rules.json 구조 오류');
  }
  
  if (!Array.isArray(admission)) {
    errors.push('admission_data.json이 배열이 아님');
  }
  
  // 2. 대학별 공식 검증
  const univNames = Object.keys(rules.rules);
  console.log(`✅ 대학 수: ${univNames.length}개`);
  
  let totalFormulas = 0;
  univNames.forEach(univName => {
    const univRules = rules.rules[univName];
    if (!univRules.formulas || !Array.isArray(univRules.formulas)) {
      errors.push(`${univName}: formulas가 없거나 배열이 아님`);
      return;
    }
    
    totalFormulas += univRules.formulas.length;
    
    // 각 공식 검증
    univRules.formulas.forEach((formula, idx) => {
      if (!formula.id) {
        errors.push(`${univName} 공식 ${idx + 1}: id 없음`);
      }
      if (!formula.type) {
        errors.push(`${univName} 공식 ${idx + 1}: type 없음`);
      }
      if (!formula.weights) {
        errors.push(`${univName} 공식 ${idx + 1}: weights 없음`);
      }
      if (!formula.english_table || !Array.isArray(formula.english_table)) {
        errors.push(`${univName} 공식 ${idx + 1}: english_table 없음`);
      }
      if (!formula.history_table || !Array.isArray(formula.history_table)) {
        errors.push(`${univName} 공식 ${idx + 1}: history_table 없음`);
      }
      if (formula.type === 'mixed_converted' && !formula.conversion_table_id) {
        warnings.push(`${univName} 공식 ${idx + 1}: mixed_converted인데 conversion_table_id 없음`);
      }
    });
  });
  
  console.log(`✅ 총 공식 수: ${totalFormulas}개`);
  
  // 3. admission_data 검증
  console.log(`✅ 모집단위 수: ${admission.length}개`);
  
  const univSet = new Set();
  const scoringClassSet = new Set();
  const missingFormulas = [];
  
  admission.forEach((item, idx) => {
    if (!item.univName) {
      errors.push(`admission_data[${idx}]: univName 없음`);
    } else {
      univSet.add(item.univName);
    }
    
    if (!item.deptName) {
      errors.push(`admission_data[${idx}]: deptName 없음`);
    }
    
    if (!item.scoringClass) {
      errors.push(`admission_data[${idx}]: scoringClass 없음`);
    } else {
      scoringClassSet.add(item.scoringClass);
    }
    
    if (!item.group) {
      warnings.push(`admission_data[${idx}]: group 없음`);
    }
    
    // scoringClass가 실제 공식에 존재하는지 확인
    if (item.univName && item.scoringClass) {
      const univRules = rules.rules[item.univName];
      if (univRules) {
        const formula = univRules.formulas.find(f => f.id === item.scoringClass);
        if (!formula) {
          missingFormulas.push({
            univ: item.univName,
            dept: item.deptName,
            scoringClass: item.scoringClass
          });
        }
      }
    }
  });
  
  console.log(`✅ 고유 대학 수: ${univSet.size}개`);
  console.log(`✅ 고유 scoringClass 수: ${scoringClassSet.size}개`);
  
  // 4. 누락된 공식 확인
  if (missingFormulas.length > 0) {
    console.log(`\n⚠️  누락된 공식: ${missingFormulas.length}개`);
    missingFormulas.slice(0, 10).forEach(m => {
      warnings.push(`${m.univ} - ${m.dept}: scoringClass "${m.scoringClass}" 없음`);
    });
    if (missingFormulas.length > 10) {
      console.log(`  ... 외 ${missingFormulas.length - 10}개`);
    }
  }
  
  // 5. 결과 출력
  console.log('\n=== 검증 결과 ===');
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ 모든 검증 통과!');
  } else {
    if (errors.length > 0) {
      console.log(`\n❌ 오류: ${errors.length}개`);
      errors.slice(0, 20).forEach(e => console.log(`  - ${e}`));
      if (errors.length > 20) {
        console.log(`  ... 외 ${errors.length - 20}개`);
      }
    }
    if (warnings.length > 0) {
      console.log(`\n⚠️  경고: ${warnings.length}개`);
      warnings.slice(0, 20).forEach(w => console.log(`  - ${w}`));
      if (warnings.length > 20) {
        console.log(`  ... 외 ${warnings.length - 20}개`);
      }
    }
  }
  
} catch (e) {
  console.error('❌ JSON 파싱 오류:', e.message);
  process.exit(1);
}

