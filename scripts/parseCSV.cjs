const fs = require('fs');
const path = require('path');

// CSV 파일 읽기
const csvPath = path.join(__dirname, '..', '대학, 모집단위 성적 산출 기준.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n');

// 헤더 파싱
const headers = lines[0].split(',').map(h => h.trim());

// 대학 리스트
const targetUnivs = [
  '건국대', '경국대', '경상국립대', '경성대', '경운대', '경인교대', '경일대', '경희대', '계명대',
  '고려대', '공주교대', '광운대', '광주교대', '국민대', '금오공대', '단국대', '대구가톨릭대', '대구교대', '대구대',
  '대구한의대', '덕성여대', '동국대', '동덕여대', '동아대', '동의대', '부경대', '부산교대', '부산대', '상명대',
  '서강대', '서울과학기술대', '서울교대', '서울대', '서울시립대', '서울여대', '성균관대', '성신여대', '숙명여대', '아주대',
  '연세대', '영남대', '울산대', '이화여대', '인하대', '전남대', '전북대', '전주교대', '중앙대', '진주교대',
  '청주교대', '춘천교대', '충남대', '충북대', '한국공학대', '한국기술교대', '한국외대', '한국외대(글로벌)', '한국항공대', '한국해양대',
  '한동대', '한양대', '홍익대'
];

// CSV 파싱 함수
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// 데이터 파싱
const data = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const values = parseCSVLine(lines[i]);
  if (values.length < headers.length) continue;
  
  const row = {};
  headers.forEach((header, idx) => {
    row[header] = values[idx] || '';
  });
  
  if (targetUnivs.includes(row['대학명'])) {
    data.push(row);
  }
}

// 대학별로 그룹화
const univData = {};
data.forEach(row => {
  const univName = row['대학명'];
  if (!univData[univName]) {
    univData[univName] = [];
  }
  univData[univName].push(row);
});

// 통계 출력
console.log('=== 대학별 모집단위 수 ===');
Object.keys(univData).sort().forEach(univ => {
  console.log(`${univ}: ${univData[univ].length}개`);
});

// 샘플 데이터 출력 (건국대)
console.log('\n=== 건국대 샘플 데이터 ===');
if (univData['건국대']) {
  console.log(JSON.stringify(univData['건국대'][0], null, 2));
}

// 파일로 저장
fs.writeFileSync(
  path.join(__dirname, '..', 'scripts', 'parsed_data.json'),
  JSON.stringify(univData, null, 2),
  'utf-8'
);

console.log('\n=== 파싱 완료 ===');
console.log(`총 ${data.length}개 모집단위 파싱됨`);

