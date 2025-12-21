import React, { useEffect, useState } from 'react';
// @ts-ignore - @react-pdf/renderer 타입 정의 문제
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import { Student, AnalysisResult, ScoreDetail } from '../types';

// 한글 폰트 등록 - KoPub Batang 사용
// 폰트 파일은 public/fonts 폴더에 있으며, BASE_URL을 고려하여 로드
let fontRegistrationPromise: Promise<void> | null = null;
let fontsRegistered = false;

const registerFonts = async (): Promise<void> => {
  if (fontsRegistered) return;
  if (fontRegistrationPromise) return fontRegistrationPromise;

  fontRegistrationPromise = (async () => {
    try {
      // BASE_URL을 사용하여 경로 설정 (빌드 환경에 따라 '/js_cs/' 또는 '/' 일 수 있음)
      const baseUrl = import.meta.env.BASE_URL || '/';
      const fontPaths = {
        light: `${baseUrl}fonts/KoPub Batang Light.ttf`,
        medium: `${baseUrl}fonts/KoPub Batang Medium.ttf`,
        bold: `${baseUrl}fonts/KoPub Batang Bold.ttf`,
      };

      // 각 폰트를 fetch로 로드하여 base64로 변환
      const [lightData, mediumData, boldData] = await Promise.all([
        fetch(fontPaths.light).then(res => {
          if (!res.ok) throw new Error(`Failed to load font: ${fontPaths.light}`);
          return res.arrayBuffer();
        }),
        fetch(fontPaths.medium).then(res => {
          if (!res.ok) throw new Error(`Failed to load font: ${fontPaths.medium}`);
          return res.arrayBuffer();
        }),
        fetch(fontPaths.bold).then(res => {
          if (!res.ok) throw new Error(`Failed to load font: ${fontPaths.bold}`);
          return res.arrayBuffer();
        }),
      ]);

      // ArrayBuffer를 base64 문자열로 변환하는 헬퍼 함수
      const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        // 큰 파일을 위한 청크 처리 (Maximum call stack size 초과 방지)
        const chunkSize = 8192;
        for (let i = 0; i < bytes.byteLength; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength));
          binary += String.fromCharCode.apply(null, Array.from(chunk) as any);
        }
        return btoa(binary);
      };

      // Font.register는 src로 base64 data URI 문자열을 받습니다
      Font.register({
        family: 'KoPubBatang',
        fonts: [
          {
            src: `data:font/truetype;charset=utf-8;base64,${arrayBufferToBase64(lightData)}`,
            fontWeight: 300,
          },
          {
            src: `data:font/truetype;charset=utf-8;base64,${arrayBufferToBase64(mediumData)}`,
            fontWeight: 500,
          },
          {
            src: `data:font/truetype;charset=utf-8;base64,${arrayBufferToBase64(boldData)}`,
            fontWeight: 700,
          },
        ],
      });
      
      fontsRegistered = true;
      console.log('KoPub Batang fonts registered successfully');
    } catch (error) {
      console.error('Font registration failed:', error);
      fontsRegistered = false;
      fontRegistrationPromise = null;
      // 폰트 등록 실패 시 기본 폰트 사용
    }
  })();

  return fontRegistrationPromise;
};

// 앱 시작 시 폰트 등록 시작
registerFonts();

// 폰트 등록 Promise를 export하여 다른 곳에서 await할 수 있도록 함
export { registerFonts };

// PDF 스타일 정의 (전문적/신뢰감: react-pdf 호환 스타일)
const BRAND = {
  navy: '#0B1F3A',
  navy2: '#123A63',
  slate: '#334155',
  muted: '#64748B',
  line: '#E2E8F0',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  safeBg: '#EFF6FF',
  safeText: '#1D4ED8',
  matchBg: '#F0FDF4',
  matchText: '#166534',
  upBg: '#FFFBEB',
  upText: '#92400E',
  dangerBg: '#FEF2F2',
  dangerText: '#991B1B',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 52,
    paddingHorizontal: 42,
    fontFamily: 'KoPubBatang',
    backgroundColor: BRAND.card,
    fontSize: 10,
    color: BRAND.slate,
    lineHeight: 1.55,
  },

  // ===== Header =====
  header: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  brandBar: {
    height: 6,
    backgroundColor: BRAND.navy,
    borderRadius: 3,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: BRAND.navy,
    letterSpacing: 0.2,
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  metaText: {
    fontSize: 9,
    color: BRAND.muted,
  },

  // ===== Section =====
  section: {
    marginTop: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: BRAND.navy,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 9,
    color: BRAND.muted,
    marginTop: -6,
    marginBottom: 10,
  },

  // ===== Card (generic) =====
  card: {
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 10,
    padding: 14,
  },

  // ===== Student Card =====
  studentCard: {
    backgroundColor: BRAND.bg,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    marginBottom: 14,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 700,
    color: BRAND.navy,
    marginBottom: 10,
  },
  kvGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  kvItem: {
    width: '50%',
    paddingRight: 10,
    marginBottom: 6,
    flexDirection: 'row',
  },
  kvLabel: {
    width: 48,
    fontSize: 9,
    color: BRAND.muted,
    fontWeight: 700,
  },
  kvValue: {
    fontSize: 10,
    color: BRAND.slate,
  },

  // ===== University Card =====
  univCard: {
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  univTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  univName: {
    fontSize: 13,
    fontWeight: 700,
    color: BRAND.navy,
    marginBottom: 3,
  },
  deptName: {
    fontSize: 10,
    color: BRAND.slate,
    marginBottom: 2,
  },
  formula: {
    fontSize: 8.5,
    color: BRAND.muted,
    marginTop: 3,
  },

  // Badge: View + Text를 분리해서 안정적으로
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 700,
  },
  badgeSafe: { backgroundColor: BRAND.safeBg, borderColor: '#BFDBFE' },
  badgeSafeText: { color: BRAND.safeText },
  badgeMatch: { backgroundColor: BRAND.matchBg, borderColor: '#BBF7D0' },
  badgeMatchText: { color: BRAND.matchText },
  badgeUp: { backgroundColor: BRAND.upBg, borderColor: '#FDE68A' },
  badgeUpText: { color: BRAND.upText },
  badgeDanger: { backgroundColor: BRAND.dangerBg, borderColor: '#FECACA' },
  badgeDangerText: { color: BRAND.dangerText },

  // ===== Score Table =====
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.bg,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  th: { fontSize: 9, color: BRAND.muted, fontWeight: 700 },
  colLabel: { width: '45%' },
  colValue: { width: '30%', textAlign: 'right' as const },
  colDiff: { width: '25%', textAlign: 'right' as const },

  tr: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  tdLabel: { width: '45%', fontSize: 9.5, color: BRAND.muted },
  tdValue: { width: '30%', fontSize: 10.5, fontWeight: 700, color: BRAND.slate, textAlign: 'right' as const },
  tdDiff: { width: '25%', fontSize: 9.5, textAlign: 'right' as const },
  diffPos: { color: '#0F766E' },
  diffNeg: { color: '#B91C1C' },

  // ===== Cutoffs =====
  cutoffs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cutoffBox: {
    width: '32%',
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: BRAND.bg,
  },
  cutoffLabel: { fontSize: 8.5, color: BRAND.muted, marginBottom: 4, fontWeight: 700 },
  cutoffValue: { fontSize: 11, fontWeight: 700 },

  // ===== Detail Blocks =====
  detailBlock: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  detailTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    color: BRAND.navy,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: { fontSize: 9, color: BRAND.muted, fontWeight: 700 },
  detailValue: { fontSize: 9.5, color: BRAND.slate },

  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: { fontSize: 10, fontWeight: 700, color: BRAND.navy },
  totalValue: { fontSize: 11, fontWeight: 700, color: BRAND.navy2 },

  // ===== Footer =====
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 42,
    right: 42,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    paddingTop: 8,
    fontSize: 8.5,
    color: BRAND.muted,
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 22,
    right: 42,
    fontSize: 8.5,
    color: BRAND.muted,
  },
});

interface PDFReportProps {
  student: Student;
  bookmarkedResults: AnalysisResult[];
  scoreDetails: Map<string, ScoreDetail>;
  generatedDate: string;
}

const PDFReport: React.FC<PDFReportProps> = ({ student, bookmarkedResults, scoreDetails, generatedDate }) => {
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'safe': return styles.badgeSafe;
      case 'match': return styles.badgeMatch;
      case 'upward': return styles.badgeUp;
      case 'danger': return styles.badgeDanger;
      default: return styles.badgeDanger;
    }
  };

  const getBadgeTextStyle = (status: string) => {
    switch (status) {
      case 'safe': return styles.badgeSafeText;
      case 'match': return styles.badgeMatchText;
      case 'upward': return styles.badgeUpText;
      case 'danger': return styles.badgeDangerText;
      default: return styles.badgeDangerText;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'safe':
        return '안정 지원';
      case 'match':
        return '소신 지원';
      case 'upward':
        return '상향 지원';
      case 'danger':
        return '위험 지원';
      default:
        return '위험 지원';
    }
  };

  const formatScore = (score: number) => {
    return score.toFixed(2);
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBar} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>2026 정시 입시 상담 리포트</Text>
            <View style={styles.metaRight}>
              <Text style={styles.metaText}>생성일: {generatedDate}</Text>
              <Text style={styles.metaText}>문서: Jeongsi Counselor 2026</Text>
            </View>
          </View>
        </View>

        {/* Student Info */}
        <View style={styles.studentCard}>
          <Text style={styles.studentName}>
            {student.classNum && student.studentNum 
              ? `${student.classNum}-${student.studentNum} ${student.name}` 
              : student.name}
          </Text>
          <View style={styles.kvGrid}>
            <View style={styles.kvItem}>
              <Text style={styles.kvLabel}>국어</Text>
              <Text style={styles.kvValue}>{student.scores.kor}점 ({student.subjectOptions?.kor || '미선택'})</Text>
            </View>
            <View style={styles.kvItem}>
              <Text style={styles.kvLabel}>수학</Text>
              <Text style={styles.kvValue}>{student.scores.math}점 ({student.subjectOptions?.math || '미선택'})</Text>
            </View>
            <View style={styles.kvItem}>
              <Text style={styles.kvLabel}>탐구1</Text>
              <Text style={styles.kvValue}>{student.scores.exp1}점 ({student.subjectOptions?.exp1 || '미선택'})</Text>
            </View>
            <View style={styles.kvItem}>
              <Text style={styles.kvLabel}>탐구2</Text>
              <Text style={styles.kvValue}>{student.scores.exp2}점 ({student.subjectOptions?.exp2 || '미선택'})</Text>
            </View>
            <View style={styles.kvItem}>
              <Text style={styles.kvLabel}>영어</Text>
              <Text style={styles.kvValue}>{student.scores.eng}등급</Text>
            </View>
            <View style={styles.kvItem}>
              <Text style={styles.kvLabel}>한국사</Text>
              <Text style={styles.kvValue}>{student.scores.hist}등급</Text>
            </View>
          </View>
        </View>

        {/* Bookmarked Universities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>관심 대학 분석</Text>
          <Text style={styles.sectionSubtitle}>총 {bookmarkedResults.length}개 대학/학과</Text>
          
          {bookmarkedResults.map((result, index) => {
            const detail = scoreDetails.get(`${result.univName}-${result.deptName}`);

            return (
              <View key={index} style={styles.univCard} wrap={false}>
                <View style={styles.univTopRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.univName}>{result.univName}</Text>
                    <Text style={styles.deptName}>{result.deptName}</Text>
                    <Text style={styles.formula}>적용 공식: {result.formulaLabel}</Text>
                  </View>

                  <View style={[styles.badge, getBadgeStyle(result.status)]}>
                    <Text style={[styles.badgeText, getBadgeTextStyle(result.status)]}>
                      {getStatusLabel(result.status)}
                    </Text>
                  </View>
                </View>

                {/* Score Comparison Table */}
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, styles.colLabel]}>지표</Text>
                    <Text style={[styles.th, styles.colValue]}>점수</Text>
                    <Text style={[styles.th, styles.colDiff]}>격차(%)</Text>
                  </View>

                  <View style={styles.tr}>
                    <Text style={styles.tdLabel}>내 환산 점수</Text>
                    <Text style={styles.tdValue}>{formatScore(result.myScore)}</Text>
                    <Text style={[styles.tdDiff, result.gapPercent >= 0 ? styles.diffPos : styles.diffNeg]}>
                      {result.gapPercent >= 0 ? '+' : ''}{formatPercent(result.gapPercent)}
                    </Text>
                  </View>
                </View>

                {/* Cutoffs */}
                <View style={styles.cutoffs}>
                  <View style={styles.cutoffBox}>
                    <Text style={styles.cutoffLabel}>안정 기준</Text>
                    <Text style={[styles.cutoffValue, { color: BRAND.safeText }]}>{formatScore(result.safeCut)}</Text>
                  </View>
                  <View style={styles.cutoffBox}>
                    <Text style={styles.cutoffLabel}>소신 기준</Text>
                    <Text style={[styles.cutoffValue, { color: BRAND.matchText }]}>{formatScore(result.matchCut)}</Text>
                  </View>
                  <View style={styles.cutoffBox}>
                    <Text style={styles.cutoffLabel}>상향 기준</Text>
                    <Text style={[styles.cutoffValue, { color: BRAND.upText }]}>{formatScore(result.upwardCut)}</Text>
                  </View>
                </View>

                {/* Recruitment Info */}
                <View style={styles.detailBlock}>
                  <Text style={styles.detailTitle}>모집 정보</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>최종 모집 인원</Text>
                    <Text style={styles.detailValue}>{result.finalRecruitmentCount}명</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>최초 모집 인원</Text>
                    <Text style={styles.detailValue}>{result.initialRecruitmentCount}명</Text>
                  </View>
                  {result.earlyAdmissionCarryover > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>수시 이월</Text>
                      <Text style={styles.detailValue}>{result.earlyAdmissionCarryover}명</Text>
                    </View>
                  )}
                  {result.lastYearCompetitionRate > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>전년도 경쟁률</Text>
                      <Text style={styles.detailValue}>{result.lastYearCompetitionRate.toFixed(2)}:1</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>군</Text>
                    <Text style={styles.detailValue}>{result.group}</Text>
                  </View>
                </View>

                {/* Score Detail */}
                {detail && (
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailTitle}>점수 상세 내역</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>국어</Text>
                      <Text style={styles.detailValue}>{formatScore(detail.kor.raw)} × {detail.kor.weight} = {formatScore(detail.kor.calc)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>수학</Text>
                      <Text style={styles.detailValue}>{formatScore(detail.math.raw)} × {detail.math.weight} = {formatScore(detail.math.calc)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>탐구</Text>
                      <Text style={styles.detailValue}>{formatScore(detail.exp.raw)} × {detail.exp.weight} = {formatScore(detail.exp.calc)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>영어</Text>
                      <Text style={styles.detailValue}>{detail.eng.grade}등급 = {formatScore(detail.eng.score)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>한국사</Text>
                      <Text style={styles.detailValue}>{detail.hist.grade}등급 = {formatScore(detail.hist.score)}</Text>
                    </View>

                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>최종 환산 점수</Text>
                      <Text style={styles.totalValue}>{formatScore(detail.total)}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Jeongsi Counselor 2026 · 본 리포트는 입력된 성적 및 기준 데이터에 기반한 참고 자료입니다.
        </Text>
        <Text 
          style={styles.pageNumber} 
          render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => (
            `${pageNumber} / ${totalPages}`
          )} 
          fixed 
        />
      </Page>
    </Document>
  );
};

export default PDFReport;

