const fs = require('fs');
const path = require('path');

const root = 'C:/Users/user/Downloads/jeongsi-counselor-2025 (1)';
const admPath = path.join(root, 'public/data/admission_data.json');
const rulesPath = path.join(root, 'public/data/univ_rules.json');

// 참조용 금오공과대학교 데이터 (점수는 0, 다른 필드만 사용)
const ref = [
  { univName: '금오공과대학교', deptName: '기계공학부', scoringClass: 'kit_eng', group: '가', recruitmentCount: 21 },
  { univName: '금오공과대학교', deptName: '산업·빅데이터공학부', scoringClass: 'kit_eng', group: '가', recruitmentCount: 10 },
  { univName: '금오공과대학교', deptName: '재료공학부', scoringClass: 'kit_eng', group: '가', recruitmentCount: 17 },
  { univName: '금오공과대학교', deptName: '화학소재공학부', scoringClass: 'kit_eng', group: '가', recruitmentCount: 13 },
  { univName: '금오공과대학교', deptName: '건축토목환경공학부', scoringClass: 'kit_eng', group: '나', recruitmentCount: 14 },
  { univName: '금오공과대학교', deptName: '기계공학부 스마트모빌리티전공', scoringClass: 'kit_eng', group: '나', recruitmentCount: 10 },
  { univName: '금오공과대학교', deptName: '전자공학부', scoringClass: 'kit_eng', group: '나', recruitmentCount: 23 },
  { univName: '금오공과대학교', deptName: '컴퓨터공학부', scoringClass: 'kit_eng', group: '나', recruitmentCount: 15 },
  { univName: '금오공과대학교', deptName: '광시스템공학과', scoringClass: 'kit_eng', group: '나', recruitmentCount: 5 },
  { univName: '금오공과대학교', deptName: '바이오메디컬공학과', scoringClass: 'kit_eng', group: '나', recruitmentCount: 5 },
  { univName: '금오공과대학교', deptName: '경영학과', scoringClass: 'kit_biz', group: '다', recruitmentCount: 3 },
  { univName: '금오공과대학교', deptName: '자율전공학부', scoringClass: 'kit_eng', group: '다', recruitmentCount: 100 }
];

const norm = (s) => s.replace(/[^\p{L}\p{N}]/gu, '');

// ----- admission_data 적용 -----
const adm = JSON.parse(fs.readFileSync(admPath, 'utf8'));
const refMap = new Map(ref.map((r) => [norm(r.deptName), r]));
const refName = ref[0].univName;
const oldName = [...new Set(adm.map((d) => d.univName))].find((n) => norm(n).includes('금오공대'));
let matched = 0;
const usedRefKeys = new Set();

const updatedAdm = adm.map((item) => {
  if (item.univName !== oldName && item.univName !== refName) return item;
  const key = norm(item.deptName);
  let refItem = refMap.get(key);
  if (!refItem) {
    refItem = [...refMap.values()].find((r) => {
      const rk = norm(r.deptName);
      return rk.includes(key) || key.includes(rk);
    });
  }
  if (!refItem) return item;
  usedRefKeys.add(norm(refItem.deptName));
  matched += 1;
  const { safeCut, matchCut, upwardCut } = item;
  return {
    ...item,
    univName: refItem.univName,
    deptName: refItem.deptName,
    scoringClass: refItem.scoringClass,
    group: refItem.group,
    recruitmentCount: refItem.recruitmentCount,
    safeCut,
    matchCut,
    upwardCut,
  };
});

// ref에 있는데 main에 없던 학과가 있으면 점수 0으로 추가
const missingRefs = ref.filter((r) => !usedRefKeys.has(norm(r.deptName)));
if (missingRefs.length) {
  missingRefs.forEach((r) => {
    updatedAdm.push({ ...r, safeCut: 0, matchCut: 0, upwardCut: 0 });
  });
}

fs.writeFileSync(admPath, JSON.stringify(updatedAdm, null, 2));
console.log(`admission: matched ${matched} of ${ref.length}, added ${missingRefs.length}`);

// ----- univ_rules 키를 금오공과대학교로 맞추기 -----
const rulesData = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
const rules = rulesData.rules || {};
const oldRuleKey = Object.keys(rules).find((k) => norm(k).includes('금오공대'));
if (oldRuleKey && oldRuleKey !== refName) {
  rules[refName] = rules[oldRuleKey];
  delete rules[oldRuleKey];
  console.log(`rules: renamed ${oldRuleKey} -> ${refName}`);
}
rulesData.rules = rules;
fs.writeFileSync(rulesPath, JSON.stringify(rulesData, null, 2));

