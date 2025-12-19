const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '..', 'public', 'data', 'admission_data.json');
const outputFile = path.join(__dirname, '..', 'admission_data.csv');

// JSON 파일 읽기 (BOM 처리)
const buf = fs.readFileSync(inputFile);
let fileContent;
if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
  fileContent = buf.slice(3).toString('utf8');
} else {
  fileContent = buf.toString('utf8');
}

const jsonData = JSON.parse(fileContent);

if (!Array.isArray(jsonData) || jsonData.length === 0) {
  throw new Error('JSON 데이터가 배열이 아니거나 비어있습니다.');
}

// CSV 헤더 생성 (첫 번째 객체의 키 사용)
const headers = Object.keys(jsonData[0]);

// CSV 행 생성 함수
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // 쉼표, 따옴표, 줄바꿈이 포함된 경우 따옴표로 감싸고 내부 따옴표는 두 개로
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }
  return stringValue;
}

// CSV 내용 생성
const csvRows = [];

// 헤더 추가
csvRows.push(headers.map(escapeCSV).join(','));

// 데이터 행 추가
jsonData.forEach(item => {
  const row = headers.map(header => escapeCSV(item[header]));
  csvRows.push(row.join(','));
});

// CSV 파일로 저장
fs.writeFileSync(outputFile, csvRows.join('\n'), 'utf8');

console.log(`CSV 파일이 생성되었습니다: ${outputFile}`);
console.log(`총 ${jsonData.length}개의 행이 변환되었습니다.`);
