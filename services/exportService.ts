import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
// @ts-ignore - jspdf-autotable doesn't have proper types
import autoTable from 'jspdf-autotable';
import { AnalysisResult, Student, ScoreDetail } from '../types';
import { generateFileName, formatDate, formatScore, sanitizeFileName } from '../utils/formatUtils';

/**
 * Excel 내보내기
 */
export const exportToExcel = (
  results: AnalysisResult[],
  studentName: string
): void => {
  const workbook = XLSX.utils.book_new();
  
  // 결과 데이터 시트
  const worksheetData = results.map(r => ({
    '대학명': r.univName,
    '모집단위': r.deptName,
    '군': r.group,
    '내 점수': formatScore(r.myScore),
    '예상 컷': formatScore(r.cutoff),
    '점수차': formatScore(r.diff),
    '진단': r.status === 'safe' ? '안정' : r.status === 'match' ? '적정' : '위험',
    '적용 전형': r.formulaLabel,
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, '분석 결과');

  // 통계 시트
  const safeCount = results.filter(r => r.status === 'safe').length;
  const matchCount = results.filter(r => r.status === 'match').length;
  const riskCount = results.filter(r => r.status === 'risk').length;
  
  const statsData = [
    { '항목': '전체', '개수': results.length },
    { '항목': '안정 지원', '개수': safeCount },
    { '항목': '적정 지원', '개수': matchCount },
    { '항목': '위험 지원', '개수': riskCount },
  ];
  
  const statsSheet = XLSX.utils.json_to_sheet(statsData);
  XLSX.utils.book_append_sheet(workbook, statsSheet, '통계');

  const fileName = generateFileName(`상담결과_${sanitizeFileName(studentName)}`, 'xlsx');
  XLSX.writeFile(workbook, fileName);
};

/**
 * PDF 리포트 생성
 */
export const exportToPDF = (
  student: Student,
  results: AnalysisResult[],
  detail?: ScoreDetail | undefined
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // 헤더
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138); // Navy blue
  doc.text('2025학년도 정시 상담 리포트', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`생성일: ${formatDate(new Date())}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;

  // 학생 정보
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('학생 정보', 20, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  const studentInfo = [
    `이름: ${student.name}`,
    `국어(표준): ${student.scores.kor}`,
    `수학(표준): ${student.scores.math}`,
    `영어(등급): ${student.scores.eng}등급`,
    `한국사(등급): ${student.scores.hist}등급`,
    `탐구1(표준): ${student.scores.exp1}`,
    `탐구2(표준): ${student.scores.exp2}`,
  ];
  
  studentInfo.forEach(info => {
    doc.text(info, 25, yPos);
    yPos += 6;
  });

  yPos += 5;

  // 분석 결과 테이블
  if (results.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('분석 결과', 20, yPos);
    yPos += 8;

    const tableData = results.map(r => [
      r.univName,
      r.deptName,
      r.group,
      formatScore(r.myScore),
      formatScore(r.cutoff),
      formatScore(r.diff),
      r.status === 'safe' ? '안정' : r.status === 'match' ? '적정' : '위험',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['대학명', '모집단위', '군', '내 점수', '예상 컷', '점수차', '진단']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [30, 58, 138],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // 상세 계산 내역 (선택적)
  if (detail && yPos < pageHeight - 50) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('상세 계산 내역', 20, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    
    const detailInfo = [
      `적용 전형: ${detail.formulaLabel}`,
      `국어: ${formatScore(detail.kor.raw)} × ${detail.kor.weight} = ${formatScore(detail.kor.calc)}`,
      `수학: ${formatScore(detail.math.raw)} × ${detail.math.weight} = ${formatScore(detail.math.calc)}`,
      `탐구: ${formatScore(detail.exp.raw)} × ${detail.exp.weight} = ${formatScore(detail.exp.calc)}`,
      `영어: ${detail.eng.grade}등급 → ${detail.eng.score >= 0 ? '+' : ''}${formatScore(detail.eng.score)}점`,
      `한국사: ${detail.hist.grade}등급 → ${detail.hist.score >= 0 ? '+' : ''}${formatScore(detail.hist.score)}점`,
      `최종 점수: ${formatScore(detail.total)}점`,
    ];

    detailInfo.forEach(info => {
      doc.text(info, 25, yPos);
      yPos += 7;
    });
  }

  // 통계 요약
  if (results.length > 0) {
    const safeCount = results.filter(r => r.status === 'safe').length;
    const matchCount = results.filter(r => r.status === 'match').length;
    const riskCount = results.filter(r => r.status === 'risk').length;

    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += 10;
    }

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('요약 통계', 20, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text(`전체: ${results.length}건`, 25, yPos);
    yPos += 7;
    doc.setTextColor(34, 197, 94);
    doc.text(`안정 지원: ${safeCount}건`, 25, yPos);
    yPos += 7;
    doc.setTextColor(234, 179, 8);
    doc.text(`적정 지원: ${matchCount}건`, 25, yPos);
    yPos += 7;
    doc.setTextColor(239, 68, 68);
    doc.text(`위험 지원: ${riskCount}건`, 25, yPos);
  }

  const fileName = generateFileName(`상담리포트_${sanitizeFileName(student.name)}`, 'pdf');
  doc.save(fileName);
};

/**
 * 선택된 결과만 내보내기
 */
export const exportSelectedResults = (
  results: AnalysisResult[],
  studentName: string,
  format: 'excel' | 'pdf' = 'excel'
): void => {
  if (format === 'excel') {
    exportToExcel(results, studentName);
  } else {
    // PDF는 전체 결과 필요하므로 Excel로 대체
    exportToExcel(results, studentName);
  }
};

